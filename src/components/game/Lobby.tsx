import { CopyRoomLinkButton } from "p2play-core";
import { HOUSE_RULE_DEFS } from "../../core/houseRules";
import type { GameConfig, HouseRulesConfig, Player, Spectator, TeamId } from "../../core/types";
import { LobbyHome } from "./LobbyHome";

interface LobbyProps {
  myPeerId: string | null;
  hostPeerId: string | null;
  isHost: boolean;
  players: Player[];
  spectators: Spectator[];
  spectatorLocks: Record<string, boolean>;
  status: string;
  error: string | null;
  config?: GameConfig;
  hostRoom: (name: string, avatar: string) => Promise<void>;
  joinRoom: (name: string, avatar: string, roomId: string) => Promise<void>;
  toggleReady: (ready: boolean) => void;
  startGame: () => void;
  disconnect: () => void;
  onSetRole: (peerId: string, role: "player" | "spectator") => void;
  onLockSpectator: (peerId: string, locked: boolean) => void;
  onChangeConfig?: (partial: Partial<GameConfig>) => void;
  onSetTeam?: (peerId: string, team: TeamId) => void;
}

export function Lobby({
  myPeerId,
  hostPeerId,
  isHost,
  players,
  spectators,
  spectatorLocks,
  status,
  error,
  config,
  hostRoom,
  joinRoom,
  toggleReady,
  startGame,
  disconnect,
  onSetRole,
  onLockSpectator,
  onChangeConfig,
  onSetTeam,
}: LobbyProps) {
  if (!hostPeerId) {
    return (
      <LobbyHome
        status={status}
        error={error}
        hostRoom={hostRoom}
        joinRoom={joinRoom}
      />
    );
  }

  const me = players.find((p) => p.id === myPeerId);
  const hr = config?.houseRules;
  const mode = config?.mode ?? "CLASSIC";

  const toggleRule = (id: keyof HouseRulesConfig) => {
    if (!isHost || !hr) return;
    onChangeConfig?.({ houseRules: { ...hr, [id]: !hr[id] } });
  };

  return (
    <div className="max-w-xl mx-auto w-full space-y-6 p-6 bg-zinc-900/80 border border-zinc-800 rounded-3xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-white">Salon P2Uno</h2>
          <p className="text-xs text-zinc-400 font-mono flex items-center gap-2">
            {hostPeerId}
            <CopyRoomLinkButton code={hostPeerId} />
          </p>
        </div>
        <button
          type="button"
          onClick={disconnect}
          className="text-xs px-3 py-1.5 rounded-xl border border-zinc-700 text-zinc-300"
        >
          Quitter
        </button>
      </div>

      {isHost && (
        <div className="space-y-3">
          <div className="flex gap-2">
            {(["CLASSIC", "TEAM_2V2"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChangeConfig?.({ mode: m })}
                className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                  mode === m
                    ? "bg-red-500/20 border-red-400 text-red-200"
                    : "border-zinc-700 text-zinc-400"
                }`}
              >
                {m === "CLASSIC" ? "Classic" : "2v2"}
              </button>
            ))}
          </div>
          <label className="block text-xs text-zinc-400">
            Score limite
            <input
              type="number"
              min={100}
              step={50}
              value={config?.scoreLimit ?? 500}
              onChange={(e) =>
                onChangeConfig?.({ scoreLimit: Number(e.target.value) || 500 })
              }
              className="mt-1 w-full px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm"
            />
          </label>
          <div className="grid gap-2">
            {HOUSE_RULE_DEFS.map((def) => (
              <button
                key={def.id}
                type="button"
                onClick={() => toggleRule(def.id)}
                className={`text-left p-3 rounded-xl border ${
                  hr?.[def.id]
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-950"
                }`}
              >
                <div className="text-sm font-bold text-zinc-100">{def.label}</div>
                <div className="text-[11px] text-zinc-500">{def.description}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase text-zinc-500">Joueurs</h3>
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-zinc-950 border border-zinc-800"
          >
            <span className="text-sm">
              {p.avatar} {p.name}
              {p.isHost ? " ★" : ""}
              {p.disconnected ? " (déco)" : ""}
              {mode === "TEAM_2V2" && p.team ? ` · ${p.team}` : ""}
            </span>
            <div className="flex gap-1">
              {mode === "TEAM_2V2" && isHost && (
                <>
                  <button
                    type="button"
                    className="text-[10px] px-2 py-1 rounded bg-red-900/40"
                    onClick={() => onSetTeam?.(p.id, "A")}
                  >
                    A
                  </button>
                  <button
                    type="button"
                    className="text-[10px] px-2 py-1 rounded bg-blue-900/40"
                    onClick={() => onSetTeam?.(p.id, "B")}
                  >
                    B
                  </button>
                </>
              )}
              {(isHost || p.id === myPeerId) && (
                <button
                  type="button"
                  className="text-[10px] px-2 py-1 rounded border border-zinc-700"
                  onClick={() => onSetRole(p.id, "spectator")}
                >
                  Spect.
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {spectators.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold uppercase text-zinc-500">Spectateurs</h3>
          {spectators.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-sm"
            >
              <span>
                {s.avatar} {s.name}
                {spectatorLocks[s.id] ? " 🔒" : ""}
              </span>
              {isHost && (
                <button
                  type="button"
                  className="text-[10px] px-2 py-1 rounded border border-zinc-700"
                  onClick={() => onLockSpectator(s.id, !spectatorLocks[s.id])}
                >
                  {spectatorLocks[s.id] ? "Unlock" : "Lock"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {me && (
          <button
            type="button"
            onClick={() => toggleReady(!me.isReady)}
            className={`flex-1 py-3 rounded-2xl font-bold text-sm ${
              me.isReady
                ? "bg-emerald-600 text-white"
                : "bg-zinc-800 text-zinc-200"
            }`}
          >
            {me.isReady ? "Prêt ✓" : "Pas prêt"}
          </button>
        )}
        {isHost && (
          <button
            type="button"
            onClick={startGame}
            disabled={players.length < 2}
            className="flex-1 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-red-500 to-blue-500 text-white disabled:opacity-40"
          >
            Lancer
          </button>
        )}
      </div>
    </div>
  );
}
