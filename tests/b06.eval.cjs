// Run after build against a disposable PostgreSQL database. No SQL mocks.
require('reflect-metadata');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {readFileSync}=require('node:fs');
const {Pool}=require('pg');
const request=require('supertest');
const {Database}=require('../dist/db');
const {EntriesService}=require('../dist/entries');
const {JobsService}=require('../dist/jobs');
const {AuthService}=require('../dist/auth');
const {bootstrap}=require('../dist/main');

test('B06 acceptance + compatibility eval (real PostgreSQL)',{timeout:90000},async t=>{
 assert.ok(process.env.TEST_DATABASE_URL,'TEST_DATABASE_URL must point to a disposable PostgreSQL database; eval must not silently skip');
 const admin=new Pool({connectionString:process.env.TEST_DATABASE_URL});
 const schema='b06_'+randomUUID().replaceAll('-','');
 await admin.query(`CREATE SCHEMA ${schema}`);
 const url=new URL(process.env.TEST_DATABASE_URL);
 url.searchParams.set('options',`-c search_path=${schema},public`);
 process.env.DATABASE_URL=url.toString();
 const sql=new Pool({connectionString:url.toString()});
 const db=new Database();const entries=new EntriesService(db);const jobs=new JobsService(db,entries);
 let app;
 const owner=randomUUID(),other=randomUUID();
 const counts=async()=> (await sql.query('SELECT (SELECT count(*)::int FROM entries) entries,(SELECT count(*)::int FROM stickers) stickers,(SELECT count(*)::int FROM generation_jobs) jobs,(SELECT count(*)::int FROM api_requests) requests')).rows[0];
 const body={content:'  Hôm nay vui  ',entry_date:'2026-01-01'};
 let created;const key=randomUUID();
 try{
  await sql.query(readFileSync('migrations/001_core.sql','utf8'));
  const legacyOwner=randomUUID();
  await sql.query('INSERT INTO users(id) VALUES($1)',[legacyOwner]);
  const legacy=(await sql.query("INSERT INTO entries(user_id,entry_date,content) VALUES($1,'2025-01-01','legacy') RETURNING id",[legacyOwner])).rows[0];
  const legacySticker=(await sql.query("INSERT INTO stickers(user_id,entry_id,content,time_of_day) VALUES($1,$2,'legacy','morning') RETURNING id",[legacyOwner,legacy.id])).rows[0];
  await sql.query('INSERT INTO generation_jobs(user_id,entry_id,sticker_id) VALUES($1,$2,$3)',[legacyOwner,legacy.id,legacySticker.id]);
  await sql.query(readFileSync('migrations/002_b06_idempotency.sql','utf8'));
  await sql.query(readFileSync('migrations/003_b07_worker.sql','utf8'));
  await sql.query(readFileSync('migrations/004_b08_quota.sql','utf8'));
  await t.test('E01 migration preserves B05 data, list/detail/delete',async()=>{
   assert.equal((await entries.detail(legacyOwner,legacy.id)).content,'legacy');
   assert.equal((await entries.detail(legacyOwner,legacy.id)).job.status,'queued');
   assert.equal((await entries.list(legacyOwner)).items.length,1);
   await entries.remove(legacyOwner,legacy.id);
  });
  await t.test('E02 concurrent same key/body uses distinct DB sessions, one entry/sticker/job/request',async()=>{
   await sql.query('INSERT INTO users(id) VALUES($1)',[owner]);
   await sql.query('INSERT INTO profiles(user_id) VALUES($1)',[owner]);
   const original=db.owner.bind(db);let arrived=0;let release;const gate=new Promise(r=>{release=r;});const pids=new Set();
   db.owner=(id,action)=>original(id,async c=>{
    pids.add((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);
    if(++arrived===2)release();await gate;return action(c);
   });
   try{
    const [a,b]=await Promise.all([entries.create(owner,body,key),entries.create(owner,body,key)]);
    assert.equal(pids.size,2);assert.equal(a.id,b.id);assert.equal(a.job.id,b.job.id);
    assert.equal(a.primary_sticker.id,b.primary_sticker.id);created=a;
    assert.deepEqual(await counts(),{entries:1,stickers:1,jobs:1,requests:1});
   }finally{db.owner=original;}
  });
  await t.test('E03 replay trim-equivalent payload, status advances without resetting job',async()=>{
   await sql.query("UPDATE generation_jobs SET status='processing',attempt=1 WHERE id=$1",[created.job.id]);
   const replay=await entries.create(owner,{...body,content:'Hôm nay vui'},key);
   assert.equal(replay.id,created.id);assert.equal(replay.job.status,'processing');assert.equal(replay.job.attempt,1);
  });
  await t.test('E04 key reused with different content/date/mood/time is rejected',async()=>{
   for(const change of [{content:'different'},{entry_date:'2026-01-02'},{mood:'happy'},{time_of_day:'night'}])
    await assert.rejects(()=>entries.create(owner,{...body,...change},key),/IDEMPOTENCY_KEY_REUSED/);
  });
  await t.test('E05 distinct keys same day race: one success, rollback losing request',async()=>{
   const newOwner=randomUUID();const results=await Promise.allSettled([entries.create(newOwner,body,randomUUID()),entries.create(newOwner,body,randomUUID())]);
   assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
   assert.match(results.find(r=>r.status==='rejected').reason.message,/DUPLICATE_ENTRY_FOR_DATE/);
   assert.equal((await sql.query('SELECT count(*)::int n FROM api_requests WHERE user_id=$1',[newOwner])).rows[0].n,1);
  });
  await t.test('E06 same key independent per owner; job ownership and public fields',async()=>{
   const b=await entries.create(other,body,key);assert.notEqual(b.id,created.id);
   await assert.rejects(()=>jobs.read(other,created.job.id),/JOB_NOT_FOUND/);
   const job=await jobs.read(owner,created.job.id);assert.equal(job.status,'processing');assert.equal(job.progress_percent,null);
   assert.deepEqual(Object.keys(job).sort(),['id','entry_id','status','attempt','error_code','progress_percent','sticker_url','can_retry','run_version'].sort());
  });
  await t.test('E07 database rejects duplicate job and cross-entry sticker linkage',async()=>{
   await assert.rejects(()=>sql.query('INSERT INTO generation_jobs(user_id,entry_id,sticker_id) VALUES($1,$2,$3)',[owner,created.id,created.primary_sticker.id]),e=>e.code==='23505');
   const another=await entries.create(owner,{content:'next day',entry_date:'2026-01-02'},randomUUID());
   await assert.rejects(()=>sql.query('UPDATE generation_jobs SET entry_id=$1 WHERE id=$2',[another.id,created.job.id]),e=>e.code==='23503');
  });
  await t.test('E08 request table RLS isolates reads/writes with unprivileged role',async()=>{
   const role='eval_'+schema;const c=await sql.connect();
   try{
    await c.query(`CREATE ROLE ${role}; GRANT USAGE ON SCHEMA ${schema} TO ${role}; GRANT SELECT,INSERT ON api_requests TO ${role}`);
    await c.query(`SET ROLE ${role}`);await c.query("SELECT set_config('app.user_id',$1,false)",[other]);
    assert.equal((await c.query('SELECT * FROM api_requests WHERE user_id=$1',[owner])).rowCount,0);
    await assert.rejects(()=>c.query("INSERT INTO api_requests(user_id,operation,idempotency_key,request_hash) VALUES($1,'create_entry',$2,$3)",[owner,randomUUID(),'a'.repeat(64)]),e=>e.code==='42501');
   }finally{await c.query('RESET ROLE');await c.query(`DROP OWNED BY ${role}; DROP ROLE ${role}`);c.release();}
  });
  await t.test('E09 compiled Nest HTTP eval: headers, auth, statuses, envelope, old routes',async()=>{
   Object.assign(process.env,{PORT:'0',SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'stub-public',SUPABASE_SERVICE_ROLE_KEY:'stub-private',IMAGE_SIGNING_SECRET:'eval-secret-more-than-32-characters',PUBLIC_API_URL:'http://localhost',CORS_ORIGIN:'http://localhost:3000',STORAGE_BUCKET:'stickers'});
   app=await bootstrap();app.get(AuthService).client=()=>({auth:{getUser:async token=>({data:{user:token==='a'?{id:owner}:token==='b'?{id:other}:null},error:null})}});
   const http=request(app.getHttpServer());
   await http.get('/api/v1/health').expect(200);
   await http.get('/api/v1/jobs/'+created.job.id).expect(401);
   await http.get('/api/v1/jobs/'+created.job.id).set('Authorization','Bearer expired').expect(401);
   await http.get('/api/v1/jobs/'+created.job.id).set('Authorization','Bearer b').expect(404);
   await http.get('/api/v1/jobs/not-uuid').set('Authorization','Bearer a').expect(400);
   await http.get('/api/v1/jobs/'+created.job.id).set('Authorization','Bearer a').expect(200).expect(r=>assert.equal(r.body.data.id,created.job.id));
   await http.post('/api/v1/entries').set('Authorization','Bearer a').send(body).expect(400).expect(r=>assert.equal(r.body.error.code,'INVALID_IDEMPOTENCY_KEY'));
   await http.post('/api/v1/entries').set('Authorization','Bearer a').set('Idempotency-Key','bad').send(body).expect(400);
   await http.post('/api/v1/entries').set('Authorization','Bearer a').set('Idempotency-Key',key).send(body).expect(201).expect(r=>assert.equal(r.body.data.id,created.id));
   await http.post('/api/v1/entries').set('Authorization','Bearer a').set('Idempotency-Key',key).send({...body,content:'changed'}).expect(409);
   await http.get('/api/v1/entries').set('Authorization','Bearer a').expect(200).expect(r=>assert.ok(Array.isArray(r.body.data.items)));
   await http.get('/api/v1/entries/'+created.id).set('Authorization','Bearer a').expect(200);
  });
  await t.test('E10 delete/replay cannot resurrect; job polling after delete is 404',async()=>{
   await entries.remove(owner,created.id);
   await assert.rejects(()=>entries.create(owner,body,key),/RESOURCE_DELETED/);
   await assert.rejects(()=>jobs.read(owner,created.job.id),/JOB_NOT_FOUND/);
   assert.equal((await sql.query('SELECT count(*)::int n FROM entries WHERE id=$1',[created.id])).rows[0].n,0);
   assert.equal((await sql.query('SELECT entry_id,job_id FROM api_requests WHERE user_id=$1 AND idempotency_key=$2',[owner,key])).rows[0].entry_id,null);
   await request(app.getHttpServer()).post('/api/v1/entries').set('Authorization','Bearer a').set('Idempotency-Key',key).send(body).expect(410);
  });
  await t.test('E11 omitted server date/time replays across Vietnam midnight',async ctx=>{
   const k=randomUUID(),id=randomUUID();
   ctx.mock.timers.enable({apis:['Date'],now:new Date('2026-11-11T16:59:59Z')});
   try{
    const a=await entries.create(id,{content:'midnight'},k);
    ctx.mock.timers.setTime(new Date('2026-11-11T17:00:01Z').getTime());
    const b=await entries.create(id,{content:'midnight'},k);
    assert.equal(a.id,b.id);assert.equal(a.entry_date,'2026-11-11');assert.equal(b.entry_date,a.entry_date);
    assert.equal(a.primary_sticker.time_of_day,b.primary_sticker.time_of_day);
   }finally{ctx.mock.timers.reset();}
  });
  await t.test('E12 HTTP simultaneous creates preserve create envelope and IDs',async()=>{
   const http=request(app.getHttpServer()),k=randomUUID(),payload={content:'HTTP race',entry_date:'2026-01-03'};
   const [a,b]=await Promise.all([http.post('/api/v1/entries').set('Authorization','Bearer a').set('Idempotency-Key',k).send(payload),http.post('/api/v1/entries').set('Authorization','Bearer a').set('Idempotency-Key',k).send(payload)]);
   assert.equal(a.status,201);assert.equal(b.status,201);assert.equal(a.body.data.id,b.body.data.id);
   assert.equal(a.body.data.job.id,b.body.data.job.id);assert.equal(a.body.success,true);
   assert.deepEqual(Object.keys(a.body.data).sort(),['id','entry_date','content','created_at','primary_sticker','job','quota'].sort());
  });
  await t.test('E13 replay races DELETE without resurrecting or deadlocking',async()=>{
   for(let i=0;i<5;i++){
    const k=randomUUID(),id=randomUUID(),payload={content:'delete race'};
    const a=await entries.create(id,payload,k);
    const result=await Promise.allSettled([entries.create(id,payload,k),entries.remove(id,a.id)]);
    assert.equal(result[1].status,'fulfilled');
    if(result[0].status==='rejected')assert.match(result[0].reason.message,/RESOURCE_DELETED/);
    await assert.rejects(()=>entries.create(id,payload,k),/RESOURCE_DELETED/);
   }
  });
  await t.test('E14 failed job insert rolls back entry/sticker/request, retry key remains usable',async()=>{
   await sql.query("CREATE FUNCTION fail_eval_job() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'eval failure'; END $$; CREATE TRIGGER fail_eval_job BEFORE INSERT ON generation_jobs FOR EACH ROW EXECUTE FUNCTION fail_eval_job()");
   const id=randomUUID(),k=randomUUID();const before=await counts();
   try{await assert.rejects(()=>entries.create(id,{content:'rollback'},k),/eval failure/);assert.deepEqual(await counts(),before);}
   finally{await sql.query('DROP TRIGGER fail_eval_job ON generation_jobs; DROP FUNCTION fail_eval_job()');}
   assert.ok((await entries.create(id,{content:'rollback'},k)).job.id);
  });
  await t.test('E15 full service flow runs with non-superuser role and forced RLS',async()=>{
   const role='service_'+schema;let restricted;
   await sql.query(`CREATE ROLE ${role}; GRANT USAGE ON SCHEMA ${schema} TO ${role}; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA ${schema} TO ${role}`);
   const restrictedUrl=new URL(url);restrictedUrl.searchParams.set('options',`-c search_path=${schema},public -c role=${role}`);
   const saved=process.env.DATABASE_URL;
   try{
    process.env.DATABASE_URL=restrictedUrl.toString();restricted=new Database();
    const service=new EntriesService(restricted),poll=new JobsService(restricted,service);
    const id=randomUUID(),k=randomUUID(),payload={content:'RLS service'};
    const a=await service.create(id,payload,k);assert.equal((await service.create(id,payload,k)).job.id,a.job.id);
    assert.equal((await poll.read(id,a.job.id)).status,'queued');
    await assert.rejects(()=>poll.read(other,a.job.id),/JOB_NOT_FOUND/);
    await service.remove(id,a.id);await assert.rejects(()=>service.create(id,payload,k),/RESOURCE_DELETED/);
   }finally{
    process.env.DATABASE_URL=saved;if(restricted)await restricted.onModuleDestroy();
    await sql.query(`DROP OWNED BY ${role}; DROP ROLE ${role}`);
   }
  });
  await t.test('E16 polling reflects persisted failed/succeeded states and B04 signed URL',async()=>{
   const id=randomUUID(),a=await entries.create(id,{content:'poll states'},randomUUID());
   await sql.query("UPDATE generation_jobs SET status='failed',error_code='PROVIDER_REJECTED' WHERE id=$1",[a.job.id]);
   const failed=await jobs.read(id,a.job.id);assert.equal(failed.status,'failed');assert.equal(failed.error_code,'PROVIDER_REJECTED');assert.equal(failed.sticker_url,null);
   await sql.query("UPDATE stickers SET object_path=$2,mime_type='image/png',size_bytes=100,width=10,height=10 WHERE id=$1",[a.primary_sticker.id,`${id}/${a.id}/eval.png`]);
   await sql.query("UPDATE generation_jobs SET status='succeeded',error_code=NULL WHERE id=$1",[a.job.id]);
   const success=await jobs.read(id,a.job.id);assert.equal(success.progress_percent,100);
   const link=new URL(success.sticker_url);assert.equal(link.pathname,`/api/v1/images/${a.primary_sticker.id}`);
   assert.equal(link.searchParams.get('owner'),id);assert.equal(link.searchParams.get('signature'),entries.signature(id,a.primary_sticker.id,link.searchParams.get('expires')));
  });
 }finally{
  if(app)await app.close();await db.onModuleDestroy();await sql.end();
  await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();
 }
});
