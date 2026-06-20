import { useGameStore } from '../store/gameStore';
import type { TurnResult, CardView } from '../types/game';

interface SpectatorPageProps {
  emit: (event: string, data?: any) => void;
}

const cardConfig: Record<string, { emoji: string; color: string }> = {
  big_joker:  { emoji: '🤝', color: 'bg-red-500' },
  small_joker: { emoji: '⚔️', color: 'bg-blue-500' },
  wild:        { emoji: '💎', color: 'bg-purple-500' },
};

function HandDisplay({ hand, name }: { hand: CardView[]; name: string }) {
  return (
    <div>
      <div className="text-xs font-semibold text-text-secondary mb-2">{name}的手牌</div>
      <div className="flex gap-1.5 flex-wrap">
        {hand.map((card) => {
          const cfg = cardConfig[card.type] || { emoji: '?', color: 'bg-slate-400' };
          return (
            <div
              key={card.id}
              className={`w-10 h-14 sm:w-12 sm:h-16 rounded-lg ${cfg.color} text-white flex flex-col items-center justify-center card-shadow text-lg`}
            >
              <span>{cfg.emoji}</span>
              {card.hint && (
                <span className="text-[8px] bg-white/20 rounded-full px-1">
                  {card.hint === 'big' ? '合作' : '背叛'}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function SpectatorPage({ emit }: SpectatorPageProps) {
  const spectatorView = useGameStore(s => s.spectatorView);
  const roomId = useGameStore(s => s.roomId);
  const spectatorCount = spectatorView?.spectatorCount ?? 0;

  const handleLeave = () => {
    emit('leave_spectate');
    useGameStore.getState().setPage('home');
    useGameStore.getState().reset();
  };

  if (!spectatorView) {
    return (
      <div className="max-w-md mx-auto text-center py-12 animate-pulse">
        <div className="text-4xl mb-3">👁️</div>
        <p className="text-text-secondary">正在加载观战画面...</p>
      </div>
    );
  }

  const { status, currentRound, currentTurn, players, rounds, winner } = spectatorView;
  const p0 = players[0];
  const p1 = players[1];

  const isEnded = status === 'ended';
  const isWin = winner === 0;
  const isDraw = winner === null || winner === undefined;
  const winName = winner === 0 ? p0?.name : winner === 1 ? p1?.name : '';

  return (
    <div className="max-w-lg mx-auto animate-slide-up pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="text-text-secondary">
          房间 <span className="font-mono font-bold text-primary">{roomId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-purple-100 text-purple-600 px-2.5 py-1 rounded-full text-xs font-medium">
            👁️ 观战中
          </span>
          <span className="bg-slate-100 text-text-secondary px-2.5 py-1 rounded-full text-xs">
            {spectatorCount}/3人
          </span>
          {!isEnded && (
            <>
              <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold text-sm">
                第 {currentRound}/5 轮
              </span>
              <span className="bg-slate-100 text-text-secondary px-2.5 py-1 rounded-full text-xs font-medium">
                第 {currentTurn}/5 回合
              </span>
            </>
          )}
        </div>
      </div>

      {/* Game Ended Banner */}
      {isEnded && (
        <div className="bg-white rounded-2xl card-shadow-lg p-5 mb-4 text-center">
          <div className="text-4xl mb-2">{isDraw ? '🤝' : '🏆'}</div>
          <h2 className="text-xl font-bold text-text-primary">
            {isDraw ? '平局！' : `${winName} 获胜！`}
          </h2>
        </div>
      )}

      {/* Both Players' Hands */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {p0 && (
          <div className="bg-white rounded-2xl card-shadow p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-red-400 flex items-center justify-center text-white font-bold text-sm">
                {p0.name[0] || 'A'}
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">{p0.name}</div>
                <div className="text-xs text-text-muted">得分: {p0.score}</div>
              </div>
            </div>
            {p0.isReady && status === 'waiting' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">已准备</span>
            )}
            {p0.hasSubmitted && status === 'playing' && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">已出牌</span>
            )}
            <HandDisplay hand={p0.hand} name={p0.name} />
          </div>
        )}
        {p1 && (
          <div className="bg-white rounded-2xl card-shadow p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold text-sm">
                {p1.name[0] || 'B'}
              </div>
              <div>
                <div className="text-sm font-semibold text-text-primary">{p1.name}</div>
                <div className="text-xs text-text-muted">得分: {p1.score}</div>
              </div>
            </div>
            {p1.isReady && status === 'waiting' && (
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">已准备</span>
            )}
            {p1.hasSubmitted && status === 'playing' && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">已出牌</span>
            )}
            <HandDisplay hand={p1.hand} name={p1.name} />
          </div>
        )}
      </div>

      {/* Round History */}
      {rounds.length > 0 && (
        <div className="bg-white rounded-2xl card-shadow p-4 mb-4">
          <h3 className="text-sm font-semibold text-text-secondary mb-3">回合历史</h3>
          <div className="space-y-2">
            {[1, 2, 3, 4, 5].map(r => {
              const rTurns = rounds.filter((t: TurnResult) => t.roundIndex === r);
              if (rTurns.length === 0) return null;
              const last = rTurns[rTurns.length - 1];
              return (
                <div key={r} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm">
                  <span className="font-semibold text-text-primary">第 {r} 轮</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span>
                      {rTurns.map((t: TurnResult, i: number) => (
                        <span key={i} className="mx-0.5">
                          {t.p1Actual === 'big' ? '🤝' : '⚔️'}
                        </span>
                      ))}
                    </span>
                    <span className="font-mono text-text-secondary">
                      {last.p1TotalScore} : {last.p2TotalScore}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Latest Turn Result */}
      {!isEnded && rounds.length > 0 && (() => {
        const last = rounds[rounds.length - 1];
        return (
          <div className="bg-white rounded-2xl card-shadow p-4 mb-4 text-center animate-slide-up">
            <div className="text-xs text-text-muted mb-2">
              第 {last.roundIndex} 轮 · 第 {last.turnIndex} 回合
            </div>
            <div className="flex items-center justify-center gap-6">
              <div>
                <div className="text-xs text-text-muted mb-1">{p0?.name}</div>
                <div className={`text-xl font-bold ${last.p1ScoreGain >= 3 ? 'text-green-500' : last.p1ScoreGain > 0 ? 'text-amber-500' : 'text-text-muted'}`}>
                  +{last.p1ScoreGain}
                </div>
              </div>
              <div className="w-px h-8 bg-slate-200" />
              <div>
                <div className="text-xs text-text-muted mb-1">{p1?.name}</div>
                <div className={`text-xl font-bold ${last.p2ScoreGain >= 3 ? 'text-green-500' : last.p2ScoreGain > 0 ? 'text-amber-500' : 'text-text-muted'}`}>
                  +{last.p2ScoreGain}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Leave button */}
      <button
        onClick={handleLeave}
        className="w-full py-2.5 text-text-muted hover:text-accent transition-colors text-sm"
      >
        退出观战
      </button>
    </div>
  );
}
