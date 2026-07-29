import { describe, expect, it } from "vitest";
import {
  activeId,
  card,
  dealFixed,
  setupPlayers,
} from "./testHelpers";

describe("base rules", () => {
  it("matches color or rank", () => {
    const eng = setupPlayers(["a", "b"]);
    dealFixed(eng, {
      top: card("t", "RED", 5),
      hands: {
        a: [card("r3", "RED", 3), card("b5", "BLUE", 5), card("g9", "GREEN", 9)],
        b: [card("k", "YELLOW", 1)],
      },
      activeId: "a",
    });
    expect(eng.playCard("a", "r3")).toBe(true);
    eng.state.activePlayerIndex = 0;
    dealFixed(eng, {
      top: card("t2", "RED", 5),
      hands: { a: [card("b5", "BLUE", 5)], b: [card("k", "YELLOW", 1)] },
      activeId: "a",
    });
    expect(eng.playCard("a", "b5")).toBe(true);
  });

  it("rejects non-matching card", () => {
    const eng = setupPlayers(["a", "b"]);
    dealFixed(eng, {
      top: card("t", "RED", 5),
      hands: { a: [card("g9", "GREEN", 9)], b: [card("k", "YELLOW", 1)] },
      activeId: "a",
    });
    expect(eng.playCard("a", "g9")).toBe(false);
  });

  it("skip passes next player (3p)", () => {
    const eng = setupPlayers(["a", "b", "c"]);
    dealFixed(eng, {
      top: card("t", "RED", 1),
      hands: {
        a: [card("sk", "RED", "SKIP"), card("x", "BLUE", 2)],
        b: [card("b1", "BLUE", 1)],
        c: [card("c1", "GREEN", 1)],
      },
      activeId: "a",
    });
    eng.playCard("a", "sk");
    expect(activeId(eng)).toBe("c");
  });

  it("reverse flips direction (3p+)", () => {
    const eng = setupPlayers(["a", "b", "c"]);
    dealFixed(eng, {
      top: card("t", "RED", 1),
      direction: 1,
      hands: {
        a: [card("rv", "RED", "REVERSE"), card("x", "BLUE", 2)],
        b: [card("b1", "BLUE", 1)],
        c: [card("c1", "GREEN", 1)],
      },
      activeId: "a",
    });
    eng.playCard("a", "rv");
    expect(eng.state.direction).toBe(-1);
    expect(activeId(eng)).toBe("c");
  });

  it("reverse acts as skip with 2 players", () => {
    const eng = setupPlayers(["a", "b"]);
    dealFixed(eng, {
      top: card("t", "RED", 1),
      hands: {
        a: [card("rv", "RED", "REVERSE"), card("x", "BLUE", 2)],
        b: [card("b1", "BLUE", 1)],
      },
      activeId: "a",
    });
    eng.playCard("a", "rv");
    expect(eng.state.direction).toBe(1);
    expect(activeId(eng)).toBe("a");
  });

  it("+2 forces next to draw or stack", () => {
    const eng = setupPlayers(["a", "b"]);
    dealFixed(eng, {
      top: card("t", "RED", 1),
      drawPile: [
        card("d1", "GREEN", 1),
        card("d2", "GREEN", 2),
        card("d3", "GREEN", 3),
      ],
      hands: {
        a: [card("p2", "RED", "DRAW_TWO"), card("x", "BLUE", 2)],
        b: [card("keep", "YELLOW", 9)],
      },
      activeId: "a",
    });
    eng.playCard("a", "p2");
    expect(eng.state.pendingDraw).toBe(2);
    expect(activeId(eng)).toBe("b");
    expect(eng.playCard("b", "keep")).toBe(false);
    expect(eng.drawCard("b")).toBe(true);
    expect(eng.state.players[1]!.hand.length).toBe(3);
    expect(eng.state.pendingDraw).toBe(0);
  });

  it("wild changes color", () => {
    const eng = setupPlayers(["a", "b"]);
    dealFixed(eng, {
      top: card("t", "RED", 1),
      hands: {
        a: [card("w", "WILD", "WILD"), card("x", "BLUE", 2)],
        b: [card("keep", "YELLOW", 9)],
      },
      activeId: "a",
    });
    expect(eng.playCard("a", "w", { chosenColor: "BLUE" })).toBe(true);
    expect(eng.state.currentColor).toBe("BLUE");
    expect(activeId(eng)).toBe("b");
  });
});

describe("+4 challenge", () => {
  it("does not open challenge on the +4 player during color pick", () => {
    const eng = setupPlayers(["a", "b"]);
    dealFixed(eng, {
      top: card("t", "RED", 1),
      currentColor: "RED",
      hands: {
        a: [
          card("p4", "WILD", "WILD_DRAW_FOUR"),
          card("r9", "RED", 9),
          card("x", "BLUE", 2),
        ],
        b: [card("keep", "YELLOW", 9)],
      },
      activeId: "a",
    });
    eng.playCard("a", "p4");
    expect(eng.state.phase).toBe("COLOR_PICK");
    expect(eng.state.wildDrawFourChallengeOpen).toBe(false);
    expect(eng.challengeWildDrawFour("a")).toBe(false);
  });

  it("challenge opens for next player only, not self", () => {
    const eng = setupPlayers(["a", "b"]);
    dealFixed(eng, {
      top: card("t", "RED", 1),
      currentColor: "RED",
      drawPile: Array.from({ length: 8 }, (_, i) =>
        card(`d${i}`, "GREEN", (i % 9) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9),
      ),
      hands: {
        a: [
          card("p4", "WILD", "WILD_DRAW_FOUR"),
          card("r9", "RED", 9),
          card("x", "BLUE", 2),
        ],
        b: [card("keep", "YELLOW", 9)],
      },
      activeId: "a",
    });
    eng.playCard("a", "p4", { chosenColor: "BLUE" });
    expect(eng.state.wildDrawFourWasBluff).toBe(true);
    expect(eng.state.wildDrawFourChallengeOpen).toBe(true);
    expect(activeId(eng)).toBe("b");
    expect(eng.challengeWildDrawFour("a")).toBe(false);
    expect(eng.challengeWildDrawFour("b")).toBe(true);
    expect(eng.state.players[0]!.hand.length).toBeGreaterThan(2);
    expect(eng.state.pendingDraw).toBe(0);
  });

  it("failed challenge: next player draws 6 and is skipped", () => {
    const eng = setupPlayers(["a", "b"]);
    dealFixed(eng, {
      top: card("t", "RED", 1),
      currentColor: "RED",
      drawPile: Array.from({ length: 10 }, (_, i) =>
        card(`d${i}`, "GREEN", (i % 9) as 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9),
      ),
      hands: {
        a: [card("p4", "WILD", "WILD_DRAW_FOUR"), card("x", "BLUE", 2)],
        b: [card("keep", "YELLOW", 9)],
      },
      activeId: "a",
    });
    eng.playCard("a", "p4", { chosenColor: "YELLOW" });
    expect(eng.state.wildDrawFourWasBluff).toBe(false);
    const before = eng.state.players[1]!.hand.length;
    expect(eng.challengeWildDrawFour("b")).toBe(true);
    expect(eng.state.players[1]!.hand.length).toBe(before + 6);
    expect(activeId(eng)).toBe("a");
  });

  it("noBluffing: challenge never opens", () => {
    const eng = setupPlayers(["a", "b"], { noBluffing: true });
    dealFixed(eng, {
      top: card("t", "RED", 1),
      hands: {
        a: [card("p4", "WILD", "WILD_DRAW_FOUR"), card("x", "BLUE", 2)],
        b: [card("keep", "YELLOW", 9)],
      },
      activeId: "a",
    });
    eng.playCard("a", "p4", { chosenColor: "BLUE" });
    expect(eng.state.wildDrawFourChallengeOpen).toBe(false);
    expect(eng.challengeWildDrawFour("b")).toBe(false);
  });
});
