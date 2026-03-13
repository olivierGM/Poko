import { useState } from 'react';
import { Card } from './Card';
import type { Participant, ParticipantRole } from '../hooks/useSession';

interface ParticipantSeatProps {
  participant: Participant;
  phase: 'voting' | 'revealed';
  isCurrentUser: boolean;
  isDisconnected?: boolean;
  showRoleControl?: boolean;
  isRoleControlOpen?: boolean;
  onToggleRoleControl?: () => void;
  onRoleChange?: (participantId: string, role: ParticipantRole) => void;
  isCoHost?: boolean;
  onToggleCoHost?: (participantId: string) => void;
}

export function ParticipantSeat({
  participant,
  phase,
  isCurrentUser,
  isDisconnected,
  showRoleControl = false,
  isRoleControlOpen = false,
  onToggleRoleControl,
  onRoleChange,
  isCoHost = false,
  onToggleCoHost,
}: ParticipantSeatProps) {
  const [roleLoading, setRoleLoading] = useState(false);
  const isObs = participant.role === 'observer';
  const showVote = !isObs && (phase === 'revealed' || (isCurrentUser && participant.vote != null));
  const voteValue = participant.vote;
  const hasVoted = !isObs && participant.vote != null;

  async function handleSetRole(role: ParticipantRole) {
    if (!onRoleChange || roleLoading) return;
    setRoleLoading(true);
    try {
      await onRoleChange(participant.participantId, role);
    } finally {
      setRoleLoading(false);
    }
  }

  return (
    <div
      className={`participant-seat ${isDisconnected ? 'participant-seat--parti' : ''} ${isObs ? 'participant-seat--observer' : ''} ${showRoleControl ? 'participant-seat--role-clickable' : ''}`}
      onClick={showRoleControl && onToggleRoleControl ? () => onToggleRoleControl() : undefined}
      role={showRoleControl && onToggleRoleControl ? 'button' : undefined}
      tabIndex={showRoleControl && onToggleRoleControl ? 0 : undefined}
      onKeyDown={
        showRoleControl && onToggleRoleControl
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onToggleRoleControl();
              }
            }
          : undefined
      }
      title={showRoleControl ? 'Cliquer pour les options' : undefined}
    >
      <div className="participant-seat__avatar" aria-hidden>
        {participant.name.charAt(0).toUpperCase()}
      </div>
      <span className="participant-seat__name">
        {participant.name || 'Anonyme'}
        {isCurrentUser && <span className="participant-seat__you" title="C'est vous"> (vous)</span>}
        {isObs && <span className="participant-seat__observer" title="Ne vote pas"> (observateur)</span>}
        {isCoHost && !isCurrentUser && <span className="participant-seat__cohost" title="Co-hôte"> ★</span>}
        {isDisconnected && (
          <span className="participant-seat__parti" title="A quitté la session">
            {' '}(parti)
          </span>
        )}
        {hasVoted && phase === 'voting' && !isDisconnected && (
          <span className="participant-seat__voted" title="A voté"> ✓</span>
        )}
      </span>
      {showRoleControl && isRoleControlOpen && (
        <div
          className="participant-seat__role-control"
          onClick={(e) => e.stopPropagation()}
          role="group"
          aria-label="Options de l'hôte"
        >
          {onRoleChange && (
            <button
              type="button"
              className="button button--small participant-seat__role-btn"
              disabled={isObs || roleLoading}
              onClick={() => handleSetRole('observer')}
            >
              Observateur
            </button>
          )}
          {onRoleChange && (
            <button
              type="button"
              className="button button--small participant-seat__role-btn"
              disabled={!isObs || roleLoading}
              onClick={() => handleSetRole('participant')}
            >
              Voteur
            </button>
          )}
          {onToggleCoHost && (
            <button
              type="button"
              className={`button button--small participant-seat__role-btn${isCoHost ? ' participant-seat__role-btn--active' : ''}`}
              onClick={() => onToggleCoHost(participant.participantId)}
            >
              {isCoHost ? 'Retirer co-hôte' : 'Co-hôte'}
            </button>
          )}
        </div>
      )}
      <div className="participant-seat__card">
        {isObs ? (
          <span className="participant-seat__card-observer" aria-hidden>—</span>
        ) : showVote && voteValue != null ? (
          <Card value={voteValue} faceDown={false} small />
        ) : participant.vote != null ? (
          <Card value="" faceDown small />
        ) : null}
      </div>
    </div>
  );
}
