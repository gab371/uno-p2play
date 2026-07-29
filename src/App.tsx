import { useEffect, useState } from "react";
import type { PeerManagerLike } from "p2play-core";
import { RoomCodeBadge } from "p2play-core";
import { SoundToggle } from "p2play-core/ui";
import { FileText, Maximize2, Minimize2 } from "lucide-react";
import { useGame } from "./hooks/useGame";
import { Lobby } from "./components/game/Lobby";
import { GameArena } from "./components/game/GameArena";
import { SideChrome } from "./components/game/SideChrome";
import { RulesModal } from "./components/game/RulesModal";
import { soundManager } from "./core/soundFX";
import "./styles/arena.css";

declare const __APP_VERSION__: string;

const LOGO_CLASS =
  "text-xl font-black tracking-tight whitespace-nowrap shrink-0 bg-[linear-gradient(90deg,#f87171,#facc15,#34d399,#60a5fa)] bg-clip-text text-transparent";

interface AppProps {
  isEmbedded?: boolean;
  externalPeerManager?: PeerManagerLike;
  playerName?: string;
  playerAvatar?: string;
  isHost?: boolean;
  lateJoin?: boolean;
  gameConfig?: unknown;
  hubPhase?: string;
  onExit?: () => void;
}

export default function App({
  isEmbedded = false,
  externalPeerManager,
  playerName,
  playerAvatar,
  isHost,
  lateJoin,
  gameConfig,
  hubPhase,
  onExit,
}: AppProps) {
  const game = useGame({
    externalPeerManager,
    isEmbedded,
    playerName,
    playerAvatar,
    isHost,
    lateJoin,
    gameConfig,
    hubPhase,
  });
  const [showRules, setShowRules] = useState(false);
  const [boardExpanded, setBoardExpanded] = useState(false);

  const {
    myPeerId,
    hostPeerId,
    isHost: gameIsHost,
    chatMessages,
    gameState,
    status,
    error,
    hostRoom,
    joinRoom,
    toggleReady,
    startGame,
    sendChatMessage,
    disconnect,
  } = game;

  const showLobby = !gameState || gameState.phase === "LOBBY";
  const exitFn = isEmbedded && onExit ? onExit : disconnect;

  useEffect(() => {
    if (showLobby) setBoardExpanded(false);
  }, [showLobby]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("p2play:board-expand", { detail: { expanded: boardExpanded } }),
    );
    return () => {
      if (boardExpanded) {
        window.dispatchEvent(
          new CustomEvent("p2play:board-expand", { detail: { expanded: false } }),
        );
      }
    };
  }, [boardExpanded]);

  useEffect(() => {
    if (!boardExpanded) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setBoardExpanded(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [boardExpanded]);

  return (
    <div
      className={
        showLobby
          ? "min-h-screen py-8 px-4 sm:px-6 lg:px-8 flex flex-col justify-between relative text-zinc-100"
          : "h-screen py-3 px-4 sm:px-6 lg:px-8 flex flex-col relative text-zinc-100 overflow-hidden"
      }
    >
      {!boardExpanded && (
        <header className="max-w-7xl mx-auto w-full flex items-center justify-between shrink-0 mb-3 pb-3 border-b border-zinc-900">
          <div className="flex items-center gap-2">
            <span className={LOGO_CLASS}>P2UNO</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowRules(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 rounded-full border border-zinc-800 font-bold transition-all"
              title="Règles du jeu"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Règles</span>
            </button>

            <SoundToggle
              soundManager={soundManager}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-zinc-100 border-zinc-800"
            />

            {gameState && gameState.phase !== "LOBBY" && (
              <>
                {hostPeerId && (
                  <RoomCodeBadge code={hostPeerId} accentClassName="text-yellow-300" />
                )}
                <button
                  type="button"
                  onClick={isEmbedded && onExit && gameIsHost ? onExit : disconnect}
                  className="text-xs px-2.5 py-1.5 bg-rose-950/20 hover:bg-rose-900/20 text-rose-400 border border-rose-900/30 rounded-xl transition-all font-bold"
                  title={
                    isEmbedded
                      ? gameIsHost
                        ? "Retour au Hub"
                        : "Quitter le Hub (la partie continue)"
                      : "Quitter"
                  }
                >
                  {isEmbedded ? (gameIsHost ? "← Hub" : "Quitter") : "Quitter"}
                </button>
              </>
            )}
          </div>
        </header>
      )}

      <main
        className={
          showLobby
            ? "flex-1 w-full max-w-7xl mx-auto min-h-0 flex flex-col"
            : "flex-1 w-full max-w-7xl mx-auto min-h-0 flex flex-col"
        }
      >
        {showLobby ? (
          <div className="flex items-center justify-center min-h-[70vh]">
            <Lobby
              myPeerId={myPeerId}
              hostPeerId={hostPeerId}
              isHost={gameIsHost}
              players={gameState?.players || []}
              spectators={gameState?.spectators || []}
              spectatorLocks={gameState?.spectatorLocks || {}}
              status={status}
              error={error}
              config={gameState?.config}
              hostRoom={hostRoom}
              joinRoom={joinRoom}
              toggleReady={toggleReady}
              startGame={startGame}
              disconnect={exitFn}
              onSetRole={game.setRole}
              onLockSpectator={game.lockSpectator}
              onChangeConfig={game.changeConfig}
              onSetTeam={game.setTeam}
            />
          </div>
        ) : (
          <div
            className={
              boardExpanded
                ? "board-stage board-stage-expanded"
                : "board-stage"
            }
          >
            <button
              type="button"
              className="board-expand-btn"
              title={boardExpanded ? "Réduire la zone de jeu (Échap)" : "Agrandir la zone de jeu"}
              aria-pressed={boardExpanded}
              onClick={() => setBoardExpanded((v) => !v)}
            >
              {boardExpanded ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
            <GameArena
              gameState={gameState!}
              myPeerId={myPeerId}
              isHost={gameIsHost}
              onPlay={game.playCard}
              onJumpIn={game.jumpIn}
              onDraw={game.drawCard}
              onPass={game.passTurn}
              onCallUno={game.callUno}
              onChallengeUno={game.challengeUno}
              onChallengeWild={game.challengeWildDrawFour}
              onChooseColor={game.chooseColor}
              onChooseSwap={game.chooseSwap}
              onNextRound={game.nextRound}
            />
            <SideChrome
              logs={gameState!.logs}
              chatMessages={chatMessages}
              onSend={sendChatMessage}
            />
          </div>
        )}
      </main>

      {!boardExpanded && (
        <footer className="max-w-7xl mx-auto w-full shrink-0 text-center text-[10px] text-zinc-600 py-2 mt-2 border-t border-zinc-900 flex justify-between items-center">
          <div>P2Uno - Réseau Privé Peer-to-Peer - Version v{__APP_VERSION__}</div>
          <a
            href="https://github.com/gab371/uno-p2play"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 hover:text-yellow-400 transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
              <path d="M9 18c-4.51 2-5-2-7-2" />
            </svg>
            <span>Dépôt GitHub</span>
          </a>
        </footer>
      )}

      {showRules && <RulesModal onClose={() => setShowRules(false)} />}
    </div>
  );
}
