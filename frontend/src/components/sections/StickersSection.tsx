import React, { useState } from 'react';

interface StickerItem {
  img: string;
  code: string;
  title: string;
  tag: 'sang' | 'trua' | 'toi';
}

export const StickersSection: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'sang' | 'trua' | 'toi'>('all');

  const stickers: StickerItem[] = [
    { img: '/sample_stickers/c01-01.jpg', code: 'c01-01', title: 'Đạp xe leo dốc', tag: 'sang' },
    { img: '/sample_stickers/c01-02.jpg', code: 'c01-02', title: 'Bữa tối gia đình', tag: 'toi' },
    { img: '/sample_stickers/c01-03.jpg', code: 'c01-03', title: 'Ngắm mưa cửa sổ', tag: 'trua' },
    { img: '/sample_stickers/c01-04.jpg', code: 'c01-04', title: 'Bó hoa tươi sáng', tag: 'sang' },
    { img: '/sample_stickers/c01-05.jpg', code: 'c01-05', title: 'Mèo ngủ sofa', tag: 'trua' },
    { img: '/sample_stickers/c01-06.jpg', code: 'c01-06', title: 'Ngắm hoàng hôn', tag: 'toi' },
    { img: '/sample_stickers/c01-07.jpg', code: 'c01-07', title: 'Họp nhóm bạn', tag: 'trua' },
    { img: '/sample_stickers/c01-08.jpg', code: 'c01-08', title: 'Viết nhật ký đêm', tag: 'toi' },
    { img: '/sample_stickers/c01-09.jpg', code: 'c01-09', title: 'Tưới cây ban công', tag: 'sang' },
    { img: '/sample_stickers/c01-10.jpg', code: 'c01-10', title: 'Cún cưng nghịch bóng', tag: 'trua' }
  ];

  const filtered = filter === 'all' ? stickers : stickers.filter((s) => s.tag === filter);

  return (
    <section className="h-full max-w-5xl mx-auto w-full flex flex-col justify-between py-2 space-y-4">
      {/* Header & Filter */}
      <div className="flex flex-wrap justify-between items-center bg-white doodle-border-md p-4 gap-3">
        <div>
          <h3 className="font-black text-base text-zinc-900">
            KHO STICKER CLOUDFLARE AI (10)
          </h3>
          <p className="text-xs text-zinc-500">
            Tất cả sticker doodle thật do anh Tiến tạo
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition ${
              filter === 'all'
                ? 'bg-zinc-900 text-white'
                : 'border border-zinc-300 bg-white hover:bg-zinc-100'
            }`}
          >
            Tất cả (10)
          </button>
          <button
            onClick={() => setFilter('sang')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
              filter === 'sang'
                ? 'bg-zinc-900 text-white font-bold'
                : 'border border-zinc-300 bg-white hover:bg-zinc-100 font-medium'
            }`}
          >
            Sáng
          </button>
          <button
            onClick={() => setFilter('trua')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
              filter === 'trua'
                ? 'bg-zinc-900 text-white font-bold'
                : 'border border-zinc-300 bg-white hover:bg-zinc-100 font-medium'
            }`}
          >
            Trưa
          </button>
          <button
            onClick={() => setFilter('toi')}
            className={`px-3 py-1.5 rounded-lg cursor-pointer transition ${
              filter === 'toi'
                ? 'bg-zinc-900 text-white font-bold'
                : 'border border-zinc-300 bg-white hover:bg-zinc-100 font-medium'
            }`}
          >
            Tối
          </button>
        </div>
      </div>

      {/* Grid of Stickers */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 my-2 flex-1 items-center">
        {filtered.map((item) => (
          <div
            key={item.code}
            onClick={() => alert(`Sticker ${item.title} (${item.code}) - Định dạng PNG 512x512`)}
            className="bg-white doodle-border-md p-2.5 text-center space-y-1.5 hover:scale-105 transition cursor-pointer shadow-sm"
          >
            <img
              src={item.img}
              alt={item.title}
              className="w-20 h-20 mx-auto rounded-xl border-2 border-zinc-900 object-cover"
            />
            <div className="text-xs font-bold truncate text-zinc-900">
              {item.title}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono">
              {item.code}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
