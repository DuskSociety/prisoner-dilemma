import { useGameStore } from '../store/gameStore';
import type { TurnResult } from '../types/game';

interface GamePageProps { emit: (event: string, data?: any) => void; }

// Card visual config
const CARD_STYLE = {
  big_joker:  { label: '合作', emoji: '🤝', bg: 'linear-gradient(135deg, #FF6B35, #FF8C5A)', text: '#fff', glow: 'glow-cooperate', glowLg: 'glow-cooperate-lg' },
  small_joker: { label: '背叛', emoji: '⚔️', bg: 'linear-gradient(135deg, #E83F6F, #F06292)', text: '#fff', glow: 'glow-betray', glowLg: 'glow-betray-lg' },
  wild:        { label: '万能', emoji: '💎', bg: 'linear-gradient(135deg, #45B7D1, #67D5E8)', text: '#fff', glow: 'glow-wild', glowLg: 'glow-wild-lg' },
};

function TurnResultDisplay({ turn, playerIndex }: { turn: TurnResult; playerIndex: number }) {
  const myGain = playerIndex === 0 ? turn.p1ScoreGain : turn.p2ScoreGain;
  const oppGain = playerIndex === 0 ? turn.p2ScoreGain : turn.p1ScoreGain;
  const myActual = playerIndex === 0 ? turn.p1Actual : turn.p2Actual;
  const oppActual = playerIndex === 0 ? turn.p2Actual : turn.p1Actual;
  const bothCooperate = myActual === 'big' && oppActual === 'big';
  const bothBetray = myActual === 'small' && oppActual === 'small';

  return (
    <div className="animate-slide-up glass-card p-5 mb-6 text-center glow-soft">
      <div className="font-body text-sm text-text-muted mb-3">第 {turn.roundIndex} 轮 · 第 {turn.turnIndex} 回合</div>
      <div className="flex items-center justify-center gap-8">
        <div className="text-center">
          <div className="font-display text-xs text-text-muted mb-1">你</div>
          <div className={`text-2xl font-mono font-bold animate-pop ${
            myGain >= 3 ? 'text-cooperate' : myGain > 0 ? 'text-text-secondary' : myGain === 0 ? 'text-text-muted' : 'text-betray'
          }`}>{myGain > 0 ? '+' : ''}{myGain}</div>
        </div>
        <div className="w-px h-10 bg-gradient-to-b from-transparent via-text-muted/30 to-transparent" />
        <div className="text-center">
          <div className="font-display text-xs text-text-muted mb-1">对手</div>
          <div className={`text-2xl font-mono font-bold ${
            oppGain >= 3 ? 'text-cooperate' : oppGain > 0 ? 'text-text-secondary' : oppGain === 0 ? 'text-text-muted' : 'text-betray'
          }`}>{oppGain > 0 ? '+' : ''}{oppGain}</div>
        </div>
      </div>
      <div className="mt-2 text-xs text-text-muted font-body">
        {bothCooperate ? '双方合作' : bothBetray ? '双方背叛' : '一方合作，一方背叛'}
      </div>
    </div>
  );
}

export function GamePage({ emit }: GamePageProps) {
  const {
    roomId, playerIndex, status, currentRound, currentTurn,
    myHand, myScore, opponent, allTurns,
    selectedCardId, hasSubmitted, opponentConfirmed,
    lastTurnResult, showingResult, roundJustEnded, winner,
    opponentVotedRematch, iVotedRematch,
  } = useGameStore();

  const selectCard = useGameStore.getState().selectCard;
  const dismissRoundSummary = useGameStore.getState().dismissRoundSummary;

  const handleSelectCard = (cardId: string) => {
    if (hasSubmitted || showingResult || roundJustEnded) return;
    selectCard(cardId === selectedCardId ? null : cardId);
  };
  const handleSubmit = () => { if (selectedCardId && !hasSubmitted) emit('submit_card', { cardId: selectedCardId }); };
  const handleRematch = () => emit('rematch');
  const handleLeave = () => { emit('leave_room'); useGameStore.getState().reset(); };

  const currentRoundTurns = allTurns.filter(t => t.roundIndex === (roundJustEnded || currentRound));

  // ── GAME ENDED ──
  if (status === 'ended') {
    const isWin = winner === playerIndex;
    const isDraw = winner === null || winner === undefined;
    const oppName = opponent?.name || '对手';
    const oppScore = opponent?.score ?? 0;

    return (
      <div className="max-w-md mx-auto animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-6xl sm:text-7xl mb-3 animate-pop drop-shadow-[0_8px_32px_rgba(255,107,53,0.20)]">
            {isWin ? '🏆' : isDraw ? '🤝' : '💔'}
          </div>
          <h1 className="font-display font-bold text-2xl text-text-primary mb-2">
            {isWin ? '你赢了！' : isDraw ? '平局！' : '你输了'}
          </h1>
          <div className="flex justify-center items-center gap-6 text-lg mt-3">
            <div>
              <div className="font-display text-sm text-text-muted">你</div>
              <div className={`font-mono font-bold text-3xl ${isWin ? 'text-cooperate' : isDraw ? 'text-text-primary' : 'text-text-secondary'}`}>{myScore}</div>
            </div>
            <div className="text-text-muted text-xl">:</div>
            <div>
              <div className="font-display text-sm text-text-muted">{oppName}</div>
              <div className={`font-mono font-bold text-3xl ${!isWin && !isDraw ? 'text-cooperate' : isDraw ? 'text-text-primary' : 'text-text-secondary'}`}>{oppScore}</div>
            </div>
          </div>
        </div>

        {[1,2,3,4,5].map(r => {
          const rts = allTurns.filter(t => t.roundIndex === r);
          if (!rts.length) return null;
          const prev = r>1 ? allTurns.filter(t => t.roundIndex===r-1).pop() : null;
          const rMy = playerIndex===0 ? rts[rts.length-1].p1TotalScore - (prev?.p1TotalScore??0) : rts[rts.length-1].p2TotalScore - (prev?.p2TotalScore??0);
          const rOp = playerIndex===0 ? rts[rts.length-1].p2TotalScore - (prev?.p2TotalScore??0) : rts[rts.length-1].p1TotalScore - (prev?.p1TotalScore??0);
          return (
            <div key={r} className="glass-card-sm p-3 mb-2 glow-soft">
              <div className="flex items-center justify-between">
                <span className="font-display font-semibold text-sm text-text-primary">第 {r} 轮</span>
                <span className="font-mono text-sm">
                  <span className={rMy>=rOp ? 'text-cooperate font-bold' : 'text-text-secondary'}>{rMy}</span>
                  <span className="text-text-muted mx-1">:</span>
                  <span className={rOp>=rMy ? 'text-cooperate font-bold' : 'text-text-secondary'}>{rOp}</span>
                </span>
              </div>
            </div>
          );
        })}

        <div className="space-y-3 mt-4">
          <button onClick={handleRematch}
            className={`w-full py-3.5 rounded-2xl font-display font-semibold text-lg transition-all ${
              iVotedRematch ? 'btn-outline' : 'btn-cooperate'
            }`}>
            {iVotedRematch ? '已投票，等待对手...' : '再来一局'}
          </button>
          {opponentVotedRematch && !iVotedRematch && <p className="text-center font-display text-sm text-cooperate">对手想要再来一局！</p>}
          <button onClick={handleLeave} className="w-full py-2.5 font-body text-sm text-text-muted hover:text-betray transition-colors">退出房间</button>
        </div>
      </div>
    );
  }

  // ── ROUND SUMMARY ──
  if (roundJustEnded) {
    const prev = allTurns.filter(t => t.roundIndex === roundJustEnded-1).pop();
    const mp = prev ? (playerIndex===0 ? prev.p1TotalScore : prev.p2TotalScore) : 0;
    const op = prev ? (playerIndex===0 ? prev.p2TotalScore : prev.p1TotalScore) : 0;
    return (
      <div className="max-w-md mx-auto animate-slide-up text-center">
        <div className="text-4xl mb-3">📊</div>
        <h1 className="font-display font-bold text-2xl text-text-primary mb-2">第 {roundJustEnded} 轮结束</h1>
        <p className="font-body text-text-secondary mb-5">手牌已重新分配，准备下一轮</p>
        <div className="glass-card p-6 mb-4 glow-soft">
          <div className="font-mono text-3xl font-bold text-text-primary mb-3">{myScore-mp} : {(opponent?.score??0)-op}</div>
          <div className="font-body text-sm text-text-muted">本轮得分 (你 : {opponent?.name})</div>
          <div className="mt-3 pt-3 border-t border-white/60 font-body text-sm text-text-secondary">
            累计总分: 你 {myScore} vs {opponent?.name} {opponent?.score}
          </div>
        </div>
        <div className="animate-pulse font-display font-semibold text-cooperate text-sm mb-4">即将进入第 {roundJustEnded+1} 轮...</div>
        <button onClick={dismissRoundSummary} className="font-body text-sm text-text-muted underline">跳过等待</button>
      </div>
    );
  }

  // ── PLAYING ──
  return (
    <div className="max-w-lg mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <div className="font-body text-text-secondary">
          房间 <span className="font-mono font-bold text-cooperate">{roomId}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="glass-card-sm px-3 py-1 rounded-full font-display font-semibold text-cooperate">第{currentRound}/5轮</span>
          <span className="glass-card-sm px-2.5 py-1 rounded-full font-display text-xs text-text-secondary">第{currentTurn}/5回合</span>
        </div>
      </div>

      {/* Opponent area */}
      <div className="glass-card p-4 mb-3 glow-soft">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-white text-lg ${
              opponent?.connected===false ? 'bg-betray' : 'bg-[#c4b5e0]'
            }`}>{opponent?.name?.[0] || '?'}</div>
            <div>
              <div className="font-display font-semibold text-text-primary flex items-center gap-2">
                {opponent?.name || '对手'}
                {opponent?.connected===false && <span className="text-xs glass-card-sm px-2 py-0.5 rounded-full font-display text-betray border-betray/30">断线中</span>}
                {opponentConfirmed && <span className="text-xs glass-card-sm px-2 py-0.5 rounded-full font-display text-cooperate border-cooperate/30">已出牌</span>}
              </div>
              <div className="font-body text-sm text-text-secondary">剩余 {opponent?.cardCount??5} 张 | 得分 {opponent?.score??0}</div>
            </div>
          </div>
          {/* Face-down cards */}
          <div className="flex gap-1">
            {Array.from({length: opponent?.cardCount??5}).map((_,i) => (
              <div key={i} className="w-5 h-8 rounded-md bg-gradient-to-br from-[#d5c8f0] to-[#c4b5e0] border border-white/40" />
            ))}
          </div>
        </div>
        {currentRoundTurns.length > 0 && (
          <div className="flex gap-1.5 mt-3 pt-3 border-t border-white/60 items-center">
            <span className="font-display text-xs text-text-muted mr-1">回合:</span>
            {Array.from({length:5}).map((_,i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${
                i < currentRoundTurns.length ? 'bg-cooperate shadow-[0_0_8px_rgba(255,107,53,0.4)]' : 'bg-[#e0d8f0]'
              }`} />
            ))}
          </div>
        )}
      </div>

      {/* Turn Result */}
      {lastTurnResult && showingResult && <TurnResultDisplay turn={lastTurnResult} playerIndex={playerIndex??0} />}

      {/* Status messages */}
      {!showingResult && !hasSubmitted && opponentConfirmed && (
        <div className="text-center py-3 mb-3 animate-pulse">
          <div className="font-display font-semibold text-cooperate">对手已出牌，请选择你的牌</div>
        </div>
      )}
      {hasSubmitted && !showingResult && (
        <div className="text-center py-3 mb-3 animate-pulse">
          <div className="font-body text-text-secondary">{opponentConfirmed ? '双方已确认...' : '已出牌，等待对手...'}</div>
        </div>
      )}
      {showingResult && (
        <div className="text-center py-2 mb-3"><div className="font-body text-sm text-text-muted animate-pulse">即将进入下一回合...</div></div>
      )}

      {/* My Score */}
      <div className="text-center mb-3">
        <span className="font-body text-sm text-text-muted">我的得分 </span>
        <span className="font-mono text-2xl font-bold text-cooperate">{myScore}</span>
      </div>

      {/* My Hand — 3:4 card ratio, gradient backgrounds, glow shadows */}
      <div className="mb-3">
        <div className="font-display text-sm text-text-secondary mb-2 text-center">选择一张牌</div>
        <div className="flex justify-center gap-2 sm:gap-3">
          {myHand.map(card => {
            const s = CARD_STYLE[card.type];
            const isSelected = card.id === selectedCardId;
            return (
              <button key={card.id} onClick={() => handleSelectCard(card.id)}
                disabled={hasSubmitted || showingResult || !!roundJustEnded}
                className={`relative w-18 sm:w-20 h-[96px] sm:h-[107px] rounded-2xl flex flex-col items-center justify-center font-display text-white transition-all duration-300 card-lift ${
                  isSelected ? `-translate-y-3 scale-105 ${s.glowLg} ring-2 ring-white/60` : s.glow
                } disabled:grayscale disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:scale-100`}
                style={{ background: s.bg }}
              >
                <span className="text-2xl sm:text-3xl drop-shadow-sm">{s.emoji}</span>
                <span className="text-xs mt-1 font-semibold">{s.label}</span>
                {card.hint && (
                  <span className="absolute -bottom-1 text-[10px] bg-white/20 backdrop-blur rounded-full px-1.5 py-0.5">
                    倾向:{card.hint==='big'?'合作':'背叛'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit */}
      <button onClick={handleSubmit}
        disabled={!selectedCardId || hasSubmitted || showingResult || !!roundJustEnded}
        className="w-full py-3.5 rounded-2xl font-display font-semibold text-lg btn-cooperate disabled:opacity-40 disabled:cursor-not-allowed">
        {hasSubmitted ? '已确认出牌' : showingResult ? '请等待...' : '确认出牌'}
      </button>

      {/* 25-dot progress */}
      <div className="flex justify-center gap-1 mt-4 flex-wrap">
        {Array.from({length:25}).map((_,i) => {
          const r = Math.floor(i/5)+1, t = (i%5)+1;
          const done = (r<currentRound)||(r===currentRound && t<currentTurn);
          const current = r===currentRound && t===currentTurn;
          return <div key={i} className={`w-2 h-2 rounded-full transition-all ${
            done ? 'bg-cooperate shadow-[0_0_6px_rgba(255,107,53,0.3)]' :
            current ? 'bg-cooperate ring-2 ring-cooperate/30 animate-pulse' : 'bg-[#e0d8f0]'
          }`} title={`第${r}轮 第${t}回合`} />;
        })}
      </div>
      <div className="text-center text-[10px] text-text-muted font-body mt-1">5轮 × 5回合</div>
    </div>
  );
}
