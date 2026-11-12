export type GenerationJobStatus = 'queued' | 'processing' | 'succeeded' | 'failed';

export interface GenerationJob {
  id: string;
  entry_id: string;
  status: GenerationJobStatus;
  attempt: number;
  run_version?: number;
  can_retry?: boolean;
  error_code?: string | null;
  progress_percent?: number | null;
  sticker_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface JobStatusResponse {
  success: boolean;
  data?: GenerationJob;
  error?: string;
}
