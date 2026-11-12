import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { Film, Download, Check, ArrowLeft, Share2 } from 'lucide-react';

interface RecapSectionProps {
  onBackToTimeline: () => void;
}

type MilestonePeriod = '3days' | '7days' | '30days';

interface MilestoneConfig {
  id: MilestonePeriod;
  label: string;
  daysCount: number;
  title: string;
  dateRange: string;
  stickers: string[];
  summaryQuote: string;
  statsText: string;
}

export const RecapSection: React.FC<RecapSectionProps> = ({ onBackToTimeline }) => {
  const { user } = useAuth();
  const userName = user?.name || 'Chí Nhân';
  const usernameHandle = `@${(user?.email?.split('@')[0] || 'chinhan').toLowerCase()}`;

  const [selectedMilestone, setSelectedMilestone] = useState<MilestonePeriod>('7days');
  const [includeQuote, setIncludeQuote] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [colorTheme, setColorTheme] = useState<'warm' | 'cool' | 'mono'>('warm');
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  const posterRef = useRef<HTMLDivElement>(null);

  const milestones: Record<MilestonePeriod, MilestoneConfig> = {
    '3days': {
      id: '3days',
      label: 'Mốc 3 Ngày',
      daysCount: 3,
      title: '3 NGÀY KHỞI ĐẦU',
      dateRange: '08/11 — 10/11/2026',
      stickers: [
        '/sample_stickers/c01-01.jpg',
        '/sample_stickers/c01-05.jpg',
        '/sample_stickers/c01-08.jpg'
      ],
      summaryQuote: '3 ngày đầu tiên gieo mầm thói quen ghi chép tích cực và lưu giữ cảm xúc chân thật.',
      statsText: '3 khoảnh khắc • 100% cảm xúc rạng rỡ'
    },
    '7days': {
      id: '7days',
      label: 'Mốc 7 Ngày',
      daysCount: 7,
      title: '7 NGÀY HÀNH TRÌNH',
      dateRange: '04/11 — 10/11/2026',
      stickers: [
        '/sample_stickers/c01-01.jpg',
        '/sample_stickers/c01-02.jpg',
        '/sample_stickers/c01-03.jpg',
        '/sample_stickers/c01-04.jpg',
        '/sample_stickers/c01-05.jpg',
        '/sample_stickers/c01-06.jpg',
        '/sample_stickers/c01-07.jpg',
        '/sample_stickers/c01-08.jpg',
        '/sample_stickers/c01-09.jpg'
      ],
      summaryQuote: 'Một tuần trọn vẹn vượt qua thử thách, gắn kết từng bước chân bằng những nhãn dán vui nhộn.',
      statsText: '7 ngày liên tiếp • 12 sticker hoàn tất'
    },
    '30days': {
      id: '30days',
      label: 'Mốc 30 Ngày',
      daysCount: 30,
      title: '30 NGÀY KỶ NIỆM',
      dateRange: '12/10 — 10/11/2026',
      stickers: [
        '/sample_stickers/c01-08.jpg',
        '/sample_stickers/c01-01.jpg',
        '/sample_stickers/c01-05.jpg',
        '/sample_stickers/c01-03.jpg',
        '/sample_stickers/c01-10.jpg',
        '/sample_stickers/c01-07.jpg',
        '/sample_stickers/c01-04.jpg',
        '/sample_stickers/c01-02.jpg',
        '/sample_stickers/c01-06.jpg'
      ],
      summaryQuote: 'Tháng trọn vẹn của những kỷ niệm không thể quên, định hình một bức tranh nhật ký vô giá.',
      statsText: 'Cột mốc Vàng 30 Ngày • 45 sticker độc bản'
    }
  };

  const currentConfig = milestones[selectedMilestone];

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      setExportSuccess(true);

      const link = document.createElement('a');
      link.download = `doodlelife_recap_${selectedMilestone}_${Date.now()}.png`;
      link.href = currentConfig.stickers[0];
      link.click();

      setTimeout(() => setExportSuccess(false), 3000);
    }, 900);
  };

  const getThemeBg = () => {
    switch (colorTheme) {
      case 'warm':
        return 'bg-[#fffdfa] border-zinc-900';
      case 'cool':
        return 'bg-[#f0f9ff] border-sky-900';
      case 'mono':
        return 'bg-[#fafafa] border-black';
    }
  };

  return (
    <section className="h-full max-w-5xl mx-auto w-full grid grid-cols-12 gap-6 items-center py-2 select-none">
      <div className="col-span-12 md:col-span-5 flex flex-col items-center justify-center">
        <div
          ref={posterRef}
          className={`w-[275px] h-[490px] ${getThemeBg()} border-[3px] rounded-2xl p-4 flex flex-col justify-between shadow-[6px_6px_0px_#18181b] relative transition-all`}
        >
          <div className="text-center space-y-0.5">
            <span className="text-[10px] font-black tracking-widest text-zinc-400 uppercase">
              DOODLE RECAP • {currentConfig.label}
            </span>
            <h2 className="text-xl font-black font-doodle text-zinc-900 leading-tight">
              {currentConfig.title}
            </h2>
            <div className="text-[10px] text-zinc-500 font-semibold font-mono">
              {currentConfig.dateRange}
            </div>
          </div>

          {selectedMilestone === '3days' ? (
            <div className="space-y-2 my-auto p-2 bg-white rounded-xl border border-dashed border-zinc-300">
              <div className="flex justify-center gap-2">
                {currentConfig.stickers.map((src, idx) => (
                  <div
                    key={idx}
                    className="w-16 h-16 rounded-xl border-2 border-zinc-900 overflow-hidden shadow-[2px_2px_0px_#000]"
                  >
                    <img src={src} alt="Sticker 3 days" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
              <div className="text-center text-[10px] font-bold text-zinc-700 font-mono pt-1">
                {currentConfig.statsText}
              </div>
            </div>
          ) : (
            <div className="my-auto p-2 bg-white rounded-xl border border-dashed border-zinc-300 space-y-1.5">
              <div className="grid grid-cols-3 gap-1.5">
                {currentConfig.stickers.slice(0, 9).map((src, index) => (
                  <img
                    key={index}
                    src={src}
                    alt={`Sticker ${index + 1}`}
                    className="aspect-square rounded-md border-2 border-zinc-900 object-cover shadow-[1px_1px_0px_#000]"
                  />
                ))}
              </div>
              <div className="text-center text-[10px] font-bold text-zinc-700 font-mono">
                {currentConfig.statsText}
              </div>
            </div>
          )}

          {includeQuote && (
            <div className="p-2 bg-amber-100/70 border border-zinc-800 rounded-lg text-center text-[10px] font-medium text-zinc-800 italic leading-snug">
              "{currentConfig.summaryQuote}"
            </div>
          )}

          <div className="pt-2 border-t border-dashed border-zinc-300 flex justify-between items-center text-[10px] text-zinc-500 font-mono">
            <span>{includeWatermark ? `doodlelife.app/${usernameHandle}` : ''}</span>
            <span className="font-bold text-zinc-900">{userName}</span>
          </div>
        </div>

        <span className="text-[11px] font-mono text-zinc-400 font-bold mt-2">
          Xem trước tỉ lệ Story 9:16 (1080 × 1920 px)
        </span>
      </div>

      <div className="col-span-12 md:col-span-7 bg-white doodle-border-lg p-5 sm:p-6 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold uppercase tracking-wider">
              Studio Xuất Ảnh 9:16
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-zinc-900 mt-1">
              Memory Recap Mốc Thời Gian
            </h3>
            <p className="text-xs sm:text-sm text-zinc-600 mt-0.5">
              Tự động gom cụm các nhãn dán sticker và typography độc bản theo từng mốc kỷ niệm.
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToTimeline}
            className="text-xs font-bold text-zinc-500 hover:text-black flex items-center gap-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Dòng thời gian</span>
          </button>
        </div>

        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700">
            Chọn mốc tổng kết:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['3days', '7days', '30days'] as MilestonePeriod[]).map((mKey) => (
              <button
                key={mKey}
                type="button"
                onClick={() => setSelectedMilestone(mKey)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedMilestone === mKey
                    ? 'bg-zinc-900 text-white shadow-sm border-2 border-zinc-900'
                    : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-2 border-transparent'
                }`}
              >
                {milestones[mKey].label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-y border-zinc-200 py-3.5 text-xs font-medium">
          <div className="flex justify-between items-center">
            <span className="font-bold text-zinc-700">Tông màu khung vẽ:</span>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setColorTheme('warm')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer border ${
                  colorTheme === 'warm' ? 'bg-amber-100 border-zinc-900' : 'bg-white border-zinc-300'
                }`}
              >
                Ấm áp
              </button>
              <button
                type="button"
                onClick={() => setColorTheme('cool')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer border ${
                  colorTheme === 'cool' ? 'bg-sky-100 border-zinc-900' : 'bg-white border-zinc-300'
                }`}
              >
                Mát mẻ
              </button>
              <button
                type="button"
                onClick={() => setColorTheme('mono')}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs cursor-pointer border ${
                  colorTheme === 'mono' ? 'bg-zinc-200 border-zinc-900' : 'bg-white border-zinc-300'
                }`}
              >
                Tối giản
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recap-quote-toggle"
              checked={includeQuote}
              onChange={(e) => setIncludeQuote(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-zinc-800 accent-zinc-900 cursor-pointer"
            />
            <label htmlFor="recap-quote-toggle" className="cursor-pointer font-bold text-zinc-800">
              Hiển thị đoạn văn tóm tắt cảm xúc
            </label>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="recap-watermark-toggle"
              checked={includeWatermark}
              onChange={(e) => setIncludeWatermark(e.target.checked)}
              className="w-4 h-4 rounded border-2 border-zinc-800 accent-zinc-900 cursor-pointer"
            />
            <label htmlFor="recap-watermark-toggle" className="cursor-pointer font-bold text-zinc-800">
              Đính kèm watermark cá nhân hóa ({usernameHandle})
            </label>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          {exportSuccess && (
            <div className="p-2.5 bg-emerald-50 border-2 border-emerald-800 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Đã xuất poster Story 9:16 chất lượng cao thành công!</span>
            </div>
          )}

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 py-3 bg-zinc-900 hover:bg-zinc-800 text-white doodle-btn rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {isExporting ? (
                <>
                  <Film className="w-4 h-4 animate-spin" />
                  <span>Đang tổng hợp ảnh 9:16...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Xuất Ảnh Story 9:16 (PNG)</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onBackToTimeline}
              className="px-4 py-3 bg-amber-100 hover:bg-amber-200 border-2 border-zinc-900 text-zinc-900 doodle-btn rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Hành trình</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
