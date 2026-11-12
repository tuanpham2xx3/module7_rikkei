import 'reflect-metadata';
import 'dotenv/config';
import { ArgumentsHost, Catch, Controller, ExceptionFilter, Get, HttpException, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { Response } from 'express';
import { AuthController, AuthService } from './auth';
import { Database } from './db';
import { QuotaController } from './quota';
import { JobsController, JobsService } from './jobs';
import { EntriesController, EntriesService, ImagesController } from './entries';
@Controller('health')
class HealthController { @Get() health(){return {success:true,data:{status:'ok'}};} }
@Catch()
class Errors implements ExceptionFilter {
  catch(error:unknown,host:ArgumentsHost){
    const status=error instanceof HttpException ? error.getStatus() : 500;
    const response=error instanceof HttpException ? error.getResponse() : null;
    if(status===429 && response && typeof response==='object' && 'code' in response){host.switchToHttp().getResponse<Response>().status(status).json({success:false,error:response});return;}
    host.switchToHttp().getResponse<Response>().status(status).json({success:false,error:{code:error instanceof HttpException ? error.message : 'INTERNAL_ERROR',message:status===500?'Internal server error':(error as Error).message}});
  }
}
@Module({controllers:[HealthController,AuthController,EntriesController,ImagesController,JobsController,QuotaController],providers:[AuthService,Database,EntriesService,JobsService]})
class AppModule {}
export async function bootstrap(){
  for(const name of ['DATABASE_URL','SUPABASE_URL','SUPABASE_ANON_KEY','SUPABASE_SERVICE_ROLE_KEY','IMAGE_SIGNING_SECRET','PUBLIC_API_URL','CORS_ORIGIN','STORAGE_BUCKET']) if(!process.env[name]) throw new Error(`Missing ${name}`);
  if(process.env.IMAGE_SIGNING_SECRET!.length<32) throw new Error('IMAGE_SIGNING_SECRET requires at least 32 characters');
  if(process.env.TIMELINE_CURSOR_SECRET && process.env.TIMELINE_CURSOR_SECRET.length<32) throw new Error('TIMELINE_CURSOR_SECRET requires at least 32 characters');
  const app=await NestFactory.create(AppModule,{logger:['error','warn']});
  app.setGlobalPrefix('api/v1');app.useGlobalFilters(new Errors());
  app.enableCors({origin:process.env.CORS_ORIGIN,allowedHeaders:['Content-Type','Authorization','Idempotency-Key']});
  app.enableShutdownHooks(); await app.listen(Number(process.env.PORT ?? 3001),'0.0.0.0'); return app;
}
if(require.main===module) void bootstrap();
