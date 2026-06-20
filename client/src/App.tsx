import { useGameStore } from './store/gameStore';
import { useSocket } from './hooks/useSocket';
import { HomePage } from './pages/HomePage';
import { RulesPage } from './pages/RulesPage';
import { RoomPage } from './pages/RoomPage';
import { GamePage } from './pages/GamePage';
import { SpectatorPage } from './pages/SpectatorPage';
import { ProfilePage } from './pages/ProfilePage';
import { BottomNav } from './components/BottomNav';
import { ChatBox } from './components/ChatBox';
import { useProfileStore } from './store/profileStore';

export default function App() {
  const { page, setPage, status, roomId, chatMessages, isChatOpen, unreadChatCount, connected } = useGameStore();
  const { emit } = useSocket();

  const hasActiveGame = status === 'playing' || status === 'ended';
  const inRoom = page === 'room' || page === 'game' || page === 'spectate';
  const showBottomNav = !inRoom;
  const showChat = inRoom;

  const setChatOpen = useGameStore(s => s.setChatOpen);

  // Load profile from localStorage on mount
  useProfileStore.getState().loadFromStorage();

  const handleGoHome = () => {
    if (hasActiveGame) {
      setPage('game');
    } else {
      setPage('home');
    }
  };

  const isOnMainTab = page === 'home' || page === 'rules' || page === 'profile';
  const showTopTabs = isOnMainTab || page === 'spectate';

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
            <span className="hidden sm:inline">塑料好朋友</span>
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
            {showTopTabs && (
              <>
                <button
                  onClick={() => setPage('home')}
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
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className={`max-w-4xl mx-auto px-4 py-6 ${showBottomNav ? 'pb-20' : ''}`}>
        {page === 'home' && <HomePage emit={emit} />}
        {page === 'rules' && <RulesPage hasActiveGame={hasActiveGame} />}
        {page === 'room' && <RoomPage emit={emit} />}
        {page === 'game' && <GamePage emit={emit} />}
        {page === 'spectate' && <SpectatorPage emit={emit} />}
        {page === 'profile' && <ProfilePage />}
      </main>

      {/* Bottom Navigation */}
      {showBottomNav && <BottomNav />}

      {/* Chat Box */}
      {showChat && (
        <ChatBox
          emit={emit}
          messages={chatMessages}
          isOpen={isChatOpen}
          onToggle={() => setChatOpen(!isChatOpen)}
          unreadCount={unreadChatCount}
          disabled={!connected}
        />
      )}
    </div>
  );
}
