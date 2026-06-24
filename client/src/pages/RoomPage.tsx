import { useGameStore } from '../store/gameStore';

interface RoomPageProps { emit: (event: string, data?: any) => void; }

export function RoomPage({ emit }: RoomPageProps) {
  const { roomId, playerIndex, isReady, opponent } = useGameStore();

  const handleToggleReady = () => emit('toggle_ready');
  const handleLeave = () => { emit('leave_room'); useGameStore.getState().reset(); };
  const handleCopy = () => { if (roomId) navigator.clipboard.writeText(roomId).catch(() => {}); };

  return (
    <div className="max-w-md mx-auto animate-slide-up">
      {/* Room code card */}
      <div className="text-center mb-6">
        <h1 className="font-display font-bold text-xl text-text-primary mb-3">房间大厅</h1>
        <div className="inline-flex items-center gap-2 glass-card p-4 glow-soft">
          <span className="font-body text-sm text-text-secondary">房间码</span>
          <span className="font-mono font-bold text-2xl text-cooperate tracking-widest">{roomId}</span>
          <button onClick={handleCopy}
            className="ml-2 px-3 py-1.5 rounded-full font-display text-xs btn-outline">
            复制
          </button>
        </div>
      </div>

      {/* Players */}
      <div className="space-y-3 mb-6">
        {/* Self */}
        <div className={`glass-card p-4 transition-all ${isReady ? 'glow-cooperate border-cooperate/30' : 'glow-soft'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-white text-lg ${
              isReady ? 'btn-cooperate !rounded-full' : 'bg-[#c4b5e0]'
            }`}>{playerIndex === 0 ? 'A' : 'B'}</div>
            <div>
              <div className="font-display font-semibold text-text-primary flex items-center gap-2">
                你
                {isReady && <span className="text-xs glass-card-sm px-2 py-0.5 rounded-full font-display text-cooperate border-cooperate/30">已准备</span>}
              </div>
              <div className="font-body text-sm text-text-secondary">持有 5 张手牌</div>
            </div>
          </div>
        </div>

        {/* Opponent */}
        <div className={`glass-card p-4 transition-all ${opponent?.isReady ? 'glow-cooperate border-cooperate/30' : 'glow-soft'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-white text-lg ${
              opponent?.isReady ? 'btn-cooperate !rounded-full' : opponent ? 'bg-[#a8b5d0]' : 'bg-[#d0d0e0]'
            }`}>{opponent ? (opponent.index === 0 ? 'A' : 'B') : '?'}</div>
            <div>
              <div className="font-display font-semibold text-text-primary flex items-center gap-2">
                {opponent ? opponent.name : '等待加入...'}
                {opponent?.connected === false && <span className="text-xs glass-card-sm px-2 py-0.5 rounded-full font-display text-betray border-betray/30">已断线</span>}
                {opponent?.isReady && <span className="text-xs glass-card-sm px-2 py-0.5 rounded-full font-display text-cooperate border-cooperate/30">已准备</span>}
              </div>
              <div className="font-body text-sm text-text-secondary">{opponent ? '持有 5 张手牌' : '等待对手加入房间'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button onClick={handleToggleReady} disabled={!opponent}
          className={`w-full py-3.5 rounded-2xl font-display font-semibold text-lg transition-all ${
            isReady ? 'btn-outline' : 'btn-cooperate'
          } disabled:opacity-40 disabled:cursor-not-allowed`}>
          {isReady ? '取消准备' : '准备'}
        </button>

        {!opponent && <p className="text-center font-body text-sm text-text-muted animate-pulse">等待对手加入...</p>}
        {opponent && !opponent.isReady && !isReady && <p className="text-center font-body text-sm text-text-secondary">点击准备开始游戏</p>}
        {opponent && isReady && !opponent.isReady && <p className="text-center font-body text-sm text-text-muted animate-pulse">等待对手准备...</p>}
        {opponent?.isReady && isReady && <p className="text-center font-display font-semibold text-sm text-cooperate animate-pulse-glow">🎉 游戏即将开始！</p>}

        <button onClick={handleLeave} className="w-full py-2.5 font-body text-sm text-text-muted hover:text-betray transition-colors">退出房间</button>
      </div>
    </div>
  );
}
