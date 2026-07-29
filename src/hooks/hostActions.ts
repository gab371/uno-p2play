import type { UnoGameEngine } from "../core/gameEngine";
import type { Color, GameConfig, TeamId } from "../core/types";
import type { NetworkMessage } from "../network/protocol";

type PlaySfx = (name: string) => void;

/** Host-side ACTION dispatch — kept out of useGame to stay under 300 LOC. */
export function handleHostAction(
  engine: UnoGameEngine,
  myPeerId: string | null,
  msg: NetworkMessage,
  playSfx: PlaySfx,
  getSeatEngine: () => ReturnType<
    typeof import("p2play-core/presence").createSeatEngine
  >,
  joinHelpers: {
    handleJoinGameSeat: typeof import("p2play-core/presence").handleJoinGameSeat;
  },
): void {
  if (msg.type !== "ACTION") return;
  const { actionName, playerId, payload } = msg;
  const { handleJoinGameSeat } = joinHelpers;

  switch (actionName) {
    case "JOIN_GAME":
      handleJoinGameSeat({
        engine: getSeatEngine(),
        playerId,
        payload: {
          name: payload?.name as string,
          avatar: payload?.avatar as string,
        },
        isHostPlayer: playerId === myPeerId,
        addPlayer: (id, name, avatar, host) =>
          engine.addPlayer(id, name, avatar, host),
        addSpectator: (id, name, avatar) =>
          engine.addSpectator(id, name, avatar),
      });
      break;
    case "TOGGLE_READY":
      engine.setPlayerReady(playerId, !!payload.readyStatus);
      break;
    case "START_GAME":
      if (playerId === myPeerId) engine.startGame();
      break;
    case "NEXT_ROUND":
      if (playerId === myPeerId) engine.startNextRound();
      break;
    case "CHANGE_CONFIG":
      if (playerId === myPeerId)
        engine.setConfig(payload.config as Partial<GameConfig>);
      break;
    case "SET_TEAM":
      engine.setTeam(payload.peerId as string, payload.team as TeamId);
      break;
    case "SET_ROLE": {
      const targetId = payload.peerId as string;
      const nextRole = payload.role as "player" | "spectator";
      if (playerId === myPeerId || targetId === playerId) {
        engine.setPlayerRole(targetId, nextRole, {
          requesterPeerId: playerId,
          requesterIsHost: playerId === myPeerId,
        });
      }
      break;
    }
    case "LOCK_SPECTATOR":
      if (playerId === myPeerId) {
        const targetId = payload.peerId as string;
        const locked = !!payload.locked;
        if (locked) {
          engine.setPlayerRole(targetId, "spectator", {
            requesterPeerId: playerId,
            requesterIsHost: true,
          });
        }
        engine.setSpectatorLock(targetId, locked);
      }
      break;
    case "PLAY_CARD":
      if (
        engine.playCard(playerId, payload.cardId as string, {
          chosenColor: payload.chosenColor as Color | undefined,
        })
      )
        playSfx("card");
      break;
    case "JUMP_IN":
      if (
        engine.playCard(playerId, payload.cardId as string, {
          jumpIn: true,
          chosenColor: payload.chosenColor as Color | undefined,
        })
      )
        playSfx("card");
      break;
    case "DRAW":
      if (engine.drawCard(playerId)) playSfx("draw");
      break;
    case "PASS_TURN":
      engine.passTurn(playerId);
      playSfx("click");
      break;
    case "CALL_UNO":
      if (engine.callUno(playerId)) playSfx("uno");
      break;
    case "CHALLENGE_UNO":
      engine.challengeUno(playerId, payload.targetId as string);
      playSfx("click");
      break;
    case "CHALLENGE_WILD_DRAW_FOUR":
      engine.challengeWildDrawFour(playerId);
      playSfx("click");
      break;
    case "CHOOSE_COLOR":
      if (engine.chooseColor(playerId, payload.color as Color)) playSfx("wild");
      break;
    case "CHOOSE_SWAP":
      engine.chooseSwapTarget(playerId, payload.targetId as string);
      playSfx("click");
      break;
  }
}
