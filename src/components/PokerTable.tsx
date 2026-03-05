import { ParticipantSeat } from './ParticipantSeat';
import type { Participant } from '../hooks/useSession';
import type { SessionPhase } from '../hooks/useSession';

interface PokerTableProps {
  participants: Participant[];
  phase: SessionPhase;
  currentParticipantId: string | null;
  /** IDs des participants actuellement connectés (Realtime Database). Absent = déconnecté. */
  connectedParticipantIds?: Set<string>;
}

export function PokerTable({
  participants,
  phase,
  currentParticipantId,
  connectedParticipantIds = new Set(),
}: PokerTableProps) {
  // À la table : uniquement les participants qui votent (pas les observateurs)
  const voters = participants.filter((p) => p.role !== 'observer');
  const count = voters.length;
  const positions = getSeatPositions(count);
  const manySeats = count >= 8;

  const partiNames = voters
    .filter((p) => {
      const isCurrent = p.participantId === currentParticipantId;
      const hasPresenceData = connectedParticipantIds.size > 0;
      return hasPresenceData && !isCurrent && !connectedParticipantIds.has(p.participantId);
    })
    .map((p) => p.name);
  if (count > 0) {
    console.debug('[Poko presence] PokerTable connectedIds:', [...connectedParticipantIds], '-> affiché (parti):', partiNames);
  }

  return (
    <div className={`poker-table-container ${manySeats ? 'poker-table-container--many' : ''}`}>
      <div className="poker-table">
        <div className="poker-table__surface" aria-hidden />
        {voters.map((participant, index) => {
          const isCurrent = participant.participantId === currentParticipantId;
          const hasPresenceData = connectedParticipantIds.size > 0;
          const isDisconnected =
            hasPresenceData &&
            !isCurrent &&
            !connectedParticipantIds.has(participant.participantId);
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
