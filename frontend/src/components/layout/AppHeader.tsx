import React, { useState, useRef } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { getQuota } from '../../lib/quotaService';
import { Pencil } from 'lucide-react';

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

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 800);
  };

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await logout();
    onNavigate('landing');
  };

  return (
    <header className="h-[56px] bg-white border-b-2 border-zinc-800 px-6 flex items-center justify-between flex-shrink-0 z-20 sticky top-0 select-none">
      <div className="flex items-center gap-8">
        <div 
          onClick={() => onNavigate(user ? 'checkin' : 'landing')}
          className="flex items-center gap-2.5 cursor-pointer"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-200 border-2 border-zinc-900 flex items-center justify-center shadow-[2px_2px_0px_#000]">
            <Pencil className="w-4 h-4 text-zinc-900 stroke-[2.5]" />
          </div>
          <span className="text-xl font-black font-doodle tracking-wide text-zinc-900">
            DoodleLife
          </span>
        </div>

        {user && (
          <nav className="hidden md:flex items-center gap-2 text-sm font-bold">
            <button
              onClick={() => onNavigate('checkin')}
              className={`px-4 py-2 rounded-xl transition tracking-normal cursor-pointer ${
                activeSection === 'checkin' ? 'nav-link-active' : 'nav-link-inactive'
              }`}
            >
              Ghi chép
            </button>
            <button
              onClick={() => onNavigate('timeline')}
              className={`px-4 py-2 rounded-xl transition tracking-normal cursor-pointer ${
                activeSection === 'timeline' ? 'nav-link-active' : 'nav-link-inactive'
              }`}
            >
              Hành trình
            </button>
            <button
              onClick={() => onNavigate('recap')}
              className={`px-4 py-2 rounded-xl transition tracking-normal cursor-pointer ${
                activeSection === 'recap' ? 'nav-link-active' : 'nav-link-inactive'
              }`}
            >
              Memory Recap
            </button>
            <button
              onClick={() => onNavigate('stickers')}
              className={`px-4 py-2 rounded-xl transition tracking-normal cursor-pointer ${
                activeSection === 'stickers' ? 'nav-link-active' : 'nav-link-inactive'
              }`}
            >
              Kho Sticker
            </button>
          </nav>
        )}
      </div>

      <div className="flex items-center gap-4">
        {user ? (
          <>
            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-zinc-900">
                {user.name}
              </div>
              <div className="text-[11px] text-zinc-500 font-medium">
                Asia/Ho_Chi_Minh (UTC+7)
              </div>
            </div>

            <div
              onClick={onOpenQuotaModal}
              className={`px-3.5 py-1.5 rounded-xl border border-zinc-800 text-xs font-extrabold cursor-pointer transition shadow-sm select-none ${
                getQuota(user?.id || 'user_guest').remaining === 0
                  ? 'bg-rose-100 hover:bg-rose-200'
                  : 'bg-amber-100 hover:bg-amber-200'
              }`}
              title="Bấm để xem hạn mức tạo ảnh"
            >
              Quota: <span className={getQuota(user?.id || 'user_guest').remaining === 0 ? "text-rose-900 font-black" : "text-amber-900"}>{getQuota(user?.id || 'user_guest').remaining}/5 lượt</span>
            </div>

            <div 
              className="relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div 
                onClick={() => setIsMenuOpen((prev) => !prev)}
                className="w-8 h-8 rounded-full bg-zinc-900 text-white flex items-center justify-center font-bold text-xs shadow-sm cursor-pointer select-none ring-2 ring-zinc-800 overflow-hidden"
                title={user.name}
              >
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>

              {isMenuOpen && (
                <div 
                  className="absolute right-0 top-full mt-1.5 w-48 bg-white border-2 border-zinc-900 rounded-xl shadow-[4px_4px_0px_#000] p-2 z-50 animate-fade-in"
                >
                  <div className="px-2.5 py-1 text-xs font-bold text-zinc-900 border-b border-zinc-200 pb-1.5 mb-1 truncate">
                    {user.name}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-rose-600 font-bold hover:bg-rose-50 rounded-lg transition cursor-pointer flex items-center gap-1.5"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <button
            onClick={onOpenAuthModal}
            className="px-4 py-2 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition cursor-pointer shadow-sm doodle-btn"
          >
            Đăng nhập
          </button>
        )}
      </div>
    </header>
  );
};
