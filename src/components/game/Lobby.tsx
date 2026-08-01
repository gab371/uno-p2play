import type { GameConfig, Player, Spectator, TeamId } from "../../core/types";
import { LobbyHome } from "./LobbyHome";
import { LobbyRoom } from "./LobbyRoom";

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

export function Lobby(props: LobbyProps) {
  const {
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
  } = props;

  if (myPeerId) {
    return (
      <LobbyRoom
        hostPeerId={hostPeerId}
        isHost={isHost}
        players={players}
        spectators={spectators}
        spectatorLocks={spectatorLocks}
        myPeerId={myPeerId}
        config={config}
        onSetRole={onSetRole}
        onLockSpectator={onLockSpectator}
        onChangeConfig={onChangeConfig}
        onSetTeam={onSetTeam}
        startGame={startGame}
        toggleReady={toggleReady}
        disconnect={disconnect}
      />
    );
  }

  return (
    <LobbyHome
      status={status}
      error={error}
      hostRoom={hostRoom}
      joinRoom={joinRoom}
    />
  );
}

export default Lobby;
