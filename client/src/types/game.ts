export type CardType = 'big_joker' | 'small_joker' | 'wild';
export type GameStatus = 'waiting' | 'playing' | 'ended';
export type ActualEffect = 'big' | 'small';

export interface CardView {
  id: string;
  type: CardType;
  hint?: 'big' | 'small';
}

export interface OpponentView {
  index: number;
  name: string;
  cardCount: number;
  score: number;
  isReady: boolean;
  connected: boolean;
}

export interface TurnResult {
  roundIndex: number;
  turnIndex: number;
  p1Card: CardType;
  p2Card: CardType;
  p1Actual: ActualEffect;
  p2Actual: ActualEffect;
  p1ScoreGain: number;
  p2ScoreGain: number;
  p1TotalScore: number;
  p2TotalScore: number;
}

export interface GameState {
  connected: boolean;
  roomId: string | null;
  playerIndex: number | null;
  token: string | null;
  name: string | null;
  status: GameStatus | null;
  currentRound: number;
  currentTurn: number;
  myHand: CardView[];
  myScore: number;
  isReady: boolean;
  hasSubmitted: boolean;
  opponent: OpponentView | null;
  allTurns: TurnResult[];       // flat list of all turns across all rounds
  winner: number | null | undefined;
  selectedCardId: string | null;
  opponentConfirmed: boolean;
  lastTurnResult: TurnResult | null;
  showingResult: boolean;
  roundJustEnded: number | null; // round number that just ended (for summary display)
  opponentVotedRematch: boolean;
  iVotedRematch: boolean;
}

export type PageView = 'home' | 'rules' | 'room' | 'game';
