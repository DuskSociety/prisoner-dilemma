import { useState, useRef, useEffect } from 'react';
import type { ChatMessage } from '../types/game';

interface ChatBoxProps {
  emit: (event: string, data?: any) => void;
  messages: ChatMessage[];
  isOpen: boolean;
  onToggle: () => void;
  unreadCount: number;
  disabled?: boolean;
}

export function ChatBox({ emit, messages, isOpen, onToggle, unreadCount, disabled }: ChatBoxProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isOpen) { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); inputRef.current?.focus(); } }, [messages, isOpen]);

  const handleSend = () => { const t = input.trim(); if (!t||disabled) return; emit('chat_message', { text: t }); setInput(''); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key==='Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const fmtTime = (ts: number) => { const d = new Date(ts); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; };

  return (
    <>
      {!isOpen && (
        <button onClick={onToggle} aria-label="打开聊天"
          className="fixed bottom-4 right-4 z-40 w-12 h-12 rounded-2xl btn-cooperate flex items-center justify-center text-xl">
          💬
          {unreadCount>0 && (
            <span className="absolute -top-1 -right-1 bg-betray text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-display font-bold px-1">
              {unreadCount>99?'99+':unreadCount}
            </span>
          )}
        </button>
      )}

      {isOpen && (
        <div className="fixed bottom-4 right-4 z-40 w-72 sm:w-80 glass-card flex flex-col animate-slide-up overflow-hidden" style={{ maxHeight: '60vh' }}>
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/60">
            <span className="font-display font-semibold text-text-primary">聊天</span>
            <button onClick={onToggle} aria-label="关闭聊天" className="text-text-muted hover:text-text-primary">✕</button>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ minHeight: '120px' }}>
            {messages.length===0 && <div className="text-center text-text-muted text-xs py-4 font-body">暂无消息</div>}
            {messages.map(msg => {
              if (msg.senderType==='system') {
                return <div key={msg.id} className="text-center"><span className="text-[10px] text-text-muted italic glass-card-sm px-2 py-0.5 rounded-full">{msg.text}</span></div>;
              }
              return (
                <div key={msg.id} className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-[10px] font-display font-semibold ${msg.senderType==='spectator'?'text-spectate':'text-text-primary'}`}>
                      {msg.sender}
                      {msg.senderType==='spectator' && <span className="text-[9px] text-spectate/70 ml-0.5">观战</span>}
                    </span>
                    <span className="text-[9px] text-text-muted font-mono">{fmtTime(msg.timestamp)}</span>
                  </div>
                  <span className="font-body text-sm text-text-primary break-words">{msg.text}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 border-t border-white/60">
            <input ref={inputRef} type="text" value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={handleKeyDown} placeholder="输入消息..." maxLength={200} disabled={disabled}
              className="flex-1 px-3 py-1.5 rounded-xl bg-white/40 border border-white/40 font-body text-sm outline-none focus:bg-white/70 focus:border-cooperate/30 text-text-primary placeholder:text-text-muted disabled:opacity-40" />
            <button onClick={handleSend} disabled={!input.trim()||disabled}
              className="px-3 py-1.5 rounded-xl font-display text-sm btn-cooperate disabled:opacity-40">
              发送
            </button>
          </div>
        </div>
      )}
    </>
  );
}
