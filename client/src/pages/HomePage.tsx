import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';

interface HomePageProps {
  emit: (event: string, data?: any) => void;
}

export function HomePage({ emit }: HomePageProps) {
  const { setPage, connected } = useGameStore();
  const [mode, setMode] = useState<'idle' | 'create' | 'join' | 'spectate'>('idle');
  const [name, setName] = useState(() => localStorage.getItem('pd_name') || '');
  const [code, setCode] = useState('');
  const [codeDigits, setCodeDigits] = useState(['', '', '', '', '', '']);
  const [submitting, setSubmitting] = useState(false);
  const submitTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(submitTimer.current);
  }, []);

  const handleCreate = () => {
    if (!name.trim() || submitting) return;
    setSubmitting(true);
    localStorage.setItem('pd_name', name.trim());
    emit('create_room', { name: name.trim() });
    clearTimeout(submitTimer.current);
    submitTimer.current = setTimeout(() => setSubmitting(false), 5000);
  };

  const handleJoin = () => {
    const fullCode = codeDigits.join('');
    if (!name.trim() || fullCode.length !== 6 || submitting) return;
    setSubmitting(true);
    localStorage.setItem('pd_name', name.trim());
    emit('join_room', { code: fullCode, name: name.trim() });
    clearTimeout(submitTimer.current);
    submitTimer.current = setTimeout(() => setSubmitting(false), 5000);
  };

  const handleSpectate = () => {
    const fullCode = codeDigits.join('');
    if (!name.trim() || fullCode.length !== 6 || submitting) return;
    setSubmitting(true);
    localStorage.setItem('pd_name', name.trim());
    emit('spectate_room', { code: fullCode, name: name.trim() });
    clearTimeout(submitTimer.current);
    submitTimer.current = setTimeout(() => setSubmitting(false), 5000);
  };

  const handleDigitInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...codeDigits];
    newDigits[index] = value.slice(-1);
    setCodeDigits(newDigits);

    // Auto-focus next
    if (value && index < 5) {
      const next = document.getElementById(`code-${index + 1}`);
      next?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !codeDigits[index] && index > 0) {
      const prev = document.getElementById(`code-${index - 1}`);
      prev?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...codeDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || '';
      }
      setCodeDigits(newDigits);
      e.preventDefault();
    }
  };

  return (
    <div className="flex flex-col items-center pt-8 sm:pt-16">
      {/* Hero */}
      <div className="text-center mb-10 animate-slide-up">
        <div className="text-6xl mb-4">🃏</div>
        <h1 className="text-3xl sm:text-4xl font-bold text-text-primary mb-3">
          塑料好朋友
        </h1>
        <p className="text-text-secondary text-lg max-w-md mx-auto">
          5张牌 · 5回合 · 2位玩家<br />
          信任还是背叛？每一次选择都至关重要
        </p>
      </div>

      {/* Action Area */}
      <div className="w-full max-w-md">
        {/* Connection Status */}
        {!connected && (
          <div className="mb-3 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700 text-center animate-pulse">
            正在连接服务器...
          </div>
        )}

        <div className="bg-white rounded-2xl card-shadow-lg p-6 mb-4">
          {/* Name Input */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-text-secondary mb-1.5">
              你的昵称
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入昵称..."
              maxLength={8}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-primary placeholder:text-text-muted"
            />
          </div>

          {/* Mode Buttons */}
          {mode === 'idle' && (
            <div className="space-y-3">
              <button
                onClick={() => setMode('create')}
                disabled={!name.trim() || !connected}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed card-shadow"
              >
                创建房间
              </button>
              <button
                onClick={() => setMode('join')}
                disabled={!name.trim() || !connected}
                className="w-full py-3.5 bg-surface-alt text-text-primary rounded-xl font-semibold text-lg hover:bg-slate-200 transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-slate-200"
              >
                加入房间
              </button>
              <button
                onClick={() => setMode('spectate')}
                disabled={!name.trim() || !connected}
                className="w-full py-3.5 bg-purple-50 text-purple-600 rounded-xl font-semibold text-lg hover:bg-purple-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed border border-purple-200"
              >
                👁️ 观战
              </button>
            </div>
          )}

          {/* Create Mode */}
          {mode === 'create' && (
            <div className="space-y-3 animate-slide-up">
              <p className="text-sm text-text-secondary text-center">
                创建房间后，将好友的房间码分享给对方即可开始对战
              </p>
              <button
                onClick={handleCreate}
                disabled={!connected || submitting}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed card-shadow"
              >
                {submitting ? '创建中...' : '确认创建'}
              </button>
              <button
                onClick={() => setMode('idle')}
                className="w-full py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                返回
              </button>
            </div>
          )}

          {/* Join Mode */}
          {mode === 'join' && (
            <div className="space-y-4 animate-slide-up">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  输入6位房间码
                </label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {codeDigits.map((d, i) => (
                    <input
                      key={i}
                      id={`code-${i}`}
                      type="text"
                      inputMode="numeric"
                      value={d}
                      onChange={(e) => handleDigitInput(i, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(i, e)}
                      maxLength={1}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-slate-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-text-primary"
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleJoin}
                disabled={codeDigits.some(d => !d) || !connected || submitting}
                className="w-full py-3.5 bg-primary text-white rounded-xl font-semibold text-lg hover:bg-primary-dark transition-all disabled:opacity-40 disabled:cursor-not-allowed card-shadow"
              >
                {submitting ? '加入中...' : '加入房间'}
              </button>
              <button
                onClick={() => setMode('idle')}
                className="w-full py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                返回
              </button>
            </div>
          )}

          {/* Spectate Mode */}
          {mode === 'spectate' && (
            <div className="space-y-4 animate-slide-up">
              <p className="text-sm text-text-secondary text-center">
                👁️ 输入房间码即可旁观对局，双方手牌可见
              </p>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  输入6位房间码
                </label>
                <div className="flex gap-2 justify-center" onPaste={handlePaste}>
                  {codeDigits.map((d, i) => (
                    <input
                      key={i}
                      id={`code-${i}`}
                      type="text"
                      inputMode="numeric"
                      value={d}
                      onChange={(e) => handleDigitInput(i, e.target.value)}
                      onKeyDown={(e) => handleDigitKeyDown(i, e)}
                      maxLength={1}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border-2 border-purple-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all text-text-primary"
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={handleSpectate}
                disabled={codeDigits.some(d => !d) || !connected || submitting}
                className="w-full py-3.5 bg-purple-500 text-white rounded-xl font-semibold text-lg hover:bg-purple-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed card-shadow"
              >
                {submitting ? '进入中...' : '进入观战'}
              </button>
              <button
                onClick={() => setMode('idle')}
                className="w-full py-2.5 text-text-secondary hover:text-text-primary transition-colors text-sm"
              >
                返回
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setPage('rules')}
          className="w-full py-2.5 text-text-secondary hover:text-primary transition-colors text-sm"
        >
          查看游戏规则 →
        </button>
      </div>
    </div>
  );
}
