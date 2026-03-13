import type { Participant, ParticipantRole } from '../hooks/useSession';

interface ObserversSideProps {
  observers: Participant[];
  currentParticipantId: string | null;
  connectedParticipantIds: Set<string>;
  /** 'left' | 'right' pour le positionnement visuel (aria-label, etc.) */
  side: 'left' | 'right';
  isHost?: boolean;
  onSetRole?: (participantId: string, role: ParticipantRole) => void;
}

export function ObserversSide({
  observers,
  currentParticipantId,
  connectedParticipantIds,
  side,
  isHost = false,
  onSetRole,
}: ObserversSideProps) {
  if (observers.length === 0) return null;

  return (
    <aside
      className={`observers-side observers-side--${side}`}
      aria-label={side === 'left' ? 'Observateurs (à gauche de la table)' : 'Observateurs (à droite de la table)'}
    >
      <span className="observers-side__title">Observateurs</span>
      <ul className="observers-side__list">
        {observers.map((participant) => {
          const isCurrent = participant.participantId === currentParticipantId;
          const hasPresenceData = connectedParticipantIds.size > 0;
          const isDisconnected =
            hasPresenceData &&
            !isCurrent &&
            !connectedParticipantIds.has(participant.participantId);
          return (
            <li key={participant.id} className="observers-side__item">
              <div
                className={`observers-side__chip ${isDisconnected ? 'observers-side__chip--parti' : ''}`}
              >
                <span className="observers-side__avatar" aria-hidden>
                  {participant.name.charAt(0).toUpperCase()}
                </span>
                <span className="observers-side__name">
                  {participant.name || 'Anonyme'}
                  {isCurrent && <span className="observers-side__you"> (vous)</span>}
                  {isDisconnected && <span className="observers-side__parti"> (parti)</span>}
                </span>
              </div>
              {isHost && onSetRole && (
                <button
                  type="button"
                  className="button button--small observers-side__action"
                  onClick={() => onSetRole(participant.participantId, 'participant')}
                  title="Passer en participant"
                >
                  Participant
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
