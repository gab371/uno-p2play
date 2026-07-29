import { remapRecordKey } from "p2play-core/presence";
import type { GameState, Player, Spectator, TeamId } from "./types";

export function addLog(
  state: GameState,
  message: string,
  type: GameState["logs"][0]["type"] = "info",
): void {
  state.logs.unshift({
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    timestamp: new Date().toISOString(),
    message,
    type,
  });
  if (state.logs.length > 50) state.logs.pop();
}

export const MAX_PLAYERS = 8;

export function addPlayer(
  state: GameState,
  id: string,
  name: string,
  avatar: string,
  isHost: boolean,
): void {
  if (state.players.some((p) => p.id === id)) return;
  if (state.players.length >= MAX_PLAYERS) {
    addSpectator(state, id, name, avatar);
    addLog(state, `${name} rejoint en spectateur (table pleine)`, "system");
    return;
  }
  state.spectators = state.spectators.filter((s) => s.id !== id);
  const player: Player = {
    id,
    name,
    avatar,
    isHost,
    isReady: isHost,
    hand: [],
    score: 0,
    calledUno: false,
  };
  state.players.push(player);
}

export function addSpectator(
  state: GameState,
  id: string,
  name: string,
  avatar: string,
): void {
  if (state.spectators.some((s) => s.id === id)) return;
  state.players = state.players.filter((p) => p.id !== id);
  const s: Spectator = { id, name, avatar };
  state.spectators.push(s);
}

export function removePlayer(state: GameState, id: string): void {
  const idx = state.players.findIndex((p) => p.id === id);
  if (idx >= 0) {
    state.players.splice(idx, 1);
    if (state.activePlayerIndex >= state.players.length) {
      state.activePlayerIndex = 0;
    }
  }
  state.spectators = state.spectators.filter((s) => s.id !== id);
  delete state.spectatorLocks[id];
}

export function setPlayerRole(
  state: GameState,
  targetId: string,
  role: "player" | "spectator",
  meta: { requesterPeerId: string; requesterIsHost: boolean },
): void {
  if (state.spectatorLocks[targetId] && !meta.requesterIsHost) return;
  if (role === "spectator") {
    const p = state.players.find((x) => x.id === targetId);
    if (!p) return;
    addSpectator(state, p.id, p.name, p.avatar);
  } else {
    if (state.players.length >= MAX_PLAYERS) return;
    const s = state.spectators.find((x) => x.id === targetId);
    if (!s) return;
    addPlayer(state, s.id, s.name, s.avatar, false);
  }
}

export function setSpectatorLock(
  state: GameState,
  peerId: string,
  locked: boolean,
): void {
  if (locked) state.spectatorLocks[peerId] = true;
  else delete state.spectatorLocks[peerId];
}

export function markDisconnected(state: GameState, id: string): void {
  const p = state.players.find((x) => x.id === id);
  if (p) p.disconnected = true;
  const s = state.spectators.find((x) => x.id === id);
  if (s) s.disconnected = true;
}

export function isDisconnected(state: GameState, id: string): boolean {
  return !!(
    state.players.find((p) => p.id === id)?.disconnected ||
    state.spectators.find((s) => s.id === id)?.disconnected
  );
}

export function remapPlayerId(
  state: GameState,
  oldId: string,
  newId: string,
): void {
  const p = state.players.find((x) => x.id === oldId);
  if (p) {
    p.id = newId;
    p.disconnected = false;
  }
  const s = state.spectators.find((x) => x.id === oldId);
  if (s) {
    s.id = newId;
    s.disconnected = false;
  }
  if (state.unoPendingPlayerId === oldId) state.unoPendingPlayerId = newId;
  if (state.wildDrawFourPlayerId === oldId) state.wildDrawFourPlayerId = newId;
  if (state.colorPickerPlayerId === oldId) state.colorPickerPlayerId = newId;
  if (state.swapPickerPlayerId === oldId) state.swapPickerPlayerId = newId;
  if (state.winnerId === oldId) state.winnerId = newId;
  if (state.roundWinnerId === oldId) state.roundWinnerId = newId;
  remapRecordKey(state.spectatorLocks, oldId, newId);
}

export function setTeam(
  state: GameState,
  playerId: string,
  team: TeamId | undefined,
): boolean {
  if (state.phase !== "LOBBY") return false;
  const p = state.players.find((x) => x.id === playerId);
  if (!p) return false;
  p.team = team;
  return true;
}
