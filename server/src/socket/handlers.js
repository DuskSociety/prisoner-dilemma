import {
  createRoom, joinRoom, reconnectPlayer, disconnectPlayer,
  toggleReady, submitCard, voteRematch, leaveRoom, getPlayerView,
} from '../game/RoomManager.js';

const socketMap = new Map();

export function setupSocketHandlers(io) {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    function emitError(code, message) {
      socket.emit('error', { code, message });
    }

    function getInfo() {
      return socketMap.get(socket.id) || null;
    }

    function sendToRoom(roomId, event, data) {
      for (const [sid, info] of socketMap) {
        if (info.roomId === roomId) {
          io.to(sid).emit(event, data);
        }
      }
    }

    // ---- Room Events ----
    socket.on('create_room', ({ name }) => {
      if (!name?.trim()) return emitError('INVALID_NAME', '请输入昵称');
      const room = createRoom();
      const result = joinRoom(room.id, name.trim());
      if (result.error) return emitError(result.error, result.message);

      const { player } = result;
      socketMap.set(socket.id, { roomId: room.id, playerIndex: player.index });
      socket.join(room.id);

      socket.emit('room_joined', {
        roomId: room.id, playerIndex: player.index,
        token: player.token, name: player.name,
        opponent: null,
      });
    });

    socket.on('join_room', ({ code, name }) => {
      if (!code || !/^\d{6}$/.test(code)) return emitError('INVALID_CODE', '房间码为6位数字');
      if (!name?.trim()) return emitError('INVALID_NAME', '请输入昵称');

      const result = joinRoom(code, name.trim());
      if (result.error) return emitError(result.error, result.message);

      const { player, room } = result;
      socketMap.set(socket.id, { roomId: room.id, playerIndex: player.index });
      socket.join(room.id);

      const opponent = room.players[1 - player.index];

      socket.emit('room_joined', {
        roomId: room.id, playerIndex: player.index,
        token: player.token, name: player.name,
        opponent: opponent ? {
          name: opponent.name, isReady: opponent.isReady,
          connected: opponent.connected,
        } : null,
      });

      socket.to(room.id).emit('opponent_joined', { opponentName: player.name });
    });

    socket.on('reconnect_room', ({ code, token }) => {
      if (!code || !token) return emitError('INVALID_PARAMS', '参数无效');
      const result = reconnectPlayer(code, token, socket.id);
      if (result.error) return emitError(result.error, result.message);

      const { player, room } = result;
      socketMap.set(socket.id, { roomId: room.id, playerIndex: player.index });
      socket.join(room.id);

      const view = getPlayerView(room.id, player.index);
      socket.emit('state_recovery', { ...view, token: player.token, name: player.name, playerIndex: player.index });
      socket.to(room.id).emit('opponent_reconnected', {});
    });

    // ---- Game Events ----
    socket.on('toggle_ready', () => {
      const info = getInfo();
      if (!info) return emitError('NOT_IN_ROOM', '未在房间中');

      const result = toggleReady(info.roomId, info.playerIndex);
      if (result.error) return;

      if (result.gameStarted) {
        for (const [sid, sinfo] of socketMap) {
          if (sinfo.roomId === info.roomId) {
            const view = getPlayerView(info.roomId, sinfo.playerIndex);
            if (view) io.to(sid).emit('game_started', view);
          }
        }
      } else {
        sendToRoom(info.roomId, 'ready_changed', {
          playerIndex: info.playerIndex, isReady: result.readyState,
        });
      }
    });

    socket.on('submit_card', ({ cardId }) => {
      const info = getInfo();
      if (!info) return emitError('NOT_IN_ROOM', '未在房间中');

      const result = submitCard(info.roomId, info.playerIndex, cardId);
      if (result.error) {
        const msgs = { ALREADY_SUBMITTED: '本轮已提交', INVALID_CARD: '无效卡牌', NOT_PLAYING: '游戏未开始' };
        return emitError(result.error, msgs[result.error] || '无效操作');
      }

      if (result.waiting) {
        socket.to(info.roomId).emit('opponent_confirmed', {});
        socket.emit('submission_accepted', {});
      } else {
        const { turn, gameEnded, roundEnded, nextTurn, nextRound, roundNum, winner, scores } = result;

        // Send turn result to both
        sendToRoom(info.roomId, 'turn_result', { turn });

        if (gameEnded) {
          // Game over after last turn of last round
          setTimeout(() => {
            for (const [sid, sinfo] of socketMap) {
              if (sinfo.roomId === info.roomId) {
                const view = getPlayerView(info.roomId, sinfo.playerIndex);
                if (view) {
                  io.to(sid).emit('game_ended', {
                    winner, scores,
                    rounds: view.rounds,
                  });
                }
              }
            }
          }, 2500);
        } else if (roundEnded) {
          // Round ended (5 turns done), but game continues
          setTimeout(() => {
            // First send round_ended
            sendToRoom(info.roomId, 'round_ended', { roundNum });

            // Then after a pause, start next round with new hands
            setTimeout(() => {
              for (const [sid, sinfo] of socketMap) {
                if (sinfo.roomId === info.roomId) {
                  const view = getPlayerView(info.roomId, sinfo.playerIndex);
                  if (view) {
                    io.to(sid).emit('round_start', {
                      round: nextRound,
                      turn: 1,
                      hand: view.myHand,
                      myScore: view.myScore,
                      opponentCardCount: view.opponent?.cardCount ?? 5,
                    });
                  }
                }
              }
            }, 2000);
          }, 2000);
        } else {
          // Same round continues — next turn starts after brief delay
          setTimeout(() => {
            for (const [sid, sinfo] of socketMap) {
              if (sinfo.roomId === info.roomId) {
                const view = getPlayerView(info.roomId, sinfo.playerIndex);
                if (view) {
                  io.to(sid).emit('turn_start', {
                    round: view.currentRound,
                    turn: nextTurn,
                    hand: view.myHand,
                    myScore: view.myScore,
                    opponentCardCount: view.opponent?.cardCount ?? 0,
                  });
                }
              }
            }
          }, 2500);
        }
      }
    });

    socket.on('rematch', () => {
      const info = getInfo();
      if (!info) return emitError('NOT_IN_ROOM', '未在房间中');

      const result = voteRematch(info.roomId, info.playerIndex);
      if (result.error) return emitError(result.error);

      if (result.rematch) {
        for (const [sid, sinfo] of socketMap) {
          if (sinfo.roomId === info.roomId) {
            const view = getPlayerView(info.roomId, sinfo.playerIndex);
            if (view) io.to(sid).emit('rematch_started', view);
          }
        }
      } else {
        socket.to(info.roomId).emit('opponent_rematch_vote', {});
        socket.emit('rematch_vote_accepted', {});
      }
    });

    socket.on('leave_room', () => {
      const info = getInfo();
      if (!info) return;
      const result = leaveRoom(info.roomId, info.playerIndex);
      if (result?.roomClosed) {
        sendToRoom(info.roomId, 'room_closed', { reason: '双方都已离开' });
      } else if (result?.left) {
        socket.to(info.roomId).emit('opponent_left', {});
      }
      socket.leave(info.roomId);
      socketMap.delete(socket.id);
    });

    socket.on('disconnect', () => {
      const info = socketMap.get(socket.id);
      if (info) {
        const result = disconnectPlayer(info.roomId, info.playerIndex);
        if (result?.action === 'disconnected') {
          socket.to(info.roomId).emit('opponent_disconnected', {});
        } else if (result?.action === 'left') {
          socket.to(info.roomId).emit('opponent_left', {});
        }
        socketMap.delete(socket.id);
      }
    });
  });
}
