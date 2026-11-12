import React, { useState, useRef } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Sparkles, RotateCcw, Lightbulb } from 'lucide-react';
import type { JournalEntry, JournalMood } from '../../types/journal';
import { getJournalDraft, saveJournalDraft, clearJournalDraft, createJournalEntry } from '../../lib/journalService';

interface JournalFormProps {
  userId: string;
  onSuccess?: (entry: JournalEntry) => void;
}

const MOODS: JournalMood[] = ['Vui vẻ', 'Bình yên', 'Bận rộn', 'Mệt mỏi'];

const WRITING_PROMPTS = [
  'Hôm nay mình vừa hoàn thành một việc quan trọng...',
  'Đi dạo ngắm hoàng hôn, tâm trạng nhẹ nhõm thật...',
  'Uống tách trà ấm nhìn mưa rơi tí tách ngoài hiên...',
  'Gặp lại bạn cũ, cùng ôn lại bao kỷ niệm vui...',
  'Thử nấu món mới và thành công ngoài mong đợi...',
  'Một ngày bận rộn nhưng gặt hái kết quả xứng đáng...'
];

export const JournalForm: React.FC<JournalFormProps> = ({ userId, onSuccess }) => {
  const initialDraft = getJournalDraft(userId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [content, setContent] = useState(initialDraft?.content || '');
  const [mood, setMood] = useState<JournalMood>(initialDraft?.mood || 'Vui vẻ');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [draftNotice, setDraftNotice] = useState<string | null>(
    initialDraft?.content ? 'Đã khôi phục bản nháp chưa lưu trong phiên làm việc của bạn.' : null
  );
  const [savedEntry, setSavedEntry] = useState<JournalEntry | null>(null);

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value.slice(0, 300);
    setContent(val);
    if (fieldError) setFieldError(null);
    if (networkError) setNetworkError(null);
    if (draftNotice) setDraftNotice(null);

    saveJournalDraft(userId, { content: val, mood });
  };

  const handleMoodSelect = (selectedMood: JournalMood) => {
    setMood(selectedMood);
    saveJournalDraft(userId, { content, mood: selectedMood });
  };

  const handleSelectPrompt = (promptText: string) => {
    let nextContent = '';
    if (!content.trim()) {
      nextContent = promptText;
    } else {
      nextContent = `${content.trim()} ${promptText}`.slice(0, 300);
    }
    setContent(nextContent);
    if (fieldError) setFieldError(null);
    if (networkError) setNetworkError(null);
    saveJournalDraft(userId, { content: nextContent, mood });
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmed = content.trim();
    if (trimmed.length < 1) {
      setFieldError('Nội dung nhật ký không được để trống (nhập ít nhất 1 ký tự).');
      return;
    }

    if (trimmed.length > 300) {
      setFieldError(`Nội dung vượt quá 300 ký tự cho phép (hiện tại: ${trimmed.length} ký tự).`);
      return;
    }

    setFieldError(null);
    setNetworkError(null);
    setIsSubmitting(true);

    try {
      const res = await createJournalEntry(userId, {
        content: trimmed,
        mood
      });

      if (!res.success || !res.entry) {
        setNetworkError(res.error || 'Lỗi khi lưu nhật ký. Bản nháp đã được lưu trong phiên để bạn gửi lại.');
        return;
      }

      setSavedEntry(res.entry);
      clearJournalDraft(userId);
      setContent('');

      if (onSuccess) {
        setTimeout(() => {
          onSuccess(res.entry!);
        }, 1200);
      }
    } catch {
      setNetworkError('Lỗi kết nối. Bản nháp đã được giữ lại trong phiên làm việc của bạn.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const trimmedLength = content.trim().length;

  return (
    <div className="bg-white doodle-border-lg p-5 sm:p-6 space-y-4 shadow-sm select-none">
      {draftNotice && (
        <div className="p-3 bg-amber-50 border-2 border-amber-800 rounded-xl flex items-center justify-between text-xs text-amber-900 font-semibold animate-fade-in">
          <div className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4 text-amber-700 flex-shrink-0" />
            <span>{draftNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              clearJournalDraft(userId);
              setContent('');
              setDraftNotice(null);
            }}
            className="text-amber-800 hover:text-amber-950 underline text-xs cursor-pointer ml-2"
          >
            Xóa nháp
          </button>
        </div>
      )}

      {savedEntry && (
        <div className="p-3 bg-emerald-50 border-2 border-emerald-800 rounded-xl flex items-start gap-2.5 text-xs text-emerald-900 font-semibold animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <div>Đã lưu thành công nhật ký #{savedEntry.id.slice(0, 8)}!</div>
            <div className="text-[11px] text-emerald-700 font-medium">
              Tâm trạng: <span className="font-bold">{savedEntry.mood}</span> | Số ký tự: {savedEntry.char_count}/300
            </div>
          </div>
        </div>
      )}

      {networkError && (
        <div className="p-3 bg-rose-50 border-2 border-rose-800 rounded-xl flex items-start gap-2 text-xs text-rose-900 font-semibold animate-fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <span>{networkError}</span>
            <div className="mt-1.5">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-2.5 py-1 bg-rose-800 text-white rounded-lg text-[11px] font-bold hover:bg-rose-900 transition cursor-pointer"
              >
                Thử gửi lại
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="flex justify-between items-center text-xs font-bold text-zinc-700">
          <label htmlFor="journal-content-input" className="tracking-wide">
            Nhập tâm sự khoảnh khắc ngắn:
          </label>
          <span
            className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
              trimmedLength > 280
                ? 'text-rose-600 bg-rose-50'
                : trimmedLength > 0
                ? 'text-zinc-700 bg-zinc-100'
                : 'text-zinc-400'
            }`}
          >
            {trimmedLength}/300 ký tự
          </span>
        </div>

        <div>
          <textarea
            ref={textareaRef}
            id="journal-content-input"
            value={content}
            onChange={handleContentChange}
            rows={3}
            disabled={isSubmitting}
            className={`w-full p-3.5 text-sm rounded-xl border-2 bg-[#fdfdfd] focus:outline-none focus:bg-white resize-none font-medium transition-colors ${
              fieldError
                ? 'border-rose-600 focus:border-rose-700 ring-1 ring-rose-200'
                : 'border-zinc-800 focus:border-zinc-950'
            } ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            placeholder="Nhập câu ngắn (1 - 300 ký tự)... Ví dụ: Vừa đi dạo mát về, không khí tối nay mát mẻ và sảng khoái thật!"
          />

          {fieldError && (
            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-rose-600 font-bold animate-fade-in">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{fieldError}</span>
            </div>
          )}

          {/* Quick writing prompts (AX1) */}
          <div className="mt-3 pt-3 border-t border-zinc-100 space-y-1.5">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-zinc-600">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
              <span>Chưa biết bắt đầu? Nhấp gợi ý để chèn/nối thêm mà không ghi đè dữ liệu:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {WRITING_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleSelectPrompt(prompt)}
                  className="px-2.5 py-1 text-xs bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg transition-colors cursor-pointer text-left font-medium active:scale-95 disabled:opacity-50"
                  title="Nhấp để chèn hoặc nối vào nhật ký"
                >
                  ✦ {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-zinc-100">
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-700">
            <span>Tâm trạng:</span>
            <div className="flex gap-1.5">
              {MOODS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleMoodSelect(m)}
                  disabled={isSubmitting}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mood === m
                      ? 'border-2 border-zinc-800 bg-amber-100 text-zinc-900 shadow-sm'
                      : 'border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-600 font-medium'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || trimmedLength === 0}
            className={`px-5 py-2.5 bg-zinc-900 text-white doodle-btn rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              isSubmitting || trimmedLength === 0
                ? 'opacity-60 cursor-not-allowed shadow-none'
                : 'cursor-pointer hover:bg-zinc-800 shadow-sm'
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Đang lưu nhật ký...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lưu & Tạo Sticker Doodle</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
