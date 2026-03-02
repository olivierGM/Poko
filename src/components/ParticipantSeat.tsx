import { Card } from './Card';
import type { Participant } from '../hooks/useSession';

interface ParticipantSeatProps {
  participant: Participant;
  phase: 'voting' | 'revealed';
  isCurrentUser: boolean;
}

export function ParticipantSeat({ participant, phase, isCurrentUser }: ParticipantSeatProps) {
  const showVote = phase === 'revealed' || (isCurrentUser && participant.vote != null);
  const voteValue = participant.vote;

  const hasVoted = participant.vote != null;

  return (
    <div className="participant-seat">
      <div className="participant-seat__avatar" aria-hidden>
        {participant.name.charAt(0).toUpperCase()}
      </div>
      <span className="participant-seat__name">
        {participant.name || 'Anonyme'}
        {hasVoted && phase === 'voting' && (
          <span className="participant-seat__voted" title="A voté"> ✓</span>
        )}
      </span>
      <div className="participant-seat__card">
        {showVote && voteValue != null ? (
          <Card value={voteValue} faceDown={false} small />
        ) : participant.vote != null ? (
          <Card value="" faceDown small />
        ) : null}
      </div>
    </div>
  );
}
