import { useToastStore } from '../store/toastStore';
import type { ToastType } from '../store/toastStore';

const typeStyles: Record<ToastType, { bg: string; text: string }> = {
  cooperate: { bg: 'btn-cooperate', text: 'text-white' },
  betray:    { bg: 'btn-betray', text: 'text-white' },
  spectate:  { bg: 'btn-spectate', text: 'text-white' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`pointer-events-auto px-4 py-2.5 rounded-2xl font-display font-semibold text-sm animate-slide-up flex items-center gap-2 ${typeStyles[t.type].bg}`}>
          <span className={typeStyles[t.type].text}>{t.text}</span>
          <button onClick={() => removeToast(t.id)} className="opacity-60 hover:opacity-100 transition-opacity ml-1" aria-label="关闭通知">✕</button>
        </div>
      ))}
    </div>
  );
}
