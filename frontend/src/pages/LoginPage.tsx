import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/useAuth';
import { GoogleLoginBtn } from '../components/auth/GoogleLoginBtn';
import { EmailAuthForm } from '../components/auth/EmailAuthForm';
import { BookOpen, Sparkles, Heart } from 'lucide-react';
import { DoodleLoading } from '../components/ui/DoodleLoading';

export const LoginPage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (user && !isLoading) {
      navigate(from, { replace: true });
    }
  }, [user, isLoading, navigate, from]);

  if (isLoading) {
    return <DoodleLoading message="Đang khởi tạo ứng dụng..." />;
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 bg-[#FAF9F6]">
      {/* Background Doodle Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-30">
        <div className="absolute top-10 left-10 text-4xl animate-bounce">✏️</div>
        <div className="absolute top-20 right-16 text-3xl animate-pulse">⭐</div>
        <div className="absolute bottom-16 left-20 text-3xl">☕</div>
        <div className="absolute bottom-24 right-12 text-4xl animate-wobble">🎨</div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* App Title Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#fef08a] border-2 border-stone-900 shadow-doodle mb-3 -rotate-2">
            <BookOpen className="w-8 h-8 text-stone-900" />
          </div>
          <h1 className="font-doodle text-4xl sm:text-5xl font-bold tracking-tight text-stone-900">
            DoodleLife
          </h1>
          <p className="text-sm font-semibold text-stone-600 mt-1 flex items-center justify-center gap-1.5">
            <span>Biến khoảnh khắc mỗi ngày thành sticker độc bản</span>
            <Sparkles className="w-4 h-4 text-amber-500 inline" />
          </p>
        </div>

        {/* Main Auth Box */}
        <div className="doodle-box p-6 sm:p-8 bg-white">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-stone-900 mb-1">
              Bắt đầu ghi nhật ký
            </h2>
            <p className="text-xs text-stone-500 font-medium">
              Đăng nhập bằng Google hoặc tạo tài khoản mới miễn phí
            </p>
          </div>

          {/* Google OAuth Option */}
          <GoogleLoginBtn onSuccess={() => navigate(from, { replace: true })} />

          {/* Doodle Or Divider */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="border-t-2 border-dashed border-stone-300 w-full"></div>
            <span className="bg-white px-3 text-xs font-bold uppercase tracking-wider text-stone-500 absolute">
              hoặc bằng email
            </span>
          </div>

          {/* Email / Password Option */}
          <EmailAuthForm onSuccess={() => navigate(from, { replace: true })} />
        </div>

        {/* Footer Credit */}
        <p className="text-center text-xs text-stone-400 mt-6 font-medium flex items-center justify-center gap-1">
          <span>Made with</span>
          <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
          <span>by Nhóm 2 · Final Module Rikkei Academy</span>
        </p>
      </div>
    </div>
  );
};
