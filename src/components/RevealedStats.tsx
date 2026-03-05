import { CARD_VALUES } from '../lib/cards';
import { Card } from './Card';
import type { Participant } from '../hooks/useSession';

const NUMERIC_VALUES = new Set(['1', '2', '3', '5', '8', '13', '20', '40', '100']);

interface RevealedStatsProps {
  participants: Participant[];
}

export function RevealedStats({ participants }: RevealedStatsProps) {
  // Exclure les observateurs des statistiques : seuls les participants qui votent comptent.
  const voters = participants.filter((p) => p.role !== 'observer');
  const votes = voters.map((p) => p.vote).filter((v): v is string => v != null && v !== '');
  if (votes.length === 0) return null;

  const voteCounts: Record<string, number> = {};
  for (const v of votes) {
    voteCounts[v] = (voteCounts[v] ?? 0) + 1;
  }

  const numericVotes = votes.filter((v) => NUMERIC_VALUES.has(v));
  const sum = numericVotes.reduce((acc, v) => acc + Number(v), 0);
  const average = numericVotes.length > 0 ? Math.round((sum / numericVotes.length) * 10) / 10 : null;

  const uniqueValues = [...new Set(votes)];
  const consensus = uniqueValues.length === 1;

  const maxCount = Math.max(...Object.values(voteCounts), 1);

  const orderedEntries = CARD_VALUES.filter((c) => (voteCounts[c.value] ?? 0) > 0).map((c) => ({
    value: c.value,
    count: voteCounts[c.value] ?? 0,
  }));

  return (
    <section className="revealed-stats" aria-label="Statistiques des votes">
      <div className="revealed-stats__bars">
        <span className="revealed-stats__bars-label">Votes par carte</span>
        <div className="revealed-stats__bars-list">
          {orderedEntries.map(({ value, count }) => (
            <div key={value} className="revealed-stats__bar-item">
              <div className="revealed-stats__bar-wrap">
                <div
                  className="revealed-stats__bar"
                  style={{ height: `${(count / maxCount) * 100}%` }}
                  title={`${count} vote(s)`}
                />
              </div>
              <div className="revealed-stats__bar-card">
                <Card value={value} faceDown={false} small />
              </div>
              <span className="revealed-stats__bar-count">
                {count} vote{count > 1 ? 's' : ''}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="revealed-stats__summary">
        <div className="revealed-stats__average">
          <span className="revealed-stats__label">Moyenne</span>
          <span className="revealed-stats__average-value">
            {average != null ? average : '—'}
          </span>
        </div>
        <div className="revealed-stats__consensus">
          <span className="revealed-stats__label">Accord</span>
          {consensus ? (
            <div className="revealed-stats__consensus-yes">
              <span className="revealed-stats__consensus-icon" aria-hidden>✓</span>
              <span>Oui ! Consensus total.</span>
            </div>
          ) : (
            <div className="revealed-stats__consensus-no">Pas de consensus</div>
          )}
        </div>
      </div>
    </section>
  );
}
