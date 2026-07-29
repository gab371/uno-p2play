import type { GameState } from "../core/types";
import {
  sanitizeForPlayer,
  sanitizeForSpectator,
} from "../core/sanitize";

export type MessageType =
  | "JOIN"
  | "STATE_UPDATE"
  | "ACTION"
  | "CHAT"
  | "AUDIO_EVENT";

export type ClientActionType =
  | "JOIN_GAME"
  | "TOGGLE_READY"
  | "START_GAME"
  | "SET_ROLE"
  | "LOCK_SPECTATOR"
  | "CHANGE_CONFIG"
  | "SET_TEAM"
  | "PLAY_CARD"
  | "DRAW"
  | "PASS_TURN"
  | "CALL_UNO"
  | "CHALLENGE_UNO"
  | "CHALLENGE_WILD_DRAW_FOUR"
  | "CHOOSE_COLOR"
  | "CHOOSE_SWAP"
  | "JUMP_IN"
  | "NEXT_ROUND";

export interface ActionMessage {
  type: "ACTION";
  actionName: ClientActionType;
  playerId: string;
  payload: Record<string, unknown>;
}

export type NetworkMessage = ActionMessage | { type: "STATE_UPDATE"; state: GameState };

export function sanitizeGameState(
  state: GameState,
  targetPlayerId: string,
): GameState {
  return sanitizeForPlayer(state, targetPlayerId);
}

export function sanitizeGameStateForSpectator(state: GameState): GameState {
  return sanitizeForSpectator(state);
}
