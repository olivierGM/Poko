import { useState } from 'react';
import type { FormEvent } from 'react';

interface NamePromptProps {
  onSubmit: (name: string) => void;
}

export function NamePrompt({ onSubmit }: NamePromptProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim().slice(0, 20);
    if (trimmed) onSubmit(trimmed);
  }

  return (
    <div className="name-prompt-overlay" role="dialog" aria-labelledby="name-prompt-title">
      <div className="name-prompt">
        <h2 id="name-prompt-title" className="name-prompt__title">
          Comment tu t&apos;appelles ?
        </h2>
        <p className="name-prompt__hint">Ton nom sera affiché aux autres participants.</p>
        <form onSubmit={handleSubmit} className="name-prompt__form">
          <input
            type="text"
            className="input name-prompt__input"
            placeholder="Ton prénom ou pseudo"
            value={value}
            onChange={(e) => setValue(e.target.value.slice(0, 20))}
            maxLength={20}
            autoFocus
            autoComplete="username"
          />
          <button type="submit" className="button button--primary" disabled={!value.trim()}>
            Continuer
          </button>
        </form>
      </div>
    </div>
  );
}
