import { describe, expect, it } from "vitest";
import { handleHostAction } from "../../hooks/hostActions";
import { card, dealFixed, setupPlayers } from "./testHelpers";
import type { NetworkMessage } from "../../network/protocol";
import type { UnoGameEngine } from "../gameEngine";
import type { Rank } from "../types";

const noopJoin = {
  handleJoinGameSeat: () => ({ kind: "added_player" as const }),
};

function dispatch(
  eng: UnoGameEngine,
  actionName: string,
  playerId: string,
  payload: Record<string, unknown> = {},
) {
  const msg = {
    type: "ACTION",
    actionName,
    playerId,
    payload,
  } as NetworkMessage;
  handleHostAction(eng, "a", msg, () => {}, () => null as never, noopJoin as never);
}

describe("action security (turnNonce / spam draw)", () => {
  it("drops DRAW with stale turnNonce even if it becomes their turn", () => {
    const eng = setupPlayers(["a", "b"]);
    dealFixed(eng, {
      top: card("t", "RED", 1),
      drawPile: Array.from({ length: 30 }, (_, i) =>
        card(`d${i}`, "GREEN", (((i % 9) + 1) as Rank)),
      ),
      hands: {
        a: [card("ka", "RED", 2)],
        b: [card("kb", "BLUE", 3)],
      },
      activeId: "a",
    });
    const staleNonce = eng.state.turnNonce;

    for (let i = 0; i < 20; i++) {
      dispatch(eng, "DRAW", "b", { turnNonce: staleNonce });
    }
    expect(eng.state.players[1]!.hand.length).toBe(1);

    eng.state.activePlayerIndex = 1;
    eng.state.hasDrawnThisTurn = false;
    eng.state.turnNonce = staleNonce + 1;

    for (let i = 0; i < 20; i++) {
      dispatch(eng, "DRAW", "b", { turnNonce: staleNonce });
    }
    expect(eng.state.players[1]!.hand.length).toBe(1);

    dispatch(eng, "DRAW", "b", { turnNonce: eng.state.turnNonce });
    expect(eng.state.players[1]!.hand.length).toBe(2);
    dispatch(eng, "DRAW", "b", { turnNonce: eng.state.turnNonce });
    expect(eng.state.players[1]!.hand.length).toBe(2);
  });
});
