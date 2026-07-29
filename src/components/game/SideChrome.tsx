import { useState } from "react";
import { MessageSquare, ScrollText, X } from "lucide-react";
import { TextChatPanel } from "p2play-core/chat";
import type { ChatMessage } from "p2play-core";
import type { GameLog } from "../../core/types";
import { LogConsole } from "./LogConsole";

interface SideChromeProps {
  logs: GameLog[];
  chatMessages: ChatMessage[];
  onSend: (text: string) => void;
}

export function SideChrome({ logs, chatMessages, onSend }: SideChromeProps) {
  const [showJournal, setShowJournal] = useState(false);
  const [showChat, setShowChat] = useState(false);

  return (
    <div className="side-chrome">
      {showJournal && (
        <div className="side-panel">
          <div className="side-panel-head">
            <span>Journal</span>
            <button type="button" className="side-panel-close" onClick={() => setShowJournal(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="h-[280px]">
            <LogConsole logs={logs} />
          </div>
        </div>
      )}

      {showChat && (
        <div className="side-panel">
          <div className="side-panel-head">
            <span>Chat</span>
            <button type="button" className="side-panel-close" onClick={() => setShowChat(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>
          <TextChatPanel
            messages={chatMessages}
            onSend={onSend}
            title=""
            placeholder="Écrire un message…"
            emptyLabel="Aucun message pour le moment."
            className="bg-zinc-900/85 backdrop-blur-md border border-yellow-500/25 rounded-2xl p-4 shadow-xl flex flex-col h-[280px] text-zinc-100 text-xs"
            scrollbarAccent="amber"
          />
        </div>
      )}

      <div className="side-chrome-fabs">
        <button
          type="button"
          className={`side-fab ${showJournal ? "active" : ""}`}
          title="Journal"
          aria-pressed={showJournal}
          onClick={() => {
            setShowJournal((v) => !v);
            if (!showJournal) setShowChat(false);
          }}
        >
          <ScrollText className="w-4 h-4" />
        </button>
        <button
          type="button"
          className={`side-fab ${showChat ? "active" : ""}`}
          title="Chat"
          aria-pressed={showChat}
          onClick={() => {
            setShowChat((v) => !v);
            if (!showChat) setShowJournal(false);
          }}
        >
          <MessageSquare className="w-4 h-4" />
          {chatMessages.length > 0 && !showChat && (
            <span className="side-fab-dot" />
          )}
        </button>
      </div>
    </div>
  );
}
