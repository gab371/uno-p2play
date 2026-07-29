import { isPlayable, cardsIdentical } from "../../core/cardRules";
import type { Card, Color, GameState } from "../../core/types";
import { UnoCardFace } from "./UnoCardFace";

interface LocalHandProps {
  gameState: GameState;
  myPeerId: string | null;
  onPlay: (cardId: string, color?: Color) => void;
  onJumpIn: (cardId: string, color?: Color) => void;
}

export function LocalHand({ gameState, myPeerId, onPlay, onJumpIn }: LocalHandProps) {
  const me = gameState.players.find((p) => p.id === myPeerId);
  if (!me) return null;

  const hand = me.hand;
  const n = hand.length;
  const isMyTurn =
    gameState.players[gameState.activePlayerIndex]?.id === myPeerId &&
    (gameState.phase === "PLAYING" || gameState.phase === "COLOR_PICK");
  const top = gameState.discardPile[gameState.discardPile.length - 1] ?? null;
  const hr = gameState.config.houseRules;

  const spread = Math.min(n * 4.5, 36);
  const start = -spread / 2;
  const step = n > 1 ? spread / (n - 1) : 0;
  const spacing = Math.max(30, Math.min(68, 850 / Math.max(n, 1)));

  return (
    <div className="hand-container">
      {hand.map((card, i) => {
        const rot = n > 1 ? start + i * step : 0;
        const x = (i - (n - 1) / 2) * spacing;
        const y = Math.pow(Math.abs(i - (n - 1) / 2), 1.8) * 1.5;
        const base = `translate(${x}px, ${y}px) rotate(${rot}deg)`;

        const playable =
          isMyTurn &&
          isPlayable(
            card,
            gameState.currentColor,
            top,
            gameState.pendingDraw,
            gameState.pendingDrawKind,
            hr.stacking,
          );
        const canJump = !!(
          hr.jumpIn &&
          gameState.jumpInOpen &&
          gameState.lastPlayedCard &&
          cardsIdentical(card, gameState.lastPlayedCard) &&
          !isMyTurn
        );
        const enabled = playable || canJump;

        return (
          <button
            key={card.id}
            type="button"
            className={`hand-card-item ${enabled ? "" : "disabled"}`}
            style={{ transform: base, zIndex: i + 1 }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = `translate(${x}px, -50px) rotate(0deg) scale(1.18)`;
              e.currentTarget.style.zIndex = "300";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = base;
              e.currentTarget.style.zIndex = String(i + 1);
            }}
            onClick={() => {
              if (!enabled) return;
              if (canJump) onJumpIn(card.id);
              else onPlay(card.id);
            }}
          >
            <UnoCardFace card={card} />
          </button>
        );
      })}
    </div>
  );
}

export function MiniHand({
  cards,
  facing = "south",
}: {
  cards: Card[];
  facing?: "north" | "south" | "east" | "west";
}) {
  const show = cards.slice(0, 12);
  const n = show.length;
  const spread = Math.min(n * 5.5, 38);
  const start = -spread / 2;
  const step = n > 1 ? spread / (n - 1) : 0;
  const spacing = Math.max(7, Math.min(13, 150 / Math.max(n, 1)));

  return (
    <div className={`mini-hand mini-hand-${facing}`}>
      {show.map((c, i) => {
        const rot = n > 1 ? start + i * step : 0;
        const x = (i - (n - 1) / 2) * spacing;
        const y = Math.pow(Math.abs(i - (n - 1) / 2), 1.7) * 0.7;
        return (
          <div
            key={c.id || `mini-${i}`}
            className="mini-card"
            style={{
              transform: `translate(${x}px, ${y}px) rotate(${rot}deg)`,
              zIndex: i + 1,
            }}
          >
            <UnoCardFace faceDown={c.id.startsWith("hidden")} card={c} />
          </div>
        );
      })}
      {cards.length > 12 && (
        <span className="mini-more">+{cards.length - 12}</span>
      )}
    </div>
  );
}
