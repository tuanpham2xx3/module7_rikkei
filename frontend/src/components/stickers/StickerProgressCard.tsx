import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Clock, Sparkles, CheckCircle2, AlertTriangle, RefreshCw, ArrowRight, Download, X } from 'lucide-react';
import type { GenerationJob } from '../../types/job';
import { fetchJobStatus, retryJobCreation, saveStoredActiveJob, clearStoredActiveJob } from '../../lib/jobService';

interface StickerProgressCardProps {
  job: GenerationJob;
  userId: string;
  onCompleted?: (stickerUrl: string) => void;
  onGoToTimeline?: () => void;
  onDismiss?: () => void;
}

export const StickerProgressCard: React.FC<StickerProgressCardProps> = ({
  job: initialJob,
  userId,
  onCompleted,
  onGoToTimeline,
  onDismiss
}) => {
  const [job, setJob] = useState<GenerationJob>(initialJob);
  const [isRetrying, setIsRetrying] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checkStatus = useCallback(async () => {
    if (job.status === 'succeeded' || job.status === 'failed') return;

    const res = await fetchJobStatus(job.id, userId);
    if (res.success && res.data) {
      setJob(res.data);
      saveStoredActiveJob(userId, res.data);

      if (res.data.status === 'succeeded' && res.data.sticker_url && onCompleted) {
        onCompleted(res.data.sticker_url);
      }
    }
  }, [job.id, job.status, userId, onCompleted]);

  useEffect(() => {
    if (job.status === 'queued' || job.status === 'processing') {
      pollTimerRef.current = setTimeout(() => {
        checkStatus();
      }, 2500);
    }

    return () => {
      if (pollTimerRef.current) {
        clearTimeout(pollTimerRef.current);
      }
    };
  }, [job.status, checkStatus]);

  const handleRetry = async () => {
    if (isRetrying) return;
    setIsRetrying(true);
    setErrorMessage(null);

    const res = await retryJobCreation(job.entry_id, userId);
    setIsRetrying(false);

    if (res.success && res.data) {
      setJob(res.data);
      saveStoredActiveJob(userId, res.data);
    } else {
      setErrorMessage(res.error || 'Chưa thể gửi lại lúc này. Vui lòng thử lại sau.');
    }
  };

  const handleClose = () => {
    clearStoredActiveJob(userId);
    if (onDismiss) onDismiss();
  };

  const getStatusBadge = () => {
    switch (job.status) {
      case 'queued':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-900 border border-amber-800 rounded-full text-xs font-black uppercase tracking-wider">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            Đang xếp hàng (Queued)
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-sky-100 text-sky-900 border border-sky-800 rounded-full text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 animate-bounce" />
            AI đang phác thảo (Processing)
          </span>
        );
      case 'succeeded':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-900 border border-emerald-800 rounded-full text-xs font-black uppercase tracking-wider">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Đã hoàn thành (Succeeded)
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-100 text-rose-900 border border-rose-800 rounded-full text-xs font-black uppercase tracking-wider">
            <AlertTriangle className="w-3.5 h-3.5" />
            Không thể tạo ảnh (Failed)
          </span>
        );
    }
  };

  return (
    <div className="bg-white doodle-border-lg p-5 sm:p-6 shadow-sm space-y-4 select-none relative animate-fade-in">
      <div className="flex items-start justify-between gap-3 border-b border-zinc-100 pb-3">
        <div>
          <div className="text-xs font-bold text-zinc-400 font-mono">
            Mã tác vụ: #{job.id.slice(0, 8)}
          </div>
          <h3 className="text-base font-black text-zinc-900 mt-1">
            Tiến trình sinh Sticker Doodle AI
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {getStatusBadge()}
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-lg border border-zinc-300 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 hover:text-black transition cursor-pointer"
            title="Đóng tiến trình"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {job.status === 'queued' && (
        <div className="space-y-3 py-2">
          <p className="text-xs text-zinc-600 font-medium">
            Tác vụ của bạn đã được tiếp nhận và xếp vào hàng đợi xử lý của hệ thống.
          </p>
          <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden border border-zinc-300">
            <div className="bg-amber-400 h-full w-1/4 rounded-full animate-pulse"></div>
          </div>
          <div className="text-[11px] text-zinc-500 font-medium flex items-center justify-between">
            <span>Đang chờ phân phối GPU Worker...</span>
            <span className="font-mono">Lần thử: {job.attempt}/3</span>
          </div>
        </div>
      )}

      {job.status === 'processing' && (
        <div className="space-y-3 py-2">
          <p className="text-xs text-zinc-600 font-medium">
            Mô hình Gemini & Diffusion đang trích xuất ngữ nghĩa và vẽ sticker doodle theo phong cách die-cut độc bản...
          </p>
          <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden border border-zinc-300">
            <div className="bg-sky-500 h-full w-3/4 rounded-full transition-all duration-500"></div>
          </div>
          <div className="text-[11px] text-zinc-500 font-medium flex items-center justify-between">
            <span>Đang khử nhiễu và bóc tách nền trong suốt...</span>
            <span className="font-mono">75%</span>
          </div>
        </div>
      )}

      {job.status === 'succeeded' && (
        <div className="space-y-4 pt-1">
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-emerald-50/70 border border-emerald-300 rounded-xl p-3.5">
            <div className="w-24 h-24 rounded-xl border-2 border-zinc-900 bg-white overflow-hidden shadow-sm flex-shrink-0 flex items-center justify-center">
              {job.sticker_url ? (
                <img
                  src={job.sticker_url}
                  alt="Sticker vừa sinh"
                  className="w-full h-full object-cover"
                />
              ) : (
                <img
                  src="/sample_stickers/c01-01.jpg"
                  alt="Sticker thành công"
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1">
              <div className="text-xs font-bold text-emerald-900">
                Sticker Doodle đã sẵn sàng!
              </div>
              <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
                Sticker đã được lưu tự động vào mục nhật ký của bạn và hiển thị trên dòng thời gian Timeline.
              </p>
              {job.sticker_url && (
                <a
                  href={job.sticker_url}
                  download="doodle_sticker.png"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-800 hover:text-emerald-950 font-bold underline mt-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải ảnh PNG</span>
                </a>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            {onGoToTimeline && (
              <button
                type="button"
                onClick={onGoToTimeline}
                className="px-4 py-2 bg-zinc-900 text-white doodle-btn rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer hover:bg-zinc-800 transition"
              >
                <span>Xem trên Hành trình</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      )}

      {job.status === 'failed' && (
        <div className="space-y-3 pt-1">
          <div className="bg-rose-50 border border-rose-300 rounded-xl p-3.5 space-y-2">
            <div className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>Chưa thể hoàn tất tạo sticker cho khoảnh khắc này</span>
            </div>
            {job.error_code && (
              <div className="text-[11px] font-mono text-rose-700 bg-white px-2.5 py-1 rounded border border-rose-200">
                Mã lỗi: {job.error_code}
              </div>
            )}
            <div className="text-[11px] text-rose-800 font-medium leading-relaxed">
              <strong>Hướng dẫn:</strong> Sự cố có thể do nhà cung cấp AI phản hồi quá thời gian quy định hoặc hạn mức tạo ảnh trong ngày đã hết. Nội dung nhật ký của bạn vẫn được lưu giữ an toàn.
            </div>
          </div>

          {errorMessage && (
            <div className="text-xs text-rose-600 font-bold">
              {errorMessage}
            </div>
          )}

          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-zinc-500 font-medium">
              Bạn có thể gửi yêu cầu tạo lại bằng nút bên cạnh.
            </span>
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className={`px-4 py-2 bg-rose-700 text-white doodle-btn rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                isRetrying ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-rose-800'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
              <span>{isRetrying ? 'Đang gửi lại...' : 'Thử lại ngay'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
