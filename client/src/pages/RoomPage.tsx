import { useGameStore } from '../store/gameStore';

interface RoomPageProps {
  emit: (event: string, data?: any) => void;
}

export function RoomPage({ emit }: RoomPageProps) {
  const { roomId, playerIndex, isReady, opponent } = useGameStore();

  const handleToggleReady = () => {
    emit('toggle_ready');
  };

  const handleLeave = () => {
    emit('leave_room');
    useGameStore.getState().reset();
  };

  const handleCopyCode = () => {
    if (roomId) {
      navigator.clipboard.writeText(roomId).catch(() => {});
    }
  };

  const playerLabel = playerIndex === 0 ? '玩家A' : '玩家B';

  return (
    <div className="max-w-md mx-auto animate-slide-up">
      {/* Room Header */}
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-text-primary mb-2">房间大厅</h1>
        <div className="inline-flex items-center gap-2 bg-white rounded-xl card-shadow px-5 py-3">
          <span className="text-sm text-text-secondary">房间码</span>
          <span className="text-2xl font-bold text-primary tracking-widest font-mono">
            {roomId}
          </span>
          <button
            onClick={handleCopyCode}
            className="ml-2 px-3 py-1 text-xs bg-surface-alt hover:bg-slate-200 rounded-lg transition-colors text-text-secondary"
          >
            复制
          </button>
        </div>
        <p className="text-sm text-text-muted mt-2">
          将房间码分享给好友即可加入对战
        </p>
      </div>

      {/* Players */}
      <div className="space-y-3 mb-6">
        {/* Self */}
        <div className={`bg-white rounded-2xl card-shadow p-4 border-2 transition-colors ${
          isReady ? 'border-green-400' : 'border-transparent'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                isReady ? 'bg-green-500' : 'bg-primary'
              }`}>
                {playerLabel}
              </div>
              <div>
                <div className="font-semibold text-text-primary flex items-center gap-2">
                  你
                  {isReady && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      已准备
                    </span>
                  )}
                </div>
                <div className="text-sm text-text-secondary">持有 5 张手牌</div>
              </div>
            </div>
          </div>
        </div>

        {/* Opponent */}
        <div className={`bg-white rounded-2xl card-shadow p-4 border-2 transition-colors ${
          opponent?.isReady ? 'border-green-400' : 'border-transparent'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                opponent?.isReady ? 'bg-green-500' : 'bg-slate-400'
              }`}>
                {opponent ? (opponent.index === 0 ? 'A' : 'B') : '?'}
              </div>
              <div>
                <div className="font-semibold text-text-primary flex items-center gap-2">
                  {opponent ? opponent.name : '等待加入...'}
                  {opponent?.connected === false && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium">
                      已断线
                    </span>
                  )}
                  {opponent?.isReady && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      已准备
                    </span>
                  )}
                </div>
                <div className="text-sm text-text-secondary">
                  {opponent ? '持有 5 张手牌' : '等待对手加入房间'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          onClick={handleToggleReady}
          disabled={!opponent}
          className={`w-full py-3.5 rounded-xl font-semibold text-lg transition-all card-shadow ${
            isReady
              ? 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'
              : 'bg-primary text-white hover:bg-primary-dark'
          } disabled:opacity-40 disabled:cursor-not-allowed`}
        >
          {isReady ? '取消准备' : '准备'}
        </button>

        {!opponent && (
          <p className="text-center text-sm text-text-muted animate-pulse">
            等待对手加入...
          </p>
        )}

        {opponent && !opponent.isReady && !isReady && (
          <p className="text-center text-sm text-text-muted">
            点击准备开始游戏
          </p>
        )}

        {opponent && isReady && !opponent.isReady && (
          <p className="text-center text-sm text-text-muted animate-pulse">
            等待对手准备...
          </p>
        )}

        {opponent?.isReady && isReady && (
          <p className="text-center text-sm text-green-600 font-medium">
            游戏即将开始！
          </p>
        )}

        <button
          onClick={handleLeave}
          className="w-full py-2.5 text-text-muted hover:text-accent transition-colors text-sm"
        >
          退出房间
        </button>
      </div>
    </div>
  );
}
