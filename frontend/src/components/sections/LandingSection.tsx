import React from 'react';

interface LandingSectionProps {
  onStartWriting: () => void;
}

export const LandingSection: React.FC<LandingSectionProps> = ({ onStartWriting }) => {
  return (
    <section className="h-full max-w-5xl mx-auto w-full flex flex-col justify-between py-2 space-y-6">
      {/* Hero Top Section */}
      <div className="text-center space-y-3 pt-2">
        <div className="inline-block px-4 py-1.5 rounded-full bg-amber-100 border-2 border-zinc-900 text-xs font-black text-zinc-900 uppercase tracking-widest shadow-sm">
          DOODLELIFE — NHẬT KÝ TRỰC QUAN TÍCH HỢP AI
        </div>
        <h1 className="text-4xl lg:text-5xl font-black font-doodle text-zinc-900 tracking-[0.01em] leading-tight max-w-3xl mx-auto">
          Little Moments - Little Doodles
        </h1>
        <p className="text-sm lg:text-base text-zinc-600 max-w-2xl mx-auto font-medium leading-relaxed tracking-normal">
          Từ những đoạn ghi chép ngắn, DoodleLife tự động tạo sticker hoạt hình doodle và sắp xếp trên dòng thời gian tương tác, giúp việc viết nhật ký trở nên sinh động, riêng tư và dễ duy trì mỗi ngày.
        </p>
      </div>

      {/* Feature Grid: 3 Cột Card có ĐỘ SÂU (DEPTH) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-auto">
        {/* Feature 1 */}
        <div 
          onClick={onStartWriting}
          className="bg-white doodle-card-depth p-6 space-y-3 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-amber-100 border-2 border-zinc-900 flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
            ⚡
          </div>
          <h3 className="text-base lg:text-lg font-black text-zinc-900 tracking-tight">
            Check-in Siêu Tốc &lt; 60s
          </h3>
          <p className="text-xs lg:text-sm text-zinc-600 leading-relaxed font-medium">
            Nhập 15–300 ký tự cảm xúc. Tự động gắn tag buổi (Sáng, Trưa, Tối) và cảm xúc mà không gây áp lực hội chứng "trang giấy trắng".
          </p>
        </div>

        {/* Feature 2 */}
        <div 
          onClick={onStartWriting}
          className="bg-white doodle-card-depth p-6 space-y-3 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-sky-100 border-2 border-zinc-900 flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
            🎨
          </div>
          <h3 className="text-base lg:text-lg font-black text-zinc-900 tracking-tight">
            Cloudflare AI Stickers
          </h3>
          <p className="text-xs lg:text-sm text-zinc-600 leading-relaxed font-medium">
            Mô hình Diffusion chuẩn hóa phong cách hoạt hình viền trắng die-cut dày dặn, màu sắc pastel ấm áp lưu vào bộ sưu tập cá nhân.
          </p>
        </div>

        {/* Feature 3 */}
        <div 
          onClick={onStartWriting}
          className="bg-white doodle-card-depth p-6 space-y-3 cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-purple-100 border-2 border-zinc-900 flex items-center justify-center text-2xl shadow-[2px_2px_0px_#000]">
            🏆
          </div>
          <h3 className="text-base lg:text-lg font-black text-zinc-900 tracking-tight">
            Memory Recap 9:16 Story
          </h3>
          <p className="text-xs lg:text-sm text-zinc-600 leading-relaxed font-medium">
            Tự động tổng hợp cột mốc 3 ngày, 7 ngày, 30 ngày. Xuất ảnh Story 1080×1920 chất lượng cao chia sẻ 1-chạm lên mạng xã hội.
          </p>
        </div>
      </div>

      {/* Bottom Hero CTA Bar */}
      <div className="bg-white doodle-card-depth p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex -space-x-2">
            <img 
              src="/sample_stickers/c01-01.jpg" 
              alt="sample sticker 1"
              className="w-11 h-11 rounded-full border-2 border-zinc-900 object-cover shadow-sm" 
            />
            <img 
              src="/sample_stickers/c01-05.jpg" 
              alt="sample sticker 2"
              className="w-11 h-11 rounded-full border-2 border-zinc-900 object-cover shadow-sm" 
            />
            <img 
              src="/sample_stickers/c01-08.jpg" 
              alt="sample sticker 3"
              className="w-11 h-11 rounded-full border-2 border-zinc-900 object-cover shadow-sm" 
            />
          </div>
          <div>
            <div className="text-sm font-black text-zinc-900">
              Sẵn sàng lưu giữ kỷ niệm hôm nay?
            </div>
            <div className="text-xs text-zinc-500 font-medium">
              Mỗi ngày được cấp 5 lượt tạo ảnh AI miễn phí
            </div>
          </div>
        </div>

        <button 
          onClick={onStartWriting} 
          className="px-6 py-3 bg-zinc-900 text-white doodle-btn rounded-xl font-black text-sm flex items-center gap-2 cursor-pointer"
        >
          <span>Bắt đầu Ghi chép ngay</span>
          <span>➔</span>
        </button>
      </div>
    </section>
  );
};
