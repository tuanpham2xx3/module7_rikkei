import { Controller, Get, Injectable, NotFoundException, Param, ParseUUIDPipe, Res, Query, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { Database } from './db';
@Injectable()
export class EntriesService {
  constructor(private readonly db: Database) {}
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
@Controller('images')
export class ImagesController {
  constructor(private readonly entries:EntriesService) {}
  @Get(':id') async image(@Param('id',new ParseUUIDPipe()) id:string,@Query('owner') owner:string,@Query('expires') expires:string,@Query('signature') signature:string,@Res() res:Response) {
    const image=await this.entries.image(id,owner,expires,signature);
    res.set({'Content-Type':image.type,'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}).send(image.buffer);
  }
}
