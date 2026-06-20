import { useGameStore } from '../store/gameStore';
import type { TurnResult } from '../types/game';
import { ChatBox } from '../components/ChatBox';

interface GamePageProps {
  emit: (event: string, data?: any) => void;
}

const cardConfig = {
  big_joker:  { label: '', color: 'bg-red-500', ring: 'ring-red-400', bg: 'bg-red-50', text: 'text-red-700', emoji: '🤝', hint: '合作' },
  small_joker: { label: '', color: 'bg-blue-500', ring: 'ring-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', emoji: '⚔️', hint: '背叛' },
  wild:        { label: '万能', color: 'bg-purple-500', ring: 'ring-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', emoji: '💎' },
};

function getActualLabel(a: string) { return a === 'big' ? '🤝 合作' : '⚔️ 背叛'; }
function getActualColor(a: string) { return a === 'big' ? 'text-red-600' : 'text-blue-600'; }

function TurnResultDisplay({ turn, playerIndex }: { turn: TurnResult; playerIndex: number }) {
  const myGain = playerIndex === 0 ? turn.p1ScoreGain : turn.p2ScoreGain;
  const oppGain = playerIndex === 0 ? turn.p2ScoreGain : turn.p1ScoreGain;
  // Determine outcome type (hidden from player, but colors hint at result)
  const myActual = playerIndex === 0 ? turn.p1Actual : turn.p2Actual;
  const oppActual = playerIndex === 0 ? turn.p2Actual : turn.p1Actual;
  const bothCooperate = myActual === 'big' && oppActual === 'big';
  const bothBetray = myActual === 'small' && oppActual === 'small';

  return (
    <div className="animate-slide-up bg-white rounded-2xl card-shadow-lg p-5 mb-6 text-center">
      <div className="text-sm text-text-muted mb-3">
        第 {turn.roundIndex} 轮 · 第 {turn.turnIndex} 回合
      </div>
      <div className="flex items-center justify-center gap-8">
        <div className="text-center">
          <div className="text-xs text-text-muted mb-1">你</div>
          <div className={`text-2xl font-bold animate-score-pop ${
            myGain >= 3 ? 'text-green-500' : myGain > 0 ? 'text-amber-500' : myGain === 0 ? 'text-text-muted' : 'text-red-400'
          }`}>
            {myGain > 0 ? '+' : ''}{myGain}
          </div>
        </div>
        <div className="w-px h-10 bg-slate-200" />
        <div className="text-center">
          <div className="text-xs text-text-muted mb-1">对手</div>
          <div className={`text-2xl font-bold ${
            oppGain >= 3 ? 'text-green-500' : oppGain > 0 ? 'text-amber-500' : oppGain === 0 ? 'text-text-muted' : 'text-red-400'
          }`}>
            {oppGain > 0 ? '+' : ''}{oppGain}
          </div>
        </div>
      </div>
      <div className="mt-2 text-xs text-text-muted">
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
    chatMessages, isChatOpen, unreadChatCount,
  } = useGameStore();

  const selectCard = useGameStore.getState().selectCard;
  const dismissRoundSummary = useGameStore.getState().dismissRoundSummary;

  const handleSelectCard = (cardId: string) => {
    if (hasSubmitted || showingResult || roundJustEnded) return;
    selectCard(cardId === selectedCardId ? null : cardId);
  };

  const handleSubmit = () => {
    if (!selectedCardId || hasSubmitted) return;
    emit('submit_card', { cardId: selectedCardId });
  };

  const handleRematch = () => emit('rematch');
  const handleLeave = () => { emit('leave_room'); useGameStore.getState().reset(); };

  // Current round's turns
  const currentRoundTurns = allTurns.filter(t => t.roundIndex === (roundJustEnded || currentRound));

  // === GAME ENDED ===
  if (status === 'ended') {
    const isWin = winner === playerIndex;
    const isDraw = winner === null || winner === undefined;
    const oppName = opponent?.name || '对手';
    const oppScore = opponent?.score ?? 0;

    return (
      <div className="max-w-md mx-auto animate-slide-up">
        <div className="text-center mb-6">
          <div className="text-5xl mb-3">{isWin ? '🏆' : isDraw ? '🤝' : '💔'}</div>
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            {isWin ? '你赢了！' : isDraw ? '平局！' : '你输了'}
          </h1>
          <div className="flex justify-center items-center gap-6 text-lg mt-3">
            <div>
              <div className="text-sm text-text-muted">你</div>
              <div className={`font-bold text-3xl ${isWin ? 'text-green-600' : isDraw ? 'text-text-primary' : 'text-text-secondary'}`}>{myScore}</div>
            </div>
            <div className="text-text-muted text-xl">:</div>
            <div>
              <div className="text-sm text-text-muted">{oppName}</div>
              <div className={`font-bold text-3xl ${!isWin && !isDraw ? 'text-green-600' : isDraw ? 'text-text-primary' : 'text-text-secondary'}`}>{oppScore}</div>
            </div>
          </div>
        </div>

        {/* Round-by-round summary (scores only, no card history) */}
        {[1, 2, 3, 4, 5].map(r => {
          const roundTurns = allTurns.filter(t => t.roundIndex === r);
          if (roundTurns.length === 0) return null;
          const prev = r > 1 ? allTurns.filter(t => t.roundIndex === r - 1).pop() : null;
          const rMyScore = playerIndex === 0
            ? roundTurns[roundTurns.length - 1].p1TotalScore - (prev?.p1TotalScore ?? 0)
            : roundTurns[roundTurns.length - 1].p2TotalScore - (prev?.p2TotalScore ?? 0);
          const rOppScore = playerIndex === 0
            ? roundTurns[roundTurns.length - 1].p2TotalScore - (prev?.p2TotalScore ?? 0)
            : roundTurns[roundTurns.length - 1].p1TotalScore - (prev?.p1TotalScore ?? 0);

          return (
            <div key={r} className="bg-white rounded-xl card-shadow p-3 mb-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">第 {r} 轮</span>
                <span className="text-sm font-mono">
                  <span className={rMyScore >= rOppScore ? 'text-green-600 font-bold' : 'text-text-secondary'}>
                    {rMyScore}
                  </span>
                  <span className="text-text-muted mx-1">:</span>
                  <span className={rOppScore >= rMyScore ? 'text-green-600 font-bold' : 'text-text-secondary'}>
                    {rOppScore}
                  </span>
                </span>
              </div>
            </div>
          );
        })}

        <div className="space-y-3 mt-4">
          <button onClick={handleRematch} className={`w-full py-3.5 rounded-xl font-semibold text-lg transition-all card-shadow ${
            iVotedRematch ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-primary text-white hover:bg-primary-dark'
          }`}>
            {iVotedRematch ? '已投票，等待对手...' : '再来一局'}
          </button>
          {opponentVotedRematch && !iVotedRematch && (
            <p className="text-center text-sm text-primary font-medium">对手想要再来一局！</p>
          )}
          <button onClick={handleLeave} className="w-full py-2.5 text-text-muted hover:text-accent transition-colors text-sm">退出房间</button>
        </div>
      </div>
    );
  }

  // === ROUND SUMMARY OVERLAY ===
  if (roundJustEnded) {
    // Calculate this round's scores
    const prevRoundLastTurn = allTurns.filter(t => t.roundIndex === roundJustEnded - 1).pop();
    const thisRoundLastTurn = currentRoundTurns[currentRoundTurns.length - 1];
    const myPrevScore = prevRoundLastTurn
      ? (playerIndex === 0 ? prevRoundLastTurn.p1TotalScore : prevRoundLastTurn.p2TotalScore)
      : 0;
    const myRoundScore = myScore - myPrevScore;
    const oppRoundScore = (opponent?.score ?? 0) - (prevRoundLastTurn
      ? (playerIndex === 0 ? prevRoundLastTurn.p2TotalScore : prevRoundLastTurn.p1TotalScore)
      : 0);

    return (
      <div className="max-w-md mx-auto animate-slide-up text-center">
        <div className="text-4xl mb-3">📊</div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">第 {roundJustEnded} 轮结束</h1>
        <p className="text-text-secondary mb-5">手牌已重新分配，准备下一轮</p>

        <div className="bg-white rounded-2xl card-shadow p-6 mb-4">
          <div className="text-3xl font-bold text-text-primary mb-3">
            {myRoundScore} : {oppRoundScore}
          </div>
          <div className="text-sm text-text-muted">
            本轮得分 (你 : {opponent?.name})
          </div>
          <div className="mt-3 pt-3 border-t border-slate-100 text-text-secondary text-sm">
            累计总分: 你 {myScore} 分 vs {opponent?.name} {opponent?.score} 分
          </div>
        </div>

        <div className="animate-pulse text-primary text-sm mb-4">即将进入第 {roundJustEnded + 1} 轮...</div>
        <button onClick={dismissRoundSummary} className="text-text-muted text-sm underline">跳过等待</button>
      </div>
    );
  }

  // === PLAYING ===
  return (
    <div className="max-w-lg mx-auto">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-3 text-sm">
        <div className="text-text-secondary">
          房间 <span className="font-mono font-bold text-primary">{roomId}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-semibold text-sm">
            第 {currentRound}/5 轮
          </span>
          <span className="bg-slate-100 text-text-secondary px-2.5 py-1 rounded-full text-xs font-medium">
            第 {currentTurn}/5 回合
          </span>
        </div>
      </div>

      {/* Opponent Area */}
      <div className="bg-white rounded-2xl card-shadow p-4 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
              opponent?.connected === false ? 'bg-red-400' : 'bg-slate-400'
            }`}>{opponent?.name?.[0] || '?'}</div>
            <div>
              <div className="font-semibold text-text-primary flex items-center gap-2">
                {opponent?.name || '对手'}
                {opponent?.connected === false && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">断线中</span>}
                {opponentConfirmed && <span className="text-xs bg-green-100 text-green-600 px-2 py-0.5 rounded-full">已出牌</span>}
              </div>
              <div className="text-sm text-text-secondary">剩余 {opponent?.cardCount ?? 5} 张 | 得分 {opponent?.score ?? 0}</div>
            </div>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: opponent?.cardCount ?? 5 }).map((_, i) => (
              <div key={i} className="w-5 h-8 rounded bg-slate-200" />
            ))}
          </div>
        </div>
        {/* Turn progress dots for current round */}
        {currentRoundTurns.length > 0 && (
          <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100 items-center">
            <span className="text-xs text-text-muted mr-1">回合:</span>
            {Array.from({ length: 5 }).map((_, i) => {
              const done = i < currentRoundTurns.length;
              return (
                <div
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full ${done ? 'bg-green-400' : 'bg-slate-200'}`}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Turn Result */}
      {lastTurnResult && showingResult && (
        <TurnResultDisplay turn={lastTurnResult} playerIndex={playerIndex ?? 0} />
      )}

      {/* Status messages */}
      {!showingResult && !hasSubmitted && opponentConfirmed && (
        <div className="text-center py-3 mb-3 animate-pulse">
          <div className="text-primary font-medium">对手已出牌，请选择你的牌</div>
        </div>
      )}
      {hasSubmitted && !showingResult && (
        <div className="text-center py-3 mb-3 animate-pulse">
          <div className="text-text-secondary font-medium">
            {opponentConfirmed ? '双方已确认...' : '已出牌，等待对手...'}
          </div>
        </div>
      )}
      {showingResult && (
        <div className="text-center py-2 mb-3">
          <div className="text-text-muted text-sm animate-pulse">即将进入下一回合...</div>
        </div>
      )}

      {/* My Score */}
      <div className="text-center mb-3">
        <span className="text-sm text-text-muted">我的得分 </span>
        <span className="text-2xl font-bold text-primary">{myScore}</span>
      </div>

      {/* My Hand */}
      <div className="mb-3">
        <div className="text-sm text-text-secondary mb-2 text-center">选择一张牌</div>
        <div className="flex justify-center gap-2 sm:gap-3">
          {myHand.map((card) => {
            const cfg = cardConfig[card.type];
            const isSelected = card.id === selectedCardId;
            return (
              <button
                key={card.id}
                onClick={() => handleSelectCard(card.id)}
                disabled={hasSubmitted || showingResult || !!roundJustEnded}
                className={`relative w-16 sm:w-20 h-24 sm:h-28 rounded-xl flex flex-col items-center justify-center transition-all duration-200 ${cfg.color} text-white font-bold card-shadow ${
                  isSelected ? 'ring-3 ring-offset-2 ring-amber-400 -translate-y-2 card-glow scale-105' : 'hover:-translate-y-1 hover:shadow-lg'
                } disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0`}
              >
                <span className="text-2xl sm:text-3xl">{cfg.emoji}</span>
                {cfg.label && <span className="text-[10px] mt-0.5 opacity-80">{cfg.label}</span>}
                {card.hint && (
                  <span className="absolute -bottom-1 text-[10px] bg-white/20 rounded-full px-1.5 py-0.5">
                    倾向:{card.hint === 'big' ? '合作' : '背叛'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedCardId || hasSubmitted || showingResult || !!roundJustEnded}
        className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed card-shadow"
      >
        {hasSubmitted ? '已确认出牌' : showingResult ? '请等待...' : '确认出牌'}
      </button>

      {/* Progress dots: 5 rounds × 5 turns = 25 dots */}
      <div className="flex justify-center gap-1 mt-4 flex-wrap">
        {Array.from({ length: 25 }).map((_, i) => {
          const r = Math.floor(i / 5) + 1;
          const t = (i % 5) + 1;
          const done = (r < currentRound) || (r === currentRound && t < currentTurn);
          const current = r === currentRound && t === currentTurn;
          return (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                done ? 'bg-green-400' : current ? 'bg-primary ring-2 ring-primary/30' : 'bg-slate-200'
              }`}
              title={`第${r}轮 第${t}回合`}
            />
          );
        })}
      </div>
      <div className="text-center text-[10px] text-text-muted mt-1">5轮 × 5回合</div>
    </div>
  );
}
