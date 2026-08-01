import { Button } from "p2play-core/ui";
import { cn } from "@/lib/utils";
import { HOUSE_RULE_DEFS } from "../../core/houseRules";
import type { GameConfig, GameMode, HouseRulesConfig } from "../../core/types";

const PICKER_BTN_RESET =
  "h-auto min-h-0 gap-1.5 rounded-xl border-2 border-transparent bg-transparent px-0 py-0 shadow-none " +
  "hover:bg-transparent hover:text-inherit dark:hover:bg-transparent " +
  "focus-visible:border-transparent focus-visible:ring-0";

const MODES: { id: GameMode; label: string; description: string }[] = [
  {
    id: "CLASSIC",
    label: "Classic",
    description: "Chacun pour soi jusqu'à la limite de score.",
  },
  {
    id: "TEAM_2V2",
    label: "2v2",
    description: "Deux équipes de deux ; scores et victoire partagés.",
  },
];

interface LobbyConfigPanelProps {
  config?: GameConfig;
  isHost: boolean;
  onChangeConfig?: (partial: Partial<GameConfig>) => void;
}

export function LobbyConfigPanel({
  config,
  isHost,
  onChangeConfig,
}: LobbyConfigPanelProps) {
  const mode = config?.mode ?? "CLASSIC";
  const hr = config?.houseRules;
  const scoreLimit = config?.scoreLimit ?? 500;

  const toggleRule = (id: keyof HouseRulesConfig) => {
    if (!isHost || !hr) return;
    onChangeConfig?.({ houseRules: { ...hr, [id]: !hr[id] } });
  };

  return (
    <div className="bg-zinc-950/40 border border-zinc-800 rounded-2xl p-4 mb-6 flex flex-col gap-4">
      <div>
        <div className="text-xs text-red-400 font-bold uppercase tracking-widest mb-2">
          Mode
        </div>
        {isHost ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {MODES.map((m) => {
              const selected = mode === m.id;
              return (
                <Button
                  key={m.id}
                  type="button"
                  variant="ghost"
                  onClick={() => onChangeConfig?.({ mode: m.id })}
                  aria-pressed={selected}
                  className={cn(
                    PICKER_BTN_RESET,
                    "w-full text-left justify-start p-3 whitespace-normal",
                    selected
                      ? "border-red-400 bg-red-500/15 dark:border-red-400 dark:bg-red-500/15"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 dark:border-zinc-800 dark:bg-zinc-900",
                  )}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-zinc-100">{m.label}</span>
                    <span className="text-[11px] text-zinc-400 leading-snug font-normal">
                      {m.description}
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="text-zinc-200 font-semibold bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-sm">
            Actif : {MODES.find((m) => m.id === mode)?.label ?? mode}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs text-red-400 font-bold uppercase tracking-widest mb-2">
          Score limite
        </div>
        {isHost ? (
          <input
            type="number"
            min={100}
            step={50}
            value={scoreLimit}
            onChange={(e) =>
              onChangeConfig?.({ scoreLimit: Number(e.target.value) || 500 })
            }
            className="w-full px-3 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-100 outline-none focus:border-red-400"
          />
        ) : (
          <div className="text-zinc-200 font-semibold bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-sm">
            {scoreLimit} points
          </div>
        )}
      </div>

      <div>
        <div className="text-xs text-red-400 font-bold uppercase tracking-widest mb-2">
          House rules
        </div>
        {isHost ? (
          <div className="grid gap-2">
            {HOUSE_RULE_DEFS.map((def) => {
              const on = !!hr?.[def.id];
              return (
                <Button
                  key={def.id}
                  type="button"
                  variant="ghost"
                  onClick={() => toggleRule(def.id)}
                  aria-pressed={on}
                  className={cn(
                    PICKER_BTN_RESET,
                    "w-full text-left justify-start p-3 whitespace-normal",
                    on
                      ? "border-emerald-500/50 bg-emerald-500/10 dark:border-emerald-500/50 dark:bg-emerald-500/10"
                      : "border-zinc-800 bg-zinc-900 hover:border-zinc-700 dark:border-zinc-800 dark:bg-zinc-900",
                  )}
                >
                  <span className="flex flex-col gap-0.5">
                    <span className="text-sm font-bold text-zinc-100">{def.label}</span>
                    <span className="text-[11px] text-zinc-400 leading-snug font-normal">
                      {def.description}
                    </span>
                  </span>
                </Button>
              );
            })}
          </div>
        ) : (
          <div className="text-zinc-200 font-semibold bg-zinc-900 p-2.5 rounded-xl border border-zinc-800 text-sm">
            {HOUSE_RULE_DEFS.filter((d) => hr?.[d.id])
              .map((d) => d.label)
              .join(", ") || "Aucune règle maison"}
          </div>
        )}
      </div>
    </div>
  );
}
