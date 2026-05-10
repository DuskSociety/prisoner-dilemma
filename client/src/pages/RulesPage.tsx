import { useGameStore } from '../store/gameStore';

export function RulesPage({ hasActiveGame }: { hasActiveGame?: boolean }) {
  const setPage = useGameStore.getState().setPage;

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      {hasActiveGame && (
        <button
          onClick={() => setPage('game')}
          className="mb-4 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary-dark transition-colors"
        >
          ← 返回游戏
        </button>
      )}
      <h1 className="text-2xl font-bold text-text-primary mb-6">游戏规则</h1>

      {/* Overview */}
      <section className="bg-white rounded-2xl card-shadow p-5 mb-4">
        <h2 className="text-lg font-semibold text-text-primary mb-3">概述</h2>
        <p className="text-text-secondary leading-relaxed">
          囚徒博弈：对决是一款双人回合制策略博弈游戏。每位玩家拥有5张手牌（2张大Joker + 2张小Joker + 1张万能牌），
          在5个回合中，双方同时选择一张牌打出，根据囚徒困境矩阵计算得分，5轮后总分高者获胜。
        </p>
      </section>

      {/* Cards */}
      <section className="bg-white rounded-2xl card-shadow p-5 mb-4">
        <h2 className="text-lg font-semibold text-text-primary mb-3">卡牌说明</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-red-50 rounded-xl">
            <div className="w-12 h-14 rounded-lg bg-red-500 flex items-center justify-center flex-shrink-0 text-2xl">
              🤝
            </div>
            <div>
              <div className="font-semibold text-text-primary">🤝 合作卡</div>
              <div className="text-sm text-text-secondary">红色卡面。表示合作意图。双方都出合作卡时各得3分；遇到背叛卡时自己得0分，对手得5分。</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-xl">
            <div className="w-12 h-14 rounded-lg bg-blue-500 flex items-center justify-center flex-shrink-0 text-2xl">
              ⚔️
            </div>
            <div>
              <div className="font-semibold text-text-primary">⚔️ 背叛卡</div>
              <div className="text-sm text-text-secondary">蓝色卡面。表示背叛意图。遇到合作卡时自己得5分，对手得0分；双方都出背叛卡时各得1分。</div>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
            <div className="w-12 h-14 rounded-lg bg-purple-500 flex items-center justify-center flex-shrink-0 text-2xl">
              💎
            </div>
            <div>
              <div className="font-semibold text-text-primary">💎 万能牌</div>
              <div className="text-sm text-text-secondary">
                紫色卡面。出牌时自动判定为合作或背叛。判定依据：打出万能牌后，剩余手牌中合作卡多则判为合作，背叛卡多则判为背叛，数量相等时判为合作。
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Payoff Matrix */}
      <section className="bg-white rounded-2xl card-shadow p-5 mb-4">
        <h2 className="text-lg font-semibold text-text-primary mb-3">收益矩阵</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100">
                <th className="p-2 text-left rounded-tl-lg"></th>
                <th className="p-2 text-center">对手 🤝 合作</th>
                <th className="p-2 text-center rounded-tr-lg">对手 ⚔️ 背叛</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-2 font-medium">我方 🤝 合作</td>
                <td className="p-2 text-center bg-green-50 rounded-lg">双方各 +3</td>
                <td className="p-2 text-center bg-orange-50">我方 +0 / 对手 +5</td>
              </tr>
              <tr>
                <td className="p-2 font-medium">我方 ⚔️ 背叛</td>
                <td className="p-2 text-center bg-green-50">我方 +5 / 对手 +0</td>
                <td className="p-2 text-center bg-red-50 rounded-lg">双方各 +1</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="mt-3 p-3 bg-slate-50 rounded-lg text-xs text-text-muted">
          <span className="font-mono">T(5) &gt; R(3) &gt; P(1) &gt; S(0)</span>，且 <span className="font-mono">2R(6) &gt; T+S(5)</span>，满足经典囚徒困境条件。
        </div>
      </section>

      {/* Flow */}
      <section className="bg-white rounded-2xl card-shadow p-5 mb-4">
        <h2 className="text-lg font-semibold text-text-primary mb-3">游戏流程</h2>
        <ol className="space-y-2 text-text-secondary">
          <li className="flex gap-2">
            <span className="font-bold text-primary min-w-[20px]">1.</span>
            创建/加入房间 → 双方点击准备
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary min-w-[20px]">2.</span>
            游戏开始，每轮双方同时选择一张牌并确认
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary min-w-[20px]">3.</span>
            双方确认后展示结果，计算得分
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary min-w-[20px]">4.</span>
            5轮结束后，总分高者获胜
          </li>
          <li className="flex gap-2">
            <span className="font-bold text-primary min-w-[20px]">5.</span>
            可点击"再来一局"继续对战
          </li>
        </ol>
      </section>
    </div>
  );
}
