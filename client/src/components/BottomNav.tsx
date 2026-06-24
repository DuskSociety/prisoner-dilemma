import { useGameStore } from '../store/gameStore';
import type { PageView } from '../types/game';

const tabs: Array<{ page: PageView; label: string; emoji: string }> = [
  { page: 'home', label: '首页', emoji: '🏠' },
  { page: 'rules', label: '规则', emoji: '📖' },
  { page: 'profile', label: '我的', emoji: '👤' },
];

export function BottomNav() {
  const page = useGameStore(s => s.page);
  const setPage = useGameStore(s => s.setPage);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-card-sm !rounded-none !border-x-0 !border-b-0 border-t border-white/60" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="max-w-4xl mx-auto flex items-center justify-around h-14">
        {tabs.map(tab => {
          const active = page === tab.page;
          return (
            <button key={tab.page} onClick={() => setPage(tab.page)}
              className={`flex flex-col items-center gap-0.5 px-6 py-1 font-display text-xs transition-all ${
                active ? 'text-cooperate scale-110' : 'text-text-muted hover:text-text-secondary'
              }`}>
              <span className="text-xl">{tab.emoji}</span>
              <span className="font-semibold">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
