import React, { useState, useEffect } from 'react';
import { Clock, Zap, AlertTriangle, CheckCircle2, X, Film } from 'lucide-react';
import { getTimeUntilMidnightAsiaHoChiMinh, getQuota, setQuotaRemaining, type QuotaState } from '../../lib/quotaService';
import { useAuth } from '../../contexts/useAuth';

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGoToRecap?: () => void;
}

export const QuotaModal: React.FC<QuotaModalProps> = ({ isOpen, onClose, onGoToRecap }) => {
  const { user } = useAuth();
  const userId = user?.id || 'user_guest';

  const [quota, setQuota] = useState<QuotaState>(() => getQuota(userId));
  const [countdown, setCountdown] = useState<string>(() => getTimeUntilMidnightAsiaHoChiMinh().formatted);

  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      setCountdown(getTimeUntilMidnightAsiaHoChiMinh().formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const isExhausted = quota.remaining <= 0;

  const handleToggleMockExhausted = () => {
    const nextRemaining = isExhausted ? 4 : 0;
    const updated = setQuotaRemaining(userId, nextRemaining);
    setQuota(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div
        className="relative w-full max-w-md bg-white border-2 border-zinc-900 rounded-2xl shadow-[6px_6px_0px_#000] p-5 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto no-scrollbar animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg border-2 border-zinc-800 bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <div className="flex items-center gap-3 border-b border-zinc-200 pb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-200 border-2 border-zinc-900 flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <Zap className="w-5 h-5 text-zinc-900 fill-zinc-900" />
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900 tracking-tight">
              Hạn Mức Tạo Sticker AI
            </h3>
            <p className="text-xs text-zinc-500 font-medium">
              Mô hình Cloudflare Workers AI (FLUX.1 Schnell)
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-3.5 rounded-xl border-2 border-zinc-800 bg-zinc-50 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-zinc-700">
              <span>Lượt tạo ảnh hôm nay:</span>
              <span className={`font-mono text-sm ${isExhausted ? 'text-rose-600 font-black' : 'text-zinc-900'}`}>
                {quota.remaining} / {quota.total} lượt
              </span>
            </div>

            <div className="w-full bg-zinc-200 rounded-full h-3 overflow-hidden border border-zinc-400">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  isExhausted ? 'bg-rose-500 w-full' : 'bg-amber-400'
                }`}
                style={{ width: isExhausted ? '100%' : `${(quota.remaining / quota.total) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 bg-amber-50/80 border border-amber-300 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-amber-950 font-bold">
              <Clock className="w-4 h-4 text-amber-800 flex-shrink-0" />
              <span>Đếm ngược đặt lại quota:</span>
            </div>
            <div className="font-mono text-sm font-black bg-white px-2.5 py-0.5 rounded-lg border border-amber-300 text-amber-900 shadow-xs">
              {countdown}
            </div>
          </div>
          <div className="text-[11px] text-zinc-500 text-center font-medium">
            Tự động cấp lại 5 lượt mới vào lúc 00:00 (Asia/Ho_Chi_Minh - UTC+7)
          </div>

          {isExhausted ? (
            <div className="p-3.5 bg-rose-50 border-2 border-rose-700 rounded-xl space-y-2 text-xs animate-fade-in">
              <div className="flex items-center gap-2 text-rose-900 font-black">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>Bạn đã sử dụng hết 5/5 lượt tạo ảnh AI trong ngày!</span>
              </div>
              <div className="text-rose-800 space-y-1 font-medium leading-relaxed pl-6">
                <div>Gợi ý dành cho bạn:</div>
                <ul className="list-disc space-y-0.5 pl-3 text-[11px]">
                  <li>Bạn vẫn có thể viết và lưu nhật ký chữ bình thường (không giới hạn).</li>
                  <li>Xem lại dòng thời gian các sticker đã sưu tập.</li>
                  <li>Xuất ảnh Memory Recap 9:16 chia sẻ lên mạng xã hội.</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Bạn còn {quota.remaining} lượt tạo ảnh sticker miễn phí hôm nay.</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-zinc-100 flex flex-col gap-2">
          {isExhausted && onGoToRecap && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onGoToRecap();
              }}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white doodle-btn rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              <Film className="w-4 h-4" />
              <span>Mở Memory Recap Story</span>
            </button>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={handleToggleMockExhausted}
              className="text-[11px] font-bold text-zinc-500 hover:text-black underline cursor-pointer"
              title="Chuyển đổi trạng thái để kiểm thử giao diện hết lượt"
            >
              {isExhausted ? 'Khôi phục 4/5 lượt' : 'Giả lập hết lượt (0/5)'}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-zinc-900 text-white doodle-btn rounded-xl font-bold text-xs hover:bg-zinc-800 cursor-pointer"
            >
              Đã hiểu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
