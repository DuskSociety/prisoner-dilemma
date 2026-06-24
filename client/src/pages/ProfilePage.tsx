import { useProfileStore } from '../store/profileStore';
import { RoundScoreChart } from '../components/RoundScoreChart';
import { ConfirmModal } from '../components/Modal';
import { useState, useEffect } from 'react';

const AVATARS = ['😎','🤠','🦊','🐱','🐶','🐼','🦁','🐸','🦉','🐲','👑','🎩','🤡','💀','👽','🐸'];

export function ProfilePage() {
  const { name, avatar, records, loadFromStorage, setName, setAvatar, clearRecords, getStats } = useProfileStore();
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(name);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const stats = getStats();

  useEffect(() => { loadFromStorage(); }, []);

  const handleSaveName = () => {
    const t = nameDraft.trim();
    if (t && t.length <= 8) setName(t); else setNameDraft(name);
    setEditingName(false);
  };

  const fmtDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  return (
    <div className="max-w-md mx-auto animate-slide-up pb-20">
      <h1 className="font-display font-bold text-xl text-text-primary mb-5 text-center">个人中心</h1>

      {/* Avatar & Name */}
      <div className="glass-card p-5 mb-4 glow-soft text-center">
        <div className="relative inline-block">
          <button onClick={() => setShowAvatarPicker(!showAvatarPicker)}
            className="text-5xl w-20 h-20 rounded-full glass-card-sm hover:glow-spectate transition-all flex items-center justify-center"
            title="点击切换头像">{avatar}</button>
          <span className="absolute -bottom-1 -right-1 bg-cooperate text-white text-[10px] px-1.5 py-0.5 rounded-full font-display">编辑</span>
        </div>

        {showAvatarPicker && (
          <div className="mt-3 p-2 glass-card-sm inline-flex flex-wrap gap-1.5 justify-center animate-slide-up">
            {AVATARS.map(a => (
              <button key={a} onClick={() => { setAvatar(a); setShowAvatarPicker(false); }}
                className={`text-2xl w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                  a===avatar ? 'bg-white/80 glow-cooperate ring-2 ring-cooperate/30' : 'hover:bg-white/60'
                }`}>{a}</button>
            ))}
          </div>
        )}

        <div className="mt-3 flex items-center justify-center gap-2">
          {editingName ? (
            <input type="text" value={nameDraft} onChange={e => setNameDraft(e.target.value)}
              onBlur={handleSaveName} onKeyDown={e => { if (e.key==='Enter') handleSaveName(); }} maxLength={8} autoFocus
              className="font-display font-semibold text-lg text-text-primary text-center border-b-2 border-cooperate outline-none bg-transparent w-32" />
          ) : (
            <button onClick={() => { setNameDraft(name); setEditingName(true); }}
              className="font-display font-semibold text-lg text-text-primary hover:text-cooperate transition-colors flex items-center gap-1">
              {name || '未设置昵称'} <span className="text-xs text-text-muted">✎</span>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="glass-card p-5 mb-4 glow-soft">
        <h2 className="font-display font-semibold text-sm text-text-primary mb-3">战绩统计</h2>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {[
            { v: stats.totalGames, l: '总局数', c: 'text-text-primary' },
            { v: stats.winRate+'%', l: '胜率', c: stats.winRate>=50 ? 'text-cooperate' : 'text-betray' },
            { v: <>{stats.wins}<span className="text-text-muted text-sm">/</span>{stats.losses}<span className="text-text-muted text-sm">/</span>{stats.draws}</>, l: '胜/负/平', c: 'text-text-primary' },
            { v: <><span className="text-sm">{stats.maxRoundScore}</span><span className="text-[10px] text-text-muted block">小局 / {stats.maxGameScore} 大场</span></>, l: '最高分', c: 'text-text-primary' },
          ].map((s,i) => (
            <div key={i} className="glass-card-sm p-3 text-center">
              <div className={`font-mono font-bold text-2xl ${s.c}`}>{s.v}</div>
              <div className="text-[10px] text-text-muted font-display mt-0.5">{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="glass-card p-5 glow-soft">
        <h2 className="font-display font-semibold text-sm text-text-primary mb-3">历史记录</h2>
        {records.length===0 ? (
          <div className="text-center py-8 text-text-muted">
            <div className="text-3xl mb-2">📭</div>
            <p className="font-display text-sm">暂无对战记录</p>
            <p className="font-body text-xs mt-1">完成一局游戏后会自动记录</p>
          </div>
        ) : (
          <div className="space-y-2">
            {records.map(r => {
              const isExp = expandedId===r.id;
              return (
                <div key={r.id} className="glass-card-sm overflow-hidden">
                  <button onClick={() => setExpandedId(isExp?null:r.id)}
                    className="w-full p-3 flex items-center justify-between hover:bg-white/30 transition-colors text-left">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg">{r.result==='win'?'🏆':r.result==='draw'?'🤝':'💔'}</span>
                      <div className="min-w-0">
                        <div className="font-display font-semibold text-sm text-text-primary truncate">vs {r.opponentName}</div>
                        <div className="font-mono text-[10px] text-text-muted">{fmtDate(r.date)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`font-mono font-bold text-sm ${r.result==='win'?'text-cooperate':r.result==='draw'?'text-text-secondary':'text-betray'}`}>
                        {r.myTotalScore}:{r.oppTotalScore}
                      </span>
                      <span className={`text-xs transition-transform ${isExp?'rotate-90':''}`}>▶</span>
                    </div>
                  </button>
                  {isExp && (
                    <div className="px-3 pb-3 animate-slide-up">
                      <RoundScoreChart roundScores={r.roundScores} myName={name||'我'} oppName={r.opponentName} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {records.length>0 && (
          <button onClick={() => setShowClearConfirm(true)}
            className="mt-4 w-full py-2 font-body text-xs text-text-muted hover:text-betray transition-colors">
            清空全部记录
          </button>
        )}
      </div>

      <ConfirmModal open={showClearConfirm} onClose={() => setShowClearConfirm(false)}
        onConfirm={clearRecords} title="清空记录" message="确定要清空所有对战记录吗？此操作不可撤销。"
        confirmLabel="清空" cancelLabel="取消" danger />
    </div>
  );
}
