import React from 'react';
import { Pencil } from 'lucide-react';

interface DoodleLoadingProps {
  message?: string;
}

export const DoodleLoading: React.FC<DoodleLoadingProps> = ({ 
  message = "Đang mở sổ nhật ký..." 
}) => {
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#FAF9F6] p-4">
      <div className="doodle-box p-8 max-w-xs w-full text-center flex flex-col items-center gap-4 bg-white">
        <div className="relative">
          <div className="w-16 h-16 rounded-full bg-[#fef08a] border-2 border-[#1c1917] flex items-center justify-center animate-bounce">
            <Pencil className="w-8 h-8 text-[#1c1917] animate-wobble" />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-[#1c1917]"></span>
          </span>
        </div>

        <div className="space-y-1">
          <h3 className="font-doodle text-2xl font-bold text-[#1c1917]">DoodleLife</h3>
          <p className="text-sm font-medium text-stone-600">{message}</p>
        </div>

        {/* Doodle skeleton bars */}
        <div className="w-full space-y-2 pt-2">
          <div className="h-2.5 bg-stone-100 border border-stone-300 rounded-full overflow-hidden">
            <div className="h-full bg-[#1c1917] w-2/3 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
};
