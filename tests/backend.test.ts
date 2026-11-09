import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { EntriesService, localDate, validateEntry } from '../src/entries';
import { Database } from '../src/db';
import { AuthService } from '../src/auth';
import { ExecutionContext } from '@nestjs/common';

test('Vietnam midnight, Unicode length, trim and invalid dates',()=>{
 assert.equal(localDate(new Date('2026-11-08T17:00:00Z')),'2026-11-09');
 assert.equal(localDate(new Date('2026-11-08T16:59:59Z')),'2026-11-08');
 assert.equal(validateEntry({content:'  vui  '}).content,'vui');
 assert.equal([...validateEntry({content:'😀'.repeat(300)}).content].length,300);
 for(const body of [{content:''},{content:' '.repeat(5)},{content:'😀'.repeat(301)},{content:'x',entry_date:'2026-02-30'},{content:'x',entry_date:'2999-01-01'},{content:'x',user_id:'spoof'}]) assert.throws(()=>validateEntry(body));
});
test('real PostgreSQL schema: owner isolation, uniqueness, cascade, no resurrection',async()=>{
 const db=new PGlite();await db.exec(readFileSync('migrations/001_core.sql','utf8'));
 const ownerA='11111111-1111-4111-8111-111111111111',ownerB='22222222-2222-4222-8222-222222222222';
 const adapter={owner:async(owner:string,action:any)=>db.transaction(async tx=>{
  await tx.query("SELECT set_config('app.user_id',$1,true)",[owner]);
  await tx.query('INSERT INTO users(id) VALUES($1) ON CONFLICT DO NOTHING',[owner]);
  return action({query:async(sql:string,args:unknown[])=>{const result=await tx.query(sql,args);return {...result,rowCount:result.affectedRows ?? result.rows.length};}});
 })} as unknown as Database;
 const service=new EntriesService(adapter);
 const entry=await service.create(ownerA,{content:'  Một ngày vui  '});
 assert.equal(entry.content,'Một ngày vui');assert.equal(entry.job.status,'queued');
 await assert.rejects(()=>service.create(ownerA,{content:'second'}),/DUPLICATE_ENTRY_FOR_DATE/);
 assert.equal((await service.list(ownerB)).items.length,0);
 await assert.rejects(()=>service.detail(ownerB,entry.id),/ENTRY_NOT_FOUND/);
 await assert.rejects(()=>service.remove(ownerB,entry.id),/ENTRY_NOT_FOUND/);
 assert.equal((await service.detail(ownerA,entry.id)).stickers.length,1);
 // RLS under a real non-superuser role, including direct guessed-ID queries.
 await db.exec('CREATE ROLE api_test; GRANT USAGE ON SCHEMA public TO api_test; GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO api_test');
 await db.exec('SET ROLE api_test');
 await db.query("SELECT set_config('app.user_id',$1,false)",[ownerB]);
 assert.equal((await db.query('SELECT * FROM entries WHERE id=$1',[entry.id])).rows.length,0);
 await assert.rejects(()=>db.query('INSERT INTO entries(user_id,entry_date,content) VALUES($1,current_date,$2)',[ownerA,'spoof']));
 await db.exec('RESET ROLE');
 process.env.IMAGE_SIGNING_SECRET='test-secret-long-enough-1234567890';process.env.PUBLIC_API_URL='http://localhost';
 const url=new URL(service.imageUrl(ownerA,entry.primary_sticker.id));
 await assert.rejects(()=>service.image(entry.primary_sticker.id,ownerB,url.searchParams.get('expires')!,url.searchParams.get('signature')!),/INVALID_IMAGE_URL/);
 await service.remove(ownerA,entry.id);
 await assert.rejects(()=>service.image(entry.primary_sticker.id,ownerA,url.searchParams.get('expires')!,url.searchParams.get('signature')!),/IMAGE_NOT_FOUND/);
 assert.equal((await db.query('SELECT * FROM generation_jobs')).rows.length,0);
 assert.equal((await db.query('SELECT * FROM stickers')).rows.length,0);
 await assert.rejects(()=>db.query("INSERT INTO generation_jobs(user_id,entry_id,sticker_id,status) VALUES($1,$2,$3,'succeeded')",[ownerA,entry.id,entry.primary_sticker.id]));
 await db.close();
});
test('auth rejects missing, expired and forged tokens; identity comes from provider',async()=>{
 const auth=new AuthService();
 let request:any={headers:{}};
 const context={switchToHttp:()=>({getRequest:()=>request})} as ExecutionContext;
 await assert.rejects(()=>auth.canActivate(context),/AUTH_REQUIRED/);
 auth.client=(()=>({auth:{getUser:async()=>({data:{user:null},error:{message:'expired'}})}})) as any;
 request={headers:{authorization:'Bearer expired'}};
 await assert.rejects(()=>auth.canActivate(context),/INVALID_SESSION/);
 auth.client=(()=>({auth:{getUser:async()=>({data:{user:{id:'verified-owner'}},error:null})}})) as any;
 request={headers:{authorization:'Bearer valid'},body:{user_id:'attacker'}};
 assert.equal(await auth.canActivate(context),true);assert.equal(request.owner,'verified-owner');
});
