import { BadRequestException } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'node:crypto';
export const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type Position={entry_date:string;id:string};
const invalid=()=>new BadRequestException('INVALID_CURSOR');
function sign(payload:string){
  const secret=process.env.TIMELINE_CURSOR_SECRET ?? process.env.IMAGE_SIGNING_SECRET;
  if(!secret||secret.length<32)throw new Error('Timeline signing secret requires at least 32 characters');
  return createHmac('sha256',secret).update('timeline:v1:'+payload).digest('hex');
}
export function encodeCursor(owner:string,position:Position){
  const payload=Buffer.from(JSON.stringify({v:1,owner,...position})).toString('base64url');
  return payload+'.'+sign(payload);
}
export function decodeCursor(owner:string,value:string):Position {
  if(value.length>2048)throw invalid();
  const [payload,signature,...extra]=value.split('.');
  if(extra.length||!payload||!/^[A-Za-z0-9_-]+$/.test(payload)||!/^[0-9a-f]{64}$/.test(signature??''))throw invalid();
  if(!timingSafeEqual(Buffer.from(signature),Buffer.from(sign(payload))))throw invalid();
  let data;
  try{data=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));}catch{throw invalid();}
  if(!data||Array.isArray(data)||Object.keys(data).sort().join(',')!=='entry_date,id,owner,v'||data.v!==1||data.owner!==owner||typeof data.id!=='string'||!uuidPattern.test(data.id)||typeof data.entry_date!=='string'||!/^(?!0000)\d{4}-\d{2}-\d{2}$/.test(data.entry_date))throw invalid();
  const date=Date.parse(data.entry_date);
  if(!Number.isFinite(date)||new Date(date).toISOString().slice(0,10)!==data.entry_date)throw invalid();
  return {entry_date:data.entry_date,id:data.id};
}
export function parseTimelineQuery(query:Record<string,unknown>={}){
  if(!query||Array.isArray(query)||typeof query!=='object'||Object.keys(query).some(k=>!['limit','cursor'].includes(k)))throw new BadRequestException('INVALID_QUERY');
  const limit=query.limit===undefined?15:typeof query.limit==='string'&&/^[1-9]\d?$/.test(query.limit)?Number(query.limit):NaN;
  if(!Number.isInteger(limit)||limit<1||limit>50)throw new BadRequestException('INVALID_LIMIT');
  if(query.cursor!==undefined&&(typeof query.cursor!=='string'||!query.cursor.length||query.cursor.length>2048))throw invalid();
  return {limit,cursor:query.cursor as string|undefined};
}
