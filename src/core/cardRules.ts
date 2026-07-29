import type { Card, Color, GameState, TeamId } from "./types";

export function isWild(card: Card): boolean {
  return card.rank === "WILD" || card.rank === "WILD_DRAW_FOUR";
}

export function cardsIdentical(a: Card, b: Card): boolean {
  return a.color === b.color && a.rank === b.rank;
}

export function isPlayable(
  card: Card,
  currentColor: Color,
  topDiscard: Card | null,
  pendingDraw: number,
  pendingDrawKind: GameState["pendingDrawKind"],
  stacking: boolean,
): boolean {
  if (pendingDraw > 0) {
    if (!stacking || !pendingDrawKind) return false;
    if (pendingDrawKind === "DRAW_TWO") return card.rank === "DRAW_TWO";
    return card.rank === "WILD_DRAW_FOUR";
  }
  if (isWild(card)) return true;
  if (card.color === currentColor) return true;
  if (topDiscard && card.rank === topDiscard.rank) return true;
  return false;
}

export function cardPoints(card: Card): number {
  if (typeof card.rank === "number") return card.rank;
  if (card.rank === "WILD" || card.rank === "WILD_DRAW_FOUR") return 50;
  return 20;
}

export function handPoints(hand: Card[]): number {
  return hand.reduce((sum, c) => sum + cardPoints(c), 0);
}

export function teamScore(state: GameState, team: TeamId): number {
  return state.players
    .filter((p) => p.team === team)
    .reduce((sum, p) => sum + p.score, 0);
}

export function partnerId(state: GameState, playerId: string): string | null {
  const me = state.players.find((p) => p.id === playerId);
  if (!me?.team) return null;
  const partner = state.players.find(
    (p) => p.id !== playerId && p.team === me.team,
  );
  return partner?.id ?? null;
}
