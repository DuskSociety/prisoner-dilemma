import { create } from 'zustand';

export type ToastType = 'cooperate' | 'betray' | 'spectate';

export interface Toast {
  id: string;
  text: string;
  type: ToastType;
}

interface ToastState {
  toasts: Toast[];
  addToast: (text: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

let nextId = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (text, type = 'cooperate') => {
    const id = `toast-${++nextId}-${Date.now()}`;
    set((s) => ({ toasts: [...s.toasts, { id, text, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));
