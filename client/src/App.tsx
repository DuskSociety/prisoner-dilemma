import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks/useSocket';
import { HomePage } from './pages/HomePage';
import { RulesPage } from './pages/RulesPage';
import { RoomPage } from './pages/RoomPage';
import { GamePage } from './pages/GamePage';

export default function App() {
  const { page, setPage, status, roomId } = useGameStore();
  const { emit } = useSocket();

  const hasActiveGame = status === 'playing' || status === 'ended';
  const hasSession = !!roomId;

  const handleGoHome = () => {
    if (hasActiveGame) {
      // If in a game, go back to game instead of home
      setPage('game');
    } else {
      setPage('home');
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={handleGoHome}
            className="text-lg font-bold text-primary hover:text-primary-dark transition-colors flex items-center gap-2"
          >
            <span className="text-2xl">🃏</span>
            <span className="hidden sm:inline">囚徒博弈：对决</span>
          </button>
          <div className="flex gap-1 items-center">
            {hasActiveGame && (
              <button
                onClick={() => setPage('game')}
                className="px-3 py-1.5 rounded-lg text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                返回游戏
              </button>
            )}
            <button
              onClick={() => setPage(hasActiveGame ? 'game' : 'home')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                page === 'home' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              首页
            </button>
            <button
              onClick={() => setPage('rules')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                page === 'rules' ? 'bg-primary/10 text-primary' : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              规则
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {page === 'home' && <HomePage emit={emit} />}
        {page === 'rules' && <RulesPage hasActiveGame={hasActiveGame} />}
        {page === 'room' && <RoomPage emit={emit} />}
        {page === 'game' && <GamePage emit={emit} />}
      </main>
    </div>
  );
}
