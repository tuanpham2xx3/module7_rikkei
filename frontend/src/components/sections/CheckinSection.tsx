import React, { useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { JournalForm } from '../journal/JournalForm';
import { StickerProgressCard } from '../stickers/StickerProgressCard';
import { getStoredActiveJob, saveStoredActiveJob } from '../../lib/jobService';
import type { GenerationJob } from '../../types/job';
import type { JournalEntry } from '../../types/journal';
import { Sparkles, ArrowRight, PlusCircle } from 'lucide-react';

interface CheckinSectionProps {
  onGoToTimeline: () => void;
}

export const CheckinSection: React.FC<CheckinSectionProps> = ({ onGoToTimeline }) => {
  const { user } = useAuth();
  const userId = user?.id || 'user_guest';

  const [activeJob, setActiveJob] = useState<GenerationJob | null>(() => getStoredActiveJob(userId));

  const handleEntryCreated = (entry: JournalEntry) => {
    const job: GenerationJob = entry.job || {
      id: 'job_' + Date.now().toString(36),
      entry_id: entry.id,
      status: 'queued',
      attempt: 1,
      can_retry: false
    };

    saveStoredActiveJob(userId, job);
    setActiveJob(job);
  };

  return (
    <section className="h-full max-w-4xl mx-auto w-full flex flex-col justify-between py-2 space-y-4">
      <div className="text-center space-y-1">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          Thứ Tư, 11 Tháng 11, 2026
        </span>
        <h2 className="text-3xl lg:text-4xl font-black font-doodle text-zinc-900">
          🌙 Chào buổi tối, {user?.name || 'Nhân'}!
        </h2>
        <p className="text-xs sm:text-sm text-zinc-600 font-medium">
          Khoảnh khắc đáng nhớ nhất trong buổi tối hôm nay của bạn là gì?
        </p>
      </div>

      {activeJob ? (
        <div className="space-y-3">
          <StickerProgressCard
            job={activeJob}
            userId={userId}
            onGoToTimeline={onGoToTimeline}
            onDismiss={() => setActiveJob(null)}
          />
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setActiveJob(null)}
              className="text-xs font-bold text-zinc-600 hover:text-black flex items-center gap-1.5 cursor-pointer underline"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Ghi thêm nhật ký mới</span>
            </button>
          </div>
        </div>
      ) : (
        <JournalForm
          userId={userId}
          onSuccess={handleEntryCreated}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white doodle-border-md p-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src="/sample_stickers/c01-08.jpg"
              alt="Hôm nay"
              className="w-12 h-12 rounded-xl border-2 border-zinc-900 object-cover shadow-sm flex-shrink-0"
            />
            <div>
              <div className="text-xs sm:text-sm font-extrabold text-zinc-900">
                Khoảnh khắc hôm nay
              </div>
              <div className="text-[11px] text-zinc-500 mt-0.5">
                Nhật ký 1-300 ký tự • Tự động gắn nhãn buổi & tâm trạng
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onGoToTimeline}
            className="text-xs font-bold text-zinc-700 hover:text-black underline cursor-pointer flex items-center gap-1"
          >
            <span>Hành trình</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        </div>

        <button
          type="button"
          onClick={onGoToTimeline}
          className="bg-amber-200 hover:bg-amber-300 doodle-btn rounded-xl p-4 flex items-center justify-between text-left cursor-pointer transition-all"
        >
          <div>
            <div className="text-xs sm:text-sm font-black text-zinc-900 uppercase flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-zinc-900" />
              <span>Xem Toàn Bộ Hành Trình Timeline</span>
            </div>
            <div className="text-[11px] text-zinc-600 mt-0.5 font-medium">
              Trục thời gian kết nối các ngày qua nét vẽ sticker
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-zinc-900 stroke-[2.5]" />
        </button>
      </div>
    </section>
  );
};
