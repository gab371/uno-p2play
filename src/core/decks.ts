import type { Card, Color, Rank } from "./types";

export const COLORS: Color[] = ["RED", "YELLOW", "GREEN", "BLUE"];

const NUMBER_RANKS: Rank[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const ACTION_RANKS: Rank[] = ["SKIP", "REVERSE", "DRAW_TWO"];

let cardSeq = 0;

function makeCard(color: Card["color"], rank: Rank): Card {
  cardSeq += 1;
  return { id: `c${cardSeq}`, color, rank };
}

/** Standard 108-card deck. */
export function buildStandardDeck(): Card[] {
  const deck: Card[] = [];
  for (const color of COLORS) {
    deck.push(makeCard(color, 0));
    for (const rank of NUMBER_RANKS) {
      if (rank === 0) continue;
      deck.push(makeCard(color, rank), makeCard(color, rank));
    }
    for (const rank of ACTION_RANKS) {
      deck.push(makeCard(color, rank), makeCard(color, rank));
    }
  }
  for (let i = 0; i < 4; i++) {
    deck.push(makeCard("WILD", "WILD"));
    deck.push(makeCard("WILD", "WILD_DRAW_FOUR"));
  }
  return deck;
}

export function buildDeckForPlayerCount(playerCount: number): Card[] {
  const decks = playerCount > 6 ? 2 : 1;
  const out: Card[] = [];
  for (let i = 0; i < decks; i++) out.push(...buildStandardDeck());
  return out;
}

export function shuffle<T>(items: T[], rng: () => number = Math.random): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function resetCardSeq(n = 0): void {
  cardSeq = n;
}
