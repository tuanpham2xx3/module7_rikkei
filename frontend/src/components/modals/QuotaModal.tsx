import React from 'react';

interface QuotaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuotaModal: React.FC<QuotaModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white doodle-border-lg p-6 max-w-sm w-full space-y-4 shadow-2xl relative">
        <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <h3 className="font-extrabold text-base text-zinc-900">Hạn Mức Tạo Ảnh AI</h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg border border-zinc-300 hover:bg-zinc-100 flex items-center justify-center text-zinc-500 font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 text-xs text-zinc-600">
          <p>
            Mỗi tài khoản được cấp <strong className="text-zinc-900">5 lượt tạo ảnh miễn phí mỗi ngày</strong> (sử dụng Cloudflare Workers AI FLUX.1 schnell).
          </p>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 font-medium">
            Số lượt còn lại hôm nay: <strong className="text-sm">4 / 5 lượt</strong>
          </div>
          <p className="text-[11px] text-zinc-400">
            Hạn mức sẽ tự động đặt lại vào lúc 00:00 (múi giờ Asia/Ho_Chi_Minh).
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 bg-zinc-900 text-white doodle-btn rounded-xl font-bold text-xs"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
};
