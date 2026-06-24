import { useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../store/gameStore';
import { useProfileStore } from '../store/profileStore';
import { useToastStore } from '../store/toastStore';
import type { GameRecord } from '../types/game';

// 自动检测服务器地址
function getServerUrl() {
  // 环境变量优先（用于自定义部署）
  if (import.meta.env.VITE_SERVER_URL) return import.meta.env.VITE_SERVER_URL;

  // 开发模式：Vite dev server 在 5173，后端在 3001
  if (import.meta.env.DEV) {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:3001';
    }
    // LAN：手机访问 192.168.x.x:5173 → 后端在 192.168.x.x:3001
    return `http://${host}:3001`;
  }

  // 生产模式：前后端同一域名，socket.io 自动同源连接
  return '';
}

const SOCKET_URL = getServerUrl();

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const store = useGameStore();

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socketRef.current = socket;

    // Room events
    socket.on('room_joined', store.setRoomJoined);
    socket.on('opponent_joined', (data) => store.setOpponentJoined(data.opponentName));
    socket.on('ready_changed', (data) => store.setReadyChanged(data.playerIndex, data.isReady));
    socket.on('game_started', store.setGameStarted);
    socket.on('state_recovery', store.setStateRecovery);

    // Game events
    socket.on('opponent_confirmed', store.setOpponentConfirmed);
    socket.on('submission_accepted', store.setSubmissionAccepted);
    socket.on('turn_result', (data) => store.setTurnResult(data.turn));
    socket.on('turn_start', store.setTurnStart);
    socket.on('round_ended', store.setRoundEnded);
    socket.on('round_start', store.setRoundStart);
    socket.on('game_ended', (data) => {
      store.setGameEnded(data);

      // Save game record to profile history
      const state = useGameStore.getState();
      if (state.playerIndex !== null && state.opponent && state.allTurns.length > 0) {
        // Compute per-round scores from accumulated totals
        const roundTotals: Record<number, { myTotal: number; oppTotal: number }> = {};
        for (const turn of state.allTurns) {
          const r = turn.roundIndex;
          roundTotals[r] = {
            myTotal: state.playerIndex === 0 ? turn.p1TotalScore : turn.p2TotalScore,
            oppTotal: state.playerIndex === 0 ? turn.p2TotalScore : turn.p1TotalScore,
          };
        }

        const roundScores: GameRecord['roundScores'] = [];
        let prevMy = 0, prevOpp = 0;
        for (let r = 1; r <= 5; r++) {
          const cur = roundTotals[r];
          if (cur) {
            roundScores.push({
              round: r,
              myScore: cur.myTotal - prevMy,
              oppScore: cur.oppTotal - prevOpp,
            });
            prevMy = cur.myTotal;
            prevOpp = cur.oppTotal;
          }
        }

        const result = data.winner === state.playerIndex ? 'win'
          : (data.winner === null || data.winner === undefined) ? 'draw' : 'lose';

        const record: GameRecord = {
          id: crypto.randomUUID(),
          date: Date.now(),
          opponentName: state.opponent.name,
          result,
          myTotalScore: state.myScore,
          oppTotalScore: state.opponent.score,
          roundScores,
        };

        useProfileStore.getState().addRecord(record);
      }
    });

    // Connection events
    socket.on('opponent_disconnected', store.setOpponentDisconnected);
    socket.on('opponent_reconnected', store.setOpponentReconnected);
    socket.on('opponent_left', store.setOpponentLeft);
    socket.on('room_closed', () => store.reset());

    // Rematch events
    socket.on('rematch_started', store.setRematchStarted);
    socket.on('opponent_rematch_vote', store.setOpponentRematchVote);
    socket.on('rematch_vote_accepted', store.setRematchVoteAccepted);

    // Chat
    socket.on('chat_message', (msg) => store.addChatMessage(msg));

    // Spectator
    socket.on('spectator_joined', store.setSpectatorJoined);
    socket.on('spectator_update', store.setSpectatorUpdate);
    socket.on('spectator_count_changed', (data) => store.setSpectatorCountChanged(data.count));

    // Error
    socket.on('error', (data) => {
      useToastStore.getState().addToast(data.message || '发生错误', 'betray');
    });

    // Track connection state
    socket.on('connect', () => {
      store.setConnected(true);
      const state = useGameStore.getState();
      if (state.roomId && state.token) {
        socket.emit('reconnect_room', {
          code: state.roomId,
          token: state.token,
        });
      }
    });

    socket.on('disconnect', () => {
      store.setConnected(false);
    });

    // Update initial connection state (may already be connected)
    if (socket.connected) {
      store.setConnected(true);
    }

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  const emit = useCallback((event: string, data?: any) => {
    const s = socketRef.current;
    if (!s?.connected) {
      console.warn('Socket not connected, cannot emit:', event);
      return;
    }
    s.emit(event, data);
  }, []);

  return { socket: socketRef.current, emit };
}
