import { ParticipantSeat } from './ParticipantSeat';
import type { Participant } from '../hooks/useSession';
import type { SessionPhase } from '../hooks/useSession';

interface PokerTableProps {
  participants: Participant[];
  phase: SessionPhase;
  currentParticipantId: string | null;
}

export function PokerTable({ participants, phase, currentParticipantId }: PokerTableProps) {
  const count = participants.length;
  const positions = getSeatPositions(count);

  return (
    <div className="poker-table-container">
      <div className="poker-table">
        <div className="poker-table__surface" aria-hidden />
        {participants.map((participant, index) => (
          <div
            key={participant.id}
            className="participant-seat-wrapper"
            style={positions[index]}
          >
            <ParticipantSeat
              participant={participant}
              phase={phase}
              isCurrentUser={participant.participantId === currentParticipantId}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function getSeatPositions(count: number): Array<{ top?: string; bottom?: string; left?: string; right?: string; transform?: string }> {
  if (count === 0) return [];
  const positions: Array<{ top?: string; bottom?: string; left?: string; right?: string; transform?: string }> = [];
  const radius = 42;
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
