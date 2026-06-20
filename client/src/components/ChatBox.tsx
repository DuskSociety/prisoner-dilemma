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

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    emit('chat_message', { text: trimmed });
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <>
      {/* Floating toggle button */}
      {!isOpen && (
        <button
          onClick={onToggle}
          className="fixed bottom-4 right-4 z-40 w-12 h-12 bg-white rounded-full card-shadow-lg flex items-center justify-center hover:bg-slate-50 transition-all text-xl"
        >
          💬
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center font-bold px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 z-40 w-72 sm:w-80 bg-white rounded-2xl card-shadow-lg flex flex-col animate-slide-up overflow-hidden" style={{ maxHeight: '60vh' }}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100">
            <span className="text-sm font-semibold text-text-primary">聊天</span>
            <button
              onClick={onToggle}
              className="text-text-muted hover:text-text-primary transition-colors text-sm"
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2" style={{ minHeight: '120px' }}>
            {messages.length === 0 && (
              <div className="text-center text-text-muted text-xs py-4">暂无消息</div>
            )}
            {messages.map(msg => {
              if (msg.senderType === 'system') {
                return (
                  <div key={msg.id} className="text-center">
                    <span className="text-[10px] text-text-muted italic bg-slate-50 px-2 py-0.5 rounded-full">
                      {msg.text}
                    </span>
                  </div>
                );
              }
              const isSelf = msg.senderType === 'player' && msg.sender === 'self';
              // For now, use simple left alignment; "self" detection via name comparison would need name prop
              return (
                <div key={msg.id} className="flex flex-col">
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-[10px] font-medium ${
                      msg.senderType === 'spectator' ? 'text-purple-500' : 'text-text-secondary'
                    }`}>
                      {msg.sender}
                      {msg.senderType === 'spectator' && (
                        <span className="text-[9px] text-purple-400 ml-0.5">观战</span>
                      )}
                    </span>
                    <span className="text-[9px] text-text-muted">{formatTime(msg.timestamp)}</span>
                  </div>
                  <span className="text-sm text-text-primary break-words">{msg.text}</span>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex items-center gap-2 px-3 py-2 border-t border-slate-100">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入消息..."
              maxLength={200}
              disabled={disabled}
              className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 disabled:opacity-40 text-text-primary placeholder:text-text-muted"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || disabled}
              className="px-3 py-1.5 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors disabled:opacity-40"
            >
              发送
            </button>
          </div>
        </div>
      )}
    </>
  );
}
