import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PokerTable } from '../components/PokerTable';
import { CardDeck } from '../components/CardDeck';
import { HostControls } from '../components/HostControls';
import { useSession } from '../hooks/useSession';
import { addParticipant, updateVote, getOrCreateParticipantId } from '../lib/session';

interface SessionPageProps {
  userName: string;
}

export function SessionPage({ userName }: SessionPageProps) {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { session, participants, loading, error } = useSession(sessionId ?? null);
  const participantId = getOrCreateParticipantId();

  useEffect(() => {
    if (!sessionId || !session || !userName.trim()) return;
    addParticipant(sessionId, participantId, userName.trim()).catch(() => {});
  }, [sessionId, session, userName, participantId]);

  const currentParticipant = participants.find((p) => p.participantId === participantId);
  const myVote = currentParticipant?.vote ?? null;
  const isHost = session?.hostId === participantId;

  async function handleSelectCard(value: string) {
    if (!sessionId) return;
    const newVote = myVote === value ? null : value;
    await updateVote(sessionId, participantId, newVote);
  }

  if (loading && !session) {
    return (
      <Layout title="PokoQC">
        <div className="session-loading">Chargement de la session…</div>
      </Layout>
    );
  }

  if (error || !session) {
    return (
      <Layout title="PokoQC">
        <div className="session-error">
          <p>{error ?? 'Session introuvable.'}</p>
          <button type="button" className="button" onClick={() => navigate('/')}>
            Retour à l&apos;accueil
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="PokoQC">
      <div className="session-page">
        <div className="session-page__share">
          <span className="session-page__share-label">Partager :</span>
          <code className="session-page__share-url">
            {window.location.origin}/session/{sessionId}
          </code>
          <button
            type="button"
            className="button button--small"
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/session/${sessionId}`);
            }}
          >
            Copier
          </button>
        </div>

        <PokerTable
          participants={participants}
          phase={session.phase}
          currentParticipantId={participantId}
        />

        <HostControls sessionId={session.id} isHost={isHost} phase={session.phase} />

        <CardDeck
          selectedValue={myVote}
          onSelect={handleSelectCard}
          disabled={session.phase === 'revealed'}
        />
      </div>
    </Layout>
  );
}
