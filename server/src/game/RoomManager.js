import {
  CardType, GameStatus, TOTAL_ROUNDS, TURNS_PER_ROUND,
  createHand, resolveCard, getPayoff,
  generateRoomCode, generateToken,
} from './types.js';

const rooms = new Map();
const cleanupTimers = new Map();

const ROOM_IDLE_TIMEOUT = 30 * 60 * 1000;
const ROOM_ENDED_TIMEOUT = 5 * 60 * 1000;
const DISCONNECT_TIMEOUT = 30 * 1000;

function scheduleCleanup(roomId, delay, reason) {
  cancelCleanup(roomId);
  const timer = setTimeout(() => {
    rooms.delete(roomId);
    console.log(`Room ${roomId} cleaned up: ${reason}`);
  }, delay);
  cleanupTimers.set(roomId, timer);
}

function cancelCleanup(roomId) {
  const timer = cleanupTimers.get(roomId);
  if (timer) { clearTimeout(timer); cleanupTimers.delete(roomId); }
}

function createPlayerView(player) {
  return {
    index: player.index,
    name: player.name,
    cardCount: player.hand.length,
    score: player.score,
    isReady: player.isReady,
    connected: player.connected,
  };
}

function createCardView(card, hand) {
  const view = { id: card.id, type: card.type };
  if (card.type === CardType.WILD && hand.length > 1) {
    const remaining = hand.filter(c => c.id !== card.id);
    let big = remaining.filter(c => c.type === CardType.BIG_JOKER).length;
    let small = remaining.filter(c => c.type === CardType.SMALL_JOKER).length;
    view.hint = big >= small ? 'big' : 'small';
  }
  return view;
}

function createHandView(player) {
  return player.hand.map(card => createCardView(card, player.hand));
}

export function getRoom(roomId) {
  return rooms.get(roomId) || null;
}

export function createRoom() {
  const roomId = generateRoomCode();
  if (rooms.has(roomId)) return createRoom();

  const room = {
    id: roomId,
    players: [null, null],
    status: GameStatus.WAITING,
    currentRound: 0,
    currentTurn: 0,
    rounds: [],           // flat array of all turns: { roundIndex, turnIndex, ... }
    roundScores: [],      // per-round totals: [{ p0Total, p1Total }, ...]
    createdAt: Date.now(),
    rematchVotes: new Set(),
  };

  rooms.set(roomId, room);
  scheduleCleanup(roomId, ROOM_IDLE_TIMEOUT, 'idle');
  console.log(`Room ${roomId} created`);
  return room;
}

export function joinRoom(roomId, name) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND', message: '房间不存在或已关闭' };
  if (room.status === GameStatus.PLAYING) return { error: 'GAME_ALREADY_STARTED', message: '游戏已在进行中' };
  if (room.players[0] && room.players[1]) return { error: 'ROOM_FULL', message: '房间已满' };

  let displayName = name;
  for (const p of room.players) {
    if (p && p.name === displayName) { displayName = name + '(2)'; break; }
  }

  const index = room.players[0] ? 1 : 0;
  const token = generateToken();
  const player = {
    index,
    token,
    name: displayName,
    hand: [],
    score: 0,
    isReady: false,
    connected: true,
    currentSubmission: null,
    disconnectTimer: null,
  };

  room.players[index] = player;
  cancelCleanup(roomId);
  console.log(`${displayName} joined room ${roomId} as P${index}`);
  return { player, room };
}

export function reconnectPlayer(roomId, token, socketId) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND', message: '房间不存在或已关闭' };

  const player = room.players.find(p => p && p.token === token);
  if (!player) return { error: 'INVALID_TOKEN', message: '身份验证失败，请重新加入' };

  player.connected = true;
  if (player.disconnectTimer) { clearTimeout(player.disconnectTimer); player.disconnectTimer = null; }
  player.socketId = socketId;
  return { player, room };
}

export function disconnectPlayer(roomId, playerIndex) {
  const room = rooms.get(roomId);
  if (!room) return;
  const player = room.players[playerIndex];
  if (!player) return;
  player.connected = false;

  if (room.status === GameStatus.WAITING) {
    room.players[playerIndex] = null;
    scheduleCleanup(roomId, ROOM_IDLE_TIMEOUT, 'player left');
    return { action: 'left', room };
  }
  if (room.status === GameStatus.PLAYING) {
    player.disconnectTimer = setTimeout(() => {
      room.status = GameStatus.ENDED;
      room.endedAt = Date.now();
      room.winner = 1 - playerIndex;
      scheduleCleanup(roomId, ROOM_ENDED_TIMEOUT, 'dc timeout');
    }, DISCONNECT_TIMEOUT);
    return { action: 'disconnected', room };
  }
  if (room.status === GameStatus.ENDED) {
    scheduleCleanup(roomId, ROOM_ENDED_TIMEOUT, 'left ended');
    return { action: 'left_ended', room };
  }
}

export function toggleReady(roomId, playerIndex) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  const player = room.players[playerIndex];
  player.isReady = !player.isReady;

  const bothReady = room.players[0]?.isReady && room.players[1]?.isReady;
  if (bothReady && room.status === GameStatus.WAITING) {
    startGame(room);
    return { gameStarted: true, room };
  }
  return { gameStarted: false, room, readyState: player.isReady };
}

function startGame(room) {
  room.status = GameStatus.PLAYING;
  room.currentRound = 1;
  room.currentTurn = 1;
  room.rounds = [];
  room.roundScores = [];
  room.rematchVotes = new Set();

  for (const player of room.players) {
    player.hand = createHand();
    player.score = 0;
    player.currentSubmission = null;
  }
  console.log(`Game started in room ${room.id}`);
}

export function submitCard(roomId, playerIndex, cardId) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.status !== GameStatus.PLAYING) return { error: 'NOT_PLAYING' };

  const player = room.players[playerIndex];
  if (player.currentSubmission) return { error: 'ALREADY_SUBMITTED' };

  const card = player.hand.find(c => c.id === cardId);
  if (!card) return { error: 'INVALID_CARD' };

  player.currentSubmission = card;
  player.hand = player.hand.filter(c => c.id !== cardId);

  const other = room.players[1 - playerIndex];
  if (other?.currentSubmission) {
    return resolveTurn(room);
  }
  return { waiting: true };
}

function resolveTurn(room) {
  const p0 = room.players[0];
  const p1 = room.players[1];

  const p0Actual = resolveCard(p0.currentSubmission, p0.hand);
  const p1Actual = resolveCard(p1.currentSubmission, p1.hand);
  const payoff = getPayoff(p0Actual, p1Actual);

  p0.score += payoff.p1;
  p1.score += payoff.p2;

  const turn = {
    roundIndex: room.currentRound,
    turnIndex: room.currentTurn,
    p1Card: p0.currentSubmission.type,
    p2Card: p1.currentSubmission.type,
    p1Actual: p0Actual,
    p2Actual: p1Actual,
    p1ScoreGain: payoff.p1,
    p2ScoreGain: payoff.p2,
    p1TotalScore: p0.score,
    p2TotalScore: p1.score,
  };

  room.rounds.push(turn);
  p0.currentSubmission = null;
  p1.currentSubmission = null;

  const isRoundEnd = room.currentTurn >= TURNS_PER_ROUND;
  const isGameEnd = isRoundEnd && room.currentRound >= TOTAL_ROUNDS;

  if (isGameEnd) {
    room.status = GameStatus.ENDED;
    room.endedAt = Date.now;
    let winner = null;
    if (p0.score > p1.score) winner = 0;
    else if (p1.score > p0.score) winner = 1;
    room.winner = winner;
    scheduleCleanup(room.id, ROOM_ENDED_TIMEOUT, 'game ended');

    return {
      turn,
      roundEnded: true,
      gameEnded: true,
      winner,
      scores: [p0.score, p1.score],
      roundNum: room.currentRound,
    };
  }

  if (isRoundEnd) {
    // Round ended but game continues — reset hands, advance round
    const roundNum = room.currentRound;
    for (const p of room.players) {
      p.hand = createHand();
    }
    room.currentRound++;
    room.currentTurn = 1;

    return {
      turn,
      roundEnded: true,
      gameEnded: false,
      nextRound: room.currentRound,
      roundNum,
    };
  }

  // Continue within same round
  room.currentTurn++;
  return {
    turn,
    roundEnded: false,
    gameEnded: false,
    nextTurn: room.currentTurn,
  };
}

export function voteRematch(roomId, playerIndex) {
  const room = rooms.get(roomId);
  if (!room) return { error: 'ROOM_NOT_FOUND' };
  if (room.status !== GameStatus.ENDED) return { error: 'GAME_NOT_ENDED' };

  room.rematchVotes.add(playerIndex);
  if (room.rematchVotes.size >= 2) {
    startGame(room);
    return { rematch: true, room };
  }
  return { rematch: false, waiting: true };
}

export function leaveRoom(roomId, playerIndex) {
  const room = rooms.get(roomId);
  if (!room) return;
  const player = room.players[playerIndex];
  if (player?.disconnectTimer) clearTimeout(player.disconnectTimer);
  room.players[playerIndex] = null;

  if (!room.players[0] && !room.players[1]) {
    rooms.delete(roomId);
    cancelCleanup(roomId);
    return { roomClosed: true };
  }
  return { left: true, room };
}

export function getPlayerView(roomId, playerIndex) {
  const room = rooms.get(roomId);
  if (!room) return null;

  const me = room.players[playerIndex];
  const opponent = room.players[1 - playerIndex];

  return {
    roomId: room.id,
    status: room.status,
    currentRound: room.currentRound,
    currentTurn: room.currentTurn,
    playerIndex,
    myName: me.name,
    myScore: me.score,
    myHand: me.hand.length > 0 ? createHandView(me) : [],
    isReady: me.isReady,
    hasSubmitted: !!me.currentSubmission,
    opponent: opponent ? createPlayerView(opponent) : null,
    rounds: room.rounds,
    winner: room.winner,
  };
}

setInterval(() => {
  const now = Date.now();
  for (const [id, room] of rooms) {
    if (room.status === GameStatus.WAITING && now - room.createdAt > ROOM_IDLE_TIMEOUT) {
      rooms.delete(id); cancelCleanup(id);
    }
    if (room.status === GameStatus.ENDED && room.endedAt && now - room.endedAt > ROOM_ENDED_TIMEOUT) {
      rooms.delete(id); cancelCleanup(id);
    }
  }
}, 60000);
