import { Controller, Get, Param, ParseUUIDPipe, Req, UseGuards } from '@nestjs/common';
import { NotFoundException, Injectable } from '@nestjs/common';
import { Database } from './db';
import { AuthRequest, AuthService } from './auth';
import { EntriesService } from './entries';
import { readQuota } from './quota';
@Injectable()
export class JobsService {
  constructor(private readonly db:Database,private readonly entries:EntriesService) {}
  async read(owner:string,id:string) {
    return this.db.owner(owner,async c=> {
      const row=(await c.query(`SELECT j.id,j.entry_id,j.status,j.attempt,j.error_code,j.run_version,j.user_retry_allowed,
        s.id AS sticker_id,s.is_fallback,s.object_path IS NOT NULL AS has_image
        FROM generation_jobs j JOIN stickers s ON s.id=j.sticker_id AND s.user_id=j.user_id AND s.entry_id=j.entry_id
        WHERE j.id=$1 AND j.user_id=$2`,[id,owner])).rows[0];
      if(!row) throw new NotFoundException('JOB_NOT_FOUND');
      const quota=await readQuota(c,owner);
      return {id:row.id,entry_id:row.entry_id,status:row.status,attempt:row.attempt,run_version:row.run_version,
        can_retry:row.status==='failed' && row.user_retry_allowed && !row.has_image && !row.is_fallback && quota.remaining_quota>0,
        error_code:row.error_code,progress_percent:row.status==='succeeded'?100:null,
        sticker_url:row.status==='succeeded' && row.has_image?this.entries.imageUrl(owner,row.sticker_id):null};
    });
  }
}
@UseGuards(AuthService)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobs:JobsService) {}
  @Get(':id') async read(@Req() req:AuthRequest,@Param('id',new ParseUUIDPipe()) id:string) {
    return {success:true,data:await this.jobs.read(req.owner,id)};
  }
}
