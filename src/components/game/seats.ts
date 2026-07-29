import type { Player } from "../../core/types";

export type SeatId =
  | "top"
  | "topLeft"
  | "topRight"
  | "left"
  | "right"
  | "bottomLeft"
  | "bottomRight";

export type SeatFacing = "north" | "south" | "east" | "west";

export const SEAT_META: Record<
  SeatId,
  { className: string; facing: SeatFacing }
> = {
  top: { className: "seat-top", facing: "north" },
  topLeft: { className: "seat-top-left", facing: "north" },
  topRight: { className: "seat-top-right", facing: "north" },
  left: { className: "seat-left", facing: "west" },
  right: { className: "seat-right", facing: "east" },
  bottomLeft: { className: "seat-bottom-left", facing: "south" },
  bottomRight: { className: "seat-bottom-right", facing: "south" },
};

/** Clockwise seats from local (south), for 2–8 players. */
function seatOrder(playerCount: number): SeatId[] {
  switch (playerCount) {
    case 2:
      return ["top"];
    case 3:
      return ["right", "left"];
    case 4:
      return ["left", "top", "right"];
    case 5:
      return ["left", "topLeft", "top", "right"];
    case 6:
      return ["left", "topLeft", "top", "topRight", "right"];
    case 7:
      return ["bottomLeft", "left", "topLeft", "top", "topRight", "right"];
    default:
      return [
        "bottomLeft",
        "left",
        "topLeft",
        "top",
        "topRight",
        "right",
        "bottomRight",
      ];
  }
}

/** Map opponents around the table relative to the local player. */
export function assignSeats(
  players: Player[],
  myId: string | null,
): Partial<Record<SeatId, Player>> {
  const idx = players.findIndex((p) => p.id === myId);
  if (idx < 0) return {};
  const n = players.length;
  const order = seatOrder(n);
  const out: Partial<Record<SeatId, Player>> = {};
  for (let rel = 1; rel < n; rel++) {
    const seat = order[rel - 1];
    if (!seat) continue;
    const player = players[(idx + rel) % n];
    if (player) out[seat] = player;
  }
  return out;
}
