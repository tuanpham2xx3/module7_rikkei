require('reflect-metadata');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {readFileSync,readdirSync}=require('node:fs');
const {Pool}=require('pg');
const request=require('supertest');
const {Database}=require('../dist/db');
const {EntriesService}=require('../dist/entries');
const {JobsService}=require('../dist/jobs');
const {readQuota}=require('../dist/quota');
const {Worker,defaults}=require('../dist/worker/worker');
const {AuthService}=require('../dist/auth');
const {bootstrap}=require('../dist/main');
test('B08 quota/retry acceptance on real PostgreSQL',{timeout:90000},async t=>{
 assert.ok(process.env.TEST_DATABASE_URL,'TEST_DATABASE_URL required');
 const admin=new Pool({connectionString:process.env.TEST_DATABASE_URL});const schema='b08_'+randomUUID().replaceAll('-','');await admin.query(`CREATE SCHEMA ${schema}`);
 const url=new URL(process.env.TEST_DATABASE_URL);url.searchParams.set('options',`-c search_path=${schema},public`);process.env.DATABASE_URL=url.toString();
 const sql=new Pool({connectionString:url.toString()}),db=new Database(),entries=new EntriesService(db),jobs=new JobsService(db,entries);let app;
 const owner=async(limit=5)=>{const id=randomUUID();await sql.query('INSERT INTO users(id) VALUES($1)',[id]);await sql.query('INSERT INTO profiles(user_id,daily_generation_limit) VALUES($1,$2)',[id,limit]);return id;};
 const create=(id,date='2026-01-01',key=randomUUID())=>entries.create(id,{content:'private diary',entry_date:date},key);
 const quota=id=>db.owner(id,c=>readQuota(c,id));
 const fail=async(entry,code='PROVIDER_UNAVAILABLE',safe=true)=>sql.query("UPDATE generation_jobs SET status='failed',phase='done',error_code=$2,user_retry_allowed=$3 WHERE id=$1",[entry.job.id,code,safe]);
 try{
  for(const name of readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort())await sql.query(readFileSync('migrations/'+name,'utf8'));
  await t.test('Q01 configured quota, create charges once, replay never charges twice',async()=>{
   const id=await owner(2),key=randomUUID();const a=await create(id,undefined,key);assert.equal(a.quota.remaining_quota,1);
   const b=await create(id,undefined,key);assert.equal(a.id,b.id);assert.equal((await quota(id)).used,1);
   assert.equal((await sql.query('SELECT count(*)::int n FROM generation_usage_events WHERE user_id=$1',[id])).rows[0].n,1);
  });
  await t.test('Q02 last-slot concurrency: two connections, one generation reserved, both diaries preserved',async()=>{
   const id=await owner(1),original=db.owner.bind(db);let n=0,release;const gate=new Promise(r=>{release=r;}),pids=new Set();
   db.owner=(user,action)=>original(user,async c=>{pids.add((await c.query('SELECT pg_backend_pid() pid')).rows[0].pid);if(++n===2)release();await gate;return action(c);});
   try{
    const out=await Promise.all([create(id,'2026-01-01'),create(id,'2026-01-02')]);assert.equal(pids.size,2);assert.equal(out.filter(e=>e.job.status==='queued').length,1);assert.equal(out.filter(e=>e.job.status==='failed').length,1);
   }finally{db.owner=original;}
   assert.equal((await quota(id)).used,1);assert.equal((await entries.list(id)).items.length,2);
   const failed=(await sql.query("SELECT * FROM generation_jobs WHERE user_id=$1 AND status='failed'",[id])).rows[0];assert.equal(failed.error_code,'QUOTA_EXCEEDED');assert.equal((await jobs.read(id,failed.id)).can_retry,false);
  });
  await t.test('Q03 failed create rolls back quota/event/request and does not consume capacity',async()=>{
   const id=await owner(2),a=await create(id);await assert.rejects(()=>create(id),/DUPLICATE_ENTRY_FOR_DATE/);assert.equal((await quota(id)).used,1);await entries.remove(id,a.id);
   assert.equal((await quota(id)).used,1);assert.equal((await sql.query('SELECT count(*)::int n FROM generation_usage_events WHERE user_id=$1 AND job_id IS NULL',[id])).rows[0].n,1);
  });
  await t.test('Q04 user retry same key concurrent changes run once and consumes one extra quota',async()=>{
   const id=await owner(3),a=await create(id),key=randomUUID();await fail(a);
   const out=await Promise.all([entries.retry(id,a.id,key),entries.retry(id,a.id,key)]);assert.equal(out[0].job.id,a.job.id);assert.equal(out[0].job.run_version,2);assert.equal(out[1].job.run_version,2);assert.equal((await quota(id)).used,2);
  });
  await t.test('Q05 distinct retry keys compete for same job: only one user run starts',async()=>{
   const id=await owner(3),a=await create(id);await fail(a);const out=await Promise.allSettled([entries.retry(id,a.id,randomUUID()),entries.retry(id,a.id,randomUUID())]);assert.equal(out.filter(r=>r.status==='fulfilled').length,1);assert.match(out.find(r=>r.status==='rejected').reason.message,/JOB_NOT_RETRYABLE/);assert.equal((await quota(id)).used,2);
  });
  await t.test('Q06 quota-exhausted retry returns 429 without altering job or retaining key',async()=>{
   const id=await owner(1),a=await create(id),key=randomUUID();await fail(a);
   await assert.rejects(()=>entries.retry(id,a.id,key),e=>e.getStatus()===429&&e.getResponse().quota.remaining_quota===0);
   assert.equal((await sql.query('SELECT run_version FROM generation_jobs WHERE id=$1',[a.job.id])).rows[0].run_version,1);
   assert.equal((await sql.query("SELECT count(*)::int n FROM api_requests WHERE user_id=$1 AND operation='retry_entry'",[id])).rows[0].n,0);
   await sql.query('UPDATE profiles SET daily_generation_limit=2 WHERE user_id=$1',[id]);assert.equal((await entries.retry(id,a.id,key)).job.run_version,2);
  });
  await t.test('Q07 reject unknown/unsafe/fallback/active jobs and owner spoofing',async()=>{
   const id=await owner(10),other=await owner(10),a=await create(id);
   await assert.rejects(()=>entries.retry(other,a.id,randomUUID()),/ENTRY_NOT_FOUND/);
   await assert.rejects(()=>entries.retry(id,a.id,randomUUID()),/JOB_NOT_RETRYABLE/);
   await fail(a,'PROVIDER_OUTCOME_UNKNOWN',false);await assert.rejects(()=>entries.retry(id,a.id,randomUUID()),/PROVIDER_OUTCOME_UNKNOWN/);
   await fail(a,'RATE_LIMITED',false);await assert.rejects(()=>entries.retry(id,a.id,randomUUID()),/JOB_NOT_RETRYABLE/);
   await fail(a);await sql.query('UPDATE stickers SET is_fallback=true WHERE entry_id=$1',[a.id]);await assert.rejects(()=>entries.retry(id,a.id,randomUUID()),/JOB_NOT_RETRYABLE/);
   assert.equal((await quota(id)).used,1);await assert.rejects(()=>entries.retry(id,a.id,randomUUID(),{user_id:other}),/INVALID_FIELDS/);
  });
  await t.test('Q08 retry key bound to target; replay after delete is 410; no refund',async()=>{
   const id=await owner(5),a=await create(id),b=await create(id,'2026-01-02'),key=randomUUID();await fail(a);await entries.retry(id,a.id,key);
   await assert.rejects(()=>entries.retry(id,b.id,key),/IDEMPOTENCY_KEY_REUSED/);await entries.remove(id,a.id);await assert.rejects(()=>entries.retry(id,a.id,key),/RESOURCE_DELETED/);assert.equal((await quota(id)).used,3);
  });
  await t.test('Q09 Vietnam midnight resets quota by request date, not journal date',async ctx=>{
   ctx.mock.timers.enable({apis:['Date'],now:new Date('2026-11-11T16:59:59Z')});
   try{
    const id=await owner(1),a=await create(id,'2026-01-01');assert.equal(a.quota.reset_at,'2026-11-11T17:00:00.000Z');
    const b=await create(id,'2026-01-02');assert.equal(b.job.status,'failed');assert.equal((await jobs.read(id,b.job.id)).can_retry,false);
    ctx.mock.timers.setTime(Date.parse('2026-11-11T17:00:01Z'));assert.equal((await quota(id)).remaining_quota,1);assert.equal((await jobs.read(id,b.job.id)).can_retry,true);
    const retried=await entries.retry(id,b.id,randomUUID());assert.equal(retried.quota.used,1);assert.equal(retried.job.run_version,2);
   }finally{ctx.mock.timers.reset();}
  });
  await t.test('Q10 three system retries charge one user action; second user run keeps attempt history',async()=>{
   // Isolate jobs so worker cannot consume other eval fixtures.
   await sql.query("UPDATE generation_jobs SET status='failed' WHERE status='queued'");
   const id=await owner(3),a=await create(id);const logs=[];let calls=0;
   const worker=new Worker(sql,{provider:{submit:async()=>{calls++;return {kind:'failed',code:'RATE_LIMITED',safeToResubmit:true};}},storage:{put:async()=>{},remove:async()=>{}}},{...defaults,concurrency:1,backoffMs:1},event=>logs.push(event));
   for(let i=0;i<3;i++){await sql.query('UPDATE generation_jobs SET next_run_at=now() WHERE id=$1',[a.job.id]);await worker.runOnce();}
   assert.equal(calls,3);assert.equal((await quota(id)).used,1);assert.equal((await jobs.read(id,a.job.id)).can_retry,true);
   await entries.retry(id,a.id,randomUUID());await worker.runOnce();assert.equal((await quota(id)).used,2);
   const history=(await sql.query('SELECT run_version,attempt_no FROM generation_attempts WHERE job_id=$1 ORDER BY run_version,attempt_no',[a.job.id])).rows;assert.deepEqual(history,[{run_version:1,attempt_no:1},{run_version:1,attempt_no:2},{run_version:1,attempt_no:3},{run_version:2,attempt_no:1}]);
   assert.equal(logs.reduce((n,e)=>n+(e.usage?.provider_submissions??0),0),4);assert.ok(!JSON.stringify(logs).includes('private diary'));
  });
  await t.test('Q11 HTTP quota/retry auth, key validation and structured 429',async()=>{
   const id=await owner(1),a=await create(id);await fail(a);
   Object.assign(process.env,{PORT:'0',SUPABASE_URL:'https://example.supabase.co',SUPABASE_ANON_KEY:'stub',SUPABASE_SERVICE_ROLE_KEY:'stub',IMAGE_SIGNING_SECRET:'eval-more-than-32-characters-12345',PUBLIC_API_URL:'http://localhost',CORS_ORIGIN:'http://localhost:3000',STORAGE_BUCKET:'stickers'});
   app=await bootstrap();app.get(AuthService).client=()=>({auth:{getUser:async token=>({data:{user:token==='valid'?{id}:null},error:null})}});const http=request(app.getHttpServer());
   await http.get('/api/v1/users/quota').expect(401);await http.get('/api/v1/users/quota').set('Authorization','Bearer valid').expect(200).expect(r=>assert.equal(r.body.data.remaining_quota,0));
   await http.post(`/api/v1/entries/${a.id}/retry`).set('Authorization','Bearer valid').send({}).expect(400);
   await http.post(`/api/v1/entries/${a.id}/retry`).set('Authorization','Bearer valid').set('Idempotency-Key',randomUUID()).send({}).expect(429).expect(r=>{assert.equal(r.body.error.code,'QUOTA_EXCEEDED');assert.equal(r.body.error.quota.remaining_quota,0);});
   await sql.query('UPDATE profiles SET daily_generation_limit=2 WHERE user_id=$1',[id]);await http.post(`/api/v1/entries/${a.id}/retry`).set('Authorization','Bearer valid').set('Idempotency-Key',randomUUID()).send({}).expect(201).expect(r=>assert.equal(r.body.data.job.run_version,2));
  });
  await t.test('Q12 usage/events RLS denies another owner, config constraints reject invalid limits',async()=>{
   const role='r_'+schema,c=await sql.connect(),id=await owner();
   try{
    await c.query(`CREATE ROLE ${role}; GRANT USAGE ON SCHEMA ${schema} TO ${role}; GRANT SELECT,INSERT ON daily_generation_usage,generation_usage_events TO ${role}`);await c.query(`SET ROLE ${role}`);await c.query("SELECT set_config('app.user_id',$1,false)",[id]);assert.equal((await c.query('SELECT * FROM daily_generation_usage')).rowCount,0);
    await assert.rejects(()=>c.query("INSERT INTO daily_generation_usage(user_id,usage_date) VALUES($1,current_date)",[randomUUID()]),e=>e.code==='42501');
   }finally{await c.query('RESET ROLE');await c.query(`DROP OWNED BY ${role}; DROP ROLE ${role}`);c.release();}
   await assert.rejects(()=>sql.query('UPDATE profiles SET daily_generation_limit=-1 WHERE user_id=$1',[id]),e=>e.code==='23514');
  });
  await t.test('Q13 fault after reservation rolls back counters/events/entry/request atomically',async()=>{
   const id=await owner(1),key=randomUUID();
   await sql.query("CREATE FUNCTION fail_eval_request() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'eval after reservation'; END $$; CREATE TRIGGER fail_eval_request BEFORE UPDATE ON api_requests FOR EACH ROW EXECUTE FUNCTION fail_eval_request()");
   try{await assert.rejects(()=>create(id,undefined,key),/eval after reservation/);assert.equal((await quota(id)).used,0);assert.equal((await sql.query('SELECT count(*)::int n FROM generation_usage_events WHERE user_id=$1',[id])).rows[0].n,0);assert.equal((await entries.list(id)).items.length,0);}
   finally{await sql.query('DROP TRIGGER fail_eval_request ON api_requests; DROP FUNCTION fail_eval_request()');}
   assert.equal((await create(id,undefined,key)).job.status,'queued');
  });
  await t.test('Q14 quota/retry work under FORCE RLS without DELETE permission on request keys',async()=>{
   const role='api_'+schema;const restrictedUrl=new URL(url);restrictedUrl.searchParams.set('options',`-c search_path=${schema},public -c role=${role}`);let restricted;const saved=process.env.DATABASE_URL;
   await sql.query(`CREATE ROLE ${role}; GRANT USAGE ON SCHEMA ${schema} TO ${role}; GRANT SELECT,INSERT,UPDATE ON users,profiles,entries,stickers,generation_jobs,api_requests,daily_generation_usage,generation_usage_events TO ${role}`);
   try{
    process.env.DATABASE_URL=restrictedUrl.toString();restricted=new Database();const service=new EntriesService(restricted),id=randomUUID();
    const a=await service.create(id,{content:'RLS quota'},randomUUID());await fail(a);const b=await service.retry(id,a.id,randomUUID());assert.equal(b.quota.used,2);assert.equal(b.job.run_version,2);
   }finally{process.env.DATABASE_URL=saved;if(restricted)await restricted.onModuleDestroy();await sql.query(`DROP OWNED BY ${role}; DROP ROLE ${role}`);}
  });
 }finally{if(app)await app.close();await db.onModuleDestroy();await sql.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);await admin.end();}
});
