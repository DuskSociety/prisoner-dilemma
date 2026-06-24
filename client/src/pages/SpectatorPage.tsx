import { useGameStore } from '../store/gameStore';
import type { TurnResult, CardView } from '../types/game';

interface SpectatorPageProps { emit: (event: string, data?: any) => void; }

const cardCfg: Record<string, { emoji: string; bg: string }> = {
  big_joker:  { emoji: '🤝', bg: 'linear-gradient(135deg, #FF6B35, #FF8C5A)' },
  small_joker: { emoji: '⚔️', bg: 'linear-gradient(135deg, #E83F6F, #F06292)' },
  wild:        { emoji: '💎', bg: 'linear-gradient(135deg, #45B7D1, #67D5E8)' },
};

function HandDisplay({ hand, name }: { hand: CardView[]; name: string }) {
  return (
    <div>
      <div className="text-xs font-display font-semibold text-text-primary mb-2">{name}的手牌</div>
      <div className="flex gap-1.5 flex-wrap">
        {hand.map(c => {
          const cfg = cardCfg[c.type] || { emoji: '?', bg: '#ccc' };
          return (
            <div key={c.id} className="w-10 h-14 sm:w-12 sm:h-16 rounded-xl flex flex-col items-center justify-center text-white font-display text-lg glow-soft"
              style={{ background: cfg.bg }}>
              <span className="drop-shadow-sm">{cfg.emoji}</span>
              {c.hint && <span className="text-[8px] bg-white/20 rounded-full px-1">{c.hint==='big'?'合作':'背叛'}</span>}
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
  const sc = spectatorView?.spectatorCount ?? 0;

  const handleLeave = () => { emit('leave_spectate'); useGameStore.getState().setPage('home'); useGameStore.getState().reset(); };

  if (!spectatorView) {
    return (
      <div className="max-w-md mx-auto text-center py-12 animate-pulse">
        <div className="text-4xl mb-3">👁️</div>
        <p className="font-body text-text-secondary">正在加载观战画面...</p>
      </div>
    );
  }

  const { status, currentRound, currentTurn, players, rounds, winner } = spectatorView;
  const p0 = players[0], p1 = players[1];
  const isEnded = status==='ended';
  const winName = winner===0 ? p0?.name : winner===1 ? p1?.name : '';

  return (
    <div className="max-w-lg mx-auto animate-slide-up pb-20">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="font-body text-text-secondary">房间 <span className="font-mono font-bold text-cooperate">{roomId}</span></div>
        <div className="flex items-center gap-1.5">
          <span className="glass-card-sm px-2.5 py-1 rounded-full text-xs font-display text-spectate border-spectate/30">👁️ 观战中</span>
          <span className="glass-card-sm px-2.5 py-1 rounded-full text-xs font-display text-text-secondary">{sc}/3人</span>
          {!isEnded && <>
            <span className="glass-card-sm px-3 py-1 rounded-full font-display font-semibold text-cooperate">第{currentRound}/5轮</span>
            <span className="glass-card-sm px-2.5 py-1 rounded-full font-display text-xs text-text-secondary">第{currentTurn}/5回合</span>
          </>}
        </div>
      </div>

      {isEnded && (
        <div className="glass-card p-5 mb-4 text-center glow-soft">
          <div className="text-4xl mb-2">{winner===null||winner===undefined ? '🤝' : '🏆'}</div>
          <h2 className="font-display font-bold text-xl text-text-primary">{winner===null||winner===undefined ? '平局！' : `${winName} 获胜！`}</h2>
        </div>
      )}

      {/* Both hands */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[p0,p1].map((p,i) => p && (
          <div key={i} className="glass-card-sm p-4 glow-soft">
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-display font-bold text-sm ${
                i===0 ? 'bg-betray' : 'bg-cooperate'
              }`}>{p.name[0]||'?'}</div>
              <div>
                <div className="font-display font-semibold text-sm text-text-primary">{p.name}</div>
                <div className="font-mono text-xs text-text-muted">得分: {p.score}</div>
              </div>
            </div>
            {p.isReady && status==='waiting' && <span className="text-xs glass-card-sm px-2 py-0.5 rounded-full font-display text-cooperate border-cooperate/30">已准备</span>}
            {p.hasSubmitted && status==='playing' && <span className="text-xs glass-card-sm px-2 py-0.5 rounded-full font-display text-text-secondary">已出牌</span>}
            <HandDisplay hand={p.hand} name={p.name} />
          </div>
        ))}
      </div>

      {/* Round History */}
      {rounds.length>0 && (
        <div className="glass-card p-4 mb-4 glow-soft">
          <h3 className="font-display font-semibold text-sm text-text-primary mb-3">回合历史</h3>
          <div className="space-y-2">
            {[1,2,3,4,5].map(r => {
              const rts = rounds.filter((t:TurnResult)=>t.roundIndex===r);
              if (!rts.length) return null;
              const last = rts[rts.length-1];
              return (
                <div key={r} className="flex items-center justify-between p-2 glass-card-sm">
                  <span className="font-display font-semibold text-sm text-text-primary">第{r}轮</span>
                  <div className="flex items-center gap-3 text-xs">
                    <span>{rts.map((t:TurnResult,j:number)=><span key={j} className="mx-0.5">{t.p1Actual==='big'?'🤝':'⚔️'}</span>)}</span>
                    <span className="font-mono text-text-secondary">{last.p1TotalScore}:{last.p2TotalScore}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isEnded && rounds.length>0 && (() => {
        const last = rounds[rounds.length-1];
        return (
          <div className="glass-card p-4 mb-4 text-center animate-slide-up glow-soft">
            <div className="font-body text-xs text-text-muted mb-2">第{last.roundIndex}轮 · 第{last.turnIndex}回合</div>
            <div className="flex items-center justify-center gap-6">
              <div>
                <div className="font-display text-xs text-text-muted mb-1">{p0?.name}</div>
                <div className={`font-mono text-xl font-bold ${last.p1ScoreGain>=3?'text-cooperate':last.p1ScoreGain>0?'text-text-secondary':'text-text-muted'}`}>+{last.p1ScoreGain}</div>
              </div>
              <div className="w-px h-8 bg-gradient-to-b from-transparent via-text-muted/30 to-transparent" />
              <div>
                <div className="font-display text-xs text-text-muted mb-1">{p1?.name}</div>
                <div className={`font-mono text-xl font-bold ${last.p2ScoreGain>=3?'text-cooperate':last.p2ScoreGain>0?'text-text-secondary':'text-text-muted'}`}>+{last.p2ScoreGain}</div>
              </div>
            </div>
          </div>
        );
      })()}

      <button onClick={handleLeave} className="w-full py-2.5 font-body text-sm text-text-muted hover:text-betray transition-colors">退出观战</button>
    </div>
  );
}
