import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { PoolClient } from 'pg';
import { localDate } from './time';
import { Database } from './db';
import { AuthService, AuthRequest } from './auth';

export async function readQuota(c:PoolClient,owner:string,now=new Date()) {
  const date=localDate(now);
  const row=(await c.query(`SELECT p.daily_generation_limit AS daily_limit,coalesce(u.used,0) AS used
    FROM profiles p LEFT JOIN daily_generation_usage u ON u.user_id=p.user_id AND u.usage_date=$2
    WHERE p.user_id=$1`,[owner,date])).rows[0];
  // Fixed UTC+7 has no daylight-saving transition.
  const next=new Date(Date.parse(`${date}T00:00:00+07:00`)+86400000);
  return {daily_limit:row.daily_limit,used:row.used,remaining_quota:Math.max(0,row.daily_limit-row.used),reset_at:next.toISOString()};
}
export async function reserveQuota(c:PoolClient,owner:string,jobId:string,run:number,now=new Date()) {
  const date=localDate(now);
  // Serializes reservations with server-side changes to this user's configured limit.
  const {daily_generation_limit:limit}=(await c.query('SELECT daily_generation_limit FROM profiles WHERE user_id=$1 FOR UPDATE',[owner])).rows[0];
  await c.query('INSERT INTO daily_generation_usage(user_id,usage_date) VALUES($1,$2) ON CONFLICT DO NOTHING',[owner,date]);
  const reserved=await c.query('UPDATE daily_generation_usage SET used=used+1 WHERE user_id=$1 AND usage_date=$2 AND used<$3 RETURNING used',[owner,date,limit]);
  if(reserved.rowCount)await c.query('INSERT INTO generation_usage_events(user_id,job_id,run_version,usage_date) VALUES($1,$2,$3,$4)',[owner,jobId,run,date]);
  return {reserved:!!reserved.rowCount,quota:await readQuota(c,owner,now)};
}
@UseGuards(AuthService)
@Controller('users')
export class QuotaController {
  constructor(private readonly db:Database) {}
  @Get('quota') async read(@Req() req:AuthRequest){return {success:true,data:await this.db.owner(req.owner,c=>readQuota(c,req.owner))};}
}
