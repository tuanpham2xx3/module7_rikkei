export interface TimelineSticker {
  id: string;
  image_url: string | null;
  is_fallback?: boolean;
  mood?: string;
  time_of_day?: string;
}

export interface TimelineItem {
  id: string;
  entry_date: string;
  content: string;
  created_at: string;
  sticker?: TimelineSticker | null;
  job_status?: string | null;
}

export interface TimelineResponse {
  items: TimelineItem[];
  has_more: boolean;
  next_cursor: string | null;
}
