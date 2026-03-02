import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PokerTable } from '../components/PokerTable';
import { CardDeck } from '../components/CardDeck';
import { HostControls } from '../components/HostControls';
import { RevealedStats } from '../components/RevealedStats';
import { useSession } from '../hooks/useSession';
import type { Participant, Session } from '../hooks/useSession';
import { addParticipant, updateVote, getOrCreateParticipantId, createSession, updateParticipantLastSeen } from '../lib/session';

const DEMO_PARTICIPANTS: Participant[] = [
  { id: 'd1', participantId: 'demo-1', name: 'Alice', vote: '5', joinedAt: null },
  { id: 'd2', participantId: 'demo-2', name: 'Bob', vote: '8', joinedAt: null },
  { id: 'd3', participantId: 'demo-3', name: 'Charlie', vote: '3', joinedAt: null },
  { id: 'd4', participantId: 'demo-4', name: 'Diana', vote: '13', joinedAt: null },
  { id: 'd5', participantId: 'demo-5', name: 'Eve', vote: '2', joinedAt: null },
  { id: 'd6', participantId: 'demo-6', name: 'Frank', vote: '20', joinedAt: null },
  { id: 'd7', participantId: 'demo-7', name: 'Grace', vote: '?', joinedAt: null },
  { id: 'd8', participantId: 'demo-8', name: 'Henry', vote: '5', joinedAt: null },
  { id: 'd9', participantId: 'demo-9', name: 'Iris', vote: '8', joinedAt: null },
  { id: 'd10', participantId: 'demo-10', name: 'Julia', vote: 'break', joinedAt: null },
  { id: 'd11', participantId: 'demo-11', name: 'Kevin', vote: '1', joinedAt: null },
];

const DEMO_SESSION: Session = {
  id: 'demo',
  createdAt: null,
  hostId: 'demo-1',
  phase: 'revealed',
  currentStory: '',
};

interface SessionPageProps {
  userName: string;
  onNameChange?: (name: string) => void;
}

export function SessionPage({ userName, onNameChange }: SessionPageProps) {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isDemo = sessionId === 'demo';
  const realSession = useSession(isDemo ? null : sessionId ?? null);
  const participantId = getOrCreateParticipantId();

  const session = isDemo ? DEMO_SESSION : realSession.session;
  const participants = isDemo ? DEMO_PARTICIPANTS : realSession.participants;
  const loading = isDemo ? false : realSession.loading;
  const error = realSession.error;

  const [now, setNow] = useState(() => Date.now());
  const [showNewSessionConfirm, setShowNewSessionConfirm] = useState(false);

  useEffect(() => {
    if (isDemo || !sessionId || !session || !userName.trim()) return;
    addParticipant(sessionId, participantId, userName.trim()).catch(() => {});
  }, [isDemo, sessionId, session, userName, participantId]);

  useEffect(() => {
    if (isDemo || !sessionId) return;
    const t = setInterval(() => updateParticipantLastSeen(sessionId, participantId).catch(() => {}), 25_000);
    return () => clearInterval(t);
  }, [isDemo, sessionId, participantId]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  const currentParticipant = participants.find((p) => p.participantId === participantId);
  const myVote = currentParticipant?.vote ?? null;
  const isHost = session?.hostId === participantId;

  function openNewSessionConfirm() {
    if (isDemo) return;
    setShowNewSessionConfirm(true);
  }

  async function confirmNewSession() {
    setShowNewSessionConfirm(false);
    try {
      const newId = await createSession(participantId);
      navigate(`/${newId}`);
    } catch {
      // ignore
    }
  }

  async function handleSelectCard(value: string) {
    if (isDemo || !sessionId) return;
    const newVote = myVote === value ? null : value;
    await updateVote(sessionId, participantId, newVote);
  }

  if (loading && !session) {
    return (
      <Layout title="Poko" userName={userName} onNameChange={onNameChange}>
        <div className="session-loading">Chargement de la session…</div>
      </Layout>
    );
  }

  if (error || !session) {
    return (
      <Layout title="Poko" userName={userName} onNameChange={onNameChange}>
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
    <Layout
      title="Poko"
      userName={userName}
      onNameChange={onNameChange}
      onNewSession={!isDemo && isHost ? openNewSessionConfirm : undefined}
    >
      <div className="session-page">
        {isDemo && (
          <div className="session-page__demo-banner">
            Aperçu avec 11 joueurs (mode démo) — <button type="button" className="button button--small" onClick={() => navigate('/')}>Retour à l&apos;accueil</button>
          </div>
        )}
        {!isDemo && (
          <div className="session-page__share">
              <span className="session-page__share-label">Partager :</span>
              <code className="session-page__share-url">
                {window.location.origin}/{sessionId}
              </code>
              <button
                type="button"
                className="button button--small"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/${sessionId}`);
                }}
              >
                Copier
              </button>
          </div>
        )}

        <PokerTable
          participants={participants}
          phase={session.phase}
          currentParticipantId={isDemo ? null : participantId}
          now={now}
        />

        {session.phase === 'revealed' && (
          <RevealedStats participants={participants} />
        )}

        {!isDemo && <HostControls sessionId={session.id} isHost={isHost} phase={session.phase} />}

        <CardDeck
          selectedValue={myVote}
          onSelect={handleSelectCard}
          disabled={isDemo}
        />

        {showNewSessionConfirm && (
          <div className="confirm-modal-overlay" role="dialog" aria-labelledby="confirm-new-session-title">
            <div className="confirm-modal">
              <h2 id="confirm-new-session-title" className="confirm-modal__title">Nouvelle partie</h2>
              <p className="confirm-modal__text">
                Vous allez quitter cette session et créer une nouvelle partie. Continuer ?
              </p>
              <div className="confirm-modal__actions">
                <button type="button" className="button button--secondary" onClick={() => setShowNewSessionConfirm(false)}>
                  Annuler
                </button>
                <button type="button" className="button button--primary" onClick={confirmNewSession}>
                  Continuer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
