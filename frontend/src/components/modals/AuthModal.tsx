import React from 'react';
import { GoogleLoginBtn } from '../auth/GoogleLoginBtn';
import { EmailAuthForm } from '../auth/EmailAuthForm';
import { BookOpen } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white doodle-border-lg p-6 max-w-md w-full space-y-4 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl border-2 border-stone-800 hover:bg-stone-100 flex items-center justify-center text-stone-700 font-bold"
        >
          ✕
        </button>

        <div className="text-center pt-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-200 border-2 border-stone-900 shadow-sm mb-2 -rotate-2">
            <BookOpen className="w-6 h-6 text-stone-900" />
          </div>
          <h2 className="font-doodle text-3xl font-black text-stone-900">
            DoodleLife
          </h2>
          <p className="text-xs text-stone-500 font-medium">
            Đăng nhập để lưu giữ hành trình và sticker của bạn
          </p>
        </div>

        <div className="pt-2">
          <GoogleLoginBtn onSuccess={onClose} />
        </div>

        <div className="relative my-4 flex items-center justify-center">
          <div className="border-t-2 border-dashed border-stone-200 w-full"></div>
          <span className="bg-white px-3 text-[11px] font-bold uppercase tracking-wider text-stone-400 absolute">
            hoặc bằng email
          </span>
        </div>

        <EmailAuthForm onSuccess={onClose} />
      </div>
    </div>
  );
};
