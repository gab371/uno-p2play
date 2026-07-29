import type { Card, Color } from "../../core/types";
import { cn } from "../../lib/utils";

const COLOR_BG: Record<string, string> = {
  RED: "bg-red-600 border-red-400",
  YELLOW: "bg-yellow-500 border-yellow-300 text-zinc-900",
  GREEN: "bg-emerald-600 border-emerald-400",
  BLUE: "bg-blue-600 border-blue-400",
  WILD: "bg-zinc-900 border-fuchsia-400",
};

function label(card: Card): string {
  if (card.rank === "SKIP") return "⊘";
  if (card.rank === "REVERSE") return "⇄";
  if (card.rank === "DRAW_TWO") return "+2";
  if (card.rank === "WILD") return "★";
  if (card.rank === "WILD_DRAW_FOUR") return "+4";
  return String(card.rank);
}

interface UnoCardProps {
  card: Card;
  selected?: boolean;
  playable?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  className?: string;
}

export function UnoCard({
  card,
  selected,
  playable,
  faceDown,
  onClick,
  className,
}: UnoCardProps) {
  if (faceDown || card.id.startsWith("hidden")) {
    return (
      <div
        className={cn(
          "w-14 h-20 rounded-xl border-2 border-zinc-600 bg-gradient-to-br from-zinc-800 to-zinc-950 shadow-md",
          className,
        )}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className={cn(
        "w-14 h-20 rounded-xl border-2 shadow-lg flex flex-col items-center justify-center font-black text-xl text-white transition-transform",
        COLOR_BG[card.color] ?? COLOR_BG.WILD,
        playable && "ring-2 ring-white scale-105 cursor-pointer hover:-translate-y-1",
        selected && "ring-4 ring-amber-300 -translate-y-2",
        !playable && onClick && "opacity-50",
        className,
      )}
    >
      <span>{label(card)}</span>
      {card.color === "WILD" && (
        <span className="text-[9px] font-bold tracking-wide opacity-80">WILD</span>
      )}
    </button>
  );
}

export function ColorPicker({ onPick }: { onPick: (c: Color) => void }) {
  const colors: Color[] = ["RED", "YELLOW", "GREEN", "BLUE"];
  return (
    <div className="flex gap-2 justify-center">
      {colors.map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onPick(c)}
          className={cn("w-12 h-12 rounded-full border-2 border-white/40", COLOR_BG[c])}
          title={c}
        />
      ))}
    </div>
  );
}
