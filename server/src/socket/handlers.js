import {
  createRoom, joinRoom, reconnectPlayer, disconnectPlayer,
  toggleReady, submitCard, voteRematch, leaveRoom, getPlayerView,
  addMessage, getMessages, getRoom,
  joinAsSpectator, leaveSpectator, getSpectatorView,
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

    function sendToSpectators(roomId, event, data) {
      for (const [sid, info] of socketMap) {
        if (info.roomId === roomId && info.spectatorId) {
          io.to(sid).emit(event, data);
        }
      }
    }

    function broadcastSpectatorUpdate(roomId) {
      const view = getSpectatorView(roomId);
      if (view) sendToSpectators(roomId, 'spectator_update', view);
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
      const joinMsg = addMessage(room.id, '系统', `${player.name} 加入了房间`, 'system');
      sendToRoom(room.id, 'chat_message', joinMsg);
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
        const startMsg = addMessage(info.roomId, '系统', '游戏开始！', 'system');
        for (const [sid, sinfo] of socketMap) {
          if (sinfo.roomId === info.roomId) {
            const view = getPlayerView(info.roomId, sinfo.playerIndex);
            if (view) io.to(sid).emit('game_started', view);
          }
        }
        sendToRoom(info.roomId, 'chat_message', startMsg);
        broadcastSpectatorUpdate(info.roomId);
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
        broadcastSpectatorUpdate(info.roomId);

        if (gameEnded) {
          // System message
          const winMsg = winner !== null && winner !== undefined
            ? `游戏结束，${room.players[winner].name} 获胜！`
            : '游戏结束，平局！';
          const endMsg = addMessage(info.roomId, '系统', winMsg, 'system');
          sendToRoom(info.roomId, 'chat_message', endMsg);

          // Game over after last turn of last round
          setTimeout(() => {
            for (const [sid, sinfo] of socketMap) {
              if (sinfo.roomId === info.roomId && sinfo.playerIndex !== undefined && sinfo.playerIndex !== null) {
                const view = getPlayerView(info.roomId, sinfo.playerIndex);
                if (view) {
                  io.to(sid).emit('game_ended', {
                    winner, scores,
                    rounds: view.rounds,
                  });
                }
              }
            }
            broadcastSpectatorUpdate(info.roomId);
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
              broadcastSpectatorUpdate(info.roomId);
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
            broadcastSpectatorUpdate(info.roomId);
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

    // ---- Spectator Events ----
    socket.on('spectate_room', ({ code, name }) => {
      if (!code || !/^\d{6}$/.test(code)) return emitError('INVALID_CODE', '房间码为6位数字');
      if (!name?.trim()) return emitError('INVALID_NAME', '请输入昵称');

      const result = joinAsSpectator(code, name.trim());
      if (result.error) {
        const msgs = { ROOM_NOT_FOUND: '房间不存在或已关闭', GAME_ENDED: '游戏已结束，无法观战', SPECTATOR_FULL: '观战人数已满（最多3人）' };
        return emitError(result.error, msgs[result.error] || '无法观战');
      }

      const { spectator, room } = result;
      socketMap.set(socket.id, { roomId: room.id, spectatorId: spectator.id });
      socket.join(room.id);

      const view = getSpectatorView(room.id);
      const messages = getMessages(room.id);
      socket.emit('spectator_joined', { view, messages, spectatorId: spectator.id, name: spectator.name });

      // System message
      const sysMsg = addMessage(room.id, '系统', `${spectator.name} 加入了观战`, 'system');
      sendToRoom(room.id, 'chat_message', sysMsg);
      sendToRoom(room.id, 'spectator_count_changed', { count: room.spectators?.length || 0 });
    });

    socket.on('leave_spectate', () => {
      const info = getInfo();
      if (!info || !info.spectatorId) return;
      const result = leaveSpectator(info.roomId, info.spectatorId);
      if (result?.roomClosed) {
        sendToRoom(info.roomId, 'room_closed', { reason: '所有人已离开' });
      } else if (result?.left) {
        const room = getRoom(info.roomId);
        const specName = room?.spectators?.find(s => s.id === info.spectatorId)?.name || '观战者';
        sendToRoom(info.roomId, 'spectator_count_changed', { count: room?.spectators?.length || 0 });
        const sysMsg = addMessage(info.roomId, '系统', `${specName} 离开了观战`, 'system');
        if (sysMsg) sendToRoom(info.roomId, 'chat_message', sysMsg);
      }
      socket.leave(info.roomId);
      socketMap.delete(socket.id);
    });

    socket.on('chat_message', ({ text }) => {
      const info = getInfo();
      if (!info || !text?.trim()) return;

      let sender, senderType;
      const room = getRoom(info.roomId);
      if (!room) return;

      if (info.playerIndex !== undefined && info.playerIndex !== null) {
        if (room.players[info.playerIndex]) {
          sender = room.players[info.playerIndex].name;
          senderType = 'player';
        }
      } else if (info.spectatorId) {
        const spec = room.spectators?.find(s => s.id === info.spectatorId);
        if (spec) {
          sender = spec.name;
          senderType = 'spectator';
        }
      }
      if (!sender) return;

      const msg = addMessage(info.roomId, sender, text.trim(), senderType);
      if (msg) {
        sendToRoom(info.roomId, 'chat_message', msg);
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
        if (info.spectatorId) {
          // Spectator disconnect
          const result = leaveSpectator(info.roomId, info.spectatorId);
          if (!result?.roomClosed) {
            const room = getRoom(info.roomId);
            sendToRoom(info.roomId, 'spectator_count_changed', { count: room?.spectators?.length || 0 });
          }
          if (result?.roomClosed) {
            sendToRoom(info.roomId, 'room_closed', { reason: '所有人已离开' });
          }
        } else {
          // Player disconnect
          const result = disconnectPlayer(info.roomId, info.playerIndex);
          if (result?.action === 'disconnected') {
            socket.to(info.roomId).emit('opponent_disconnected', {});
          } else if (result?.action === 'left') {
            socket.to(info.roomId).emit('opponent_left', {});
          }
        }
        socketMap.delete(socket.id);
      }
    });
  });
}
