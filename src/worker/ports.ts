// C03/C04/C06 implement this server-only contract. Adapters must not retry internally.
export type ImageResult = { bytes: Uint8Array; mime: 'image/png'|'image/jpeg'|'image/webp'; width:number; height:number };
export type ProviderResult =
  | {kind:'succeeded';image:ImageResult;reference?:string}
  | {kind:'pending';reference:string;retryAfterMs?:number}
  | {kind:'failed';code:string;safeToResubmit:boolean;retryAfterMs?:number;reference?:string};
export interface Provider {
  submit(input:{jobId:string;requestKey:string;content:string;mood:string;timeOfDay:string},signal:AbortSignal):Promise<ProviderResult>;
  lookup?(reference:string,signal:AbortSignal):Promise<ProviderResult>;
}
export interface Storage {
  put(path:string,image:ImageResult,signal:AbortSignal):Promise<void>;
  remove(path:string,signal:AbortSignal):Promise<void>;
}
export type WorkerAdapter = {provider:Provider;storage:Storage};
