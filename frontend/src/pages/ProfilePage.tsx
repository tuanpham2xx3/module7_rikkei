import React from 'react';
import { useAuth } from '../contexts/useAuth';
import { Mail, ShieldCheck, Calendar, LogOut, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formattedDate = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('vi-VN', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      })
    : 'Hôm nay';

  return (
    <div className="space-y-6 max-w-xl mx-auto pb-20">
      {/* Profile Card */}
      <div className="doodle-box p-6 bg-white border-2 border-stone-800">
        <div className="flex flex-col sm:flex-row items-center gap-5 border-b-2 border-dashed border-stone-200 pb-6 mb-6 text-center sm:text-left">
          <img
            src={user?.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.id}`}
            alt={user?.name}
            className="w-20 h-20 rounded-2xl border-2 border-stone-800 bg-[#fef08a] shadow-doodle-sm object-cover"
          />
          <div className="space-y-1">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <h1 className="font-doodle text-3xl font-bold text-stone-900">
                {user?.name}
              </h1>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-800 text-emerald-800">
                Đang hoạt động
              </span>
            </div>
            <p className="text-xs text-stone-500 font-medium flex items-center justify-center sm:justify-start gap-1.5">
              <Mail className="w-3.5 h-3.5" />
              <span>{user?.email}</span>
            </p>
          </div>
        </div>

        {/* Account Details Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
            <span className="font-bold text-stone-600 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-stone-700" />
              Phương thức xác thực
            </span>
            <span className="font-bold uppercase text-stone-900 bg-white px-2 py-0.5 rounded-md border border-stone-300">
              {user?.provider === 'google' ? 'Google OAuth' : 'Email & Mật khẩu'}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
            <span className="font-bold text-stone-600 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-stone-700" />
              Ngày tham gia
            </span>
            <span className="font-bold text-stone-900">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center justify-between p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs">
            <span className="font-bold text-stone-600 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Gói tài khoản
            </span>
            <span className="font-bold text-stone-900 bg-[#fef08a] px-2 py-0.5 rounded-md border border-stone-800">
              Free Tier (1 nhật ký/ngày)
            </span>
          </div>
        </div>

        {/* Logout Button */}
        <div className="pt-6">
          <button
            onClick={handleLogout}
            className="doodle-btn w-full bg-white hover:bg-rose-50 text-rose-600 border-2 border-stone-800 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-doodle transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Đăng xuất khỏi thiết bị</span>
          </button>
        </div>
      </div>

      {/* Project Info Card */}
      <div className="doodle-box p-4 bg-stone-100 border-2 border-stone-800 text-center">
        <p className="text-xs text-stone-600 font-medium">
          DoodleLife v1.0.0 · Đồ án tốt nghiệp Final Module Rikkei
        </p>
        <p className="text-[11px] text-stone-500 mt-1 flex items-center justify-center gap-1">
          <span>Nhóm 2: Bùi Phạm Chí Nhân · Anh Tuấn · Anh Tiến</span>
        </p>
      </div>
    </div>
  );
};
