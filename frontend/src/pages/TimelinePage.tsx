import React from 'react';
import { useAuth } from '../contexts/useAuth';
import { Calendar, PenTool, Sparkles, Trophy, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const getFormattedToday = () => {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Ho_Chi_Minh'
  }).format(new Date());
};

export const TimelinePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const todayStr = getFormattedToday();

  return (
    <div className="space-y-6 pb-20">
      {/* Welcome Banner */}
      <div className="doodle-box p-5 sm:p-6 bg-[#fef08a]/40 border-2 border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-stone-600 mb-1">
            <Calendar className="w-3.5 h-3.5 text-stone-700" />
            <span className="capitalize">{todayStr}</span>
          </div>
          <h1 className="font-doodle text-3xl font-bold text-stone-900 tracking-tight">
            Chào {user?.name || 'bạn'}! 👋
          </h1>
          <p className="text-xs sm:text-sm font-medium text-stone-600 mt-1">
            Hôm nay của bạn có điều gì đáng nhớ không? Ghi lại 1–2 câu nhé!
          </p>
        </div>

        <button
          onClick={() => navigate('/write')}
          className="doodle-btn bg-[#1c1917] hover:bg-stone-800 text-white border-2 border-stone-900 py-2.5 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-doodle cursor-pointer flex-shrink-0"
        >
          <PenTool className="w-4 h-4 text-[#fef08a]" />
          <span>Ghi nhật ký hôm nay</span>
        </button>
      </div>

      {/* Streak and Milestones Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="doodle-box p-3.5 bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 border-2 border-stone-800 flex items-center justify-center flex-shrink-0">
            🔥
          </div>
          <div>
            <p className="text-[11px] font-bold text-stone-500 uppercase">Chuỗi ngày</p>
            <p className="text-lg font-bold text-stone-900">1 Ngày</p>
          </div>
        </div>

        <div className="doodle-box p-3.5 bg-white flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border-2 border-stone-800 flex items-center justify-center flex-shrink-0">
            🎨
          </div>
          <div>
            <p className="text-[11px] font-bold text-stone-500 uppercase">Sticker AI</p>
            <p className="text-lg font-bold text-stone-900">0 Sticker</p>
          </div>
        </div>

        <div className="doodle-box p-3.5 bg-white col-span-2 sm:col-span-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 border-2 border-stone-800 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-sky-700" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-stone-500 uppercase">Cột mốc tiếp</p>
            <p className="text-xs font-bold text-stone-900">Mốc 3 ngày (Recap)</p>
          </div>
        </div>
      </div>

      {/* Timeline Stream Container */}
      <div className="doodle-box p-6 bg-white border-2 border-stone-800">
        <div className="flex items-center justify-between border-b-2 border-dashed border-stone-200 pb-4 mb-6">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h2 className="font-doodle text-2xl font-bold text-stone-900">
              Dòng thời gian nhật ký
            </h2>
          </div>
          <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2.5 py-1 rounded-full border border-stone-300">
            Sprint 1
          </span>
        </div>

        {/* Empty State ready for A04/A05 */}
        <div className="text-center py-10 px-4 flex flex-col items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-stone-100 border-2 border-dashed border-stone-400 flex items-center justify-center text-3xl mb-4 animate-wobble">
            📝
          </div>
          <h3 className="font-doodle text-2xl font-bold text-stone-800">
            Chưa có trang nhật ký nào!
          </h3>
          <p className="text-sm text-stone-500 max-w-sm mt-1 mb-5">
            Hãy bắt đầu viết câu đầu tiên cho ngày hôm nay. Trí tuệ nhân tạo sẽ tự động phác họa bức tranh doodle độc nhất cho riêng bạn.
          </p>
          <button
            onClick={() => navigate('/write')}
            className="doodle-btn bg-[#fef08a] hover:bg-[#fde047] text-stone-900 border-2 border-stone-900 py-2.5 px-5 rounded-xl font-bold flex items-center gap-2 shadow-doodle"
          >
            <Plus className="w-4 h-4" />
            <span>Tạo trang nhật ký đầu tiên</span>
          </button>
        </div>
      </div>
    </div>
  );
};
