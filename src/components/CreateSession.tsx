import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getOrCreateParticipantId } from '../lib/session';
import type { CardScale } from '../lib/session';
import { isFirebaseConfigured } from '../lib/firebase';

interface CreateSessionProps {
  userName: string;
}

export function CreateSession({ userName }: CreateSessionProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cardScale, setCardScale] = useState<CardScale>('fibonacci');

  async function handleCreate() {
    if (!userName.trim()) {
      setError('Indique ton nom pour créer une session.');
      return;
    }
    if (!isFirebaseConfigured()) {
      setError(
        "Firebase n'est pas configuré. Crée un projet sur console.firebase.google.com, ajoute un fichier .env avec VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_API_KEY, etc. (voir .env.example)."
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const hostId = getOrCreateParticipantId();
      const sessionId = await Promise.race([
        createSession(hostId, cardScale),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Délai dépassé. Vérifie ta connexion et les règles Firestore.')), 15000)
        ),
      ]);
      navigate(`/${sessionId}`);
    } catch (e) {
      const err = e as Error & { code?: string };
      const message = err?.message ?? String(e);
      const code = err?.code ?? '';
      setError(
        code === 'permission-denied' || message.includes('permission') || message.includes('Permission')
          ? 'Accès refusé par Firestore. Vérifie que la base Firestore existe et que les règles autorisent lecture/écriture.'
          : code
            ? `Erreur (${code}): ${message}`
            : message
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="create-session">
      <fieldset className="create-session__scale-fieldset">
        <legend className="create-session__scale-legend">Échelle de vote</legend>
        <label className="create-session__scale-option">
          <input
            type="radio"
            name="cardScale"
            value="fibonacci"
            checked={cardScale === 'fibonacci'}
            onChange={() => setCardScale('fibonacci')}
          />
          <span>Fibonacci <span className="create-session__scale-preview">1 2 3 5 8 13 20…</span></span>
        </label>
        <label className="create-session__scale-option">
          <input
            type="radio"
            name="cardScale"
            value="tshirt"
            checked={cardScale === 'tshirt'}
            onChange={() => setCardScale('tshirt')}
          />
          <span>T-Shirt <span className="create-session__scale-preview">XS S M L XL XXL</span></span>
        </label>
      </fieldset>
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
