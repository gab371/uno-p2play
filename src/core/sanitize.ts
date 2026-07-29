import { partnerId } from "./cardRules";
import type { Card, GameState } from "./types";

function hideHand(hand: Card[]): Card[] {
  return hand.map((_, i) => ({
    id: `hidden-${i}`,
    color: "WILD" as const,
    rank: "WILD" as const,
  }));
}

/** Per-viewer sanitization: hide opponents' hands (show 2v2 partner). */
export function sanitizeForPlayer(
  state: GameState,
  playerId: string,
): GameState {
  const clone: GameState = structuredClone(state);
  clone.drawPile = [];
  const partner = partnerId(state, playerId);
  clone.players = clone.players.map((p) => {
    if (p.id === playerId || p.id === partner) return p;
    return { ...p, hand: hideHand(p.hand) };
  });
  return clone;
}

export function sanitizeForSpectator(state: GameState): GameState {
  const clone: GameState = structuredClone(state);
  clone.drawPile = [];
  clone.players = clone.players.map((p) => ({
    ...p,
    hand: hideHand(p.hand),
  }));
  return clone;
}
