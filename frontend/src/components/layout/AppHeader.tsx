import React from 'react';
import { useAuth } from '../../contexts/useAuth';
import { BookOpen, LogOut, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const AppHeader: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-[#FAF9F6]/90 backdrop-blur-md border-b-2 border-stone-800 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div 
          onClick={() => navigate('/')} 
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <div className="w-10 h-10 rounded-xl bg-[#fef08a] border-2 border-stone-900 flex items-center justify-center shadow-doodle-sm group-hover:-rotate-3 transition-transform">
            <BookOpen className="w-5 h-5 text-stone-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-doodle text-2xl font-bold tracking-tight text-stone-900">
                DoodleLife
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-stone-100 border border-stone-800 text-stone-700">
                MVP
              </span>
            </div>
            <p className="hidden sm:block text-[11px] font-medium text-stone-500 -mt-1">
              Little Moments · Little Doodles
            </p>
          </div>
        </div>

        {/* User Badge & Actions */}
        {user && (
          <div className="flex items-center gap-3">
            {/* User Profile Pill */}
            <div 
              onClick={() => navigate('/profile')}
              className="flex items-center gap-2.5 bg-white border-2 border-stone-800 py-1.5 px-3 rounded-xl shadow-doodle-sm cursor-pointer hover:bg-stone-50 transition-colors"
            >
              <img
                src={user.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                alt={user.name}
                className="w-7 h-7 rounded-lg border border-stone-800 bg-[#fef08a] object-cover"
              />
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-stone-900 leading-tight truncate max-w-[120px]">
                  {user.name}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-stone-500 font-semibold">
                  <Sparkles className="w-2.5 h-2.5 text-amber-500" />
                  <span>Free Tier</span>
                </div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className="w-9 h-9 rounded-xl bg-white hover:bg-rose-50 text-stone-700 hover:text-rose-600 border-2 border-stone-800 flex items-center justify-center shadow-doodle-sm cursor-pointer transition-all active:translate-x-0.5 active:translate-y-0.5"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
