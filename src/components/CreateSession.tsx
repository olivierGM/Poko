import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createSession, getOrCreateParticipantId } from '../lib/session';

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
    setLoading(true);
    setError(null);
    try {
      const hostId = getOrCreateParticipantId();
      const sessionId = await createSession(hostId);
      navigate(`/session/${sessionId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la création');
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
