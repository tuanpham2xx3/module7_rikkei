import type { GenerationJob } from './job';

export type JournalMood = 'Vui vẻ' | 'Bình yên' | 'Bận rộn' | 'Mệt mỏi';
export type DayPeriod = 'morning' | 'afternoon' | 'evening';

export interface JournalEntry {
  id: string;
  user_id: string;
  content: string;
  char_count: number;
  mood: JournalMood;
  period: DayPeriod;
  created_at: string;
  updated_at?: string;
  status: 'saved' | 'generating' | 'completed';
  sticker_url?: string;
  job?: GenerationJob;
}

export interface CreateJournalInput {
  content: string;
  mood: JournalMood;
}

export interface CreateJournalResult {
  success: boolean;
  entry?: JournalEntry;
  error?: string;
}

export interface JournalDraft {
  content: string;
  mood: JournalMood;
  saved_at: string;
}
