import { useState } from 'react';
import { revealCards, resetToVoting } from '../lib/session';

interface HostControlsProps {
  sessionId: string;
  isHost: boolean;
  phase: 'voting' | 'revealed';
}

export function HostControls({ sessionId, isHost, phase }: HostControlsProps) {
  const [loading, setLoading] = useState(false);

  if (!isHost) return null;

  async function handleReveal() {
    setLoading(true);
    try {
      await revealCards(sessionId);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset() {
    setLoading(true);
    try {
      await resetToVoting(sessionId);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="host-controls">
      {phase === 'voting' ? (
        <button
          type="button"
          className="button button--primary"
          onClick={handleReveal}
          disabled={loading}
        >
          {loading ? '…' : 'Révéler les cartes'}
        </button>
      ) : (
        <button
          type="button"
          className="button button--secondary"
          onClick={handleReset}
          disabled={loading}
        >
          {loading ? '…' : 'Nouveau tour'}
        </button>
      )}
    </div>
  );
}
