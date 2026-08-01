import { useState } from "react";
import { Badge, Button } from "p2play-core/ui";
import { CopyRoomLinkButton } from "p2play-core";
import { cn } from "@/lib/utils";
import type { GameConfig, Player, Spectator, TeamId } from "../../core/types";
import { LobbyConfigPanel } from "./LobbyConfigPanel";
import { SpectatorRolePanel } from "./SpectatorRolePanel";

export interface LobbyRoomProps {
  hostPeerId: string | null;
  isHost: boolean;
  players: Player[];
  spectators: Spectator[];
  spectatorLocks: Record<string, boolean>;
  myPeerId: string | null;
  config?: GameConfig;
  onSetRole: (peerId: string, role: "player" | "spectator") => void;
  onLockSpectator: (peerId: string, locked: boolean) => void;
  onChangeConfig?: (partial: Partial<GameConfig>) => void;
  onSetTeam?: (peerId: string, team: TeamId) => void;
  startGame: () => void;
  toggleReady: (ready: boolean) => void;
  disconnect: () => void;
}

function TeamButtons({
  player,
  isHost,
  onSetTeam,
}: {
  player: Player;
  isHost: boolean;
  onSetTeam?: (peerId: string, team: TeamId) => void;
}) {
  if (!isHost || !onSetTeam) return null;
  const btn = (team: TeamId, label: string) => {
    const selected = player.team === team;
    return (
      <Button
        type="button"
        size="xs"
        variant="ghost"
        onClick={() => onSetTeam(player.id, team)}
        aria-pressed={selected}
        className={cn(
          "h-auto min-h-0 rounded-lg border px-2.5 py-1 shadow-none",
          "hover:bg-transparent hover:text-inherit dark:hover:bg-transparent focus-visible:ring-0",
          selected
            ? team === "A"
              ? "border-red-400 bg-red-600 text-white dark:border-red-400 dark:bg-red-600"
              : "border-blue-400 bg-blue-600 text-white dark:border-blue-400 dark:bg-blue-600"
            : "border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-600",
        )}
      >
        {label}
      </Button>
    );
  };
  return (
    <div className="flex gap-1.5 items-center">
      {btn("A", "Équipe A")}
      {btn("B", "Équipe B")}
    </div>
  );
}

/** Connected-room lobby: config, roles, ready / start. */
export function LobbyRoom({
  hostPeerId,
  isHost,
  players,
  spectators,
  spectatorLocks,
  myPeerId,
  config,
  onSetRole,
  onLockSpectator,
  onChangeConfig,
  onSetTeam,
  startGame,
  toggleReady,
  disconnect,
}: LobbyRoomProps) {
  const [localReady, setLocalReady] = useState(false);
  const mode = config?.mode ?? "CLASSIC";
  const canStart = players.length >= 2;
  const amPlayer = players.some((p) => p.id === myPeerId);

  const handleReady = () => {
    const next = !localReady;
    setLocalReady(next);
    toggleReady(next);
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 rounded-3xl shadow-2xl relative overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-[linear-gradient(90deg,#f87171,#facc15,#34d399,#60a5fa)] bg-clip-text text-transparent">
            Salon : {hostPeerId}
          </h1>
          {hostPeerId && (
            <CopyRoomLinkButton
              code={hostPeerId}
              className="bg-zinc-800/60 hover:bg-zinc-700 text-zinc-300"
            />
          )}
        </div>
        <Badge
          variant="outline"
          className="bg-zinc-800 border-zinc-700 text-zinc-400 font-mono"
        >
          {isHost ? "HÔTE" : "INVITÉ"}
        </Badge>
      </div>
      <p className="text-zinc-400 text-sm mb-4">
        Partagez ce code avec vos amis pour les inviter à jouer.
      </p>

      <LobbyConfigPanel
        config={config}
        isHost={isHost}
        onChangeConfig={onChangeConfig}
      />

      <SpectatorRolePanel
        players={players}
        spectators={spectators}
        spectatorLocks={spectatorLocks}
        myPeerId={myPeerId}
        isHost={isHost}
        onSetRole={onSetRole}
        onLockSpectator={onLockSpectator}
      />

      <div className="flex flex-col gap-4 mb-6">
        <h2 className="text-lg font-bold text-zinc-200">
          Joueurs connectés ({players.length})
          {spectators.length > 0 && (
            <span className="text-sky-300/80 text-sm">
              {" "}
              · 👁 {spectators.length} spectateur(s)
            </span>
          )}
        </h2>
        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-zinc-800/40 border border-zinc-800"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.avatar}</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-zinc-100">{p.name}</span>
                  {p.id === myPeerId && (
                    <span className="text-xs text-red-400">(Vous)</span>
                  )}
                  {p.isHost && (
                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">
                      Hôte
                    </Badge>
                  )}
                  {!p.isHost && p.isReady && (
                    <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                      Prêt
                    </Badge>
                  )}
                  {p.disconnected && (
                    <Badge className="bg-zinc-800 text-zinc-500 text-[10px]">
                      Déco
                    </Badge>
                  )}
                </div>
              </div>
              {mode === "TEAM_2V2" && (
                <TeamButtons player={p} isHost={isHost} onSetTeam={onSetTeam} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-zinc-800/60">
        {!isHost && amPlayer && (
          <Button
            type="button"
            onClick={handleReady}
            className={`flex-1 h-auto py-3.5 px-6 rounded-2xl font-bold ${
              localReady
                ? "bg-red-600 hover:bg-red-500 text-white"
                : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
            }`}
          >
            {localReady ? "Pas Prêt" : "Je suis Prêt !"}
          </Button>
        )}
        {isHost && (
          <Button
            type="button"
            onClick={startGame}
            disabled={!canStart}
            className="flex-1 h-auto py-3.5 px-6 rounded-2xl bg-gradient-to-r from-red-500 to-blue-500 hover:from-red-400 hover:to-blue-400 text-white font-bold disabled:opacity-40 shadow-lg shadow-red-500/20"
          >
            Lancer la partie ({players.length})
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={disconnect}
          className="h-auto py-3.5 px-6 rounded-2xl bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800"
        >
          Quitter
        </Button>
      </div>
    </div>
  );
}
