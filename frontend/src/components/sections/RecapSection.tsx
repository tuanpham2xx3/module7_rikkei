import React, { useState } from 'react';

interface RecapSectionProps {
  onBackToTimeline: () => void;
}

export const RecapSection: React.FC<RecapSectionProps> = ({ onBackToTimeline }) => {
  const [includeQuote, setIncludeQuote] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);

  const sampleStickers = [
    '/sample_stickers/c01-01.jpg',
    '/sample_stickers/c01-02.jpg',
    '/sample_stickers/c01-03.jpg',
    '/sample_stickers/c01-04.jpg',
    '/sample_stickers/c01-05.jpg',
    '/sample_stickers/c01-06.jpg',
    '/sample_stickers/c01-08.jpg',
    '/sample_stickers/c01-09.jpg',
    '/sample_stickers/c01-10.jpg'
  ];

  return (
    <section className="h-full max-w-5xl mx-auto w-full grid grid-cols-12 gap-8 items-center py-2">
      {/* Left: 9:16 Poster */}
      <div className="col-span-12 md:col-span-5 flex justify-center">
        <div className="w-[270px] h-[480px] bg-[#fffdfa] border-[3px] border-zinc-900 rounded-2xl p-4 flex flex-col justify-between shadow-[6px_6px_0px_#18181b]">
          <div className="text-center space-y-0.5">
            <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              DOODLE RECAP
            </span>
            <h2 className="text-xl font-black font-doodle text-zinc-900 leading-tight">
              7 NGÀY HÀNH TRÌNH
            </h2>
            <div className="text-[10px] text-zinc-500 font-semibold">
              31/10/2026 — 06/11/2026
            </div>
          </div>

          {/* 3x3 Grid of 9 Real Cloudflare AI Stickers */}
          <div className="grid grid-cols-3 gap-1.5 my-auto p-2 bg-white rounded-xl border border-dashed border-zinc-300">
            {sampleStickers.map((src, index) => (
              <img
                key={index}
                src={src}
                alt={`Sticker ${index + 1}`}
                className="aspect-square rounded-md border-2 border-zinc-900 object-cover shadow-[1px_1px_0px_#000]"
              />
            ))}
          </div>

          <div className="pt-2 border-t border-dashed border-zinc-300 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
            <span>{includeWatermark ? 'doodlelife.app/@nhan' : ''}</span>
            <span className="font-bold text-zinc-900">#DoodleLife</span>
          </div>
        </div>
      </div>

      {/* Right: Export Settings & Controls */}
      <div className="col-span-12 md:col-span-7 bg-white doodle-border-lg p-6 space-y-4">
        <div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold uppercase">
            Xuất ảnh 1-chạm
          </span>
          <h3 className="text-2xl font-black text-zinc-900 mt-1">
            Memory Recap Studio (9:16)
          </h3>
          <p className="text-sm text-zinc-600 mt-0.5">
            Tự động kết hợp 9 sticker thật từ Cloudflare AI thành tấm poster chuẩn Story.
          </p>
        </div>

        <div className="space-y-3.5 border-y border-zinc-200 py-4 text-sm font-medium">
          <div className="flex justify-between items-center">
            <span>Độ phân giải xuất:</span>
            <span className="font-bold font-mono bg-zinc-100 px-3 py-1 rounded-lg border border-zinc-300">
              1080 × 1920 px (PNG)
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={includeQuote}
              onChange={(e) => setIncludeQuote(e.target.checked)}
              id="recap-c1"
              className="rounded w-4 h-4 cursor-pointer accent-zinc-900"
            />
            <label htmlFor="recap-c1" className="cursor-pointer font-medium text-xs">
              Hiển thị trích dẫn nội dung ngắn dưới sticker
            </label>
          </div>
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={includeWatermark}
              onChange={(e) => setIncludeWatermark(e.target.checked)}
              id="recap-c2"
              className="rounded w-4 h-4 cursor-pointer accent-zinc-900"
            />
            <label htmlFor="recap-c2" className="cursor-pointer font-medium text-xs">
              Đính kèm watermark cá nhân hóa @username
            </label>
          </div>
        </div>

        <div className="space-y-2.5 pt-1">
          <button
            onClick={() => alert('Đã kết xuất và tải thành công ảnh Story PNG 1080x1920!')}
            className="w-full py-3.5 bg-zinc-900 text-white doodle-btn rounded-xl font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            📥 TẢI XUỐNG ẢNH STORY (PNG 1080×1920)
          </button>
          <button
            onClick={onBackToTimeline}
            className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 doodle-btn rounded-xl font-bold text-xs text-zinc-700 cursor-pointer"
          >
            ← Quay lại Hành trình Timeline
          </button>
        </div>
      </div>
    </section>
  );
};
