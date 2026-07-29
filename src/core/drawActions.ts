import { isPlayable, isWild } from "./cardRules";
import { addLog } from "./lobby";
import { advanceTurn, drawFromPile } from "./round";
import type { GameState } from "./types";

export function drawCard(
  state: GameState,
  playerId: string,
  playCard: (playerId: string, cardId: string) => boolean,
): boolean {
  if (state.phase !== "PLAYING") return false;
  if (state.players[state.activePlayerIndex]?.id !== playerId) return false;
  if (state.hasDrawnThisTurn && state.pendingDraw === 0) return false;
  const player = state.players.find((p) => p.id === playerId)!;
  const hr = state.config.houseRules;
  const top = state.discardPile[state.discardPile.length - 1] ?? null;

  if (state.pendingDraw > 0) {
    const drawn = drawFromPile(state, state.pendingDraw);
    player.hand.push(...drawn);
    addLog(state, `${player.name} pioche ${drawn.length} carte(s).`, "warning");
    state.pendingDraw = 0;
    state.pendingDrawKind = null;
    state.wildDrawFourChallengeOpen = false;
    state.jumpInOpen = false;
    advanceTurn(state);
    return true;
  }

  if (hr.drawToMatch) {
    let drawn = drawFromPile(state, 1);
    while (
      drawn.length &&
      !isPlayable(
        drawn[drawn.length - 1]!,
        state.currentColor,
        top,
        0,
        null,
        false,
      )
    ) {
      player.hand.push(drawn[drawn.length - 1]!);
      drawn = drawFromPile(state, 1);
    }
    if (drawn.length) {
      const c = drawn[0]!;
      player.hand.push(c);
      state.hasDrawnThisTurn = true;
      if (hr.forcePlay && isPlayable(c, state.currentColor, top, 0, null, false)) {
        return playCard(playerId, c.id);
      }
    }
    if (!hr.forcePlay) advanceTurn(state);
    return true;
  }

  const [c] = drawFromPile(state, 1);
  if (!c) return false;
  player.hand.push(c);
  state.hasDrawnThisTurn = true;
  addLog(state, `${player.name} pioche.`, "info");
  if (hr.forcePlay && isPlayable(c, state.currentColor, top, 0, null, false)) {
    if (isWild(c)) {
      state.phase = "COLOR_PICK";
      state.colorPickerPlayerId = playerId;
    }
    return playCard(playerId, c.id);
  }
  return true;
}

export function passTurn(state: GameState, playerId: string): boolean {
  if (state.phase !== "PLAYING") return false;
  if (state.players[state.activePlayerIndex]?.id !== playerId) return false;
  if (!state.hasDrawnThisTurn) return false;
  advanceTurn(state);
  return true;
}

export function callUno(state: GameState, playerId: string): boolean {
  const p = state.players.find((x) => x.id === playerId);
  if (!p || p.hand.length !== 1) return false;
  p.calledUno = true;
  if (state.unoPendingPlayerId === playerId) {
    state.unoPendingPlayerId = null;
    state.unoWindowUntil = null;
  }
  addLog(state, `${p.name} : UNO !`, "success");
  return true;
}

export function challengeUno(
  state: GameState,
  challengerId: string,
  targetId: string,
): boolean {
  if (challengerId === targetId) return false;
  const target = state.players.find((p) => p.id === targetId);
  const challenger = state.players.find((p) => p.id === challengerId);
  if (!target || !challenger) return false;
  if (target.hand.length !== 1 || target.calledUno) return false;

  const drawn = drawFromPile(state, 2);
  target.hand.push(...drawn);
  target.calledUno = false;
  state.unoPendingPlayerId = null;
  state.unoWindowUntil = null;
  addLog(state, `${challenger.name} Contre UNO ! ${target.name} +2.`, "danger");
  return true;
}

export function challengeWildDrawFour(
  state: GameState,
  challengerId: string,
): boolean {
  const hr = state.config.houseRules;
  if (hr.noBluffing || !state.wildDrawFourChallengeOpen) return false;
  if (state.players[state.activePlayerIndex]?.id !== challengerId) return false;
  if (challengerId === state.wildDrawFourPlayerId) return false;
  const offender = state.players.find((p) => p.id === state.wildDrawFourPlayerId);
  const challenger = state.players.find((p) => p.id === challengerId);
  if (!offender || !challenger || !state.colorBeforeWildDrawFour) return false;

  state.wildDrawFourChallengeOpen = false;

  if (state.wildDrawFourWasBluff) {
    const drawn = drawFromPile(state, 4);
    offender.hand.push(...drawn);
    state.pendingDraw = 0;
    state.pendingDrawKind = null;
    addLog(state, `Challenge réussi ! ${offender.name} pioche 4.`, "success");
    return true;
  }
  const drawn = drawFromPile(state, state.pendingDraw + 2);
  challenger.hand.push(...drawn);
  state.pendingDraw = 0;
  state.pendingDrawKind = null;
  addLog(
    state,
    `Challenge raté ! ${challenger.name} pioche ${drawn.length}.`,
    "danger",
  );
  advanceTurn(state);
  return true;
}
