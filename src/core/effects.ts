import { COLORS } from "./decks";
import { addLog } from "./lobby";
import { advanceTurn } from "./round";
import type { Color, GameState, Rank } from "./types";

export function rotateHands(state: GameState): void {
  const hands = state.players.map((p) => p.hand);
  const n = hands.length;
  for (let i = 0; i < n; i++) {
    const from = (i - state.direction + n) % n;
    state.players[i]!.hand = hands[from]!;
    state.players[i]!.calledUno = state.players[i]!.hand.length === 1;
  }
}

export function applyCardEffect(
  state: GameState,
  playerId: string,
  card: { rank: Rank; color: Color | "WILD" },
  chosenColor?: Color,
): void {
  const hr = state.config.houseRules;
  const player = state.players.find((p) => p.id === playerId)!;

  if (card.rank === "SKIP") {
    if (card.color !== "WILD") state.currentColor = card.color;
    addLog(state, `${player.name} joue Passe.`, "action");
    advanceTurn(state, true);
    return;
  }
  if (card.rank === "REVERSE") {
    if (card.color !== "WILD") state.currentColor = card.color;
    if (state.players.length === 2) {
      addLog(state, `${player.name} inverse (= passe).`, "action");
      advanceTurn(state, true);
    } else {
      state.direction = state.direction === 1 ? -1 : 1;
      addLog(state, `${player.name} inverse le sens.`, "action");
      advanceTurn(state);
    }
    return;
  }
  if (card.rank === "DRAW_TWO") {
    if (card.color !== "WILD") state.currentColor = card.color;
    state.pendingDraw += 2;
    state.pendingDrawKind = "DRAW_TWO";
    addLog(state, `${player.name} joue +2 (pile ${state.pendingDraw}).`, "action");
    advanceTurn(state);
    return;
  }
  if (hr.sevenZero && card.rank === 7) {
    if (card.color !== "WILD") state.currentColor = card.color;
    state.phase = "SWAP_PICK";
    state.swapPickerPlayerId = playerId;
    addLog(state, `${player.name} doit échanger sa main (7).`, "action");
    return;
  }
  if (hr.sevenZero && card.rank === 0) {
    if (card.color !== "WILD") state.currentColor = card.color;
    rotateHands(state);
    addLog(state, "Toutes les mains tournent (0) !", "action");
    advanceTurn(state);
    return;
  }
  if (card.rank === "WILD" || card.rank === "WILD_DRAW_FOUR") {
    if (card.rank === "WILD_DRAW_FOUR") {
      state.colorBeforeWildDrawFour = state.currentColor;
      state.wildDrawFourPlayerId = playerId;
      state.pendingDraw += 4;
      state.pendingDrawKind = "WILD_DRAW_FOUR";
      // Challenge opens only once the next player is active (after color + turn).
      state.wildDrawFourChallengeOpen = false;
    }
    if (chosenColor && COLORS.includes(chosenColor)) {
      state.currentColor = chosenColor;
      addLog(state, `${player.name} choisit ${chosenColor}.`, "action");
      advanceTurn(state);
      if (card.rank === "WILD_DRAW_FOUR" && !hr.noBluffing) {
        state.wildDrawFourChallengeOpen = true;
      }
    } else {
      state.phase = "COLOR_PICK";
      state.colorPickerPlayerId = playerId;
      addLog(state, `${player.name} doit choisir une couleur.`, "action");
    }
    return;
  }
  if (card.color !== "WILD") state.currentColor = card.color;
  addLog(state, `${player.name} joue ${card.color} ${card.rank}.`, "action");
  advanceTurn(state);
}

export function chooseColor(
  state: GameState,
  playerId: string,
  color: Color,
): boolean {
  if (state.phase !== "COLOR_PICK" || state.colorPickerPlayerId !== playerId)
    return false;
  if (!COLORS.includes(color)) return false;
  const hr = state.config.houseRules;
  const openChallenge =
    state.pendingDrawKind === "WILD_DRAW_FOUR" && !hr.noBluffing;
  state.currentColor = color;
  state.phase = "PLAYING";
  state.colorPickerPlayerId = null;
  addLog(state, `Couleur : ${color}.`, "info");
  advanceTurn(state);
  if (openChallenge) state.wildDrawFourChallengeOpen = true;
  return true;
}

export function chooseSwapTarget(
  state: GameState,
  playerId: string,
  targetId: string,
): boolean {
  if (state.phase !== "SWAP_PICK" || state.swapPickerPlayerId !== playerId)
    return false;
  const a = state.players.find((p) => p.id === playerId);
  const b = state.players.find((p) => p.id === targetId);
  if (!a || !b || a.id === b.id) return false;
  const tmp = a.hand;
  a.hand = b.hand;
  b.hand = tmp;
  a.calledUno = a.hand.length === 1;
  b.calledUno = b.hand.length === 1;
  state.phase = "PLAYING";
  state.swapPickerPlayerId = null;
  addLog(state, `${a.name} échange avec ${b.name}.`, "action");
  advanceTurn(state);
  return true;
}
