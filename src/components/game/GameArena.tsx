import type { GameState, Player } from "../../core/types";
import { MiniHand } from "./LocalHand";
import { LocalHand } from "./LocalHand";
import { UnoCardFace } from "./UnoCardFace";
import { ColorPicker } from "./UnoCard";
import { assignSeats, SEAT_META, type SeatFacing, type SeatId } from "./seats";
import { useDeadlinePassed } from "../../hooks/useDeadlinePassed";

interface GameArenaProps {
  gameState: GameState;
  myPeerId: string | null;
  isHost: boolean;
  onPlay: (cardId: string) => void;
  onJumpIn: (cardId: string) => void;
  onDraw: () => void;
  onPass: () => void;
  onCallUno: () => void;
  onChallengeUno: (targetId: string) => void;
  onChallengeWild: () => void;
  onChooseColor: (c: import("../../core/types").Color) => void;
  onChooseSwap: (targetId: string) => void;
  onNextRound: () => void;
}

function OpponentSeat({
  player,
  active,
  myPeerId,
  onChallengeUno,
  className,
  facing,
  unoPendingPlayerId,
  unoWindowUntil,
}: {
  player: Player;
  active: boolean;
  myPeerId: string | null;
  onChallengeUno: (id: string) => void;
  className: string;
  facing: SeatFacing;
  unoPendingPlayerId: string | null;
  unoWindowUntil: number | null;
}) {
  const pendingThis = unoPendingPlayerId === player.id;
  const graceUntil = pendingThis ? unoWindowUntil : null;
  const graceOver = useDeadlinePassed(graceUntil);
  const inGrace = pendingThis && !graceOver;

  const canContre =
    player.hand.length === 1 &&
    !player.calledUno &&
    player.id !== myPeerId &&
    !inGrace;

  return (
    <div className={`player-seat ${className} ${active ? "active-turn" : ""}`}>
      <div className="player-avatar">{player.avatar}</div>
      <div className="player-info">
        <span className="player-name">
          {player.name} ({player.score} pts)
        </span>
        <span className="card-count-badge">
          {player.hand.length} carte{player.hand.length > 1 ? "s" : ""}
        </span>
        {player.calledUno && <span className="uno-badge">UNO !</span>}
        {inGrace && (
          <span className="uno-grace-hint" title="Temps pour dire UNO">
            UNO…
          </span>
        )}
        {canContre && (
          <button
            type="button"
            className="btn-counter-uno"
            onClick={() => onChallengeUno(player.id)}
          >
            Contre UNO !
          </button>
        )}
      </div>
      <MiniHand cards={player.hand} facing={facing} />
    </div>
  );
}

const SEAT_IDS = Object.keys(SEAT_META) as SeatId[];

export function GameArena({
  gameState,
  myPeerId,
  isHost,
  onPlay,
  onJumpIn,
  onDraw,
  onPass,
  onCallUno,
  onChallengeUno,
  onChallengeWild,
  onChooseColor,
  onChooseSwap,
  onNextRound,
}: GameArenaProps) {
  const me = gameState.players.find((p) => p.id === myPeerId);
  const activeId = gameState.players[gameState.activePlayerIndex]?.id;
  const isMyTurn = activeId === myPeerId;
  const top = gameState.discardPile[gameState.discardPile.length - 1];
  const seats = assignSeats(gameState.players, myPeerId);
  const colorClass = `color-${gameState.currentColor.toLowerCase()}`;
  const needsColor =
    gameState.phase === "COLOR_PICK" && gameState.colorPickerPlayerId === myPeerId;
  const needsSwap =
    gameState.phase === "SWAP_PICK" && gameState.swapPickerPlayerId === myPeerId;

  return (
    <div className="game-arena">
      <div className="table-felt">
        {SEAT_IDS.map((id) => {
          const player = seats[id];
          if (!player) return null;
          const meta = SEAT_META[id];
          return (
            <OpponentSeat
              key={player.id}
              player={player}
              active={player.id === activeId}
              myPeerId={myPeerId}
              onChallengeUno={onChallengeUno}
              className={meta.className}
              facing={meta.facing}
              unoPendingPlayerId={gameState.unoPendingPlayerId}
              unoWindowUntil={gameState.unoWindowUntil}
            />
          );
        })}

        <div className="center-play-zone">
          <div
            key={gameState.direction}
            className={`direction-ring ${
              gameState.direction === 1 ? "clockwise" : "counter-clockwise"
            }`}
          >
            <svg className="ring-svg" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
              {gameState.direction === 1 ? (
                <>
                  {/* Tips point clockwise */}
                  <polygon points="50,4 50,16 62,10" fill="#FCD116" />
                  <polygon points="84,50 96,50 90,62" fill="#FCD116" />
                  <polygon points="50,96 50,84 38,90" fill="#FCD116" />
                  <polygon points="16,50 4,50 10,38" fill="#FCD116" />
                </>
              ) : (
                <>
                  {/* Tips point counter-clockwise */}
                  <polygon points="50,4 50,16 38,10" fill="#FCD116" />
                  <polygon points="84,50 96,50 90,38" fill="#FCD116" />
                  <polygon points="50,96 50,84 62,90" fill="#FCD116" />
                  <polygon points="16,50 4,50 10,62" fill="#FCD116" />
                </>
              )}
            </svg>
          </div>
          <div className={`active-color-aura ${colorClass}`} />

          <div className="piles-container">
            <button
              type="button"
              className="deck-pile interactive"
              title="Piocher"
              onClick={onDraw}
              disabled={!isMyTurn || gameState.phase !== "PLAYING"}
            >
              <div className="deck-stack-effect" />
              <UnoCardFace faceDown />
              <span className="deck-counter">{gameState.drawPileCount}</span>
            </button>
            <div className="discard-pile">
              {top ? <UnoCardFace card={top} /> : null}
            </div>
          </div>

          <div className="turn-banner">
            {isMyTurn
              ? "C'est TOI de jouer !"
              : `Tour de ${gameState.players.find((p) => p.id === activeId)?.name ?? "…"}`}
            {gameState.pendingDraw > 0 ? ` · +${gameState.pendingDraw}` : ""}
          </div>
        </div>

        <div className="seat-bottom">
          <div className={`local-player-header ${isMyTurn ? "active-turn" : ""}`}>
            <div className="player-avatar">{me?.avatar ?? "👤"}</div>
            <span className="player-name">
              {me?.name ?? "Moi"} ({me?.score ?? 0} pts)
            </span>
            {me && me.hand.length === 1 && !me.calledUno && (
              <button type="button" className="btn-uno-pulse" onClick={onCallUno}>
                UNO !
              </button>
            )}
            {isMyTurn && gameState.hasDrawnThisTurn && (
              <button type="button" className="btn-pass" onClick={onPass}>
                Passer
              </button>
            )}
            {isMyTurn &&
              gameState.wildDrawFourChallengeOpen &&
              gameState.wildDrawFourPlayerId !== myPeerId && (
              <button type="button" className="btn-counter-uno" onClick={onChallengeWild}>
                Challenger +4
              </button>
            )}
            {gameState.phase === "ROUND_END" && isHost && (
              <button type="button" className="btn-pass" onClick={onNextRound}>
                Manche suivante
              </button>
            )}
          </div>

          {needsColor && (
            <div className="inline-picker">
              <ColorPicker onPick={onChooseColor} />
            </div>
          )}
          {needsSwap && (
            <div className="inline-picker swap-picker">
              {gameState.players
                .filter((p) => p.id !== myPeerId)
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="btn-pass"
                    onClick={() => onChooseSwap(p.id)}
                  >
                    Échanger avec {p.name}
                  </button>
                ))}
            </div>
          )}

          <LocalHand
            gameState={gameState}
            myPeerId={myPeerId}
            onPlay={onPlay}
            onJumpIn={onJumpIn}
          />
        </div>
      </div>
    </div>
  );
}
