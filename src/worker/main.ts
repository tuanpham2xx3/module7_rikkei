import 'dotenv/config';
import { resolve } from 'node:path';
import { createRequire } from 'node:module';
import { Pool } from 'pg';
import { Worker, defaults, WorkerOptions } from './worker';
import { WorkerAdapter } from './ports';

export async function startWorker(){
  if(!process.env.WORKER_DATABASE_URL||!process.env.WORKER_ADAPTER_MODULE)throw new Error('Worker requires WORKER_DATABASE_URL and WORKER_ADAPTER_MODULE');
  // Explicit trusted local module only; never load a URL or user-supplied module path.
  const loadAdapter=createRequire(__filename);
  const adapter:WorkerAdapter=loadAdapter(resolve(process.env.WORKER_ADAPTER_MODULE));
  if(typeof adapter.provider?.submit!=='function'||typeof adapter.storage?.put!=='function'||typeof adapter.storage?.remove!=='function')throw new Error('Invalid worker adapter exports');
  const options={...defaults};
  for(const key of Object.keys(defaults) as (keyof WorkerOptions)[]){
    const env='WORKER_'+key.replace(/[A-Z]/g,x=>'_'+x).toUpperCase();
    if(process.env[env])options[key]=Number(process.env[env]);
  }
  const pool=new Pool({connectionString:process.env.WORKER_DATABASE_URL,max:options.concurrency+2,connectionTimeoutMillis:10000,statement_timeout:15000});
  const worker=new Worker(pool,adapter,options);let stopped=false;
  const stop=()=>{stopped=true;};process.once('SIGINT',stop);process.once('SIGTERM',stop);
  try{
    while(!stopped){await worker.runOnce();if(!stopped)await new Promise(r=>setTimeout(r,options.pollMs));}
  }finally{await worker.stop();await pool.end();process.removeListener('SIGINT',stop);process.removeListener('SIGTERM',stop);}
}
if(require.main===module)void startWorker().catch(()=>{process.stderr.write('Worker stopped: check server configuration/database/adapter.\n');process.exitCode=1;});
