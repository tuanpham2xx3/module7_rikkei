import React from 'react';
import { useAuth } from '../../contexts/useAuth';

export type ActiveSection = 'landing' | 'checkin' | 'timeline' | 'recap' | 'stickers';

interface AppHeaderProps {
  activeSection: ActiveSection;
  onNavigate: (section: ActiveSection) => void;
  onOpenQuotaModal: () => void;
  onOpenAuthModal: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  activeSection,
  onNavigate,
  onOpenQuotaModal,
  onOpenAuthModal
}) => {
  const { user, logout } = useAuth();

  return (
    <header className="h-[56px] bg-white border-b-2 border-zinc-800 px-4 lg:px-6 flex items-center justify-between flex-shrink-0 z-20 sticky top-0">
      {/* Left: Brand Logo & Navigation Links */}
      <div className="flex items-center gap-4 lg:gap-8">
        {/* Logo: Icon bút chì đặc trưng của DoodleLife */}
        <div 
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-200 border-2 border-zinc-900 flex items-center justify-center font-black text-base shadow-[2px_2px_0px_#000] group-hover:-rotate-3 transition-transform">
            ✏️
          </div>
          <span className="text-xl font-black font-doodle tracking-wide text-zinc-900">
            DoodleLife
          </span>
        </div>

        {/* Main Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1.5 lg:gap-2 text-xs lg:text-sm font-bold">
          <button
            onClick={() => onNavigate('landing')}
            className={`px-3 lg:px-4 py-2 rounded-xl transition tracking-normal cursor-pointer ${
              activeSection === 'landing' ? 'nav-link-active' : 'nav-link-inactive'
            }`}
          >
            Giới thiệu
          </button>
          <button
            onClick={() => onNavigate('checkin')}
            className={`px-3 lg:px-4 py-2 rounded-xl transition tracking-normal cursor-pointer ${
              activeSection === 'checkin' ? 'nav-link-active' : 'nav-link-inactive'
            }`}
          >
            Ghi chép
          </button>
          <button
            onClick={() => onNavigate('timeline')}
            className={`px-3 lg:px-4 py-2 rounded-xl transition tracking-normal cursor-pointer ${
              activeSection === 'timeline' ? 'nav-link-active' : 'nav-link-inactive'
            }`}
          >
            Hành trình
          </button>
          <button
            onClick={() => onNavigate('recap')}
            className={`px-3 lg:px-4 py-2 rounded-xl transition tracking-normal cursor-pointer ${
              activeSection === 'recap' ? 'nav-link-active' : 'nav-link-inactive'
            }`}
          >
            Memory Recap
          </button>
          <button
            onClick={() => onNavigate('stickers')}
            className={`px-3 lg:px-4 py-2 rounded-xl transition tracking-normal cursor-pointer ${
              activeSection === 'stickers' ? 'nav-link-active' : 'nav-link-inactive'
            }`}
          >
            Kho Sticker
          </button>
        </nav>
      </div>

      {/* Right: User Information & Action Badges */}
      <div className="flex items-center gap-3 lg:gap-4">
        {/* User Info */}
        <div className="text-right hidden sm:block">
          <div className="text-xs font-bold text-zinc-900 truncate max-w-[140px]">
            {user ? user.name : 'Bùi Phạm Chí Nhân'}
          </div>
          <div className="text-[11px] text-zinc-500 font-medium">
            Asia/Ho_Chi_Minh (UTC+7)
          </div>
        </div>

        {/* Quota Counter Pill */}
        <div
          onClick={onOpenQuotaModal}
          className="px-3 py-1.5 rounded-xl bg-amber-100 border border-zinc-800 text-xs font-extrabold cursor-pointer hover:bg-amber-200 transition shadow-sm select-none"
          title="Bấm để xem hạn mức tạo ảnh"
        >
          Quota: <span className="text-amber-900">4/5 lượt</span>
        </div>

        {/* User Avatar & Auth State */}
        {user ? (
          <div className="relative group">
            <div 
              className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer select-none"
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </div>
            {/* Quick dropdown menu for logged in user */}
            <div className="absolute right-0 top-full mt-2 w-44 bg-white border-2 border-zinc-900 rounded-xl shadow-doodle p-2 hidden group-hover:block z-50">
              <div className="px-2 py-1 text-xs font-bold text-zinc-900 border-b border-zinc-200 pb-1 mb-1 truncate">
                {user.name}
              </div>
              <button
                onClick={() => logout()}
                className="w-full text-left px-2 py-1 text-xs text-rose-600 font-bold hover:bg-rose-50 rounded-lg transition"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="px-3.5 py-1.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition cursor-pointer shadow-sm"
          >
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
};
