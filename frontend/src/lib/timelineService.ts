import type { TimelineItem, TimelineResponse } from '../types/timeline';
import { getStoredEntries } from './journalService';
import { supabase } from './supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

const SAMPLE_STICKER_IMAGES = [
  '/sample_stickers/c01-01.jpg',
  '/sample_stickers/c01-02.jpg',
  '/sample_stickers/c01-03.jpg',
  '/sample_stickers/c01-04.jpg',
  '/sample_stickers/c01-05.jpg',
  '/sample_stickers/c01-06.jpg',
  '/sample_stickers/c01-07.jpg',
  '/sample_stickers/c01-08.jpg',
  '/sample_stickers/c01-09.jpg',
  '/sample_stickers/c01-10.jpg',
];

const SAMPLE_ACTIVITIES = [
  'Đạp xe thể thao leo dốc đón nắng sớm',
  'Viết nhật ký đêm muộn dưới ánh đèn vàng ấm cúng',
  'Mèo lười ngủ say trên ghế sofa buổi chiều',
  'Uống trà ấm nhìn mưa rơi tí tách bên ô cửa sổ',
  'Chạy bộ 5km quanh công viên bờ hồ thoáng mát',
  'Thưởng thức tách cà phê sữa đá đậm đà vỉa hè',
  'Đọc xong cuốn sách yêu thích trong một buổi chiều thu',
  'Nấu bữa cơm gia đình quây quần ấm cúng',
  'Đi dạo ngắm phố lên đèn rực rỡ cuối tuần',
  'Làm việc tập trung hoàn thành trọn vẹn mục tiêu đề ra'
];

const MOODS = ['happy', 'calm', 'stressed', 'tired', 'energetic', 'neutral'];
const PERIODS = ['morning', 'afternoon', 'evening', 'night'];

export const generateBenchmarkDataset = (): TimelineItem[] => {
  const items: TimelineItem[] = [];
  const baseDate = new Date('2026-11-12T20:00:00+07:00');

  for (let i = 0; i < 100; i++) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const sampleImg = SAMPLE_STICKER_IMAGES[i % SAMPLE_STICKER_IMAGES.length];
    const activity = SAMPLE_ACTIVITIES[i % SAMPLE_ACTIVITIES.length];
    const mood = MOODS[i % MOODS.length];
    const period = PERIODS[i % PERIODS.length];

    items.push({
      id: `entry_benchmark_${String(100 - i).padStart(3, '0')}`,
      entry_date: dateStr,
      content: `${activity} - Ngày ${dateStr}. Tự động tạo nhãn dán doodle kỷ niệm.`,
      created_at: d.toISOString(),
      job_status: 'succeeded',
      sticker: {
        id: `sticker_${String(100 - i).padStart(3, '0')}`,
        image_url: sampleImg,
        is_fallback: false,
        mood,
        time_of_day: period
      }
    });
  }

  return items;
};

const ALL_BENCHMARK_ITEMS = generateBenchmarkDataset();

export const fetchTimelineBatch = async (
  userId: string,
  cursor: string | null = null,
  limit: number = 6
): Promise<TimelineResponse> => {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const query = new URLSearchParams();
    query.set('limit', String(limit));
    if (cursor) query.set('cursor', cursor);

    const res = await fetch(`${API_URL}/entries?${query.toString()}`, {
      method: 'GET',
      headers,
      signal: controller.signal
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.data && Array.isArray(json.data.items)) {
        return {
          items: json.data.items,
          has_more: Boolean(json.data.has_more),
          next_cursor: json.data.next_cursor || null
        };
      }
    }
  } catch {
    // Graceful offline fallback to benchmark dataset
  }

  const userSavedEntries = getStoredEntries(userId).map((e, idx) => ({
    id: e.id,
    entry_date: e.created_at.slice(0, 10),
    content: e.content,
    created_at: e.created_at,
    job_status: e.status,
    sticker: {
      id: `local_sticker_${e.id}`,
      image_url: e.sticker_url || SAMPLE_STICKER_IMAGES[idx % SAMPLE_STICKER_IMAGES.length],
      mood: e.mood,
      time_of_day: e.period
    }
  }));

  const allCombined = [...userSavedEntries, ...ALL_BENCHMARK_ITEMS];
  const uniqueMap = new Map<string, TimelineItem>();
  for (const item of allCombined) {
    if (!uniqueMap.has(item.id)) {
      uniqueMap.set(item.id, item);
    }
  }
  const merged = Array.from(uniqueMap.values());

  let startIndex = 0;
  if (cursor) {
    const foundIdx = merged.findIndex((it) => it.id === cursor);
    if (foundIdx !== -1) {
      startIndex = foundIdx + 1;
    }
  }

  const batch = merged.slice(startIndex, startIndex + limit);
  const nextItem = merged[startIndex + limit];
  const hasMore = Boolean(nextItem);
  const nextCursor = hasMore && batch.length > 0 ? batch[batch.length - 1].id : null;

  return {
    items: batch,
    has_more: hasMore,
    next_cursor: nextCursor
  };
};
