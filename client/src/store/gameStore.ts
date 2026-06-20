import { create } from 'zustand';
import type { GameState, PageView, TurnResult, ChatMessage, SpectatorView } from '../types/game';

interface GameStore extends GameState {
  page: PageView;
  setPage: (page: PageView) => void;
  setConnected: (connected: boolean) => void;
  setRoomJoined: (data: any) => void;
  setOpponentJoined: (name: string) => void;
  setReadyChanged: (playerIndex: number, isReady: boolean) => void;
  setGameStarted: (data: any) => void;
  setOpponentConfirmed: () => void;
  setSubmissionAccepted: () => void;
  setTurnResult: (turn: TurnResult) => void;
  setTurnStart: (data: any) => void;
  setRoundEnded: (data: any) => void;
  setRoundStart: (data: any) => void;
  setGameEnded: (data: any) => void;
  setStateRecovery: (data: any) => void;
  setOpponentDisconnected: () => void;
  setOpponentReconnected: () => void;
  setOpponentLeft: () => void;
  setRematchStarted: (data: any) => void;
  setOpponentRematchVote: () => void;
  setRematchVoteAccepted: () => void;
  selectCard: (cardId: string | null) => void;
  dismissRoundSummary: () => void;
  reset: () => void;
  // Chat actions
  addChatMessage: (msg: ChatMessage) => void;
  setChatHistory: (msgs: ChatMessage[]) => void;
  setChatOpen: (open: boolean) => void;
  clearChat: () => void;
  // Spectator actions
  setSpectatorJoined: (data: { view: SpectatorView; messages: ChatMessage[]; spectatorId: string; name: string }) => void;
  setSpectatorUpdate: (view: SpectatorView) => void;
  setSpectatorCountChanged: (count: number) => void;
}

const initial: GameState & { page: PageView } = {
  page: 'home',
  connected: false,
  roomId: null, playerIndex: null, token: null, name: null,
  status: null, currentRound: 0, currentTurn: 0,
  myHand: [], myScore: 0, isReady: false, hasSubmitted: false,
  opponent: null, allTurns: [], winner: undefined,
  selectedCardId: null, opponentConfirmed: false,
  lastTurnResult: null, showingResult: false, roundJustEnded: null,
  opponentVotedRematch: false, iVotedRematch: false,
  chatMessages: [], unreadChatCount: 0, isChatOpen: false,
  isSpectator: false,
  spectatorView: null as SpectatorView | null,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initial,

  setPage: (page) => set({ page }),

  setConnected: (connected) => set({ connected }),

  setRoomJoined: (data) => set((s) => ({
    page: 'room', roomId: data.roomId, playerIndex: data.playerIndex,
    token: data.token, name: data.name,
    opponent: data.opponent ? {
      index: 1 - (data.playerIndex ?? 0), name: data.opponent.name,
      cardCount: 5, score: 0, isReady: data.opponent.isReady ?? false,
      connected: data.opponent.connected ?? true,
    } : s.opponent,
  })),

  setOpponentJoined: (name) => set((s) => ({
    opponent: { index: 1 - (s.playerIndex ?? 0), name, cardCount: 5, score: 0, isReady: false, connected: true },
  })),

  setReadyChanged: (playerIndex, isReady) => set((s) => {
    if (s.playerIndex === playerIndex) return { isReady };
    if (s.opponent) return { opponent: { ...s.opponent, isReady } };
    return {};
  }),

  setGameStarted: (data) => set({
    page: 'game', status: 'playing',
    currentRound: data.currentRound || 1,
    currentTurn: data.currentTurn || 1,
    myHand: data.myHand || [], myScore: 0,
    opponent: data.opponent ? {
      ...data.opponent, cardCount: data.opponent.cardCount ?? 5, score: 0,
    } : get().opponent,
    allTurns: [], selectedCardId: null,
    hasSubmitted: false, opponentConfirmed: false,
    lastTurnResult: null, showingResult: false, roundJustEnded: null,
    winner: undefined,
  }),

  setOpponentConfirmed: () => set({ opponentConfirmed: true }),
  setSubmissionAccepted: () => set({ hasSubmitted: true }),

  setTurnResult: (turn) => set((s) => ({
    lastTurnResult: turn,
    allTurns: [...s.allTurns, turn],
    currentTurn: turn.turnIndex,
    currentRound: turn.roundIndex,
    myScore: s.playerIndex === 0 ? turn.p1TotalScore : turn.p2TotalScore,
    opponent: s.opponent ? {
      ...s.opponent,
      score: s.playerIndex === 0 ? turn.p2TotalScore : turn.p1TotalScore,
      cardCount: s.opponent.cardCount - 1,
    } : null,
    showingResult: true,
    selectedCardId: null,
    hasSubmitted: false,
    opponentConfirmed: false,
  })),

  setTurnStart: (data) => set({
    currentRound: data.round, currentTurn: data.turn,
    myHand: data.hand, myScore: data.myScore,
    opponent: get().opponent ? {
      ...get().opponent!, cardCount: data.opponentCardCount,
    } : null,
    selectedCardId: null, hasSubmitted: false,
    opponentConfirmed: false, lastTurnResult: null, showingResult: false,
  }),

  setRoundEnded: (data) => set({
    roundJustEnded: data.roundNum, showingResult: false,
  }),

  setRoundStart: (data) => set({
    currentRound: data.round, currentTurn: 1,
    myHand: data.hand, myScore: data.myScore,
    opponent: get().opponent ? {
      ...get().opponent!, cardCount: data.opponentCardCount, score: get().opponent!.score,
    } : null,
    selectedCardId: null, hasSubmitted: false,
    opponentConfirmed: false, lastTurnResult: null,
    showingResult: false, roundJustEnded: null,
  }),

  setGameEnded: (data) => set({
    status: 'ended', winner: data.winner,
    allTurns: data.rounds || get().allTurns,
    showingResult: false,
  }),

  setStateRecovery: (data) => set({
    page: data.status === 'waiting' ? 'room' : 'game',
    roomId: data.roomId, playerIndex: data.playerIndex,
    token: data.token, name: data.name,
    status: data.status, currentRound: data.currentRound,
    currentTurn: data.currentTurn,
    myHand: data.myHand || [], myScore: data.myScore || 0,
    opponent: data.opponent, allTurns: data.rounds || [],
    winner: data.winner, isReady: data.isReady,
    hasSubmitted: data.hasSubmitted,
  }),

  setOpponentDisconnected: () => set((s) => ({
    opponent: s.opponent ? { ...s.opponent, connected: false } : null,
  })),
  setOpponentReconnected: () => set((s) => ({
    opponent: s.opponent ? { ...s.opponent, connected: true } : null,
  })),
  setOpponentLeft: () => set({ ...initial, page: 'home', connected: get().connected }),

  setRematchStarted: (data) => set({
    status: 'playing', currentRound: data.currentRound || 1,
    currentTurn: 1, myHand: data.myHand || [], myScore: 0,
    opponent: data.opponent ? {
      ...data.opponent, cardCount: data.opponent.cardCount ?? 5, score: 0,
    } : get().opponent ? { ...get().opponent!, score: 0, cardCount: 5 } : null,
    allTurns: [], selectedCardId: null, hasSubmitted: false,
    opponentConfirmed: false, lastTurnResult: null,
    showingResult: false, roundJustEnded: null,
    winner: undefined, opponentVotedRematch: false, iVotedRematch: false,
  }),

  setOpponentRematchVote: () => set({ opponentVotedRematch: true }),
  setRematchVoteAccepted: () => set({ iVotedRematch: true }),
  selectCard: (cardId) => set({ selectedCardId: cardId }),
  dismissRoundSummary: () => set({ roundJustEnded: null }),
  reset: () => set({ ...initial, connected: get().connected }),

  // Chat actions
  addChatMessage: (msg) => set((s) => {
    if (s.chatMessages.some(m => m.id === msg.id)) return {};
    return {
      chatMessages: [...s.chatMessages, msg].slice(-50),
      unreadChatCount: s.isChatOpen ? 0 : Math.min(s.unreadChatCount + 1, 99),
    };
  }),
  setChatHistory: (msgs) => set({ chatMessages: msgs }),
  setChatOpen: (open) => set((s) => ({
    isChatOpen: open,
    unreadChatCount: open ? 0 : s.unreadChatCount,
  })),
  clearChat: () => set({ chatMessages: [], unreadChatCount: 0 }),

  // Spectator actions
  setSpectatorJoined: (data) => set({
    page: 'spectate',
    isSpectator: true,
    roomId: data.view.roomId,
    playerIndex: null,
    name: data.name,
    token: data.spectatorId,
    spectatorView: data.view,
    chatMessages: data.messages || [],
    isChatOpen: false,
    unreadChatCount: 0,
  }),
  setSpectatorUpdate: (view) => set({ spectatorView: view }),
  setSpectatorCountChanged: (count) => set((s) => ({
    spectatorView: s.spectatorView ? { ...s.spectatorView, spectatorCount: count } : null,
  })),
}));
