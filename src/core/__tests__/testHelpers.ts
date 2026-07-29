import { UnoGameEngine } from "../gameEngine";
import { resetCardSeq } from "../decks";
import type { Card, Color, HouseRulesConfig, Rank } from "../types";

export function card(
  id: string,
  color: Color | "WILD",
  rank: Rank,
): Card {
  return { id, color, rank };
}

export function setupPlayers(
  ids: string[],
  hr: Partial<HouseRulesConfig> = {},
): UnoGameEngine {
  resetCardSeq(0);
  const eng = new UnoGameEngine();
  ids.forEach((id, i) => {
    eng.addPlayer(id, id.toUpperCase(), "🃏", i === 0);
  });
  eng.setConfig({ houseRules: { ...eng.state.config.houseRules, ...hr } });
  eng.startGame();
  return eng;
}

/** Bypass shuffle: fixed discard top + hands + active player. */
export function dealFixed(
  eng: UnoGameEngine,
  opts: {
    top: Card;
    currentColor?: Color;
    hands: Record<string, Card[]>;
    activeId: string;
    direction?: 1 | -1;
    drawPile?: Card[];
  },
): void {
  eng.state.phase = "PLAYING";
  eng.state.discardPile = [opts.top];
  eng.state.lastPlayedCard = opts.top;
  eng.state.currentColor =
    opts.currentColor ??
    (opts.top.color === "WILD" ? "RED" : (opts.top.color as Color));
  eng.state.pendingDraw = 0;
  eng.state.pendingDrawKind = null;
  eng.state.wildDrawFourChallengeOpen = false;
  eng.state.wildDrawFourPlayerId = null;
  eng.state.colorBeforeWildDrawFour = null;
  eng.state.wildDrawFourWasBluff = false;
  eng.state.jumpInOpen = false;
  eng.state.hasDrawnThisTurn = false;
  eng.state.direction = opts.direction ?? 1;
  if (opts.drawPile) {
    eng.state.drawPile = [...opts.drawPile];
    eng.state.drawPileCount = opts.drawPile.length;
  }
  for (const p of eng.state.players) {
    p.hand = opts.hands[p.id] ? [...opts.hands[p.id]!] : [];
    p.calledUno = false;
  }
  const idx = eng.state.players.findIndex((p) => p.id === opts.activeId);
  eng.state.activePlayerIndex = idx >= 0 ? idx : 0;
}

export function activeId(eng: UnoGameEngine): string {
  return eng.state.players[eng.state.activePlayerIndex]!.id;
}
