export type Color = "RED" | "YELLOW" | "GREEN" | "BLUE";
export type Rank =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | "SKIP"
  | "REVERSE"
  | "DRAW_TWO"
  | "WILD"
  | "WILD_DRAW_FOUR";

export interface Card {
  id: string;
  color: Color | "WILD";
  rank: Rank;
}

export type GameMode = "CLASSIC" | "TEAM_2V2";
export type TeamId = "A" | "B";
export type GamePhase =
  | "LOBBY"
  | "PLAYING"
  | "COLOR_PICK"
  | "SWAP_PICK"
  | "ROUND_END"
  | "GAME_OVER";

export interface HouseRulesConfig {
  stacking: boolean;
  sevenZero: boolean;
  jumpIn: boolean;
  forcePlay: boolean;
  drawToMatch: boolean;
  noBluffing: boolean;
}

export interface GameConfig {
  mode: GameMode;
  houseRules: HouseRulesConfig;
  scoreLimit: number;
}

export interface Player {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
  isReady: boolean;
  hand: Card[];
  score: number;
  team?: TeamId;
  disconnected?: boolean;
  calledUno: boolean;
}

export interface Spectator {
  id: string;
  name: string;
  avatar: string;
  disconnected?: boolean;
}

export interface GameLog {
  id: string;
  timestamp: string;
  message: string;
  type: "info" | "system" | "warning" | "success" | "danger" | "action";
}

export interface GameState {
  phase: GamePhase;
  config: GameConfig;
  players: Player[];
  spectators: Spectator[];
  spectatorLocks: Record<string, boolean>;
  direction: 1 | -1;
  activePlayerIndex: number;
  drawPile: Card[];
  drawPileCount: number;
  discardPile: Card[];
  currentColor: Color;
  pendingDraw: number;
  pendingDrawKind: "DRAW_TWO" | "WILD_DRAW_FOUR" | null;
  unoPendingPlayerId: string | null;
  unoWindowUntil: number | null;
  wildDrawFourChallengeOpen: boolean;
  wildDrawFourPlayerId: string | null;
  colorBeforeWildDrawFour: Color | null;
  /** True if +4 player still had a matching color card when playing (illegal). */
  wildDrawFourWasBluff: boolean;
  colorPickerPlayerId: string | null;
  swapPickerPlayerId: string | null;
  jumpInOpen: boolean;
  lastPlayedCard: Card | null;
  hasDrawnThisTurn: boolean;
  winnerId: string | null;
  winningTeam: TeamId | null;
  roundWinnerId: string | null;
  logs: GameLog[];
}
