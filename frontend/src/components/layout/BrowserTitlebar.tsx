import React from 'react';
import type { ActiveSection } from './AppHeader';
import { Lock } from 'lucide-react';

interface BrowserTitlebarProps {
  activeSection: ActiveSection;
}

export const BrowserTitlebar: React.FC<BrowserTitlebarProps> = ({ activeSection }) => {
  const getTabTitle = () => {
    switch (activeSection) {
      case 'landing':
        return 'DoodleLife - Giới thiệu';
      case 'checkin':
        return 'DoodleLife - Ghi chép';
      case 'timeline':
        return 'DoodleLife - Hành trình';
      case 'recap':
        return 'DoodleLife - Memory Recap';
      case 'stickers':
        return 'DoodleLife - Kho Sticker';
      default:
        return 'DoodleLife';
    }
  };

  const getUrl = () => {
    switch (activeSection) {
      case 'landing':
        return 'https://doodlelife.app';
      case 'checkin':
        return 'https://doodlelife.app/checkin';
      case 'timeline':
        return 'https://doodlelife.app/timeline';
      case 'recap':
        return 'https://doodlelife.app/recap';
      case 'stickers':
        return 'https://doodlelife.app/stickers';
      default:
        return 'https://doodlelife.app';
    }
  };

  return (
    <div className="h-[42px] bg-zinc-100 border-b-2 border-zinc-800 px-4 flex items-center justify-between flex-shrink-0 relative select-none">
      {/* Left: Traffic Lights & Browser Tab */}
      <div className="flex items-center gap-2.5 z-10 min-w-[260px]">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400 border border-zinc-700"></div>
          <div className="w-3 h-3 rounded-full bg-amber-400 border border-zinc-700"></div>
          <div className="w-3 h-3 rounded-full bg-emerald-400 border border-zinc-700"></div>
        </div>

        <div className="ml-2 px-3.5 py-1.5 bg-white border-2 border-zinc-800 rounded-t-lg font-bold text-xs flex items-center justify-between gap-2 -mb-2 z-10 shadow-sm w-[200px]">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0"></span>
            <span className="truncate text-zinc-900">{getTabTitle()}</span>
          </div>
          <span className="text-zinc-400 text-xs hover:text-black cursor-pointer flex-shrink-0">✕</span>
        </div>
      </div>

      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm pointer-events-auto z-10">
        <div className="w-full bg-white border border-zinc-300 rounded-xl px-3.5 py-1 text-xs text-zinc-700 flex items-center justify-center gap-1.5 shadow-inner">
          <Lock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
          <span className="text-zinc-800 font-semibold text-xs tracking-normal select-text">
            {getUrl()}
          </span>
        </div>
      </div>

      <div className="text-xs font-bold text-zinc-500 flex items-center gap-1.5 z-10 min-w-[200px] justify-end hidden md:flex">
        <span>Desktop 1440 × 900</span>
      </div>
    </div>
  );
};
