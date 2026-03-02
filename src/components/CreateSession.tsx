import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getOrCreateParticipantId } from '../lib/session';
import { isFirebaseConfigured } from '../lib/firebase';

interface CreateSessionProps {
  userName: string;
}

export function CreateSession({ userName }: CreateSessionProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!userName.trim()) {
      setError('Indique ton nom pour créer une session.');
      return;
    }
    if (!isFirebaseConfigured()) {
      setError(
        'Firebase n’est pas configuré. Crée un projet sur console.firebase.google.com, ajoute un fichier .env avec VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_API_KEY, etc. (voir .env.example).'
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const hostId = getOrCreateParticipantId();
      const sessionId = await createSession(hostId);
      navigate(`/session/${sessionId}`);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Erreur lors de la création';
      setError(
        message.includes('permission') || message.includes('Permission')
          ? 'Vérifie les règles Firestore et que le projet Firebase est bien configuré.'
          : message
      );
      setLoading(false);
    }
  }

  return (
    <div className="create-session">
      <button
        type="button"
        className="button button--primary"
        onClick={handleCreate}
        disabled={loading}
      >
        {loading ? 'Création…' : 'Démarrer une session'}
      </button>
      {error && <p className="create-session__error">{error}</p>}
    </div>
  );
}
