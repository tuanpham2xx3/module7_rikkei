require('reflect-metadata');
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {randomUUID}=require('node:crypto');
const {readFileSync,readdirSync}=require('node:fs');
const {Pool}=require('pg');
const {Worker,defaults}=require('../dist/worker/worker');
const {Database}=require('../dist/db');
const {EntriesService}=require('../dist/entries');
const {JobsService}=require('../dist/jobs');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const image={bytes:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aP6kAAAAASUVORK5CYII=','base64'),mime:'image/png',width:1,height:1};
test('B07 worker acceptance, crash/race/RLS and B06 compatibility',{timeout:90000},async t=>{
 assert.ok(process.env.TEST_DATABASE_URL,'TEST_DATABASE_URL required');
 const admin=new Pool({connectionString:process.env.TEST_DATABASE_URL});
 const schema='b07_'+randomUUID().replaceAll('-','');
 await admin.query(`CREATE SCHEMA ${schema}`);
 const url=new URL(process.env.TEST_DATABASE_URL);url.searchParams.set('options',`-c search_path=${schema},public`);
 const db=new Pool({connectionString:url.toString()});
 const roleExists=(await admin.query("SELECT 1 FROM pg_roles WHERE rolname='doodlelife_worker'")).rowCount;
 if(!roleExists)await admin.query('CREATE ROLE doodlelife_worker NOLOGIN NOSUPERUSER NOBYPASSRLS');
 const workerUrl=new URL(url);workerUrl.searchParams.set('options',`-c search_path=${schema},public -c role=doodlelife_worker`);
 const workerDb=new Pool({connectionString:workerUrl.toString()});
 const logs=[],objects=new Map();let api;
 const storage={put:async(path,img)=>{objects.set(path,img);},remove:async path=>{objects.delete(path);}};
 const options={...defaults,concurrency:2,leaseMs:300,timeoutMs:150,pollMs:10,backoffMs:5,maxJobAgeMs:60000};
 const make=(provider,store=storage,config={})=>new Worker(workerDb,{provider,storage:store},{...options,...config},event=>logs.push(event));
 const seed=async()=>{
  const owner=randomUUID(),entry=randomUUID(),sticker=randomUUID(),job=randomUUID();
  await db.query('INSERT INTO users(id) VALUES($1)',[owner]);
  await db.query("INSERT INTO entries(id,user_id,entry_date,content) VALUES($1,$2,'2026-01-01','private diary must never appear in logs')",[entry,owner]);
  await db.query("INSERT INTO stickers(id,user_id,entry_id,content,time_of_day) VALUES($1,$2,$3,'secret prompt','morning')",[sticker,owner,entry]);
  await db.query('INSERT INTO generation_jobs(id,user_id,entry_id,sticker_id) VALUES($1,$2,$3,$4)',[job,owner,entry,sticker]);
  return {owner,entry,sticker,job};
 };
 const row=async job=>(await db.query('SELECT * FROM generation_jobs WHERE id=$1',[job])).rows[0];
 const due=async job=>db.query('UPDATE generation_jobs SET next_run_at=now() WHERE id=$1',[job]);
 const clear=async()=>{await db.query('DELETE FROM entries');objects.clear();};
 try{
  for(const name of readdirSync('migrations').filter(n=>n.endsWith('.sql')).sort())await db.query(readFileSync('migrations/'+name,'utf8'));
  await db.query(`GRANT USAGE ON SCHEMA ${schema} TO doodlelife_worker; GRANT SELECT,UPDATE(id) ON entries TO doodlelife_worker; GRANT SELECT,UPDATE ON stickers,generation_jobs TO doodlelife_worker; GRANT SELECT,INSERT,UPDATE ON generation_attempts TO doodlelife_worker`);
  await t.test('W01 success atomically persists metadata/job; worker RLS cannot mutate entries',async()=>{
   const a=await seed();const w=make({submit:async()=>({kind:'succeeded',image})});assert.equal(await w.runOnce(),1);
   assert.equal((await row(a.job)).status,'succeeded');assert.equal((await row(a.job)).attempt,1);
   assert.equal((await db.query('SELECT * FROM generation_attempts WHERE job_id=$1',[a.job])).rows[0].outcome,'succeeded');
   const meta=(await db.query('SELECT * FROM stickers WHERE id=$1',[a.sticker])).rows[0];assert.ok(objects.has(meta.object_path));assert.equal(meta.mime_type,'image/png');
   await assert.rejects(()=>workerDb.query("UPDATE entries SET content='spoof' WHERE id=$1",[a.entry]),e=>e.code==='42501');await clear();
  });
  await t.test('W02 two workers + concurrent runOnce never duplicate claim or exceed per-process concurrency',async()=>{
   for(let i=0;i<6;i++)await seed();let calls=0,active=0,peak=0;const ids=new Set();
   const provider={submit:async input=>{calls++;assert.ok(!ids.has(input.jobId));ids.add(input.jobId);peak=Math.max(peak,++active);await sleep(30);active--;return {kind:'succeeded',image};}};
   const a=make(provider),b=make(provider);await Promise.all([a.runOnce(),a.runOnce(),b.runOnce()]);assert.equal(calls,4);assert.ok(peak<=4);
   await a.runOnce();assert.equal(calls,6);assert.equal((await db.query("SELECT count(*)::int n FROM generation_jobs WHERE status='succeeded'")).rows[0].n,6);await clear();
  });
  await t.test('W03 safe transient failure uses retry_after/backoff, max attempts finite',async()=>{
   const a=await seed();let calls=0;const w=make({submit:async()=>{calls++;return {kind:'failed',code:'RATE_LIMITED',safeToResubmit:true,retryAfterMs:1000};}});
   await w.runOnce();assert.equal((await row(a.job)).status,'queued');assert.ok(new Date((await row(a.job)).next_run_at)>new Date());assert.equal(await w.runOnce(),0);
   await due(a.job);await w.runOnce();await due(a.job);await w.runOnce();assert.equal(calls,3);assert.equal((await row(a.job)).status,'failed');assert.equal((await row(a.job)).error_code,'RATE_LIMITED');await clear();
  });
  await t.test('W04 provider refusal is terminal; thrown raw errors are sanitized and never retried',async()=>{
   const a=await seed();const w=make({submit:async()=>({kind:'failed',code:'PROVIDER_REJECTED',safeToResubmit:false})});await w.runOnce();assert.equal((await row(a.job)).error_code,'PROVIDER_REJECTED');
   const b=await seed();let calls=0;const unknown=make({submit:async()=>{calls++;throw Error('secret prompt and api key');}});await unknown.runOnce();await unknown.runOnce();assert.equal(calls,1);assert.equal((await row(b.job)).error_code,'PROVIDER_OUTCOME_UNKNOWN');await clear();
  });
  await t.test('W05 timeout aborts provider, does not wait forever or resubmit unknown delivery',async()=>{
   const a=await seed();let aborted=false,calls=0;
   const w=make({submit:async(_,signal)=>{calls++;signal.addEventListener('abort',()=>{aborted=true;});return new Promise(()=>{});}});
   await w.runOnce();assert.ok(aborted);assert.equal((await row(a.job)).error_code,'PROVIDER_OUTCOME_UNKNOWN');await w.runOnce();assert.equal(calls,1);await clear();
  });
  await t.test('W06 pending reference uses lookup, never a second submit; attempt stays one',async()=>{
   const a=await seed();let submits=0,lookups=0;
   const w=make({submit:async()=>{submits++;return {kind:'pending',reference:'provider-123'};},lookup:async ref=>{assert.equal(ref,'provider-123');lookups++;return {kind:'succeeded',image};}});
   await w.runOnce();assert.equal((await row(a.job)).provider_reference,'provider-123');await due(a.job);await w.runOnce();assert.equal(submits,1);assert.equal(lookups,1);assert.equal((await row(a.job)).attempt,1);await clear();
  });
  await t.test('W07 expired leases recover ready/pending, but dispatching never resubmits',async()=>{
   const a=await seed(),b=await seed(),c=await seed();
   for(const [job,phase,ref] of [[a.job,'ready',null],[b.job,'dispatching',null],[c.job,'pending','ref']])await db.query("UPDATE generation_jobs SET status='processing',phase=$2,provider_reference=$3,lease_token=$4,lease_expires_at=now()-interval '1 second' WHERE id=$1",[job,phase,ref,randomUUID()]);
   const w=make({submit:async()=>({kind:'succeeded',image})});await w.recover();assert.equal((await row(a.job)).status,'queued');assert.equal((await row(b.job)).status,'failed');assert.equal((await row(b.job)).error_code,'PROVIDER_OUTCOME_UNKNOWN');assert.equal((await row(c.job)).phase,'pending');await clear();
  });
  await t.test('W08 delete during provider call never recreates entry/job/object',async()=>{
   const a=await seed();const w=make({submit:async()=>{await db.query('DELETE FROM entries WHERE id=$1',[a.entry]);return {kind:'succeeded',image};}});await w.runOnce();assert.equal(await row(a.job),undefined);assert.equal(objects.size,0);await clear();
  });
  await t.test('W09 delete after upload cleans object, commit cannot resurrect metadata',async()=>{
   const a=await seed();const store={...storage,put:async(path,img)=>{await storage.put(path,img);await db.query('DELETE FROM entries WHERE id=$1',[a.entry]);}};
   await make({submit:async()=>({kind:'succeeded',image})},store).runOnce();assert.equal(objects.size,0);assert.equal(await row(a.job),undefined);await clear();
  });
  await t.test('W10 old worker loses lease and cannot write success or overwrite history',async()=>{
   const a=await seed();const w=make({submit:async()=>{await db.query("UPDATE generation_jobs SET lease_token=$2,status='failed',error_code='PROVIDER_OUTCOME_UNKNOWN' WHERE id=$1",[a.job,randomUUID()]);return {kind:'succeeded',image};}});await w.runOnce();assert.equal((await row(a.job)).status,'failed');assert.equal(objects.size,0);await clear();
  });
  await t.test('W11 invalid image and failed storage never mark success or regenerate',async()=>{
   const a=await seed();await make({submit:async()=>({kind:'succeeded',image:{...image,bytes:Buffer.alloc(20)}})}).runOnce();assert.equal((await row(a.job)).error_code,'INVALID_IMAGE');
   const b=await seed();let calls=0;const w=make({submit:async()=>{calls++;return {kind:'succeeded',image};}},{...storage,put:async()=>{throw Error('private storage token');}});await w.runOnce();await w.runOnce();assert.equal(calls,1);assert.equal((await row(b.job)).error_code,'STORAGE_FAILED');await clear();
  });
  await t.test('W12 heartbeat keeps long-running call leased; stop drains and prevents next batch',async()=>{
   const a=await seed();const w=make({submit:async()=>{await sleep(500);return {kind:'succeeded',image};}},storage,{timeoutMs:1000});
   const active=w.runOnce();await sleep(370);await w.recover();assert.equal((await row(a.job)).status,'processing');await w.stop();await active;assert.equal((await row(a.job)).status,'succeeded');assert.equal(await w.runOnce(),0);await clear();
  });
  await t.test('W13 pending jobs have total deadline, no infinite polling',async()=>{
   const a=await seed();await db.query("UPDATE generation_jobs SET created_at=now()-interval '1 hour' WHERE id=$1",[a.job]);let calls=0;
   await make({submit:async()=>{calls++;return {kind:'pending',reference:'old'};}}).runOnce();assert.equal(calls,0);assert.equal((await row(a.job)).error_code,'JOB_DEADLINE_EXCEEDED');await clear();
  });
  await t.test('W14 B06 create/replay/job polling compatible after worker migration',async()=>{
   process.env.DATABASE_URL=url.toString();process.env.IMAGE_SIGNING_SECRET='test-more-than-32-characters-12345';process.env.PUBLIC_API_URL='http://localhost';
   api=new Database();const entries=new EntriesService(api),jobs=new JobsService(api,entries);const owner=randomUUID(),key=randomUUID();
   const entry=await entries.create(owner,{content:'B06 compatible'},key);await make({submit:async()=>({kind:'succeeded',image})}).runOnce();
   const replay=await entries.create(owner,{content:'B06 compatible'},key);assert.equal(replay.job.id,entry.job.id);assert.equal(replay.job.status,'succeeded');assert.ok((await jobs.read(owner,entry.job.id)).sticker_url);
   await assert.rejects(()=>jobs.read(randomUUID(),entry.job.id),/JOB_NOT_FOUND/);await clear();
  });
  await t.test('W15 logs exclude content/prompt/raw errors/object paths and secrets',()=>{
   const output=JSON.stringify(logs);for(const secret of ['secret prompt','private diary','api key','private storage token'])assert.ok(!output.includes(secret));
   for(const event of logs)assert.ok(Object.keys(event).every(k=>['job_id','status','duration_ms','attempt'].includes(k)));
  });
  await t.test('W16 crash after persisted reference recovers via lookup and updates attempt history',async()=>{
   const a=await seed();await db.query("UPDATE generation_jobs SET status='processing',phase='dispatching',attempt=1,provider_reference='persisted-ref',lease_token=$2,lease_expires_at=now()-interval '1 second' WHERE id=$1",[a.job,randomUUID()]);
   await db.query('INSERT INTO generation_attempts(job_id,user_id,attempt_no) VALUES($1,$2,1)',[a.job,a.owner]);
   let submits=0,lookups=0;const w=make({submit:async()=>{submits++;return {kind:'succeeded',image};},lookup:async ref=>{assert.equal(ref,'persisted-ref');lookups++;return {kind:'succeeded',image};}});
   await w.runOnce();assert.equal(submits,0);assert.equal(lookups,1);assert.equal((await row(a.job)).status,'succeeded');
   assert.equal((await db.query('SELECT outcome FROM generation_attempts WHERE job_id=$1',[a.job])).rows[0].outcome,'succeeded');await clear();
  });
  await t.test('W17 late storage completion after deadline is cleaned without success',async()=>{
   const a=await seed();const slow={...storage,put:async(path,img)=>{await sleep(250);await storage.put(path,img);}};
   await make({submit:async()=>({kind:'succeeded',image})},slow).runOnce();assert.equal((await row(a.job)).error_code,'STORAGE_FAILED');await sleep(180);assert.equal(objects.size,0);await clear();
  });
  await t.test('W18 failed DB commit after upload leaves no accessible image or success',async()=>{
   const a=await seed();await db.query("CREATE FUNCTION fail_eval_success() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN IF NEW.status='succeeded' THEN RAISE EXCEPTION 'eval commit failure'; END IF; RETURN NEW; END $$; CREATE TRIGGER fail_eval_success BEFORE UPDATE ON generation_jobs FOR EACH ROW EXECUTE FUNCTION fail_eval_success()");
   try{
    await make({submit:async()=>({kind:'succeeded',image})}).runOnce();assert.equal((await row(a.job)).status,'failed');assert.equal(objects.size,0);
    assert.equal((await db.query('SELECT object_path FROM stickers WHERE id=$1',[a.sticker])).rows[0].object_path,null);
   }finally{await db.query('DROP TRIGGER fail_eval_success ON generation_jobs; DROP FUNCTION fail_eval_success()');await clear();}
  });
  await t.test('W19 unknown/rejected outcomes never retry even with contradictory adapter hint',async()=>{
   for(const code of ['PROVIDER_OUTCOME_UNKNOWN','PROVIDER_REJECTED','INVALID_INPUT']){
    const a=await seed();let calls=0;const w=make({submit:async()=>{calls++;return {kind:'failed',code,safeToResubmit:true};}});
    await w.runOnce();await w.runOnce();assert.equal(calls,1);assert.equal((await row(a.job)).status,'failed');await clear();
   }
  });
 }finally{
  if(api)await api.onModuleDestroy();await workerDb.end();await db.end();await admin.query(`DROP SCHEMA ${schema} CASCADE`);
  if(!roleExists)await admin.query('DROP ROLE doodlelife_worker');await admin.end();
 }
});
