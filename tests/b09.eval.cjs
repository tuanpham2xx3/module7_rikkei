require('reflect-metadata');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID,createHmac}=require('node:crypto');
const {readFileSync,readdirSync}=require('node:fs');
const {Pool}=require('pg');
const request=require('supertest');
const {Database}=require('../dist/db');
const {EntriesService}=require('../dist/entries');
const {AuthService}=require('../dist/auth');
const {bootstrap}=require('../dist/main');
const {encodeCursor}=require('../dist/timeline');
test('B09 timeline cursor acceptance on PostgreSQL 16',{timeout:90000},async t=>{
 assert.ok(process.env.TEST_DATABASE_URL,'TEST_DATABASE_URL required');
 const admin=new Pool({connectionString:process.env.TEST_DATABASE_URL}),schema='b09_'+randomUUID().replaceAll('-','');await admin.query(`CREATE SCHEMA ${schema}`);
 const url=new URL(process.env.TEST_DATABASE_URL);url.searchParams.set('options',`-c search_path=${schema},public`);
 Object.assign(process.env,{DATABASE_URL:url.toString(),IMAGE_SIGNING_SECRET:'image-secret-longer-than-32-characters',TIMELINE_CURSOR_SECRET:'cursor-secret-longer-than-32-characters',PUBLIC_API_URL:'http://localhost'});
 const sql=new Pool({connectionString:url.toString()}),db=new Database(),entries=new EntriesService(db);let app;
 const seed=async(n=100)=>{
  const owner=randomUUID();await sql.query('INSERT INTO users(id) VALUES($1)',[owner]);await sql.query('INSERT INTO profiles(user_id) VALUES($1)',[owner]);
  await sql.query("INSERT INTO entries(user_id,entry_date,content) SELECT $1,'2026-05-01'::date-i*2,'timeline-'||i FROM generate_series(0,$2::int-1) i",[owner,n]);
  return {owner,rows:(await sql.query('SELECT id,entry_date::text FROM entries WHERE user_id=$1 ORDER BY entry_date DESC,id DESC',[owner])).rows};
 };
 let fixture,other;
 const walk=async(owner,limit)=>{
  const ids=[];let cursor;let pages=0;
  do{const page=await entries.list(owner,{limit:String(limit),...(cursor?{cursor}:{})});assert.ok(page.items.length<=limit);assert.equal(page.has_more,!!page.next_cursor);ids.push(...page.items.map(i=>i.id));cursor=page.next_cursor;if(++pages>110)throw Error('cursor loop');}while(cursor);
  return ids;
 };
 try{
  for(const name of readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort())await sql.query(readFileSync('migrations/'+name,'utf8'));
  fixture=await seed();other=await seed();
  await t.test('T01 100 entries through cursor: complete, unique and stable date/ID order',async()=>{
   const ids=await walk(fixture.owner,15);assert.equal(ids.length,100);assert.equal(new Set(ids).size,100);assert.deepEqual(ids,fixture.rows.map(r=>r.id));
  });
  await t.test('T02 limits 1/15/50 cover every entry exactly once with sparse dates',async()=>{
   for(const limit of [1,15,50])assert.deepEqual(await walk(fixture.owner,limit),fixture.rows.map(r=>r.id));
  });
  await t.test('T03 default 15, empty timeline, final/full page cursor semantics',async()=>{
   assert.equal((await entries.list(fixture.owner)).items.length,15);
   const empty=await entries.list(randomUUID());assert.deepEqual(empty,{items:[],has_more:false,next_cursor:null});
   const single=await seed(15),page=await entries.list(single.owner);assert.equal(page.items.length,15);assert.equal(page.next_cursor,null);assert.equal(page.has_more,false);
   const after=await entries.list(single.owner,{cursor:encodeCursor(single.owner,single.rows.at(-1))});assert.equal(after.items.length,0);assert.equal(after.next_cursor,null);
  });
  await t.test('T04 invalid limits/query forms fail before DB, including repeats and oversized values',async()=>{
   for(const limit of ['0','-1','51','999','1.5','01','','NaN','1e1',' 15',15,['15','20']])await assert.rejects(()=>entries.list(fixture.owner,{limit}),/INVALID_LIMIT/);
   await assert.rejects(()=>entries.list(fixture.owner,{user_id:other.owner}),/INVALID_QUERY/);
   for(const cursor of ['',[],{},'x'.repeat(2049)])await assert.rejects(()=>entries.list(fixture.owner,{cursor}),/INVALID_CURSOR/);
  });
  await t.test('T05 tampered, malformed, wrong-owner and invalid signed payload cursors rejected',async()=>{
   const page=await entries.list(fixture.owner),token=page.next_cursor;
   for(const cursor of [token.slice(0,-1)+(token.endsWith('0')?'1':'0'),'not-a-cursor',randomUUID()+'.invalid'])await assert.rejects(()=>entries.list(fixture.owner,{cursor}),/INVALID_CURSOR/);
   await assert.rejects(()=>entries.list(other.owner,{cursor:token}),/INVALID_CURSOR/);
   for(const payload of [{v:2,owner:fixture.owner,...fixture.rows[0]},{v:1,owner:fixture.owner,id:'bad',entry_date:'2026-05-01'},{v:1,owner:fixture.owner,id:fixture.rows[0].id,entry_date:'2026-02-30'}]){
    const p=Buffer.from(JSON.stringify(payload)).toString('base64url'),sig=createHmac('sha256',process.env.TIMELINE_CURSOR_SECRET).update('timeline:v1:'+p).digest('hex');await assert.rejects(()=>entries.list(fixture.owner,{cursor:p+'.'+sig}),/INVALID_CURSOR/);
   }
  });
  await t.test('T06 legacy A01 UUID cursor supported only under authenticated owner',async()=>{
   const page=await entries.list(fixture.owner,{limit:'15',cursor:fixture.rows[14].id});assert.deepEqual(page.items.map(r=>r.id),fixture.rows.slice(15,30).map(r=>r.id));assert.ok(page.next_cursor.includes('.'));
   await assert.rejects(()=>entries.list(other.owner,{cursor:fixture.rows[14].id}),/INVALID_CURSOR/);await assert.rejects(()=>entries.list(fixture.owner,{cursor:randomUUID()}),/INVALID_CURSOR/);
  });
  await t.test('T07 deleting boundary row does not invalidate signed cursor or skip remaining rows',async()=>{
   const sample=await seed(6),first=await entries.list(sample.owner,{limit:'2'});await entries.remove(sample.owner,first.items[1].id);
   const next=await entries.list(sample.owner,{limit:'2',cursor:first.next_cursor});assert.deepEqual(next.items.map(r=>r.id),sample.rows.slice(2,4).map(r=>r.id));
  });
  await t.test('T08 mutations between pages obey live keyset semantics, no duplicates',async()=>{
   const sample=await seed(6),first=await entries.list(sample.owner,{limit:'2'});
   const before=(await sql.query("INSERT INTO entries(user_id,entry_date,content) VALUES($1,'2026-06-01','new above') RETURNING id",[sample.owner])).rows[0];
   const behind=(await sql.query("INSERT INTO entries(user_id,entry_date,content) VALUES($1,'2026-04-28','new below') RETURNING id",[sample.owner])).rows[0];
   const next=await entries.list(sample.owner,{limit:'50',cursor:first.next_cursor});const ids=next.items.map(r=>r.id);assert.ok(!ids.includes(before.id));assert.ok(ids.includes(behind.id));assert.equal(new Set([...first.items.map(r=>r.id),...ids]).size,first.items.length+ids.length);
  });
  await t.test('T09 one query returns safe sticker metadata and actual primary job statuses',async()=>{
   const states=['succeeded','queued','processing','failed'];
   for(let i=0;i<4;i++){
    const e=fixture.rows[i],s=(await sql.query("INSERT INTO stickers(user_id,entry_id,content,time_of_day,object_path,mime_type,size_bytes,width,height) VALUES($1,$2,'sticker','morning',$3,'image/png',100,1,1) RETURNING id",[fixture.owner,e.id,i===0?`${fixture.owner}/${e.id}/private.png`:null])).rows[0];
    await sql.query('INSERT INTO generation_jobs(user_id,entry_id,sticker_id,status) VALUES($1,$2,$3,$4)',[fixture.owner,e.id,s.id,states[i]]);
   }
   const original=db.owner.bind(db);let queries=0;db.owner=(owner,action)=>original(owner,c=>action({query:(...args)=>{queries++;return c.query(...args);}}));
   let page;try{page=await entries.list(fixture.owner);}finally{db.owner=original;}
   assert.equal(queries,1);assert.deepEqual(page.items.slice(0,4).map(i=>i.job_status),states);assert.equal(page.items[4].sticker,null);
   const sticker=page.items[0].sticker,link=new URL(sticker.image_url);assert.equal(link.pathname,`/api/v1/images/${sticker.id}`);assert.equal(link.searchParams.get('owner'),fixture.owner);assert.equal(link.searchParams.get('signature'),entries.signature(fixture.owner,sticker.id,link.searchParams.get('expires')));
   assert.equal(page.items[1].sticker.image_url,null);assert.ok(!JSON.stringify(page).includes('private.png'));assert.deepEqual(Object.keys(sticker).sort(),['id','image_url','is_fallback'].sort());
  });
  await t.test('T10 extra non-primary sticker/job does not multiply entries or replace primary status',async()=>{
   const e=fixture.rows[0],s=(await sql.query("INSERT INTO stickers(user_id,entry_id,content,time_of_day,is_primary) VALUES($1,$2,'other','morning',false) RETURNING id",[fixture.owner,e.id])).rows[0];await sql.query("INSERT INTO generation_jobs(user_id,entry_id,sticker_id,status) VALUES($1,$2,$3,'failed')",[fixture.owner,e.id,s.id]);
   const page=await entries.list(fixture.owner);assert.equal(new Set(page.items.map(i=>i.id)).size,page.items.length);assert.equal(page.items[0].job_status,'succeeded');assert.notEqual(page.items[0].sticker.id,s.id);
  });
  await t.test('T11 compiled HTTP envelope, query validation, auth and cursor owner binding',async()=>{
   Object.assign(process.env,{PORT:'0',SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'stub',SUPABASE_SERVICE_ROLE_KEY:'stub',CORS_ORIGIN:'http://localhost:3000',STORAGE_BUCKET:'stickers'});app=await bootstrap();app.get(AuthService).client=()=>({auth:{getUser:async token=>({data:{user:token==='a'?{id:fixture.owner}:token==='b'?{id:other.owner}:null},error:null})}});
   const http=request(app.getHttpServer());await http.get('/api/v1/entries').expect(401);await http.get('/api/v1/entries').set('Authorization','Bearer expired').expect(401);
   const page=await http.get('/api/v1/entries?limit=15').set('Authorization','Bearer a').expect(200);assert.deepEqual(Object.keys(page.body.data).sort(),['items','has_more','next_cursor'].sort());assert.equal(page.body.data.items.length,15);
   await http.get('/api/v1/entries').query({cursor:page.body.data.next_cursor,limit:15}).set('Authorization','Bearer a').expect(200).expect(r=>assert.equal(r.body.data.items[0].id,fixture.rows[15].id));
   await http.get('/api/v1/entries').query({cursor:page.body.data.next_cursor}).set('Authorization','Bearer b').expect(400);
   await http.get('/api/v1/entries?limit=1&limit=2').set('Authorization','Bearer a').expect(400);await http.get('/api/v1/entries?limit=51').set('Authorization','Bearer a').expect(400);
  });
  await t.test('T12 normal database role/RLS preserves pagination and owner isolation',async()=>{
   const role='api_'+schema;let restricted;const saved=process.env.DATABASE_URL;const roleUrl=new URL(url);roleUrl.searchParams.set('options',`-c search_path=${schema},public -c role=${role}`);
   await sql.query(`CREATE ROLE ${role}; GRANT USAGE ON SCHEMA ${schema} TO ${role}; GRANT SELECT,INSERT,UPDATE ON users,profiles TO ${role}; GRANT SELECT ON entries,stickers,generation_jobs TO ${role}`);
   try{process.env.DATABASE_URL=roleUrl.toString();restricted=new Database();const service=new EntriesService(restricted);const p=await service.list(fixture.owner);assert.equal(p.items.length,15);assert.equal(p.items[0].id,fixture.rows[0].id);await assert.rejects(()=>service.list(other.owner,{cursor:p.next_cursor}),/INVALID_CURSOR/);}
   finally{process.env.DATABASE_URL=saved;if(restricted)await restricted.onModuleDestroy();await sql.query(`DROP OWNED BY ${role}; DROP ROLE ${role}`);}
  });
  await t.test('T13 legacy environment fallback uses domain-separated image key; rotation rejects old cursors',async()=>{
   const saved=process.env.TIMELINE_CURSOR_SECRET;delete process.env.TIMELINE_CURSOR_SECRET;
   try{const p=await entries.list(fixture.owner);assert.equal((await entries.list(fixture.owner,{cursor:p.next_cursor})).items[0].id,fixture.rows[15].id);process.env.TIMELINE_CURSOR_SECRET='new-cursor-key-more-than-32-characters';await assert.rejects(()=>entries.list(fixture.owner,{cursor:p.next_cursor}),/INVALID_CURSOR/);}
   finally{process.env.TIMELINE_CURSOR_SECRET=saved;}
  });
  await t.test('T14 four-digit early journal years round-trip through signed cursor',async()=>{
   const id=randomUUID();await sql.query('INSERT INTO users(id) VALUES($1)',[id]);await sql.query("INSERT INTO entries(user_id,entry_date,content) VALUES($1,'0002-01-01','old'),($1,'0001-01-01','older')",[id]);
   const p=await entries.list(id,{limit:'1'});assert.equal(p.items[0].entry_date,'0002-01-01');const next=await entries.list(id,{limit:'1',cursor:p.next_cursor});assert.equal(next.items[0].entry_date,'0001-01-01');assert.equal(next.has_more,false);
  });
 }finally{if(app)await app.close();await db.onModuleDestroy();await sql.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();}
});
