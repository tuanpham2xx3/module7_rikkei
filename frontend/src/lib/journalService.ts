import type { JournalEntry, JournalMood, DayPeriod, CreateJournalInput, CreateJournalResult, JournalDraft } from '../types/journal';

const DRAFT_PREFIX = 'doodle_journal_draft_';
const ENTRIES_PREFIX = 'doodle_journal_entries_';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const getDayPeriod = (date: Date = new Date()): DayPeriod => {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

export const getJournalDraft = (userId: string): JournalDraft | null => {
  try {
    const raw = sessionStorage.getItem(`${DRAFT_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as JournalDraft;
  } catch {
    return null;
  }
};

export const saveJournalDraft = (userId: string, draft: { content: string; mood: JournalMood }): void => {
  try {
    const payload: JournalDraft = {
      content: draft.content,
      mood: draft.mood,
      saved_at: new Date().toISOString()
    };
    sessionStorage.setItem(`${DRAFT_PREFIX}${userId}`, JSON.stringify(payload));
  } catch {
    // Session storage quota or private mode fallback
  }
};

export const clearJournalDraft = (userId: string): void => {
  try {
    sessionStorage.removeItem(`${DRAFT_PREFIX}${userId}`);
  } catch {
    // Ignore cleanup errors
  }
};

export const getStoredEntries = (userId: string): JournalEntry[] => {
  try {
    const raw = localStorage.getItem(`${ENTRIES_PREFIX}${userId}`);
    return raw ? (JSON.parse(raw) as JournalEntry[]) : [];
  } catch {
    return [];
  }
};

export const createJournalEntry = async (
  userId: string,
  input: CreateJournalInput
): Promise<CreateJournalResult> => {
  const trimmed = input.content.trim();

  if (trimmed.length < 1) {
    return {
      success: false,
      error: 'Nội dung nhật ký không được để trống.'
    };
  }

  if (trimmed.length > 300) {
    return {
      success: false,
      error: `Nội dung vượt quá giới hạn 300 ký tự (hiện tại: ${trimmed.length} ký tự).`
    };
  }

  const period = getDayPeriod();
  const newEntry: JournalEntry = {
    id: 'entry_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8),
    user_id: userId,
    content: trimmed,
    char_count: trimmed.length,
    mood: input.mood,
    period,
    created_at: new Date().toISOString(),
    status: 'saved'
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_URL}/entries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        content: trimmed,
        mood: input.mood,
        period
      }),
      signal: controller.signal
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.data) {
        clearJournalDraft(userId);
        return { success: true, entry: json.data };
      }
    }

    const existing = getStoredEntries(userId);
    const updated = [newEntry, ...existing];
    localStorage.setItem(`${ENTRIES_PREFIX}${userId}`, JSON.stringify(updated));

    clearJournalDraft(userId);
    return { success: true, entry: newEntry };
  } catch (err: unknown) {
    saveJournalDraft(userId, input);
    const errorMsg = err instanceof Error ? err.message : 'Lỗi kết nối mạng';
    return {
      success: false,
      error: `Không thể kết nối đến máy chủ (${errorMsg}). Bản nháp của bạn đã được lưu tự động trong phiên để thử lại!`
    };
  }
};
