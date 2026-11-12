import { BadRequestException, Body, Controller, Delete, Get, Injectable, NotFoundException, Param, ParseUUIDPipe, Post, Req, UseGuards, ConflictException, Res, Query, UnauthorizedException, GoneException, Headers } from '@nestjs/common';
import { Response } from 'express';
import { createHmac, timingSafeEqual, createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Database } from './db';
import { AuthRequest, AuthService } from './auth';

export function localDate(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}
export function validateEntry(body: Record<string, unknown>, now = new Date()) {
  if (!body || Object.keys(body).some(k => !['content','entry_date','mood','time_of_day'].includes(k))) throw new BadRequestException('INVALID_FIELDS');
  const content = typeof body.content === 'string' ? body.content.trim() : '';
  if ([...content].length < 1 || [...content].length > 300) throw new BadRequestException('INVALID_CONTENT');
  const date = body.entry_date ?? localDate(now);
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date || date > localDate(now)) throw new BadRequestException('INVALID_ENTRY_DATE');
  const mood = body.mood ?? 'neutral';
  const hour = Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Ho_Chi_Minh',hour:'2-digit',hourCycle:'h23'}).format(now));
  const time = body.time_of_day ?? (hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening');
  if (!['happy','calm','stressed','tired','neutral','energetic'].includes(mood as string) || !['morning','afternoon','evening','night'].includes(time as string)) throw new BadRequestException('INVALID_METADATA');
  return { content, date, mood, time };
}
@Injectable()
export class EntriesService {
  constructor(private readonly db: Database) {}
  async create(owner: string, body: Record<string, unknown>, key?: string) {
    if (!key || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) throw new BadRequestException('INVALID_IDEMPOTENCY_KEY');
    const input = validateEntry(body);
    // Hash client intent; server-derived date/time must not change a replay at midnight.
    const hash = createHash('sha256').update(JSON.stringify({v:1,content:input.content,date:body.entry_date ?? null,mood:input.mood,time:body.time_of_day ?? null})).digest('hex');
    try {
      return await this.db.owner(owner, async c => {
        const claim = await c.query("INSERT INTO api_requests(user_id,operation,idempotency_key,request_hash) VALUES($1,'create_entry',$2,$3) ON CONFLICT DO NOTHING RETURNING idempotency_key",[owner,key,hash]);
        if (!claim.rowCount) {
          const previous = (await c.query("SELECT request_hash,entry_id,job_id FROM api_requests WHERE user_id=$1 AND operation='create_entry' AND idempotency_key=$2",[owner,key])).rows[0];
          if (previous.request_hash !== hash) throw new ConflictException('IDEMPOTENCY_KEY_REUSED');
          if (!previous.entry_id || !previous.job_id) throw new GoneException('RESOURCE_DELETED');
          const entry = (await c.query('SELECT id,entry_date::text,content,created_at FROM entries WHERE id=$1 AND user_id=$2 FOR KEY SHARE',[previous.entry_id,owner])).rows[0];
          if (!entry) throw new GoneException('RESOURCE_DELETED');
          const sticker = (await c.query('SELECT id,content,mood,time_of_day,is_primary FROM stickers WHERE entry_id=$1 AND user_id=$2 AND is_primary',[entry.id,owner])).rows[0];
          const job = (await c.query('SELECT id,status,attempt FROM generation_jobs WHERE id=$1 AND user_id=$2',[previous.job_id,owner])).rows[0];
          if (!sticker || !job) throw new GoneException('RESOURCE_DELETED');
          return {...entry,primary_sticker:{...sticker,status:job.status},job};
        }
        const entry = (await c.query('INSERT INTO entries(user_id,entry_date,content) VALUES($1,$2,$3) RETURNING id,entry_date::text,content,created_at',[owner,input.date,input.content])).rows[0];
        const sticker = (await c.query('INSERT INTO stickers(user_id,entry_id,content,mood,time_of_day) VALUES($1,$2,$3,$4,$5) RETURNING id,content,mood,time_of_day,is_primary',[owner,entry.id,input.content,input.mood,input.time])).rows[0];
        const job = (await c.query('INSERT INTO generation_jobs(user_id,entry_id,sticker_id) VALUES($1,$2,$3) RETURNING id,status,attempt',[owner,entry.id,sticker.id])).rows[0];
        await c.query("UPDATE api_requests SET entry_id=$3,job_id=$4 WHERE user_id=$1 AND operation='create_entry' AND idempotency_key=$2",[owner,key,entry.id,job.id]);
        return { ...entry, primary_sticker: { ...sticker, status: job.status }, job };
      });
    } catch (error) {
      if ((error as {code?:string;constraint?:string}).code === '23505' && (error as {constraint?:string}).constraint === 'entries_user_id_entry_date_key') throw new ConflictException('DUPLICATE_ENTRY_FOR_DATE');
      throw error;
    }
  }
  async list(owner: string) {
    return this.db.owner(owner, async c => ({ items: (await c.query('SELECT id,entry_date::text,content,created_at FROM entries WHERE user_id=$1 ORDER BY entry_date DESC,id DESC LIMIT 50',[owner])).rows }));
  }
  async detail(owner: string, id: string) {
    return this.db.owner(owner, async c => {
      const entry = (await c.query('SELECT id,entry_date::text,content,created_at FROM entries WHERE id=$1 AND user_id=$2',[id,owner])).rows[0];
      if (!entry) throw new NotFoundException('ENTRY_NOT_FOUND');
      const stickers = (await c.query('SELECT id,content,mood,time_of_day,is_primary,is_fallback,created_at,object_path IS NOT NULL AS has_image FROM stickers WHERE entry_id=$1 AND user_id=$2 ORDER BY created_at,id',[id,owner])).rows.map(s => {
        const {has_image,...fields}=s; return {...fields,image_url:has_image ? this.imageUrl(owner,s.id) : null};
      });
      const job = (await c.query('SELECT id,status,attempt,error_code FROM generation_jobs WHERE entry_id=$1 AND user_id=$2 ORDER BY created_at DESC LIMIT 1',[id,owner])).rows[0] ?? null;
      return {...entry,stickers,primary_sticker:stickers.find(s=>s.is_primary) ?? null,job};
    });
  }
  async remove(owner: string,id: string) {
    return this.db.owner(owner,async c=> {
      if (!(await c.query('DELETE FROM entries WHERE id=$1 AND user_id=$2 RETURNING id',[id,owner])).rowCount) throw new NotFoundException('ENTRY_NOT_FOUND');
      // FK cascades invalidate jobs/metadata atomically. Proxy checks metadata on every image read.
      return {message:'Xóa mục nhật ký thành công.'};
    });
  }
  signature(owner:string,id:string,expiry:string) {
    return createHmac('sha256',process.env.IMAGE_SIGNING_SECRET!).update(`${owner}:${id}:${expiry}`).digest('hex');
  }
  imageUrl(owner:string,id:string) {
    const expires=String(Math.floor(Date.now()/1000)+300);
    return `${process.env.PUBLIC_API_URL}/api/v1/images/${id}?owner=${owner}&expires=${expires}&signature=${this.signature(owner,id,expires)}`;
  }
  async image(id:string,owner:string,expires:string,signature:string) {
    if (!/^[0-9a-f-]{36}$/i.test(owner ?? '') || !/^\d+$/.test(expires ?? '') || Number(expires)<=Date.now()/1000 || Number(expires)>Date.now()/1000+301 || !/^[0-9a-f]{64}$/.test(signature ?? '')) throw new UnauthorizedException('INVALID_IMAGE_URL');
    if (!timingSafeEqual(Buffer.from(signature),Buffer.from(this.signature(owner,id,expires)))) throw new UnauthorizedException('INVALID_IMAGE_URL');
    const meta=await this.db.owner(owner,async c=>(await c.query('SELECT object_path,mime_type FROM stickers WHERE id=$1 AND user_id=$2 AND object_path IS NOT NULL',[id,owner])).rows[0]);
    if (!meta) throw new NotFoundException('IMAGE_NOT_FOUND');
    const storage=createClient(process.env.SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!,{auth:{persistSession:false,autoRefreshToken:false}});
    const {data,error}=await storage.storage.from(process.env.STORAGE_BUCKET!).download(meta.object_path);
    if(error || !data) throw new NotFoundException('IMAGE_NOT_FOUND');
    return {buffer:Buffer.from(await data.arrayBuffer()),type:meta.mime_type};
  }
}
@UseGuards(AuthService)
@Controller('entries')
export class EntriesController {
  constructor(private readonly entries: EntriesService) {}
  @Post() async create(@Req() req:AuthRequest,@Body() body:Record<string,unknown>,@Headers('idempotency-key') key?:string) {return {success:true,data:await this.entries.create(req.owner,body,key)};}
  @Get() async list(@Req() req:AuthRequest) {return {success:true,data:await this.entries.list(req.owner)};}
  @Get(':id') async detail(@Req() req:AuthRequest,@Param('id',new ParseUUIDPipe()) id:string) {return {success:true,data:await this.entries.detail(req.owner,id)};}
  @Delete(':id') async remove(@Req() req:AuthRequest,@Param('id',new ParseUUIDPipe()) id:string) {return {success:true,...await this.entries.remove(req.owner,id)};}
}
@Controller('images')
export class ImagesController {
  constructor(private readonly entries:EntriesService) {}
  @Get(':id') async image(@Param('id',new ParseUUIDPipe()) id:string,@Query('owner') owner:string,@Query('expires') expires:string,@Query('signature') signature:string,@Res() res:Response) {
    const image=await this.entries.image(id,owner,expires,signature);
    res.set({'Content-Type':image.type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}).send(image.buffer);
  }
}
