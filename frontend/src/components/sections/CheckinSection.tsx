import React, { useState } from 'react';
import { useAuth } from '../../contexts/useAuth';

interface CheckinSectionProps {
  onGoToTimeline: () => void;
}

export const CheckinSection: React.FC<CheckinSectionProps> = ({ onGoToTimeline }) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState('Vui vẻ');
  const [isGenerating, setIsGenerating] = useState(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const moods = ['Vui vẻ', 'Bình yên', 'Bận rộn', 'Mệt mỏi'];

  const handleGenerate = () => {
    if (!content.trim()) {
      alert('Vui lòng nhập ít nhất 1 câu ngắn về ngày hôm nay nhé!');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setSuccessNotice('✨ Đã gửi tác vụ tạo sticker doodle thành công!');
      setTimeout(() => {
        setSuccessNotice(null);
        onGoToTimeline();
      }, 1200);
    }, 1500);
  };

  return (
    <section className="h-full max-w-4xl mx-auto w-full flex flex-col justify-between py-2 space-y-5">
      {/* Greeting Header */}
      <div className="text-center space-y-1">
        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
          Thứ Hai, 09 Tháng 11, 2026
        </span>
        <h2 className="text-3xl lg:text-4xl font-black font-doodle text-zinc-900">
          🌙 Chào buổi tối, {user?.name || 'Nhân'}!
        </h2>
        <p className="text-sm text-zinc-600 font-medium">
          Khoảnh khắc đáng nhớ nhất trong buổi tối hôm nay của bạn là gì?
        </p>
      </div>

      {/* Main Input Card */}
      <div className="bg-white doodle-border-lg p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center text-sm">
          <span className="font-extrabold text-zinc-800">
            Nhập tâm sự khoảnh khắc ngắn:
          </span>
          <span className="text-xs font-mono text-zinc-400 font-bold">
            {content.length}/300 ký tự
          </span>
        </div>

        {/* Textarea */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value.slice(0, 300))}
          rows={3}
          className="w-full p-4 text-sm lg:text-base rounded-xl border-2 border-zinc-800 bg-[#fdfdfd] focus:outline-none focus:bg-white resize-none font-medium"
          placeholder="Nhập câu ngắn (1 - 300 ký tự)... Ví dụ: Vừa đi dạo mát về, không khí tối nay mát mẻ và sảng khoái thật!"
        />

        {/* Success Notice */}
        {successNotice && (
          <div className="p-3 bg-emerald-50 border-2 border-emerald-800 rounded-xl text-emerald-900 text-xs font-bold animate-bounce">
            {successNotice}
          </div>
        )}

        {/* Mood Selector & Submit Button */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-bold text-zinc-700">Tâm trạng:</span>
            <div className="flex gap-2">
              {moods.map((mood) => (
                <button
                  key={mood}
                  type="button"
                  onClick={() => setSelectedMood(mood)}
                  className={`px-3 py-1.5 rounded-lg text-xs lg:text-sm font-bold transition-all cursor-pointer ${
                    selectedMood === mood
                      ? 'border-2 border-zinc-800 bg-amber-100 text-zinc-900 shadow-sm'
                      : 'border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-600 font-medium'
                  }`}
                >
                  {mood}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-3 bg-zinc-900 text-white doodle-btn rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer"
          >
            <span>{isGenerating ? '⏳ Đang phác thảo AI...' : '✨ Tạo Sticker Doodle'}</span>
          </button>
        </div>
      </div>

      {/* Bottom Split: Today's Summary & Big CTA Lead to Timeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Today's Moment Teaser */}
        <div className="bg-white doodle-border-md p-4 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src="/sample_stickers/c01-08.jpg"
              alt="Hôm nay"
              className="w-14 h-14 rounded-xl border-2 border-zinc-900 object-cover shadow-sm flex-shrink-0"
            />
            <div>
              <div className="text-sm font-extrabold text-zinc-900">
                Hôm nay: 2 khoảnh khắc
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">
                12:45 Đạp xe • 21:30 Viết nhật ký đêm
              </div>
            </div>
          </div>
          <button
            onClick={onGoToTimeline}
            className="text-xs font-bold text-zinc-700 hover:text-black underline cursor-pointer"
          >
            Quản lý ➔
          </button>
        </div>

        {/* Big CTA Button Lead to Timeline Screen */}
        <button
          onClick={onGoToTimeline}
          className="bg-amber-200 hover:bg-amber-300 doodle-btn rounded-xl p-4 flex items-center justify-between text-left cursor-pointer"
        >
          <div>
            <div className="text-sm font-black text-zinc-900 uppercase">
              Xem Toàn Bộ Hành Trình Timeline
            </div>
            <div className="text-xs text-zinc-600 mt-0.5">
              Trục thời gian kết nối các ngày qua nét vẽ sticker
            </div>
          </div>
          <span className="text-xl font-black text-zinc-900">➔</span>
        </button>
      </div>
    </section>
  );
};
