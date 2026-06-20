import { randomUUID } from 'crypto';

// Card types
export const CardType = {
  BIG_JOKER: 'big_joker',    // 大Joker = 合作
  SMALL_JOKER: 'small_joker', // 小Joker = 背叛
  WILD: 'wild',               // 万能牌
};

export const GameStatus = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  ENDED: 'ended',
};

export const TOTAL_ROUNDS = 5;        // 5大轮
export const TURNS_PER_ROUND = 5;     // 每轮5回合，对应5张手牌
export const MAX_SPECTATORS = 3;      // 最大观战人数

// Payoff matrix
// [p1Card][p2Card] -> { p1Gain, p2Gain }
// After wild card resolution, actual = 'big' | 'small'
const PAYOFF = {
  big: {
    big:   { p1: 3, p2: 3 },
    small: { p1: 0, p2: 5 },
  },
  small: {
    big:   { p1: 5, p2: 0 },
    small: { p1: 1, p2: 1 },
  },
};

export function getPayoff(p1Actual, p2Actual) {
  return PAYOFF[p1Actual][p2Actual];
}

// Create initial hand for a player
export function createHand() {
  return [
    { id: randomUUID(), type: CardType.BIG_JOKER },
    { id: randomUUID(), type: CardType.BIG_JOKER },
    { id: randomUUID(), type: CardType.SMALL_JOKER },
    { id: randomUUID(), type: CardType.SMALL_JOKER },
    { id: randomUUID(), type: CardType.WILD },
  ];
}

// Resolve wild card: check remaining hand (excluding the played wild card)
// Returns 'big' or 'small'
export function resolveWild(remainingHand) {
  let bigCount = 0;
  let smallCount = 0;
  for (const card of remainingHand) {
    if (card.type === CardType.BIG_JOKER) bigCount++;
    else if (card.type === CardType.SMALL_JOKER) smallCount++;
    // wild cards that remain are ignored for counting
  }
  if (bigCount >= smallCount) return 'big';  // tie favors big (cooperation)
  return 'small';
}

// Resolve a played card to its actual effect
export function resolveCard(card, remainingHand) {
  if (card.type === CardType.BIG_JOKER) return 'big';
  if (card.type === CardType.SMALL_JOKER) return 'small';
  // Wild card
  return resolveWild(remainingHand);
}

// Generate a 6-digit room code
export function generateRoomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Generate a player token for reconnection
export function generateToken() {
  return randomUUID();
}
