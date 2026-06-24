import { useGameStore } from '../store/gameStore';

export function RulesPage({ hasActiveGame }: { hasActiveGame?: boolean }) {
  const setPage = useGameStore.getState().setPage;

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      {hasActiveGame && (
        <button onClick={() => setPage('game')}
          className="mb-4 px-4 py-2 rounded-full font-display font-semibold text-sm btn-cooperate">
          ← 返回游戏
        </button>
      )}
      <h1 className="font-display font-bold text-2xl text-text-primary mb-6">游戏规则</h1>

      <section className="glass-card p-5 mb-4 glow-soft">
        <h2 className="font-display font-semibold text-lg text-text-primary mb-3">概述</h2>
        <p className="font-body text-text-secondary leading-relaxed">
          塑料好朋友是一款双人回合制策略博弈游戏。每位玩家拥有5张手牌（2张合作卡+2张背叛卡+1张万能牌），在5个回合中双方同时选择一张牌打出，根据博弈矩阵计算得分，5轮后总分高者获胜。
        </p>
      </section>

      <section className="glass-card p-5 mb-4 glow-soft">
        <h2 className="font-display font-semibold text-lg text-text-primary mb-3">卡牌说明</h2>
        <div className="space-y-3">
          {[
            { emoji:'🤝', label:'合作卡', bg:'linear-gradient(135deg, #FF6B35, #FF8C5A)', desc:'橙色卡面。表示合作意图。双方都出合作卡时各得3分；遇到背叛卡时自己得0分，对手得5分。' },
            { emoji:'⚔️', label:'背叛卡', bg:'linear-gradient(135deg, #E83F6F, #F06292)', desc:'粉色卡面。表示背叛意图。遇到合作卡时自己得5分，对手得0分；双方都出背叛卡时各得1分。' },
            { emoji:'💎', label:'万能牌', bg:'linear-gradient(135deg, #45B7D1, #67D5E8)', desc:'蓝色卡面。自动判定为合作或背叛——剩余手牌中哪种多就判定为哪种，数量相等时判为合作。' },
          ].map(c => (
            <div key={c.label} className="flex items-start gap-3 p-3 glass-card-sm">
              <div className="w-12 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl text-white" style={{ background: c.bg }}>
                {c.emoji}
              </div>
              <div>
                <div className="font-display font-semibold text-text-primary">{c.emoji} {c.label}</div>
                <div className="font-body text-sm text-text-secondary">{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="glass-card p-5 mb-4 glow-soft">
        <h2 className="font-display font-semibold text-lg text-text-primary mb-3">收益矩阵</h2>
        <div className="overflow-x-auto">
          <table className="w-full font-body text-sm">
            <thead>
              <tr className="border-b border-white/60">
                <th className="p-2 text-left"></th>
                <th className="p-2 text-center font-display">对手 🤝 合作</th>
                <th className="p-2 text-center font-display">对手 ⚔️ 背叛</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-white/30">
                <td className="p-2 font-display">我方 🤝 合作</td>
                <td className="p-2 text-center bg-cooperate/10 rounded-lg">双方各 +3</td>
                <td className="p-2 text-center bg-betray/5">我方 +0 / 对手 +5</td>
              </tr>
              <tr>
                <td className="p-2 font-display">我方 ⚔️ 背叛</td>
                <td className="p-2 text-center bg-cooperate/5">我方 +5 / 对手 +0</td>
                <td className="p-2 text-center bg-betray/10 rounded-lg">双方各 +1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="glass-card p-5 mb-4 glow-soft">
        <h2 className="font-display font-semibold text-lg text-text-primary mb-3">游戏流程</h2>
        <ol className="space-y-2 text-text-secondary font-body">
          {['创建/加入房间 → 双方点击准备','游戏开始，每轮双方同时选择一张牌并确认','双方确认后展示结果，计算得分','5轮结束后，总分高者获胜','可点击"再来一局"继续对战'].map((t,i) => (
            <li key={i} className="flex gap-2"><span className="font-display font-bold text-cooperate min-w-[20px]">{i+1}.</span>{t}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
