import React, { useState } from 'react';

interface TimelineSectionProps {
  onGoToCheckin: () => void;
  onGoToRecap: () => void;
}

interface TimelineDay {
  id: string;
  dateStr: string;
  img: string;
  code: string;
  title: string;
  meta: string;
  badge?: string;
}

export const TimelineSection: React.FC<TimelineSectionProps> = ({ onGoToCheckin, onGoToRecap }) => {
  const days: TimelineDay[] = [
    {
      id: 'today',
      dateStr: '06/11 (Hôm nay)',
      img: '/sample_stickers/c01-08.jpg',
      code: 'c01-08',
      title: 'Viết nhật ký đêm muộn dưới ánh đèn vàng ấm cúng',
      meta: '21:30 Tối • Đang làm đại diện chính',
      badge: '2 sticker'
    },
    {
      id: 'nov5',
      dateStr: '05/11/2026',
      img: '/sample_stickers/c01-01.jpg',
      code: 'c01-01',
      title: 'Đạp xe thể thao leo dốc đón nắng sớm',
      meta: '07:30 Sáng • Hào hứng'
    },
    {
      id: 'nov4',
      dateStr: '04/11/2026',
      img: '/sample_stickers/c01-05.jpg',
      code: 'c01-05',
      title: 'Mèo lười ngủ say trên ghế sofa buổi chiều',
      meta: '16:00 Chiều • Bình yên'
    },
    {
      id: 'nov3',
      dateStr: '03/11/2026',
      img: '/sample_stickers/c01-03.jpg',
      code: 'c01-03',
      title: 'Uống trà ấm nhìn mưa rơi tí tách bên ô cửa sổ',
      meta: '14:15 Chiều • Lắng đọng'
    }
  ];

  const [selectedDay, setSelectedDay] = useState<TimelineDay>(days[0]);

  return (
    <section className="h-full max-w-6xl mx-auto w-full grid grid-cols-12 gap-6 items-stretch py-2">
      {/* Left Column: Compact Timeline Vertical Road (Col 7) */}
      <div className="col-span-12 lg:col-span-7 flex flex-col justify-between space-y-3">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b-2 border-zinc-200 flex-shrink-0">
          <div>
            <h2 className="text-xl font-black font-doodle text-zinc-900">
              Hành Trình Dòng Đời (7 Ngày)
            </h2>
            <p className="text-xs text-zinc-500">
              Các khoảnh khắc tích lũy kết nối qua trục thời gian dọc
            </p>
          </div>
          <button
            onClick={onGoToCheckin}
            className="px-4 py-2 bg-zinc-900 text-white doodle-btn rounded-xl text-xs font-bold cursor-pointer"
          >
            + Ghi chép mới
          </button>
        </div>

        {/* Milestone Banner */}
        <div
          onClick={onGoToRecap}
          className="p-3 bg-purple-50 border-2 border-zinc-900 rounded-xl flex justify-between items-center cursor-pointer hover:bg-purple-100 transition shadow-sm flex-shrink-0"
        >
          <div className="flex items-center gap-2.5 text-xs">
            <span className="text-xl">🏆</span>
            <div>
              <span className="font-black text-sm text-purple-950">
                Đã tích lũy Mốc 7 Ngày!
              </span>
              <span className="text-purple-700 text-xs ml-2">
                Bấm mở Studio xuất ảnh Story 9:16
              </span>
            </div>
          </div>
          <span className="text-xs font-bold bg-white px-3 py-1 rounded-lg border border-zinc-900">
            Mở Recap ➔
          </span>
        </div>

        {/* 4 Days Cards Vertical Road */}
        <div className="flex-1 flex flex-col justify-between space-y-2.5 relative pl-8 before:content-[''] before:absolute before:left-[15px] before:top-3 before:bottom-3 before:w-[2px] before:bg-zinc-800 before:border-dashed">
          {days.map((day) => {
            const isSelected = selectedDay.id === day.id;
            return (
              <div key={day.id} className="relative">
                {/* Node marker */}
                {day.id === 'today' ? (
                  <div className="absolute -left-[24px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-emerald-500 border-2 border-zinc-900 shadow-sm ring-4 ring-emerald-100 z-10" />
                ) : (
                  <div className="absolute -left-[24px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-zinc-900 shadow-sm z-10 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                  </div>
                )}

                {/* Day Card */}
                <div
                  onClick={() => setSelectedDay(day)}
                  className={`bg-white doodle-border-md p-3.5 flex items-center justify-between cursor-pointer transition ${
                    isSelected
                      ? 'border-zinc-900 bg-amber-50/40 ring-2 ring-zinc-900'
                      : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={day.img}
                      alt={day.title}
                      className="w-16 h-16 rounded-xl border-2 border-zinc-900 object-cover shadow-[2px_2px_0px_#000] flex-shrink-0"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-zinc-900">
                          {day.dateStr}
                        </span>
                        {day.badge && (
                          <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-md">
                            {day.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-zinc-700 font-medium line-clamp-1 mt-0.5">
                        "{day.title}"
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {day.meta}
                      </div>
                    </div>
                  </div>
                  {isSelected ? (
                    <span className="text-xs font-extrabold text-emerald-600 flex-shrink-0">
                      Đang chọn ➔
                    </span>
                  ) : (
                    <span className="text-xs text-zinc-400 font-mono">
                      {day.code}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Live Day Detail Panel (Col 5) */}
      <div className="col-span-12 lg:col-span-5 bg-white doodle-border-lg p-5 flex flex-col justify-between space-y-4">
        <div className="flex justify-between items-center border-b border-zinc-200 pb-2.5">
          <span className="text-xs font-extrabold uppercase tracking-wider text-zinc-500">
            Chi tiết ngày {selectedDay.dateStr}
          </span>
          <span className="text-xs font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded">
            {selectedDay.code}
          </span>
        </div>

        {/* Big Sticker Image Preview */}
        <div className="flex flex-col items-center text-center space-y-2 py-2">
          <div className="w-36 h-36 rounded-2xl border-2 border-zinc-900 overflow-hidden shadow-[4px_4px_0px_#000] relative bg-amber-50">
            <img
              src={selectedDay.img}
              alt={selectedDay.title}
              className="w-full h-full object-cover"
            />
            <span className="absolute top-2 right-2 bg-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full border border-zinc-900 shadow">
              ĐẠI DIỆN
            </span>
          </div>
          <div>
            <h3 className="font-extrabold text-base text-zinc-900">
              "{selectedDay.title}"
            </h3>
            <p className="text-xs text-zinc-500 font-mono mt-0.5">
              Cloudflare Workers AI • Die-cut 512x512
            </p>
          </div>
        </div>

        {/* Moments Selector in Selected Day */}
        <div className="space-y-2 border-t border-dashed border-zinc-200 pt-3">
          <div className="flex justify-between items-center text-xs font-extrabold">
            <span>Khoảnh khắc trong ngày:</span>
            <button
              onClick={onGoToCheckin}
              className="text-emerald-700 font-bold hover:underline text-xs cursor-pointer"
            >
              + Thêm khoảnh khắc
            </button>
          </div>

          <div className="p-2.5 rounded-xl border-2 border-zinc-800 bg-amber-50/70 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <img
                src={selectedDay.img}
                alt="thumb"
                className="w-9 h-9 rounded-lg border border-zinc-800 object-cover"
              />
              <div>
                <div className="font-bold text-xs truncate max-w-[160px]">
                  {selectedDay.title}
                </div>
                <div className="text-[11px] text-zinc-500">
                  Đang đại diện Timeline
                </div>
              </div>
            </div>
            <span className="text-xs font-extrabold text-emerald-600">✓ Chọn</span>
          </div>
        </div>

        <button
          onClick={() => alert(`Đã tải sticker ${selectedDay.code} (PNG trong suốt 512x512) về máy!`)}
          className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 doodle-btn rounded-xl font-bold text-xs cursor-pointer"
        >
          📥 Tải sticker này (PNG trong suốt)
        </button>
      </div>
    </section>
  );
};
