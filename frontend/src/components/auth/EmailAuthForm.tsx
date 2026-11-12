import React, { useState } from 'react';
import { useAuth } from '../../contexts/useAuth';
import { Mail, Lock, User, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface EmailAuthFormProps {
  onSuccess?: () => void;
}

export const EmailAuthForm: React.FC<EmailAuthFormProps> = ({ onSuccess }) => {
  const { loginWithEmail, registerWithEmail, error, clearError } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [clientError, setClientError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setClientError(null);
    clearError();
    setSuccessMsg(null);
  };

  const validate = (): boolean => {
    if (!email.trim()) {
      setClientError('Vui lòng nhập địa chỉ email.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setClientError('Định dạng email chưa hợp lệ.');
      return false;
    }
    if (!password) {
      setClientError('Vui lòng nhập mật khẩu.');
      return false;
    }
    if (password.length < 6) {
      setClientError('Mật khẩu cần tối thiểu 6 ký tự.');
      return false;
    }
    if (mode === 'register') {
      if (!name.trim()) {
        setClientError('Vui lòng nhập họ tên hoặc nickname.');
        return false;
      }
      if (password !== confirmPassword) {
        setClientError('Xác nhận mật khẩu không trùng khớp.');
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientError(null);
    clearError();

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      if (mode === 'login') {
        const res = await loginWithEmail(email, password);
        if (res.success && onSuccess) {
          onSuccess();
        }
      } else {
        const res = await registerWithEmail(name, email, password);
        if (res.success) {
          setSuccessMsg('Đăng ký thành công!');
          if (onSuccess) {
            setTimeout(onSuccess, 600);
          }
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <div className="flex bg-stone-100 p-1 rounded-xl border-2 border-stone-800 mb-3">
        <button
          type="button"
          onClick={() => switchMode('login')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            mode === 'login'
              ? 'bg-[#1c1917] text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Đăng nhập
        </button>
        <button
          type="button"
          onClick={() => switchMode('register')}
          className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
            mode === 'register'
              ? 'bg-[#1c1917] text-white shadow-sm'
              : 'text-stone-600 hover:text-stone-900'
          }`}
        >
          Đăng ký mới
        </button>
      </div>

      {(clientError || error) && (
        <div className="mb-3 p-2.5 bg-rose-50 border-2 border-rose-800 rounded-xl flex items-start gap-2 text-rose-900 text-xs font-medium">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600 mt-0.5" />
          <span>{clientError || error}</span>
        </div>
      )}

      {successMsg && (
        <div className="mb-3 p-2.5 bg-emerald-50 border-2 border-emerald-800 rounded-xl flex items-start gap-2 text-emerald-900 text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-2.5">
        {mode === 'register' && (
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
              Họ tên hoặc Nickname
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ví dụ: Chí Nhân"
                className="w-full pl-9 pr-3 py-2 bg-white border-2 border-stone-800 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#fef08a] transition-all font-medium text-xs"
              />
            </div>
          </div>
        )}

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
            Địa chỉ Email
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tenban@gmail.com"
              className="w-full pl-9 pr-3 py-2 bg-white border-2 border-stone-800 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#fef08a] transition-all font-medium text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
            Mật khẩu {mode === 'register' && <span className="text-stone-400 normal-case">(≥ 6 ký tự)</span>}
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-9 pr-3 py-2 bg-white border-2 border-stone-800 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#fef08a] transition-all font-medium text-xs"
            />
          </div>
        </div>

        {mode === 'register' && (
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-stone-700 mb-1">
              Xác nhận mật khẩu
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-white border-2 border-stone-800 rounded-xl text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#fef08a] transition-all font-medium text-xs"
              />
            </div>
          </div>
        )}

        {mode === 'login' && (
          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-stone-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border border-stone-800 text-[#1c1917] accent-stone-900"
              />
              Ghi nhớ đăng nhập
            </label>
            <span className="text-stone-500 hover:text-stone-900 cursor-pointer font-medium">
              Quên mật khẩu?
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="doodle-btn w-full bg-[#fef08a] hover:bg-[#fde047] text-stone-900 border-2 border-stone-900 py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all mt-3 cursor-pointer text-xs"
        >
          <span>
            {isSubmitting
              ? 'Đang xử lý...'
              : mode === 'login'
              ? 'Vào sổ nhật ký'
              : 'Tạo tài khoản'}
          </span>
          <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </form>
    </div>
  );
};
