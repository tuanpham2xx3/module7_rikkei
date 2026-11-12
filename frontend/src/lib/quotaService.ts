export interface QuotaState {
  total: number;
  used: number;
  remaining: number;
  reset_time_desc: string;
}

const QUOTA_STORAGE_PREFIX = 'doodle_quota_';

export const getTimeUntilMidnightAsiaHoChiMinh = (): {
  hours: number;
  minutes: number;
  seconds: number;
  formatted: string;
} => {
  const now = new Date();
  const vnTimeStr = now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' });
  const vnNow = new Date(vnTimeStr);

  const vnMidnight = new Date(vnNow);
  vnMidnight.setDate(vnMidnight.getDate() + 1);
  vnMidnight.setHours(0, 0, 0, 0);

  const diffMs = vnMidnight.getTime() - vnNow.getTime();
  const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { hours, minutes, seconds, formatted };
};

export const getQuota = (userId: string): QuotaState => {
  try {
    const raw = localStorage.getItem(`${QUOTA_STORAGE_PREFIX}${userId}`);
    if (raw) {
      return JSON.parse(raw) as QuotaState;
    }
  } catch {
    // ignore
  }

  return {
    total: 5,
    used: 1,
    remaining: 4,
    reset_time_desc: '00:00 Asia/Ho_Chi_Minh (UTC+7)'
  };
};

export const setQuotaRemaining = (userId: string, remaining: number): QuotaState => {
  const validRemaining = Math.max(0, Math.min(5, remaining));
  const state: QuotaState = {
    total: 5,
    used: 5 - validRemaining,
    remaining: validRemaining,
    reset_time_desc: '00:00 Asia/Ho_Chi_Minh (UTC+7)'
  };

  try {
    localStorage.setItem(`${QUOTA_STORAGE_PREFIX}${userId}`, JSON.stringify(state));
  } catch {
    // ignore
  }

  return state;
};
