import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

interface HomePageProps { emit: (event: string, data?: any) => void; }

export function HomePage({ emit }: HomePageProps) {
  const { setPage, connected } = useGameStore();
  const [mode, setMode] = useState<'idle' | 'create' | 'join' | 'spectate'>('idle');
  const [name, setName] = useState(() => localStorage.getItem('pd_name') || '');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const submitTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(submitTimer.current), []);

  const submit = (event: string, data: any) => {
    setSubmitting(true);
    localStorage.setItem('pd_name', name.trim());
    emit(event, { ...data, name: name.trim() });
    clearTimeout(submitTimer.current);
    submitTimer.current = setTimeout(() => setSubmitting(false), 5000);
  };

  const handleDigitInput = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const nd = [...codeDigits]; nd[i] = v.slice(-1); setCodeDigits(nd);
    if (v && i < 5) document.getElementById(`code-${i+1}`)?.focus();
  };
  const handleDigitKeyDown = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeDigits[i] && i > 0) document.getElementById(`code-${i-1}`)?.focus();
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0,6);
    if (p.length) { const nd = [...codeDigits]; for (let i=0;i<6;i++) nd[i]=p[i]||''; setCodeDigits(nd); e.preventDefault(); }
  };

  const fullCode = codeDigits.join('');
  const canSubmit = name.trim() && connected && !submitting;

  return (
    <div className="flex flex-col items-center pt-10 sm:pt-20">
      {/* Hero */}
      <div className="text-center mb-12 animate-slide-up">
        <div className="inline-block animate-float">
          <div className="text-7xl sm:text-8xl drop-shadow-[0_8px_32px_rgba(255,107,53,0.20)]">🃏</div>
        </div>
        <h1 className="font-display font-bold text-3xl sm:text-4xl text-text-primary mt-4 mb-3">
          塑料好朋友
        </h1>
        <p className="font-body text-text-secondary text-lg max-w-sm mx-auto leading-relaxed">
          5张牌 · 5回合 · 2位玩家<br/>
          信任还是背叛？每一次选择都至关重要
        </p>
      </div>

      <div className="w-full max-w-md">
        {/* Connection */}
        {!connected && (
          <div className="mb-4 px-4 py-3 glass-card text-center font-body text-sm text-text-secondary animate-pulse">
            🔗 正在连接服务器...
          </div>
        )}

        <div className="glass-card p-6 mb-4 glow-soft">
          {/* Name */}
          <div className="mb-5">
            <label className="block font-display font-semibold text-sm text-text-primary mb-2">你的昵称</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)}
              placeholder="输入昵称..." maxLength={8}
              className="w-full px-4 py-3 rounded-2xl bg-white/50 border border-white/60 font-body text-text-primary placeholder:text-text-muted outline-none transition-all focus:bg-white/80 focus:border-cooperate/30 focus:glow-soft" />
          </div>

          {/* Mode selection */}
          {mode === 'idle' && (
            <div className="space-y-3 animate-slide-up">
              <button onClick={() => setMode('create')} disabled={!name.trim() || !connected}
                className="w-full py-3.5 rounded-2xl font-display font-semibold text-lg btn-cooperate disabled:opacity-40 disabled:cursor-not-allowed">
                ✨ 创建房间
              </button>
              <button onClick={() => setMode('join')} disabled={!name.trim() || !connected}
                className="w-full py-3.5 rounded-2xl font-display font-semibold text-lg btn-outline disabled:opacity-40 disabled:cursor-not-allowed">
                🔢 加入房间
              </button>
              <button onClick={() => setMode('spectate')} disabled={!name.trim() || !connected}
                className="w-full py-3.5 rounded-2xl font-display font-semibold text-lg btn-spectate disabled:opacity-40 disabled:cursor-not-allowed">
                👁️ 观战
              </button>
            </div>
          )}

          {/* Create */}
          {mode === 'create' && (
            <div className="space-y-3 animate-slide-up">
              <p className="font-body text-sm text-text-secondary text-center">创建房间后将房间码分享给对方</p>
              <button onClick={() => submit('create_room', {})} disabled={!canSubmit}
                className="w-full py-3.5 rounded-2xl font-display font-semibold text-lg btn-cooperate disabled:opacity-40">
                {submitting ? '创建中...' : '确认创建'}
              </button>
              <button onClick={() => setMode('idle')} className="w-full py-2.5 font-body text-sm text-text-muted hover:text-text-secondary">返回</button>
            </div>
          )}

          {/* Join */}
          {mode === 'join' && (
            <div className="space-y-4 animate-slide-up">
              <div>
                <label className="block font-display font-semibold text-sm text-text-primary mb-2">输入6位房间码</label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {codeDigits.map((d,i) => (
                    <input key={i} id={`code-${i}`} type="text" inputMode="numeric" value={d}
                      onChange={e => handleDigitInput(i,e.target.value)} onKeyDown={e => handleDigitKeyDown(i,e)} maxLength={1}
                      className="w-12 h-14 text-center font-mono font-bold text-xl rounded-2xl bg-white/50 border border-white/60 outline-none transition-all focus:bg-white/80 focus:border-cooperate/40 focus:glow-cooperate text-text-primary" />
                  ))}
                </div>
              </div>
              <button onClick={() => submit('join_room', { code: fullCode })} disabled={codeDigits.some(d=>!d)||!canSubmit}
                className="w-full py-3.5 rounded-2xl font-display font-semibold text-lg btn-cooperate disabled:opacity-40">
                {submitting ? '加入中...' : '加入房间'}
              </button>
              <button onClick={() => setMode('idle')} className="w-full py-2.5 font-body text-sm text-text-muted hover:text-text-secondary">返回</button>
            </div>
          )}

          {/* Spectate */}
          {mode === 'spectate' && (
            <div className="space-y-4 animate-slide-up">
              <p className="font-body text-sm text-text-secondary text-center">👁️ 双方手牌完整可见</p>
              <div>
                <label className="block font-display font-semibold text-sm text-text-primary mb-2">输入6位房间码</label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {codeDigits.map((d,i) => (
                    <input key={i} id={`code-${i}`} type="text" inputMode="numeric" value={d}
                      onChange={e => handleDigitInput(i,e.target.value)} onKeyDown={e => handleDigitKeyDown(i,e)} maxLength={1}
                      className="w-12 h-14 text-center font-mono font-bold text-xl rounded-2xl bg-white/50 border border-spectate/30 outline-none transition-all focus:bg-white/80 focus:border-spectate focus:glow-spectate text-text-primary" />
                  ))}
                </div>
              </div>
              <button onClick={() => submit('spectate_room', { code: fullCode })} disabled={codeDigits.some(d=>!d)||!canSubmit}
                className="w-full py-3.5 rounded-2xl font-display font-semibold text-lg btn-spectate disabled:opacity-40">
                {submitting ? '进入中...' : '进入观战'}
              </button>
              <button onClick={() => setMode('idle')} className="w-full py-2.5 font-body text-sm text-text-muted hover:text-text-secondary">返回</button>
            </div>
          )}
        </div>

        <button onClick={() => setPage('rules')}
          className="w-full py-2.5 font-body text-sm text-text-muted hover:text-cooperate transition-colors">
          查看游戏规则 →
        </button>
      </div>
    </div>
  );
}
