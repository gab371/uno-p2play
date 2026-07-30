import { cardsIdentical, isPlayable, isWild } from "./cardRules";
import {
  applyCardEffect,
  chooseColor as chooseColorFn,
  chooseSwapTarget as chooseSwapFn,
} from "./effects";
import {
  callUno as callUnoFn,
  challengeUno as challengeUnoFn,
  challengeWildDrawFour as challengeWildFn,
  drawCard as drawCardFn,
  passTurn as passTurnFn,
} from "./drawActions";
import { DEFAULT_GAME_CONFIG, UNO_CALL_WINDOW_MS } from "./houseRules";
import {
  addPlayer,
  addSpectator,
  isDisconnected,
  markDisconnected,
  remapPlayerId,
  removePlayer,
  setPlayerRole,
  setSpectatorLock,
  setTeam,
  addLog,
} from "./lobby";
import { bumpTurnNonce, dealRound, endRound } from "./round";
import type { Color, GameConfig, GameState } from "./types";

function initialState(): GameState {
  return {
    phase: "LOBBY",
    config: structuredClone(DEFAULT_GAME_CONFIG),
    players: [],
    spectators: [],
    spectatorLocks: {},
    direction: 1,
    activePlayerIndex: 0,
    drawPile: [],
    drawPileCount: 0,
    discardPile: [],
    currentColor: "RED",
    pendingDraw: 0,
    pendingDrawKind: null,
    unoPendingPlayerId: null,
    unoWindowUntil: null,
    wildDrawFourChallengeOpen: false,
    wildDrawFourPlayerId: null,
    colorBeforeWildDrawFour: null,
    wildDrawFourWasBluff: false,
    colorPickerPlayerId: null,
    swapPickerPlayerId: null,
    jumpInOpen: false,
    lastPlayedCard: null,
    hasDrawnThisTurn: false,
    turnNonce: 0,
    winnerId: null,
    winningTeam: null,
    roundWinnerId: null,
    logs: [],
  };
}

export class UnoGameEngine {
  public state: GameState = initialState();

  addPlayer(id: string, name: string, avatar: string, isHost: boolean) {
    addPlayer(this.state, id, name, avatar, isHost);
  }
  addSpectator(id: string, name: string, avatar: string) {
    addSpectator(this.state, id, name, avatar);
  }
  removePlayer(id: string) {
    removePlayer(this.state, id);
  }
  setPlayerReady(id: string, ready: boolean) {
    const p = this.state.players.find((x) => x.id === id);
    if (p) p.isReady = ready;
  }
  setPlayerRole(
    targetId: string,
    role: "player" | "spectator",
    meta: { requesterPeerId: string; requesterIsHost: boolean },
  ) {
    setPlayerRole(this.state, targetId, role, meta);
  }
  setSpectatorLock(peerId: string, locked: boolean) {
    setSpectatorLock(this.state, peerId, locked);
  }
  markDisconnected(id: string) {
    markDisconnected(this.state, id);
  }
  isDisconnected(id: string) {
    return isDisconnected(this.state, id);
  }
  remapPlayerId(oldId: string, newId: string): boolean {
    remapPlayerId(this.state, oldId, newId);
    return true;
  }
  setTeam(playerId: string, team: "A" | "B" | undefined) {
    return setTeam(this.state, playerId, team);
  }

  setConfig(partial: Partial<GameConfig>): boolean {
    if (this.state.phase !== "LOBBY") return false;
    const next = { ...this.state.config, ...partial };
    if (partial.houseRules) {
      next.houseRules = { ...this.state.config.houseRules, ...partial.houseRules };
    }
    this.state.config = next;
    addLog(this.state, "Configuration mise à jour.", "system");
    return true;
  }

  startGame(): boolean {
    if (this.state.phase !== "LOBBY" && this.state.phase !== "ROUND_END") return false;
    this.state.winnerId = null;
    this.state.winningTeam = null;
    return dealRound(this.state);
  }

  startNextRound(): boolean {
    if (this.state.phase !== "ROUND_END") return false;
    return dealRound(this.state);
  }

  playCard(
    playerId: string,
    cardId: string,
    opts?: { chosenColor?: Color; jumpIn?: boolean },
  ): boolean {
    const s = this.state;
    if (s.phase !== "PLAYING" && s.phase !== "COLOR_PICK") return false;
    const player = s.players.find((p) => p.id === playerId);
    if (!player) return false;
    const cardIdx = player.hand.findIndex((c) => c.id === cardId);
    if (cardIdx < 0) return false;
    const card = player.hand[cardIdx]!;
    const top = s.discardPile[s.discardPile.length - 1] ?? null;
    const hr = s.config.houseRules;

    const isActive = s.players[s.activePlayerIndex]?.id === playerId;
    if (opts?.jumpIn) {
      if (!hr.jumpIn || !s.jumpInOpen || !s.lastPlayedCard) return false;
      if (!cardsIdentical(card, s.lastPlayedCard)) return false;
    } else if (!isActive) {
      return false;
    }

    if (
      !isPlayable(
        card,
        s.currentColor,
        top,
        s.pendingDraw,
        s.pendingDrawKind,
        hr.stacking,
      )
    ) {
      return false;
    }

    const bluff =
      card.rank === "WILD_DRAW_FOUR" &&
      player.hand.some(
        (c, i) => i !== cardIdx && c.color === s.currentColor && !isWild(c),
      );

    player.hand.splice(cardIdx, 1);
    s.discardPile.push(card);
    s.lastPlayedCard = card;
    s.hasDrawnThisTurn = false;
    s.wildDrawFourChallengeOpen = false;
    s.wildDrawFourWasBluff = bluff;

    if (opts?.jumpIn) {
      s.activePlayerIndex = s.players.findIndex((p) => p.id === playerId);
      bumpTurnNonce(s);
      addLog(s, `${player.name} joue à la volée !`, "action");
    }

    applyCardEffect(s, playerId, card, opts?.chosenColor);

    if (s.phase === "PLAYING" || s.phase === "COLOR_PICK" || s.phase === "SWAP_PICK") {
      s.jumpInOpen = hr.jumpIn;
    }

    if (player.hand.length === 0) {
      endRound(s, player);
      return true;
    }
    if (player.hand.length === 1) {
      player.calledUno = false;
      s.unoPendingPlayerId = playerId;
      s.unoWindowUntil = Date.now() + UNO_CALL_WINDOW_MS;
    }
    return true;
  }

  chooseColor(playerId: string, color: Color) {
    return chooseColorFn(this.state, playerId, color);
  }
  chooseSwapTarget(playerId: string, targetId: string) {
    return chooseSwapFn(this.state, playerId, targetId);
  }
  drawCard(playerId: string) {
    return drawCardFn(this.state, playerId, (id, cardId) =>
      this.playCard(id, cardId),
    );
  }
  passTurn(playerId: string) {
    return passTurnFn(this.state, playerId);
  }
  callUno(playerId: string) {
    return callUnoFn(this.state, playerId);
  }
  challengeUno(challengerId: string, targetId: string) {
    return challengeUnoFn(this.state, challengerId, targetId);
  }
  challengeWildDrawFour(challengerId: string) {
    return challengeWildFn(this.state, challengerId);
  }
}
