import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key==='Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div ref={overlayRef} className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E1E2E]/30 backdrop-blur-sm animate-slide-up"
      onClick={e => { if (e.target===overlayRef.current) onClose(); }}>
      <div className="glass-card max-w-sm w-[90%] overflow-hidden glow-soft">
        <div className="px-5 py-3 font-display font-bold text-lg text-text-primary border-b border-white/60 flex justify-between items-center">
          <span>{title}</span>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors" aria-label="关闭">✕</button>
        </div>
        <div className="p-5 font-body text-text-primary">{children}</div>
        {footer && <div className="px-5 pb-5 flex gap-3 justify-end">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel='确认', cancelLabel='取消', danger }: ConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} footer={
      <>
        <button onClick={onClose} className="px-4 py-2 font-display text-sm text-text-secondary hover:text-text-primary transition-colors">{cancelLabel}</button>
        <button onClick={() => { onConfirm(); onClose(); }}
          className={`px-4 py-2 rounded-xl font-display text-sm font-semibold transition-all ${danger ? 'btn-betray' : 'btn-cooperate'}`}>
          {confirmLabel}
        </button>
      </>
    }><p>{message}</p></Modal>
  );
}
