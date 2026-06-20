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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-md border-t border-slate-200 safe-area-bottom">
      <div className="max-w-4xl mx-auto flex items-center justify-around h-14">
        {tabs.map(tab => {
          const active = page === tab.page;
          return (
            <button
              key={tab.page}
              onClick={() => setPage(tab.page)}
              className={`flex flex-col items-center gap-0.5 px-6 py-1 transition-colors ${
                active ? 'text-primary' : 'text-text-muted hover:text-text-secondary'
              }`}
            >
              <span className="text-xl">{tab.emoji}</span>
              <span className={`text-[10px] font-medium ${active ? 'text-primary' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
