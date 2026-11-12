import { Pool, PoolClient } from 'pg';
import { ImageResult, ProviderResult, WorkerAdapter } from './ports';

export type WorkerOptions={concurrency:number;leaseMs:number;timeoutMs:number;pollMs:number;backoffMs:number;maxJobAgeMs:number};
export const defaults:WorkerOptions={concurrency:2,leaseMs:60000,timeoutMs:30000,pollMs:2000,backoffMs:2000,maxJobAgeMs:600000};
type Job={id:string;user_id:string;entry_id:string;sticker_id:string;attempt:number;run_version:number;run_started_at:Date;max_attempts:number;phase:string;lease_token:string;provider_reference:string|null;content:string;mood:string;time_of_day:string;created_at:Date};
const allowedErrors=new Set(['PROVIDER_REJECTED','INVALID_INPUT','RATE_LIMITED','PROVIDER_UNAVAILABLE','INVALID_IMAGE','PROVIDER_OUTCOME_UNKNOWN','STORAGE_FAILED','JOB_DEADLINE_EXCEEDED','ADAPTER_FAILURE']);
const safeCode=(code:string)=>allowedErrors.has(code)?code:'ADAPTER_FAILURE';
export class Worker {
  private active:Promise<number>|null=null;
  private stopping=false;
  constructor(private readonly pool:Pool,private readonly adapter:WorkerAdapter,readonly options:WorkerOptions=defaults,
    private readonly log:(event:Record<string,unknown>)=>void=event=>process.stdout.write(JSON.stringify(event)+'\n')) {
    for(const [name,value] of Object.entries(options))if(!Number.isInteger(value)||value<1)throw new Error(`Invalid worker config: ${name}`);
    if(options.concurrency>32||options.leaseMs<100)throw new Error('Invalid worker concurrency/lease');
  }
  private async transaction<T>(action:(c:PoolClient)=>Promise<T>){
    const c=await this.pool.connect();try{await c.query('BEGIN');const result=await action(c);await c.query('COMMIT');return result;}
    catch(error){await c.query('ROLLBACK');throw error;}finally{c.release();}
  }
  async recover(){
    // Phase written BEFORE network dispatch. Unknown delivery never automatically resubmits.
    return this.pool.query(`WITH recovered AS (UPDATE generation_jobs SET
      status=CASE WHEN phase='ready' OR (provider_reference IS NOT NULL AND phase IN ('dispatching','pending','storing')) THEN 'queued' ELSE 'failed' END,
      error_code=CASE WHEN phase='ready' OR (provider_reference IS NOT NULL AND phase IN ('dispatching','pending','storing')) THEN NULL ELSE 'PROVIDER_OUTCOME_UNKNOWN' END,
      finished_at=CASE WHEN phase='ready' OR (provider_reference IS NOT NULL AND phase IN ('dispatching','pending','storing')) THEN NULL ELSE now() END,
      phase=CASE WHEN phase IN ('dispatching','storing') AND provider_reference IS NOT NULL THEN 'pending' WHEN phase='dispatching' THEN 'unknown' ELSE phase END,
      lease_token=NULL,lease_expires_at=NULL,next_run_at=now(),updated_at=now()
      WHERE status='processing' AND lease_expires_at < now() RETURNING id,attempt,run_version,status,error_code)
      UPDATE generation_attempts a SET outcome=CASE WHEN r.status='failed' THEN 'failed' ELSE 'recovered' END,
        error_code=r.error_code,finished_at=now() FROM recovered r WHERE a.job_id=r.id AND a.attempt_no=r.attempt AND a.run_version=r.run_version`);
  }
  async runOnce():Promise<number>{
    if(this.stopping)return 0;
    if(this.active)return this.active;
    this.active=this.batch();try{return await this.active;}finally{this.active=null;}
  }
  private async batch(){
    await this.recover();
    const jobs=await this.transaction(async c=>(await c.query(`WITH candidates AS (
      SELECT id FROM generation_jobs WHERE status='queued' AND next_run_at<=now()
      ORDER BY next_run_at,created_at,id FOR UPDATE SKIP LOCKED LIMIT $1)
      UPDATE generation_jobs j SET status='processing',lease_token=gen_random_uuid(),
      lease_expires_at=now()+$2::int*interval '1 millisecond',started_at=coalesce(started_at,now()),updated_at=now()
      FROM candidates x WHERE j.id=x.id AND j.status='queued' RETURNING j.*`,[this.options.concurrency,this.options.leaseMs])).rows as Job[]);
    await Promise.all(jobs.map(job=>this.process(job)));return jobs.length;
  }
  private async bounded<T>(action:(signal:AbortSignal)=>Promise<T>,controller:AbortController):Promise<T>{
    let timer:ReturnType<typeof setTimeout>|undefined;
    try{return await Promise.race([action(controller.signal),new Promise<never>((_,reject)=>{
      timer=setTimeout(()=>{controller.abort();reject(new Error('deadline'));},this.options.timeoutMs);
    })]);}finally{if(timer)clearTimeout(timer);}
  }
  private async update(job:Job,sql:string,args:unknown[]=[]){
    return this.pool.query(`UPDATE generation_jobs SET ${sql},updated_at=now() WHERE id=$1 AND lease_token=$2 AND status='processing' AND lease_expires_at>now() RETURNING id`,[job.id,job.lease_token,...args]);
  }
  private async finish(job:Job,code:string,userRetryAllowed=false){
    await this.transaction(async c=>{
      const row=await c.query("UPDATE generation_jobs SET status='failed',phase='done',error_code=$3,user_retry_allowed=$4,finished_at=now(),lease_token=NULL,lease_expires_at=NULL,updated_at=now() WHERE id=$1 AND lease_token=$2 AND status='processing' RETURNING id",[job.id,job.lease_token,safeCode(code),userRetryAllowed]);
      if(row.rowCount)await c.query("UPDATE generation_attempts SET outcome='failed',error_code=$3,finished_at=now() WHERE job_id=$1 AND attempt_no=$2 AND run_version=$4",[job.id,job.attempt,safeCode(code),job.run_version]);
    });
  }
  private async process(job:Job){
    const controller=new AbortController();let lost=false;let beating=false;let path:string|undefined;const started=Date.now();
    const usage={provider_submissions:0,provider_lookups:0};
    const heartbeat=setInterval(()=>{if(beating)return;beating=true;
      void this.update(job,"lease_expires_at=now()+$3::int*interval '1 millisecond'",[this.options.leaseMs])
        .then(r=>{if(!r.rowCount){lost=true;controller.abort();}}).catch(()=>{lost=true;controller.abort();}).finally(()=>{beating=false;});
    },Math.max(25,Math.floor(this.options.leaseMs/3)));
    try{
      if(Date.now()-new Date(job.run_started_at ?? job.created_at).getTime()>this.options.maxJobAgeMs){await this.finish(job,'JOB_DEADLINE_EXCEEDED');return;}
      const details=(await this.pool.query('SELECT content,mood,time_of_day FROM stickers WHERE id=$1 AND entry_id=$2 AND user_id=$3',[job.sticker_id,job.entry_id,job.user_id])).rows[0];
      if(!details)return;Object.assign(job,details);
      let result:ProviderResult;
      if(job.provider_reference && job.phase==='pending'){
        if(!this.adapter.provider.lookup){await this.finish(job,'PROVIDER_OUTCOME_UNKNOWN');return;}
        usage.provider_lookups++;
        result=await this.bounded(signal=>this.adapter.provider.lookup!(job.provider_reference!,signal),controller);
      }else{
        if(job.phase!=='ready'){await this.finish(job,'PROVIDER_OUTCOME_UNKNOWN');return;}
        if(job.attempt>=job.max_attempts){await this.finish(job,'PROVIDER_UNAVAILABLE');return;}
        const dispatched=await this.transaction(async c=>{
          const row=await c.query(`UPDATE generation_jobs SET phase='dispatching',attempt=attempt+1,updated_at=now()
            WHERE id=$1 AND lease_token=$2 AND status='processing' RETURNING attempt`,[job.id,job.lease_token]);
          if(!row.rowCount)return false;job.attempt=row.rows[0].attempt;
          await c.query('INSERT INTO generation_attempts(job_id,user_id,attempt_no,run_version) VALUES($1,$2,$3,$4)',[job.id,job.user_id,job.attempt,job.run_version]);return true;
        });
        if(!dispatched)return;
        usage.provider_submissions++;
        result=await this.bounded(signal=>this.adapter.provider.submit({jobId:job.id,requestKey:`${job.id}:${job.run_version}:${job.attempt}`,content:job.content,mood:job.mood,timeOfDay:job.time_of_day},signal),controller);
      }
      if(lost)return;
      if(result.reference){job.provider_reference=result.reference;
        if(!(await this.update(job,'provider_reference=$3',[result.reference])).rowCount)return;}
      if(result.kind==='pending'){
        if(!result.reference){await this.finish(job,'PROVIDER_OUTCOME_UNKNOWN');return;}
        await this.requeue(job,'pending',result.retryAfterMs??this.options.pollMs);return;
      }
      if(result.kind==='failed'){
        if(result.safeToResubmit && ['RATE_LIMITED','PROVIDER_UNAVAILABLE'].includes(result.code) && job.attempt<job.max_attempts){
          await this.requeue(job,'ready',Math.max(result.retryAfterMs??0,this.options.backoffMs*2**Math.max(0,job.attempt-1)+Math.floor(Math.random()*this.options.backoffMs)),safeCode(result.code));
        }else await this.finish(job,result.code,result.safeToResubmit && ['RATE_LIMITED','PROVIDER_UNAVAILABLE'].includes(result.code));return;
      }
      if(!validImage(result.image)){await this.finish(job,'INVALID_IMAGE');return;}
      if(!(await this.update(job,"phase='storing'")).rowCount)return;
      path=`${job.user_id}/${job.entry_id}/${job.id}-${job.lease_token}.${result.image.mime==='image/png'?'png':result.image.mime==='image/jpeg'?'jpg':'webp'}`;
      const uploadPath=path;
      try{await this.bounded(signal=>this.adapter.storage.put(uploadPath,result.image,signal).then(async()=>{
        // A non-cooperative transport may complete after the deadline. Clean that late upload too.
        if(signal.aborted){try{await this.bounded(s=>this.adapter.storage.remove(uploadPath,s),new AbortController());}
        catch{this.log({job_id:job.id,status:'cleanup_required'});}}
      }),controller);}
      catch{await this.finish(job,'STORAGE_FAILED');return;}
      if(lost)return;
      const saved=await this.transaction(async c=>{
        // Same lock order as DELETE: entry before dependent rows.
        if(!(await c.query('SELECT id FROM entries WHERE id=$1 AND user_id=$2 FOR UPDATE',[job.entry_id,job.user_id])).rowCount)return false;
        const current=await c.query("SELECT id FROM generation_jobs WHERE id=$1 AND lease_token=$2 AND status='processing' AND lease_expires_at>now() FOR UPDATE",[job.id,job.lease_token]);
        if(!current.rowCount)return false;
        await c.query('UPDATE stickers SET object_path=$4,mime_type=$5,size_bytes=$6,width=$7,height=$8 WHERE id=$1 AND entry_id=$2 AND user_id=$3',[job.sticker_id,job.entry_id,job.user_id,path,result.image.mime,result.image.bytes.byteLength,result.image.width,result.image.height]);
        await c.query("UPDATE generation_jobs SET status='succeeded',phase='done',error_code=NULL,finished_at=now(),updated_at=now(),lease_token=NULL,lease_expires_at=NULL WHERE id=$1",[job.id]);
        await c.query("UPDATE generation_attempts SET outcome='succeeded',finished_at=now(),provider_reference=$3 WHERE job_id=$1 AND attempt_no=$2 AND run_version=$4",[job.id,job.attempt,job.provider_reference,job.run_version]);return true;
      });
      if(saved)path=undefined;
    }catch{
      // Throws/timeouts are delivery-unknown unless a previously persisted reference can be reconciled.
      if(!lost){if(job.provider_reference && this.adapter.provider.lookup)await this.requeue(job,'pending',this.options.pollMs);
      else await this.finish(job,'PROVIDER_OUTCOME_UNKNOWN');}
    }finally{
      clearInterval(heartbeat);
      if(path){try{
        // COMMIT acknowledgement can fail after the DB committed. Never remove a referenced image.
        const attached=await this.pool.query('SELECT id FROM stickers WHERE object_path=$1',[path]);
        if(!attached.rowCount)await this.bounded(signal=>this.adapter.storage.remove(path!,signal),new AbortController());
      }catch{this.log({job_id:job.id,status:'cleanup_required'});}}
      let status='worker_cycle_finished';
      try{status=(await this.pool.query('SELECT status FROM generation_jobs WHERE id=$1',[job.id])).rows[0]?.status ?? 'deleted';}catch{/* No raw database error in logs. */}
      this.log({job_id:job.id,status,duration_ms:Date.now()-started,attempt:job.attempt,run_version:job.run_version,usage});
    }
  }
  private async requeue(job:Job,phase:'ready'|'pending',delay:number,code:string|null=null){
    const ms=Number.isFinite(delay)?Math.max(1,Math.min(delay,600000)):this.options.pollMs;
    await this.transaction(async c=>{
      const r=await c.query(`UPDATE generation_jobs SET status='queued',phase=$3,error_code=$4,next_run_at=now()+$5::int*interval '1 millisecond',
        lease_token=NULL,lease_expires_at=NULL,updated_at=now(),provider_reference=CASE WHEN $3='ready' THEN NULL ELSE provider_reference END
        WHERE id=$1 AND lease_token=$2 AND status='processing' RETURNING id`,[job.id,job.lease_token,phase,code,Math.ceil(ms)]);
      if(r.rowCount)await c.query('UPDATE generation_attempts SET outcome=$3,error_code=$4,provider_reference=$5,finished_at=CASE WHEN $3=\'retry\' THEN now() ELSE NULL END WHERE job_id=$1 AND attempt_no=$2 AND run_version=$6',[job.id,job.attempt,phase==='ready'?'retry':'pending',code,job.provider_reference,job.run_version]);
    });
  }
  async stop(){this.stopping=true;if(this.active)await this.active;}
}
export function validImage(image:ImageResult){
  if(!image||!(image.bytes instanceof Uint8Array)||image.bytes.byteLength<12||image.bytes.byteLength>10485760||!Number.isInteger(image.width)||!Number.isInteger(image.height)||image.width<1||image.height<1)return false;
  const b=Buffer.from(image.bytes);
  return image.mime==='image/png'?b.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])):
    image.mime==='image/jpeg'?b[0]===255&&b[1]===216&&b[2]===255:
    image.mime==='image/webp'?b.toString('ascii',0,4)==='RIFF'&&b.toString('ascii',8,12)==='WEBP':false;
}
