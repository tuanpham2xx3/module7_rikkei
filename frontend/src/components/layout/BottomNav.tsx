import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, PenTool, User } from 'lucide-react';

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[92%] max-w-md bg-white/95 backdrop-blur-md border-2 border-stone-800 rounded-2xl shadow-doodle p-1.5 flex items-center justify-around sm:hidden">
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all cursor-pointer font-bold text-xs ${
            isActive
              ? 'bg-[#fef08a] text-stone-900 border-2 border-stone-800 shadow-doodle-sm -translate-y-0.5'
              : 'text-stone-600 hover:text-stone-900 border-2 border-transparent'
          }`
        }
      >
        <Compass className="w-5 h-5" />
        <span>Hành trình</span>
      </NavLink>

      <NavLink
        to="/write"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all cursor-pointer font-bold text-xs ${
            isActive
              ? 'bg-[#fef08a] text-stone-900 border-2 border-stone-800 shadow-doodle-sm -translate-y-0.5'
              : 'text-stone-600 hover:text-stone-900 border-2 border-transparent'
          }`
        }
      >
        <PenTool className="w-5 h-5" />
        <span>Ghi chép</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 py-1.5 px-4 rounded-xl transition-all cursor-pointer font-bold text-xs ${
            isActive
              ? 'bg-[#fef08a] text-stone-900 border-2 border-stone-800 shadow-doodle-sm -translate-y-0.5'
              : 'text-stone-600 hover:text-stone-900 border-2 border-transparent'
          }`
        }
      >
        <User className="w-5 h-5" />
        <span>Hồ sơ</span>
      </NavLink>
    </nav>
  );
};
