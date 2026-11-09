import 'reflect-metadata';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { AuthService } from '../src/auth';
import { ExecutionContext } from '@nestjs/common';

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
