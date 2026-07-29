import type { Card, Color, Rank } from "../../core/types";

const PALETTE: Record<string, { main: string; light: string; dark: string }> = {
  RED: { main: "#E52521", light: "#FF5A57", dark: "#B3120F" },
  YELLOW: { main: "#FCD116", light: "#FFE259", dark: "#C9A000" },
  GREEN: { main: "#2BB673", light: "#4AD890", dark: "#1E8A56" },
  BLUE: { main: "#0956BF", light: "#3B82F6", dark: "#063A85" },
  WILD: { main: "#1A1A24", light: "#3F3F54", dark: "#0B0B10" },
};

function label(rank: Rank): string {
  if (rank === "SKIP") return "⊘";
  if (rank === "REVERSE") return "⇄";
  if (rank === "DRAW_TWO") return "+2";
  if (rank === "WILD") return "★";
  if (rank === "WILD_DRAW_FOUR") return "+4";
  return String(rank);
}

function ink(color: Color | "WILD"): string {
  return color === "YELLOW" ? "#1A1A24" : PALETTE[color]?.main ?? "#E52521";
}

interface UnoCardFaceProps {
  card?: Card;
  faceDown?: boolean;
  className?: string;
}

export function UnoCardFace({ card, faceDown, className = "" }: UnoCardFaceProps) {
  if (faceDown || !card) {
    return (
      <svg viewBox="0 0 240 360" className={`uno-card-svg ${className}`} aria-hidden>
        <rect x="5" y="5" width="230" height="350" rx="20" fill="#111827" stroke="#374151" strokeWidth="2" />
        <rect x="18" y="18" width="204" height="324" rx="14" fill="#0B0D12" stroke="#E52521" strokeWidth="8" />
        <ellipse cx="120" cy="180" rx="70" ry="100" fill="#E52521" transform="rotate(-25 120 180)" />
        <text
          x="120"
          y="190"
          textAnchor="middle"
          fill="#FCD116"
          fontFamily="Rubik, Outfit, sans-serif"
          fontWeight="900"
          fontSize="42"
          fontStyle="italic"
        >
          UNO
        </text>
      </svg>
    );
  }

  const p = PALETTE[card.color] ?? PALETTE.WILD!;
  const txt = label(card.rank);
  const c = ink(card.color);

  return (
    <svg viewBox="0 0 240 360" className={`uno-card-svg ${className}`} aria-hidden>
      <defs>
        <linearGradient id={`g-${card.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={p.light} />
          <stop offset="60%" stopColor={p.main} />
          <stop offset="100%" stopColor={p.dark} />
        </linearGradient>
      </defs>
      <rect x="5" y="5" width="230" height="350" rx="20" fill="#fff" stroke="#D1D5DB" strokeWidth="2" />
      <rect x="15" y="15" width="210" height="330" rx="14" fill={`url(#g-${card.id})`} />
      <ellipse
        cx="120"
        cy="180"
        rx="90"
        ry="132"
        fill="#fff"
        transform="rotate(-28 120 180)"
        opacity="0.95"
      />
      <text
        x="120"
        y="200"
        textAnchor="middle"
        fill={c}
        fontFamily="Outfit, sans-serif"
        fontWeight="900"
        fontSize={txt.length > 2 ? 64 : 96}
      >
        {txt}
      </text>
      <text x="36" y="52" fill="#fff" fontFamily="Outfit, sans-serif" fontWeight="800" fontSize="32">
        {txt}
      </text>
      <text
        x="204"
        y="322"
        textAnchor="end"
        fill="#fff"
        fontFamily="Outfit, sans-serif"
        fontWeight="800"
        fontSize="32"
        transform="rotate(180 204 310)"
      >
        {txt}
      </text>
    </svg>
  );
}
