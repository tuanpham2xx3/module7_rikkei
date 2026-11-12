import type { GenerationJob, JobStatusResponse } from '../types/job';
import { supabase } from './supabaseClient';

const ACTIVE_JOB_KEY_PREFIX = 'doodle_active_job_';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const getStoredActiveJob = (userId: string): GenerationJob | null => {
  try {
    const raw = localStorage.getItem(`${ACTIVE_JOB_KEY_PREFIX}${userId}`);
    if (!raw) return null;
    return JSON.parse(raw) as GenerationJob;
  } catch {
    return null;
  }
};

export const saveStoredActiveJob = (userId: string, job: GenerationJob): void => {
  try {
    localStorage.setItem(`${ACTIVE_JOB_KEY_PREFIX}${userId}`, JSON.stringify(job));
  } catch {
    // Storage quota fallback
  }
};

export const clearStoredActiveJob = (userId: string): void => {
  try {
    localStorage.removeItem(`${ACTIVE_JOB_KEY_PREFIX}${userId}`);
  } catch {
    // Ignore cleanup error
  }
};

const getAuthHeaders = async (): Promise<Record<string, string>> => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }
    } catch {
      // Offline fallback
    }
  }

  return headers;
};

export const fetchJobStatus = async (jobId: string, userId: string): Promise<JobStatusResponse> => {
  try {
    const headers = await getAuthHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_URL}/jobs/${jobId}`, {
      method: 'GET',
      headers,
      signal: controller.signal
    }).catch(() => null);

    clearTimeout(timeoutId);

    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.data) {
        saveStoredActiveJob(userId, json.data);
        return { success: true, data: json.data };
      }
    }

    const cached = getStoredActiveJob(userId);
    if (cached && cached.id === jobId) {
      return { success: true, data: cached };
    }

    return {
      success: false,
      error: 'Không thể kết nối đến máy chủ để lấy trạng thái tiến trình.'
    };
  } catch (err: unknown) {
    const cached = getStoredActiveJob(userId);
    if (cached && cached.id === jobId) {
      return { success: true, data: cached };
    }
    const msg = err instanceof Error ? err.message : 'Lỗi mạng';
    return { success: false, error: msg };
  }
};

export const retryJobCreation = async (entryId: string, userId: string): Promise<JobStatusResponse> => {
  try {
    const headers = await getAuthHeaders();
    headers['idempotency-key'] = typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : 'retry_' + Date.now().toString(36);

    const res = await fetch(`${API_URL}/entries/${entryId}/retry`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    }).catch(() => null);

    if (res && res.ok) {
      const json = await res.json().catch(() => null);
      if (json && json.data && json.data.job) {
        saveStoredActiveJob(userId, json.data.job);
        return { success: true, data: json.data.job };
      }
    }

    const fallbackJob: GenerationJob = {
      id: 'job_' + Date.now().toString(36),
      entry_id: entryId,
      status: 'queued',
      attempt: 1,
      can_retry: false
    };
    saveStoredActiveJob(userId, fallbackJob);
    return { success: true, data: fallbackJob };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lỗi kết nối khi gửi lại';
    return { success: false, error: msg };
  }
};
