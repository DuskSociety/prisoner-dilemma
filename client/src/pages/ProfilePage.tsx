import { useState, useEffect } from 'react';
import { useProfileStore } from '../store/profileStore';
import { RoundScoreChart } from '../components/RoundScoreChart';
import type { GameRecord } from '../types/game';

const AVATARS = ['😎', '🤠', '🦊', '🐱', '🐶', '🐼', '🦁', '🐸', '🦉', '🐲', '👑', '🎩'];

export function ProfilePage() {
  const { name, avatar, records, loadFromStorage, setName, setAvatar, clearRecords, getStats } = useProfileStore();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const stats = getStats();

  useEffect(() => {
    loadFromStorage();
  }, []);

  const handleSaveName = () => {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed.length <= 8) {
      setName(trimmed);
    } else {
      setNameDraft(name);
    }
    setEditingName(false);
  };

  const handleClearRecords = () => {
    if (window.confirm('确定要清空所有对战记录吗？此操作不可撤销。')) {
      clearRecords();
    }
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="max-w-md mx-auto animate-slide-up pb-20">
      <h1 className="text-xl font-bold text-text-primary mb-5 text-center">个人中心</h1>

      {/* Avatar & Name */}
      <div className="bg-white rounded-2xl card-shadow p-5 mb-4 text-center">
        <div className="relative inline-block">
          <button
            onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="text-5xl w-20 h-20 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center"
            title="点击切换头像"
          >
            {avatar}
          </button>
          <span className="absolute -bottom-1 -right-1 bg-primary text-white text-[10px] px-1.5 py-0.5 rounded-full">
            编辑
          </span>
        </div>

        {showAvatarPicker && (
          <div className="mt-3 p-2 bg-slate-50 rounded-xl inline-flex flex-wrap gap-1.5 justify-center animate-slide-up">
            {AVATARS.map(a => (
              <button
                key={a}
                onClick={() => { setAvatar(a); setShowAvatarPicker(false); }}
                className={`text-2xl w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                  a === avatar ? 'bg-primary/20 ring-2 ring-primary' : 'hover:bg-slate-200'
                }`}
              >
                {a}
              </button>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-center gap-2">
          {editingName ? (
            <input
              type="text"
              value={nameDraft}
              onChange={e => setNameDraft(e.target.value)}
              onBlur={handleSaveName}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveName(); }}
              maxLength={8}
              autoFocus
              className="text-lg font-semibold text-text-primary text-center border-b-2 border-primary outline-none bg-transparent w-32"
            />
          ) : (
            <button
              onClick={() => { setNameDraft(name); setEditingName(true); }}
              className="text-lg font-semibold text-text-primary hover:text-primary transition-colors flex items-center gap-1"
            >
              {name || '未设置昵称'}
              <span className="text-xs text-text-muted">✎</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="bg-white rounded-2xl card-shadow p-5 mb-4">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">战绩统计</h2>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-text-primary">{stats.totalGames}</div>
            <div className="text-[10px] text-text-muted">总局数</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <div className={`text-2xl font-bold ${stats.winRate >= 50 ? 'text-green-600' : 'text-orange-500'}`}>
              {stats.winRate}%
            </div>
            <div className="text-[10px] text-text-muted">胜率</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <div className="text-2xl font-bold text-text-primary">
              {stats.wins}<span className="text-sm text-text-muted">/</span>{stats.losses}<span className="text-sm text-text-muted">/</span>{stats.draws}
            </div>
            <div className="text-[10px] text-text-muted">胜 / 负 / 平</div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 text-center">
            <div className="text-sm font-bold text-primary">{stats.maxRoundScore}</div>
            <div className="text-[10px] text-text-muted">小局最高分</div>
            <div className="text-sm font-bold text-primary mt-0.5">{stats.maxGameScore}</div>
            <div className="text-[10px] text-text-muted">大场最高分</div>
          </div>
        </div>
      </div>

      {/* Match History */}
      <div className="bg-white rounded-2xl card-shadow p-5">
        <h2 className="text-sm font-semibold text-text-secondary mb-3">历史记录</h2>

        {records.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <div className="text-3xl mb-2">📭</div>
            <p className="text-sm">暂无对战记录</p>
            <p className="text-xs mt-1">完成一局游戏后会自动记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map(record => {
              const isExpanded = expandedId === record.id;
              return (
                <div key={record.id} className="border border-slate-100 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : record.id)}
                    className="w-full p-3 flex items-center justify-between hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-lg ${
                        record.result === 'win' ? '' : record.result === 'draw' ? '' : ''
                      }`}>
                        {record.result === 'win' ? '🏆' : record.result === 'draw' ? '🤝' : '💔'}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">
                          vs {record.opponentName}
                        </div>
                        <div className="text-[10px] text-text-muted">{formatDate(record.date)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-sm font-bold font-mono ${
                        record.result === 'win' ? 'text-green-600' :
                        record.result === 'draw' ? 'text-text-secondary' : 'text-red-500'
                      }`}>
                        {record.myTotalScore}:{record.oppTotalScore}
                      </span>
                      <span className={`text-xs transition-transform ${isExpanded ? 'rotate-90' : ''}`}>▶</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 animate-slide-up">
                      <RoundScoreChart
                        roundScores={record.roundScores}
                        myName={name || '我'}
                        oppName={record.opponentName}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {records.length > 0 && (
          <button
            onClick={handleClearRecords}
            className="mt-4 w-full py-2 text-xs text-text-muted hover:text-accent transition-colors"
          >
            清空全部记录
          </button>
        )}
      </div>
    </div>
  );
}
