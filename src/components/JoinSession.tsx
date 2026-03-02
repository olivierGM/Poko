import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface JoinSessionProps {
  userName: string;
}

export function JoinSession({ userName }: JoinSessionProps) {
  const navigate = useNavigate();
  const [sessionIdInput, setSessionIdInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    const id = sessionIdInput.trim().toLowerCase().replace(/\s/g, '');
    if (!id) {
      setError("Saisis l'ID de la session.");
      return;
    }
    if (!userName.trim()) {
      setError('Indique ton nom pour rejoindre.');
      return;
    }
    setError(null);
    navigate(`/${id}`);
  }

  return (
    <form className="join-session" onSubmit={handleJoin}>
      <label htmlFor="session-id" className="join-session__label">
        ID de la session
      </label>
      <input
        id="session-id"
        type="text"
        className="input join-session__input"
        placeholder="ex. abc12xyz"
        value={sessionIdInput}
        onChange={(e) => setSessionIdInput(e.target.value)}
        autoComplete="off"
      />
      <button type="submit" className="button button--secondary">
        Rejoindre
      </button>
      {error && <p className="join-session__error">{error}</p>}
    </form>
  );
}
