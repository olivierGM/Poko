import { Card } from './Card';
import type { Participant } from '../hooks/useSession';

interface ParticipantSeatProps {
  participant: Participant;
  phase: 'voting' | 'revealed';
  isCurrentUser: boolean;
  isDisconnected?: boolean;
}

export function ParticipantSeat({ participant, phase, isCurrentUser, isDisconnected }: ParticipantSeatProps) {
  const isObs = participant.role === 'observer';
  const showVote = !isObs && (phase === 'revealed' || (isCurrentUser && participant.vote != null));
  const voteValue = participant.vote;

  const hasVoted = !isObs && participant.vote != null;

  return (
    <div className={`participant-seat ${isDisconnected ? 'participant-seat--parti' : ''} ${isObs ? 'participant-seat--observer' : ''}`}>
      <div className="participant-seat__avatar" aria-hidden>
        {participant.name.charAt(0).toUpperCase()}
      </div>
      <span className="participant-seat__name">
        {participant.name || 'Anonyme'}
        {isCurrentUser && <span className="participant-seat__you" title="C’est vous"> (vous)</span>}
        {isObs && <span className="participant-seat__observer" title="Ne vote pas"> (observateur)</span>}
        {isDisconnected && (
          <span className="participant-seat__parti" title="A quitté la session">
            {' '}(parti)
          </span>
        )}
        {hasVoted && phase === 'voting' && !isDisconnected && (
          <span className="participant-seat__voted" title="A voté"> ✓</span>
        )}
      </span>
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
