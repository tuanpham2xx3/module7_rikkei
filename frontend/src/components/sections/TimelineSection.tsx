import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/useAuth';
import type { TimelineItem } from '../../types/timeline';
import { fetchTimelineBatch, deleteTimelineEntry, fetchTimelineEntryDetail } from '../../lib/timelineService';
import { DeleteEntryModal } from '../modals/DeleteEntryModal';
import { Trophy, ArrowRight, Loader2, Sparkles, Calendar, Tag, ChevronDown, Trash2, CheckCircle2 } from 'lucide-react';

interface TimelineSectionProps {
  onGoToCheckin: () => void;
  onGoToRecap: () => void;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ onGoToCheckin, onGoToRecap }) => {
  const { user } = useAuth();
  const userId = user?.id || 'user_guest';

  const [items, setItems] = useState<TimelineItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<TimelineItem | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [initialLoaded, setInitialLoaded] = useState<boolean>(false);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const selectItemWithUrl = (item: TimelineItem | null) => {
    setSelectedItem(item);
    try {
      const url = new URL(window.location.href);
      if (item) {
        url.searchParams.set('entry', item.id);
        localStorage.setItem(`doodle_selected_entry_${userId}`, item.id);
      } else {
        url.searchParams.delete('entry');
        localStorage.removeItem(`doodle_selected_entry_${userId}`);
      }
      window.history.replaceState(null, '', url.toString());
    } catch {
      // Ignore URL update errors in non-browser env
    }
  };

  useEffect(() => {
    let ignore = false;
    const init = async () => {
      setIsLoading(true);
      try {
        const res = await fetchTimelineBatch(userId, null, 6);
        if (!ignore) {
          setItems(res.items);
          setHasMore(res.has_more);
          setNextCursor(res.next_cursor);

          const searchParams = new URLSearchParams(window.location.search);
          const deepLinkId = searchParams.get('entry') || localStorage.getItem(`doodle_selected_entry_${userId}`);

          if (deepLinkId) {
            const found = res.items.find((it) => it.id === deepLinkId);
            if (found) {
              setSelectedItem(found);
            } else {
              const detail = await fetchTimelineEntryDetail(userId, deepLinkId);
              if (detail && !ignore) {
                setSelectedItem(detail);
              } else if (res.items.length > 0) {
                setSelectedItem(res.items[0]);
              }
            }
          } else if (res.items.length > 0) {
            setSelectedItem(res.items[0]);
          }
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
          setInitialLoaded(true);
        }
      }
    };

    init();
    return () => {
      ignore = true;
    };
  }, [userId]);

  const handleLoadMore = async () => {
    if (isLoading || !hasMore || !nextCursor) return;
    setIsLoading(true);
    try {
      const res = await fetchTimelineBatch(userId, nextCursor, 6);
      setItems((prev) => {
        const combined = [...prev, ...res.items];
        const map = new Map<string, TimelineItem>();
        for (const item of combined) {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          }
        }
        return Array.from(map.values());
      });
      setHasMore(res.has_more);
      setNextCursor(res.next_cursor);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem || isDeleting) return;
    setIsDeleting(true);

    try {
      const deletedId = selectedItem.id;
      const res = await deleteTimelineEntry(userId, deletedId);

      if (res.success) {
        setItems((prev) => {
          const nextItems = prev.filter((it) => it.id !== deletedId);
          const nextSelection = nextItems.length > 0 ? nextItems[0] : null;
          selectItemWithUrl(nextSelection);
          return nextItems;
        });

        setIsDeleteModalOpen(false);
        setActionNotice('Đã xóa thành công mục nhật ký và giải phóng bộ nhớ liên kết.');
        setTimeout(() => setActionNotice(null), 3500);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section className="h-full max-w-6xl mx-auto w-full grid grid-cols-12 gap-6 items-stretch py-2 select-none">
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-between space-y-3 h-full overflow-hidden">
        <div className="flex justify-between items-center pb-2 border-b-2 border-zinc-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-black font-doodle text-zinc-900 flex items-center gap-2">
              <span>Hành Trình Dòng Đời (Timeline)</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 border border-zinc-800 text-zinc-800 font-mono font-bold">
                {items.length} khoảnh khắc
              </span>
            </h2>
            <p className="text-xs text-zinc-500 font-medium">
              Các khoảnh khắc tích lũy kết nối qua trục thời gian dọc
            </p>
          </div>
          <button
            type="button"
            onClick={onGoToCheckin}
            className="px-3.5 py-1.5 bg-zinc-900 text-white doodle-btn rounded-xl text-xs font-bold cursor-pointer hover:bg-zinc-800 transition"
          >
            + Ghi chép mới
          </button>
        </div>

        {actionNotice && (
          <div className="p-2.5 bg-emerald-50 border-2 border-emerald-800 rounded-xl flex items-center gap-2 text-xs text-emerald-900 font-bold animate-fade-in flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{actionNotice}</span>
          </div>
        )}

        <div
          onClick={onGoToRecap}
          className="p-3 bg-purple-50 border-2 border-zinc-900 rounded-xl flex justify-between items-center cursor-pointer hover:bg-purple-100 transition shadow-sm flex-shrink-0"
        >
          <div className="flex items-center gap-2.5 text-xs">
            <Trophy className="w-5 h-5 text-purple-700 flex-shrink-0" />
            <div>
              <span className="font-black text-sm text-purple-950">
                Đã tích lũy Mốc 7 Ngày!
              </span>
              <span className="text-purple-700 text-xs ml-2 hidden sm:inline">
                Bấm mở Studio xuất ảnh Story 9:16
              </span>
            </div>
          </div>
          <span className="text-xs font-bold bg-white px-3 py-1 rounded-lg border border-zinc-900 flex items-center gap-1">
            <span>Mở Recap</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </span>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar pr-1 relative space-y-3 min-h-0">
          <div className="absolute left-6 top-3 bottom-3 w-0.5 border-l-2 border-dashed border-zinc-300 pointer-events-none"></div>

          {items.map((item, idx) => {
            const isSelected = selectedItem?.id === item.id;
            const isAlternate = idx % 2 === 1;

            return (
              <div
                key={item.id}
                onClick={() => selectItemWithUrl(item)}
                className={`relative flex items-center gap-3.5 p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-amber-50/90 border-zinc-950 shadow-[4px_4px_0px_#18181b] translate-x-1'
                    : 'bg-white border-zinc-800 shadow-[2px_2px_0px_#18181b] hover:border-zinc-950 hover:bg-zinc-50'
                } ${isAlternate ? 'ml-2' : ''}`}
              >
                <div className="relative z-10 w-12 h-12 rounded-xl border-2 border-zinc-900 bg-white overflow-hidden shadow-sm flex-shrink-0 flex items-center justify-center">
                  {item.sticker?.image_url ? (
                    <img
                      src={item.sticker.image_url}
                      alt={item.content}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Sparkles className="w-5 h-5 text-amber-500" />
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-black font-mono text-zinc-900">
                      {item.entry_date}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 border border-zinc-300 text-zinc-600">
                      {item.sticker?.time_of_day || 'hôm nay'}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 font-semibold truncate">
                    {item.content}
                  </p>
                </div>
              </div>
            );
          })}

          {hasMore && (
            <div className="pt-2 pb-1 text-center">
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={isLoading}
                className="px-4 py-2 bg-white hover:bg-zinc-100 border-2 border-zinc-800 text-zinc-900 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang tải thêm theo lô...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Tải thêm khoảnh khắc</span>
                  </>
                )}
              </button>
            </div>
          )}

          {!hasMore && initialLoaded && items.length > 0 && (
            <div className="text-center text-[11px] font-bold text-zinc-400 py-2">
              Đã hiển thị toàn bộ {items.length} khoảnh khắc trên dòng thời gian.
            </div>
          )}
        </div>
      </div>

      <div className="hidden lg:col-span-5 lg:flex flex-col justify-between space-y-3 h-full">
        <div className="flex items-center justify-between pb-2 border-b-2 border-zinc-200">
          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
            Chi tiết khoảnh khắc đã chọn
          </span>
          <span className="text-[11px] font-mono text-zinc-400">
            #{selectedItem?.id.slice(0, 8)}
          </span>
        </div>

        {selectedItem ? (
          <div className="bg-white doodle-border-lg p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="w-full aspect-square max-h-56 rounded-2xl border-2 border-zinc-900 bg-amber-50/40 p-4 flex items-center justify-center overflow-hidden shadow-inner mx-auto">
                {selectedItem.sticker?.image_url ? (
                  <img
                    src={selectedItem.sticker.image_url}
                    alt={selectedItem.content}
                    className="max-h-full max-w-full object-contain filter drop-shadow-md"
                  />
                ) : (
                  <Sparkles className="w-16 h-16 text-amber-500" />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-100 border border-zinc-800 text-xs font-bold text-zinc-900">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{selectedItem.entry_date}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 border border-zinc-800 text-xs font-bold text-zinc-900">
                    <Tag className="w-3.5 h-3.5" />
                    <span>{selectedItem.sticker?.mood || 'Vui vẻ'}</span>
                  </span>
                </div>

                <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-200 text-xs text-zinc-800 font-medium leading-relaxed">
                  {selectedItem.content}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-zinc-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl font-bold flex items-center gap-1 cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa nhật ký</span>
              </button>

              <button
                type="button"
                onClick={onGoToRecap}
                className="px-3.5 py-1.5 bg-zinc-900 text-white doodle-btn rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-zinc-800"
              >
                <span>Xem Recap</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white doodle-border-lg p-6 flex-1 flex flex-col items-center justify-center text-center text-zinc-400">
            <Sparkles className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-xs font-medium">Chọn một khoảnh khắc trên dòng thời gian để xem chi tiết</p>
          </div>
        )}
      </div>

      <DeleteEntryModal
        isOpen={isDeleteModalOpen}
        item={selectedItem}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </section>
  );
};
