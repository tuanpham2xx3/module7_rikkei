import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';
import type { TimelineItem } from '../../types/timeline';

interface DeleteEntryModalProps {
  isOpen: boolean;
  item: TimelineItem | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export const DeleteEntryModal: React.FC<DeleteEntryModalProps> = ({
  isOpen,
  item,
  isDeleting,
  onConfirm,
  onClose
}) => {
  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in select-none">
      <div
        className="relative w-full max-w-md bg-white border-2 border-zinc-900 rounded-2xl shadow-[6px_6px_0px_#000] p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg border-2 border-zinc-800 bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700 transition cursor-pointer"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>

        <div className="flex items-start gap-3 pt-1">
          <div className="w-10 h-10 rounded-xl bg-rose-100 border-2 border-rose-800 flex items-center justify-center flex-shrink-0 shadow-[2px_2px_0px_#000]">
            <AlertTriangle className="w-5 h-5 text-rose-700" />
          </div>
          <div>
            <h3 className="text-base font-black text-zinc-900 tracking-tight">
              Xác nhận xóa nhật ký?
            </h3>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Khoảnh khắc ngày {item.entry_date}
            </p>
          </div>
        </div>

        <div className="my-3.5 p-3 bg-zinc-50 border border-zinc-200 rounded-xl space-y-1">
          <div className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">
            Nội dung khoảnh khắc:
          </div>
          <p className="text-xs text-zinc-800 font-medium line-clamp-2">
            "{item.content}"
          </p>
        </div>

        <div className="p-3 bg-rose-50/80 border border-rose-200 rounded-xl text-xs text-rose-900 font-medium leading-relaxed">
          Mục nhật ký và nhãn dán sticker liên quan sẽ bị xóa vĩnh viễn khỏi dòng thời gian. Dữ liệu bộ nhớ cục bộ sẽ được giải phóng ngay lập tức.
        </div>

        <div className="flex justify-end gap-2.5 mt-5 pt-3 border-t border-zinc-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-2 border-zinc-800 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white doodle-btn rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang xóa...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xác nhận xóa</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
