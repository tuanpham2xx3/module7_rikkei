import React from 'react';
import type { ActiveSection } from './AppHeader';
import { Sparkles, PenTool, Compass, Trophy, Images } from 'lucide-react';

interface BottomNavProps {
  activeSection: ActiveSection;
  onNavigate: (section: ActiveSection) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeSection, onNavigate }) => {
  return (
    <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 w-[94%] max-w-md bg-white/95 backdrop-blur-md border-2 border-zinc-900 rounded-2xl shadow-doodle p-1.5 flex items-center justify-around md:hidden">
      <button
        onClick={() => onNavigate('landing')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer font-bold text-[11px] ${
          activeSection === 'landing'
            ? 'bg-amber-100 text-zinc-900 border-2 border-zinc-900'
            : 'text-zinc-600'
        }`}
      >
        <Sparkles className="w-4 h-4" />
        <span>Giới thiệu</span>
      </button>

      <button
        onClick={() => onNavigate('checkin')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer font-bold text-[11px] ${
          activeSection === 'checkin'
            ? 'bg-amber-100 text-zinc-900 border-2 border-zinc-900'
            : 'text-zinc-600'
        }`}
      >
        <PenTool className="w-4 h-4" />
        <span>Ghi chép</span>
      </button>

      <button
        onClick={() => onNavigate('timeline')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer font-bold text-[11px] ${
          activeSection === 'timeline'
            ? 'bg-amber-100 text-zinc-900 border-2 border-zinc-900'
            : 'text-zinc-600'
        }`}
      >
        <Compass className="w-4 h-4" />
        <span>Hành trình</span>
      </button>

      <button
        onClick={() => onNavigate('recap')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer font-bold text-[11px] ${
          activeSection === 'recap'
            ? 'bg-amber-100 text-zinc-900 border-2 border-zinc-900'
            : 'text-zinc-600'
        }`}
      >
        <Trophy className="w-4 h-4" />
        <span>Recap</span>
      </button>

      <button
        onClick={() => onNavigate('stickers')}
        className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl transition cursor-pointer font-bold text-[11px] ${
          activeSection === 'stickers'
            ? 'bg-amber-100 text-zinc-900 border-2 border-zinc-900'
            : 'text-zinc-600'
        }`}
      >
        <Images className="w-4 h-4" />
        <span>Kho ảnh</span>
      </button>
    </nav>
  );
};
