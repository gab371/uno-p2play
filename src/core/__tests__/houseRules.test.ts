import { describe, expect, it } from "vitest";
import {
  activeId,
  card,
  dealFixed,
  setupPlayers,
} from "./testHelpers";

describe("house rules toggles", () => {
  it("stacking: +2 then +2 accumulates", () => {
    const eng = setupPlayers(["a", "b"], { stacking: true });
    dealFixed(eng, {
      top: card("t", "RED", 1),
      hands: {
        a: [card("d2a", "RED", "DRAW_TWO"), card("ka", "YELLOW", 9)],
        b: [card("d2b", "BLUE", "DRAW_TWO"), card("kb", "GREEN", 8)],
      },
      activeId: "a",
    });
    eng.playCard("a", "d2a");
    expect(eng.state.pendingDraw).toBe(2);
    expect(eng.state.currentColor).toBe("RED");
    eng.playCard("b", "d2b");
    expect(eng.state.pendingDraw).toBe(4);
    expect(eng.state.currentColor).toBe("BLUE");
  });

  it("stacking: yellow +2 on blue +2 sets current color to yellow", () => {
    const eng = setupPlayers(["a", "b", "c"], { stacking: true });
    dealFixed(eng, {
      top: card("t", "GREEN", 3),
      currentColor: "BLUE",
      hands: {
        a: [card("d2b", "BLUE", "DRAW_TWO"), card("ka", "RED", 1)],
        b: [card("d2y", "YELLOW", "DRAW_TWO"), card("kb", "GREEN", 8)],
        c: [card("kc", "RED", 2)],
      },
      activeId: "a",
    });
    eng.playCard("a", "d2b");
    expect(eng.state.currentColor).toBe("BLUE");
    eng.playCard("b", "d2y");
    expect(eng.state.pendingDraw).toBe(4);
    expect(eng.state.currentColor).toBe("YELLOW");
  });

  it("stacking off: cannot answer +2 with +2", () => {
    const eng = setupPlayers(["a", "b"], { stacking: false });
    dealFixed(eng, {
      top: card("t", "RED", 1),
      hands: {
        a: [card("d2a", "RED", "DRAW_TWO"), card("ka", "YELLOW", 9)],
        b: [card("d2b", "BLUE", "DRAW_TWO"), card("kb", "GREEN", 8)],
      },
      activeId: "a",
    });
    eng.playCard("a", "d2a");
    expect(eng.playCard("b", "d2b")).toBe(false);
  });

  it("stacking: +4 on +4", () => {
    const eng = setupPlayers(["a", "b"], { stacking: true });
    dealFixed(eng, {
      top: card("t", "RED", 1),
      hands: {
        a: [card("p4a", "WILD", "WILD_DRAW_FOUR"), card("ka", "BLUE", 2)],
        b: [card("p4b", "WILD", "WILD_DRAW_FOUR"), card("kb", "GREEN", 8)],
      },
      activeId: "a",
    });
    eng.playCard("a", "p4a", { chosenColor: "YELLOW" });
    expect(eng.state.pendingDraw).toBe(4);
    eng.state.wildDrawFourChallengeOpen = false;
    eng.playCard("b", "p4b", { chosenColor: "GREEN" });
    expect(eng.state.pendingDraw).toBe(8);
  });

  it("sevenZero: 0 rotates hands", () => {
    const eng = setupPlayers(["a", "b"], { sevenZero: true });
    dealFixed(eng, {
      top: card("t", "RED", 1),
      hands: {
        a: [card("z", "RED", 0), card("x", "YELLOW", 2)],
        b: [card("y", "BLUE", 3)],
      },
      activeId: "a",
    });
    eng.playCard("a", "z");
    expect(eng.state.players[0]!.hand.map((c) => c.id)).toEqual(["y"]);
    expect(eng.state.players[1]!.hand.map((c) => c.id)).toContain("x");
  });

  it("sevenZero: red 7 on blue 7 updates current color", () => {
    const eng = setupPlayers(["a", "b", "c"], { sevenZero: true });
    dealFixed(eng, {
      top: card("t", "BLUE", 7),
      currentColor: "BLUE",
      hands: {
        a: [card("s7", "RED", 7), card("x", "YELLOW", 2)],
        b: [card("y", "BLUE", 3)],
        c: [card("z", "GREEN", 4)],
      },
      activeId: "a",
    });
    eng.playCard("a", "s7");
    expect(eng.state.currentColor).toBe("RED");
    expect(eng.state.phase).toBe("SWAP_PICK");
  });

  it("sevenZero: green 0 on blue 0 updates current color", () => {
    const eng = setupPlayers(["a", "b"], { sevenZero: true });
    dealFixed(eng, {
      top: card("t", "BLUE", 0),
      currentColor: "BLUE",
      hands: {
        a: [card("z", "GREEN", 0), card("x", "YELLOW", 2)],
        b: [card("y", "RED", 3)],
      },
      activeId: "a",
    });
    eng.playCard("a", "z");
    expect(eng.state.currentColor).toBe("GREEN");
  });

  it("sevenZero: 7 opens swap pick", () => {
    const eng = setupPlayers(["a", "b", "c"], { sevenZero: true });
    dealFixed(eng, {
      top: card("t", "RED", 1),
      hands: {
        a: [card("s7", "RED", 7), card("x", "YELLOW", 2)],
        b: [card("y", "BLUE", 3)],
        c: [card("z", "GREEN", 4)],
      },
      activeId: "a",
    });
    eng.playCard("a", "s7");
    expect(eng.state.phase).toBe("SWAP_PICK");
    expect(eng.chooseSwapTarget("a", "c")).toBe(true);
    expect(eng.state.players[0]!.hand.map((c) => c.id)).toEqual(["z"]);
    expect(eng.state.players[2]!.hand.map((c) => c.id)).toContain("x");
  });

  it("sevenZero off: 7 is a normal number", () => {
    const eng = setupPlayers(["a", "b"], { sevenZero: false });
    dealFixed(eng, {
      top: card("t", "RED", 1),
      hands: {
        a: [card("s7", "RED", 7), card("x", "YELLOW", 2)],
        b: [card("y", "BLUE", 3)],
      },
      activeId: "a",
    });
    eng.playCard("a", "s7");
    expect(eng.state.phase).toBe("PLAYING");
    expect(eng.state.swapPickerPlayerId).toBeNull();
    expect(activeId(eng)).toBe("b");
  });

  it("jumpIn: identical card steals turn", () => {
    const eng = setupPlayers(["a", "b"], { jumpIn: true });
    dealFixed(eng, {
      top: card("t", "RED", 4),
      hands: {
        a: [card("r5a", "RED", 5), card("ka", "YELLOW", 1)],
        b: [card("r5b", "RED", 5), card("kb", "BLUE", 2)],
      },
      activeId: "a",
    });
    eng.playCard("a", "r5a");
    expect(eng.state.jumpInOpen).toBe(true);
    expect(eng.playCard("b", "r5b", { jumpIn: true })).toBe(true);
    expect(activeId(eng)).toBe("a");
  });

  it("jumpIn off: cannot play out of turn", () => {
    const eng = setupPlayers(["a", "b"], { jumpIn: false });
    dealFixed(eng, {
      top: card("t", "RED", 5),
      hands: {
        a: [card("r5a", "RED", 5), card("ka", "YELLOW", 1)],
        b: [card("r5b", "RED", 5), card("kb", "BLUE", 2)],
      },
      activeId: "a",
    });
    eng.playCard("a", "r5a");
    expect(eng.playCard("b", "r5b", { jumpIn: true })).toBe(false);
  });

  it("forcePlay: playable draw is auto-played", () => {
    const eng = setupPlayers(["a", "b"], { forcePlay: true });
    dealFixed(eng, {
      top: card("t", "RED", 5),
      // pop() takes the last card first
      drawPile: [card("g1", "GREEN", 1), card("r3", "RED", 3)],
      hands: {
        a: [card("keep", "YELLOW", 9)],
        b: [card("kb", "BLUE", 2)],
      },
      activeId: "a",
    });
    expect(eng.drawCard("a")).toBe(true);
    expect(eng.state.discardPile.at(-1)?.id).toBe("r3");
    expect(activeId(eng)).toBe("b");
  });

  it("drawToMatch: keeps drawing until playable", () => {
    const eng = setupPlayers(["a", "b"], { drawToMatch: true });
    dealFixed(eng, {
      top: card("t", "RED", 5),
      // drawn order via pop: g1 → b2 → r7 (stops)
      drawPile: [
        card("y9", "YELLOW", 9),
        card("r7", "RED", 7),
        card("b2", "BLUE", 2),
        card("g1", "GREEN", 1),
      ],
      hands: {
        a: [card("keep", "YELLOW", 9)],
        b: [card("kb", "BLUE", 2)],
      },
      activeId: "a",
    });
    eng.drawCard("a");
    const ids = eng.state.players[0]!.hand.map((c) => c.id);
    expect(ids).toContain("g1");
    expect(ids).toContain("b2");
    expect(ids).toContain("r7");
    // Turn must stay with the drawer so they can play the matched card.
    expect(activeId(eng)).toBe("a");
    expect(eng.state.hasDrawnThisTurn).toBe(true);
    expect(eng.playCard("a", "r7")).toBe(true);
    expect(activeId(eng)).toBe("b");
  });

  it("UNO challenge works immediately (no grace block)", () => {
    const eng = setupPlayers(["a", "b"]);
    dealFixed(eng, {
      top: card("t", "RED", 1),
      drawPile: [card("d1", "GREEN", 1), card("d2", "GREEN", 2)],
      hands: {
        a: [card("only", "RED", 1)],
        b: [card("kb", "BLUE", 2)],
      },
      activeId: "b",
    });
    eng.state.players[0]!.calledUno = false;
    eng.state.unoPendingPlayerId = "a";
    eng.state.unoWindowUntil = Date.now() + 10_000;
    expect(eng.challengeUno("b", "a")).toBe(true);
    expect(eng.state.players[0]!.hand.length).toBe(3);
  });

  it("callUno blocks challenge", () => {
    const eng = setupPlayers(["a", "b"]);
    dealFixed(eng, {
      top: card("t", "RED", 1),
      hands: {
        a: [card("only", "RED", 1)],
        b: [card("kb", "BLUE", 2)],
      },
      activeId: "a",
    });
    expect(eng.callUno("a")).toBe(true);
    eng.state.unoPendingPlayerId = "a";
    eng.state.unoWindowUntil = Date.now() - 1;
    expect(eng.challengeUno("b", "a")).toBe(false);
  });
});
