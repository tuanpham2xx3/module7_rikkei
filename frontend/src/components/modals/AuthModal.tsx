import React from 'react';
import { GoogleLoginBtn } from '../auth/GoogleLoginBtn';
import { EmailAuthForm } from '../auth/EmailAuthForm';
import { BookOpen, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white doodle-border-lg p-5 sm:p-6 max-w-[420px] w-full relative shadow-[6px_6px_0px_#18181b] max-h-[95vh] overflow-y-auto no-scrollbar">
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg border-2 border-stone-800 hover:bg-stone-100 flex items-center justify-center text-stone-800 font-bold transition cursor-pointer z-10"
          title="Đóng"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="text-center pt-1 mb-4">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-amber-200 border-2 border-stone-900 shadow-sm mb-1.5 -rotate-2">
            <BookOpen className="w-5 h-5 text-stone-900" />
          </div>
          <h2 className="font-doodle text-2xl sm:text-3xl font-black text-stone-900 leading-tight">
            DoodleLife
          </h2>
          <p className="text-[11px] text-stone-500 font-medium">
            Đăng nhập để lưu giữ hành trình và sticker của bạn
          </p>
        </div>

        <div className="mb-3">
          <GoogleLoginBtn onSuccess={onClose} />
        </div>

        <div className="relative my-3 flex items-center justify-center">
          <div className="border-t-2 border-dashed border-stone-200 w-full"></div>
          <span className="bg-white px-2.5 text-[10px] font-bold uppercase tracking-wider text-stone-400 absolute">
            hoặc bằng email
          </span>
        </div>

        <EmailAuthForm onSuccess={onClose} />
      </div>
    </div>
  );
};
