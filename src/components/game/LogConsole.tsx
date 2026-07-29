import type { GameLog } from "../../core/types";
import { JournalPanel } from "p2play-core/chat";

interface LogConsoleProps {
  logs: GameLog[];
}

export function LogConsole({ logs }: LogConsoleProps) {
  return (
    <JournalPanel
      entries={logs}
      title="Journal de partie"
      emptyLabel="La partie commence…"
      className="bg-zinc-900/85 backdrop-blur-md border border-yellow-500/25 rounded-2xl p-4 shadow-xl flex flex-col h-full text-zinc-100 text-xs"
      maxHeight="260px"
      scrollbarAccent="amber"
    />
  );
}
