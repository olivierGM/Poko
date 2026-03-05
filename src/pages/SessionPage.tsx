import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { PokerTable } from '../components/PokerTable';
import { CardDeck } from '../components/CardDeck';
import { HostControls } from '../components/HostControls';
import { RevealedStats } from '../components/RevealedStats';
import { useSession } from '../hooks/useSession';
import type { Participant, Session } from '../hooks/useSession';
import { addParticipant, updateVote, updateParticipantRole, getOrCreateParticipantId, createSession } from '../lib/session';
import type { ParticipantRole } from '../lib/session';
import {
  setPresence,
  removePresence,
  usePresence,
  disconnectPresence,
  connectPresence,
  updatePresenceHeartbeat,
} from '../lib/presence';
import { rtdb } from '../lib/firebase';

const DEMO_PARTICIPANTS: Participant[] = [
  { id: 'd1', participantId: 'demo-1', name: 'Alice', vote: '5', joinedAt: null, role: 'participant' },
  { id: 'd2', participantId: 'demo-2', name: 'Bob', vote: '8', joinedAt: null, role: 'participant' },
  { id: 'd3', participantId: 'demo-3', name: 'Charlie', vote: '3', joinedAt: null, role: 'participant' },
  { id: 'd4', participantId: 'demo-4', name: 'Diana', vote: '13', joinedAt: null, role: 'participant' },
  { id: 'd5', participantId: 'demo-5', name: 'Eve', vote: '2', joinedAt: null, role: 'participant' },
  { id: 'd6', participantId: 'demo-6', name: 'Frank', vote: '20', joinedAt: null, role: 'participant' },
  { id: 'd7', participantId: 'demo-7', name: 'Grace', vote: '?', joinedAt: null, role: 'participant' },
  { id: 'd8', participantId: 'demo-8', name: 'Henry', vote: '5', joinedAt: null, role: 'participant' },
  { id: 'd9', participantId: 'demo-9', name: 'Iris', vote: '8', joinedAt: null, role: 'participant' },
  { id: 'd10', participantId: 'demo-10', name: 'Julia', vote: 'break', joinedAt: null, role: 'participant' },
  { id: 'd11', participantId: 'demo-11', name: 'Kevin', vote: '1', joinedAt: null, role: 'participant' },
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isDemo = sessionId === 'demo';
  const realSession = useSession(isDemo ? null : sessionId ?? null);
  const participantId =
    searchParams.get('testParticipantId')?.trim() || getOrCreateParticipantId();

  const session = isDemo ? DEMO_SESSION : realSession.session;
  const participants = isDemo ? DEMO_PARTICIPANTS : realSession.participants;
  const loading = isDemo ? false : realSession.loading;
  const error = realSession.error;

  const [showNewSessionConfirm, setShowNewSessionConfirm] = useState(false);
  const rtdbConnected = usePresence(isDemo ? null : sessionId ?? null);
  const connectedParticipantIds = isDemo
    ? new Set(participants.map((p) => p.participantId))
    : rtdbConnected;

  const displayName =
    searchParams.get('testName')?.trim().slice(0, 20) || userName.trim().slice(0, 20);
  const presenceRef = useRef<{ sessionId: string; participantId: string } | null>(null);
  presenceRef.current =
    isDemo || !rtdb || !sessionId ? null : { sessionId, participantId };

  useEffect(() => {
    if (isDemo || !sessionId || !session || !displayName) return;
    addParticipant(sessionId, participantId, displayName).catch(() => {});
  }, [isDemo, sessionId, session, displayName, participantId]);

  useEffect(() => {
    if (isDemo || !rtdb || !sessionId || !displayName) return undefined;
    connectPresence();
    setPresence(sessionId, participantId, displayName).catch((err) => {
      console.warn('[Poko presence] setPresence failed:', err);
    });
    const heartbeat = setInterval(
      () => updatePresenceHeartbeat(sessionId, participantId, displayName).catch(() => {}),
      5_000
    );
    return () => {
      clearInterval(heartbeat);
      void removePresence(sessionId, participantId).catch(() => {});
    };
  }, [isDemo, sessionId, participantId, displayName]);

  useEffect(() => {
    if (isDemo || !rtdb) return;
    function onLeave() {
      const p = presenceRef.current;
      if (p) {
        removePresence(p.sessionId, p.participantId).catch(() => {});
      }
      disconnectPresence();
    }
    window.addEventListener('pagehide', onLeave);
    window.addEventListener('beforeunload', onLeave);
    return () => {
      window.removeEventListener('pagehide', onLeave);
      window.removeEventListener('beforeunload', onLeave);
    };
  }, [isDemo]);

  const currentParticipant = participants.find((p) => p.participantId === participantId);
  const myVote = currentParticipant?.vote ?? null;
  const isHost = session?.hostId === participantId;
  const isObserver = currentParticipant?.role === 'observer';

  async function handleToggleObserver() {
    if (isDemo || !sessionId) return;
    const nextRole: ParticipantRole = isObserver ? 'participant' : 'observer';
    await updateParticipantRole(sessionId, participantId, nextRole);
  }

  function openNewSessionConfirm() {
    if (isDemo) return;
    setShowNewSessionConfirm(true);
  }

  async function confirmNewSession() {
    setShowNewSessionConfirm(false);
    if (sessionId) await removePresence(sessionId, participantId).catch(() => {});
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
      observerButton={
        !isDemo && currentParticipant
          ? {
              label: isObserver ? 'Participer au vote' : 'Devenir observateur',
              onClick: handleToggleObserver,
            }
          : undefined
      }
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
          connectedParticipantIds={connectedParticipantIds}
        />

        {session.phase === 'revealed' && (
          <RevealedStats participants={participants} />
        )}

        {!isDemo && <HostControls sessionId={session.id} isHost={isHost} phase={session.phase} />}

        {isObserver ? (
          <p className="session-page__observer-hint">En mode observateur, vous voyez la session sans voter.</p>
        ) : (
          <CardDeck
            selectedValue={myVote}
            onSelect={handleSelectCard}
            disabled={isDemo}
          />
        )}

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
