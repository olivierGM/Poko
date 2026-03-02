import { ParticipantSeat } from './ParticipantSeat';
import type { Participant } from '../hooks/useSession';
import type { SessionPhase } from '../hooks/useSession';

const LAST_SEEN_MS = 90 * 1000;

function lastSeenToMs(lastSeen: unknown): number {
  const t = lastSeen as { toMillis?: () => number } | null | undefined;
  return t?.toMillis?.() ?? 0;
}

interface PokerTableProps {
  participants: Participant[];
  phase: SessionPhase;
  currentParticipantId: string | null;
  now?: number;
}

export function PokerTable({ participants, phase, currentParticipantId, now = Date.now() }: PokerTableProps) {
  const count = participants.length;
  const positions = getSeatPositions(count);
  const manySeats = count >= 8;

  return (
    <div className={`poker-table-container ${manySeats ? 'poker-table-container--many' : ''}`}>
      <div className="poker-table">
        <div className="poker-table__surface" aria-hidden />
        {participants.map((participant, index) => {
          const isCurrent = participant.participantId === currentParticipantId;
          const lastSeenMs = lastSeenToMs(participant.lastSeen);
          const hasLastSeen = participant.lastSeen != null && lastSeenMs > 0;
          const isDisconnected = !isCurrent && hasLastSeen && now - lastSeenMs > LAST_SEEN_MS;
          return (
          <div
            key={participant.id}
            className="participant-seat-wrapper"
            style={positions[index]}
          >
            <ParticipantSeat
              participant={participant}
              phase={phase}
              isCurrentUser={isCurrent}
              isDisconnected={isDisconnected}
            />
          </div>
          );
        })}
      </div>
    </div>
  );
}

function getSeatPositions(count: number): Array<{ left: string; top: string; transform: string }> {
  if (count === 0) return [];
  const positions: Array<{ left: string; top: string; transform: string }> = [];
  const radius = count >= 10 ? 48 : count >= 8 ? 46 : 42;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * 2 * Math.PI - Math.PI / 2;
    const x = 50 + radius * Math.cos(angle);
    const y = 50 + radius * Math.sin(angle);
    positions.push({
      left: `${x}%`,
      top: `${y}%`,
      transform: 'translate(-50%, -50%)',
    });
  }
  return positions;
}
