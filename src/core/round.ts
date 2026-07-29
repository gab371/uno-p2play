import { handPoints, teamScore } from "./cardRules";
import { buildDeckForPlayerCount, COLORS, shuffle } from "./decks";
import { addLog } from "./lobby";
import type { Card, Color, GameState, Player } from "./types";

export function syncDrawCount(state: GameState): void {
  state.drawPileCount = state.drawPile.length;
}

export function ensureDrawPile(state: GameState): void {
  if (state.drawPile.length > 0) return;
  const top = state.discardPile[state.discardPile.length - 1];
  const rest = state.discardPile.slice(0, -1);
  state.drawPile = shuffle(rest);
  state.discardPile = top ? [top] : [];
  syncDrawCount(state);
  addLog(state, "La défausse a été remélangée.", "system");
}

export function drawFromPile(state: GameState, n: number): Card[] {
  const drawn: Card[] = [];
  for (let i = 0; i < n; i++) {
    ensureDrawPile(state);
    const c = state.drawPile.pop();
    if (!c) break;
    drawn.push(c);
  }
  syncDrawCount(state);
  return drawn;
}

export function nextIndex(state: GameState, from = state.activePlayerIndex): number {
  const n = state.players.length;
  if (n === 0) return 0;
  return (from + state.direction + n * 10) % n;
}

export function advanceTurn(state: GameState, skip = false): void {
  state.activePlayerIndex = nextIndex(state);
  if (skip) state.activePlayerIndex = nextIndex(state);
  state.hasDrawnThisTurn = false;
  // jumpInOpen is managed by playCard (kept open after a play)
  state.wildDrawFourChallengeOpen = false;
}

export function dealRound(state: GameState): boolean {
  const players = state.players.filter((p) => !p.disconnected);
  if (players.length < 2) return false;
  if (state.config.mode === "TEAM_2V2") {
    const a = players.filter((p) => p.team === "A").length;
    const b = players.filter((p) => p.team === "B").length;
    if (players.length !== 4 || a !== 2 || b !== 2) {
      addLog(state, "2v2 : il faut 4 joueurs (2 vs 2).", "warning");
      return false;
    }
  }

  let deck = shuffle(buildDeckForPlayerCount(players.length));
  state.players.forEach((p) => {
    p.hand = [];
    p.calledUno = false;
  });

  for (let i = 0; i < 7; i++) {
    for (const p of players) {
      const c = deck.pop();
      if (c) p.hand.push(c);
    }
  }

  // Flip first non-wild (+4) discard
  let first: Card | undefined;
  while (deck.length) {
    first = deck.pop();
    if (!first) break;
    if (first.rank === "WILD_DRAW_FOUR") {
      deck = shuffle([first, ...deck]);
      continue;
    }
    break;
  }
  if (!first) return false;

  state.drawPile = deck;
  state.discardPile = [first];
  state.lastPlayedCard = first;
  if (first.color === "WILD") {
    state.currentColor = COLORS[Math.floor(Math.random() * COLORS.length)]!;
  } else {
    state.currentColor = first.color as Color;
  }
  state.pendingDraw = 0;
  state.pendingDrawKind = null;
  state.unoPendingPlayerId = null;
  state.unoWindowUntil = null;
  state.wildDrawFourChallengeOpen = false;
  state.wildDrawFourPlayerId = null;
  state.colorBeforeWildDrawFour = null;
  state.wildDrawFourWasBluff = false;
  state.colorPickerPlayerId = null;
  state.swapPickerPlayerId = null;
  state.jumpInOpen = false;
  state.hasDrawnThisTurn = false;
  state.direction = 1;
  state.activePlayerIndex = 0;
  state.roundWinnerId = null;
  state.phase = "PLAYING";
  syncDrawCount(state);

  // Apply opening action card lightly
  if (first.rank === "SKIP") advanceTurn(state, false);
  else if (first.rank === "REVERSE" && players.length === 2) advanceTurn(state, false);
  else if (first.rank === "REVERSE") state.direction = -1;
  else if (first.rank === "DRAW_TWO") {
    state.pendingDraw = 2;
    state.pendingDrawKind = "DRAW_TWO";
  } else if (first.rank === "WILD") {
    /* color already random */
  }

  addLog(state, "Nouvelle manche — bonne chance !", "success");
  return true;
}

export function endRound(state: GameState, winner: Player): void {
  const points = state.players
    .filter((p) => p.id !== winner.id)
    .reduce((sum, p) => sum + handPoints(p.hand), 0);

  if (state.config.mode === "TEAM_2V2" && winner.team) {
    state.players
      .filter((p) => p.team === winner.team)
      .forEach((p) => {
        p.score += points;
      });
    state.winningTeam = null;
    const teamPts = teamScore(state, winner.team);
    addLog(
      state,
      `Manche gagnée par l'équipe ${winner.team} (+${points}, total ${teamPts}).`,
      "success",
    );
    if (teamPts >= state.config.scoreLimit) {
      state.phase = "GAME_OVER";
      state.winningTeam = winner.team;
      state.winnerId = winner.id;
      addLog(state, `Équipe ${winner.team} remporte la partie !`, "success");
      return;
    }
  } else {
    winner.score += points;
    addLog(
      state,
      `${winner.name} gagne la manche (+${points}, total ${winner.score}).`,
      "success",
    );
    if (winner.score >= state.config.scoreLimit) {
      state.phase = "GAME_OVER";
      state.winnerId = winner.id;
      addLog(state, `${winner.name} remporte la partie !`, "success");
      return;
    }
  }

  state.roundWinnerId = winner.id;
  state.phase = "ROUND_END";
  state.jumpInOpen = false;
  state.pendingDraw = 0;
}
