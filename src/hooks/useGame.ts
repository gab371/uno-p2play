import { useEffect, useRef, useState, useCallback } from "react";
import {
  attachPresenceHandlers,
  createSeatEngine,
  handleJoinGameSeat,
} from "p2play-core/presence";
import { usePeer } from "./usePeer";
import { handleHostAction } from "./hostActions";
import { UnoGameEngine } from "../core/gameEngine";
import {
  sanitizeGameState,
  sanitizeGameStateForSpectator,
} from "../network/protocol";
import type { NetworkMessage } from "../network/protocol";
import type { Color, GameConfig, GameState, TeamId } from "../core/types";
import { isDebugModeAllowed } from "../lib/debugMode";

interface UseGameOptions {
  externalPeerManager?: import("p2play-core").PeerManagerLike;
  playerName?: string;
  playerAvatar?: string;
  isEmbedded?: boolean;
  isHost?: boolean;
  lateJoin?: boolean;
  gameConfig?: unknown;
  hubPhase?: string;
}

export function useGame(options?: UseGameOptions) {
  const p2p = usePeer(options);
  const {
    isHost,
    myPeerId,
    peerManager,
    playSfx,
    hostGame,
    joinGame,
    sendAction,
    sendChat,
    gameState,
    status,
    error,
    chatMessages,
    disconnect,
  } = p2p;

  const gameEngineRef = useRef<UnoGameEngine | null>(null);
  const victoryPlayedRef = useRef(false);
  const [localPlayerName, setLocalPlayerName] = useState(options?.playerName || "");
  const [localPlayerAvatar, setLocalPlayerAvatar] = useState(
    options?.playerAvatar || "🃏",
  );

  const broadcastSanitizedStates = useCallback(
    (engineState: GameState, overridePeerId?: string) => {
      const activePeerId = overridePeerId || myPeerId;
      if (!activePeerId) return;
      for (const p of engineState.players) {
        peerManager.registerPeerProfile?.(p.id, { username: p.name, avatar: p.avatar });
      }
      for (const s of engineState.spectators) {
        peerManager.registerPeerProfile?.(s.id, { username: s.name, avatar: s.avatar });
      }
      const sent = new Set<string>([activePeerId]);
      const resolveConn = (id: string) => {
        let conn = peerManager.connections.get(id);
        if (!conn) {
          for (const [peerId, connection] of peerManager.connections.entries()) {
            if (peerId.endsWith(id) || id.endsWith(peerId)) {
              conn = connection;
              break;
            }
          }
        }
        return conn;
      };

      p2p.peerManager.onStateReceived?.(
        JSON.parse(JSON.stringify(sanitizeGameState(engineState, activePeerId))),
      );

      engineState.players.forEach((p) => {
        if (p.id === activePeerId) return;
        const conn = resolveConn(p.id);
        if (conn?.open) {
          conn.send({
            type: "STATE_UPDATE",
            state: sanitizeGameState(engineState, p.id),
          });
          sent.add(p.id);
          sent.add(conn.peer);
        }
      });

      const spectatorView = sanitizeGameStateForSpectator(engineState);
      engineState.spectators.forEach((s) => {
        const conn = resolveConn(s.id);
        if (conn?.open) {
          conn.send({
            type: "STATE_UPDATE",
            state: JSON.parse(JSON.stringify(spectatorView)),
          });
          sent.add(s.id);
          sent.add(conn.peer);
        }
      });

      peerManager.connections.forEach((conn, peerId) => {
        if (!conn.open || sent.has(peerId) || sent.has(conn.peer)) return;
        conn.send({
          type: "STATE_UPDATE",
          state: JSON.parse(JSON.stringify(spectatorView)),
        });
      });
    },
    [myPeerId, peerManager, p2p.peerManager],
  );

  useEffect(() => {
    if (!isHost) {
      gameEngineRef.current = null;
      return;
    }
    if (!gameEngineRef.current) gameEngineRef.current = new UnoGameEngine();
    const engine = gameEngineRef.current;

    if (
      options?.isEmbedded &&
      options?.externalPeerManager &&
      engine.state.phase === "LOBBY"
    ) {
      setTimeout(() => {
        engine.state.players = [];
        engine.addPlayer(
          myPeerId!,
          options.playerName || "Hôte",
          options.playerAvatar || "🃏",
          true,
        );
        peerManager.lobbyPlayers?.forEach((p) => {
          if (p.peerId && p.peerId !== myPeerId) {
            engine.addPlayer(
              p.peerId,
              p.username || `Joueur ${p.peerId.slice(0, 4)}`,
              p.avatar || "👤",
              false,
            );
          }
        });
        broadcastSanitizedStates(engine.state);
      }, 0);
    }

    const getSeatEngine = () =>
      createSeatEngine({
        getPhase: () => engine.state.phase,
        getPlayers: () => engine.state.players,
        getSpectators: () => engine.state.spectators,
        markDisconnected: (id) => engine.markDisconnected(id),
        isDisconnected: (id) => engine.isDisconnected(id),
        remapPlayerId: (o, n) => engine.remapPlayerId(o, n),
        removePlayer: (id) => engine.removePlayer(id),
      });

    const presence = attachPresenceHandlers({
      peerManager,
      getEngine: getSeatEngine,
      onBroadcast: () => broadcastSanitizedStates(engine.state),
      onHostAction: (senderPeerId, actionMsg) => {
        const raw = actionMsg as NetworkMessage;
        // Never trust client-supplied playerId — identity is the DataConnection peer.
        const msg =
          raw.type === "ACTION"
            ? ({ ...raw, playerId: senderPeerId } as NetworkMessage)
            : raw;
        handleHostAction(
          engine,
          myPeerId,
          msg,
          playSfx,
          getSeatEngine,
          {
            handleJoinGameSeat,
            getTrustedUsername: (id) => peerManager.getTrustedUsername?.(id),
          },
        );
        broadcastSanitizedStates(engine.state);
        if (engine.state.phase === "GAME_OVER" && !victoryPlayedRef.current) {
          victoryPlayedRef.current = true;
          playSfx("victory");
        } else if (engine.state.phase !== "GAME_OVER") {
          victoryPlayedRef.current = false;
        }
      },
    });

    return () => presence.dispose();
  }, [
    isHost,
    myPeerId,
    peerManager,
    playSfx,
    broadcastSanitizedStates,
    options?.isEmbedded,
    options?.externalPeerManager,
    options?.playerName,
    options?.playerAvatar,
  ]);

  /** Host-only console helpers: `window.__P2UNO_DEBUG__` (gated by VITE_ALLOW_DEBUG_MODE). */
  useEffect(() => {
    if (!isHost || !isDebugModeAllowed()) {
      delete (window as unknown as { __P2UNO_DEBUG__?: unknown }).__P2UNO_DEBUG__;
      return;
    }
    (window as unknown as {
      __P2UNO_DEBUG__: {
        engine: typeof gameEngineRef.current;
        myPeerId: string | null;
        sync: () => void;
      };
    }).__P2UNO_DEBUG__ = {
      get engine() {
        return gameEngineRef.current;
      },
      myPeerId,
      sync: () => {
        const eng = gameEngineRef.current;
        if (eng) broadcastSanitizedStates(eng.state);
      },
    };
    return () => {
      delete (window as unknown as { __P2UNO_DEBUG__?: unknown }).__P2UNO_DEBUG__;
    };
  }, [isHost, myPeerId, broadcastSanitizedStates]);

  useEffect(() => {
    if (!options?.isEmbedded || isHost || !myPeerId) return;
    const name = options.playerName || localPlayerName || "Joueur";
    const avatar = options.playerAvatar || localPlayerAvatar || "👤";
    const sendJoin = () => {
      peerManager.sendToHost("ACTION", {
        actionName: "JOIN_GAME",
        playerId: myPeerId,
        payload: { name, avatar },
      });
    };
    const timers = [250, 1000, 2500].map((ms) => window.setTimeout(sendJoin, ms));
    return () => timers.forEach(clearTimeout);
  }, [
    options?.isEmbedded,
    options?.playerName,
    options?.playerAvatar,
    isHost,
    myPeerId,
    localPlayerName,
    localPlayerAvatar,
    peerManager,
  ]);

  const hostRoom = useCallback(
    async (name: string, avatar: string) => {
      setLocalPlayerName(name);
      setLocalPlayerAvatar(avatar);
      const roomId = await hostGame(undefined, { username: name, avatar });
      const engine = new UnoGameEngine();
      gameEngineRef.current = engine;
      engine.addPlayer(roomId, name, avatar, true);
      broadcastSanitizedStates(engine.state, roomId);
    },
    [hostGame, broadcastSanitizedStates],
  );

  const joinRoom = useCallback(
    async (name: string, avatar: string, roomId: string) => {
      setLocalPlayerName(name);
      setLocalPlayerAvatar(avatar);
      const { peerId } = await joinGame(roomId, { username: name, avatar });
      setTimeout(() => {
        peerManager.sendToHost("ACTION", {
          actionName: "JOIN_GAME",
          playerId: peerId,
          payload: { name, avatar },
        });
      }, 1000);
    },
    [joinGame, peerManager],
  );

  /** Echo host `turnNonce` so stale/queued turn-bound actions are dropped. */
  const sendTurnAction = useCallback(
    (actionName: string, payload: Record<string, unknown> = {}) => {
      sendAction(actionName, {
        ...payload,
        turnNonce: gameState?.turnNonce ?? -1,
      });
    },
    [sendAction, gameState?.turnNonce],
  );

  return {
    isHost,
    myPeerId,
    hostPeerId: p2p.hostPeerId,
    connectedPeers: p2p.connectedPeers,
    chatMessages,
    gameState,
    status,
    error,
    hostRoom,
    joinRoom,
    toggleReady: (readyStatus: boolean) =>
      sendAction("TOGGLE_READY", { readyStatus }),
    startGame: () => sendAction("START_GAME", {}),
    nextRound: () => sendAction("NEXT_ROUND", {}),
    changeConfig: (config: Partial<GameConfig>) =>
      sendAction("CHANGE_CONFIG", { config }),
    setTeam: (peerId: string, team: TeamId) =>
      sendAction("SET_TEAM", { peerId, team }),
    setRole: (peerId: string, role: "player" | "spectator") =>
      sendAction("SET_ROLE", { peerId, role }),
    lockSpectator: (peerId: string, locked: boolean) =>
      sendAction("LOCK_SPECTATOR", { peerId, locked }),
    playCard: (cardId: string, chosenColor?: Color) =>
      sendTurnAction("PLAY_CARD", { cardId, chosenColor }),
    jumpIn: (cardId: string, chosenColor?: Color) =>
      sendTurnAction("JUMP_IN", { cardId, chosenColor }),
    drawCard: () => sendTurnAction("DRAW", {}),
    passTurn: () => sendTurnAction("PASS_TURN", {}),
    callUno: () => sendAction("CALL_UNO", {}),
    challengeUno: (targetId: string) =>
      sendAction("CHALLENGE_UNO", { targetId }),
    challengeWildDrawFour: () => sendTurnAction("CHALLENGE_WILD_DRAW_FOUR", {}),
    chooseColor: (color: Color) => sendTurnAction("CHOOSE_COLOR", { color }),
    chooseSwap: (targetId: string) => sendTurnAction("CHOOSE_SWAP", { targetId }),
    sendChatMessage: (text: string) =>
      sendChat(localPlayerName || "Joueur", text),
    disconnect,
    localPlayerName,
    localPlayerAvatar,
  };
}
