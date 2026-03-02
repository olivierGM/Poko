import { getCardLabel } from '../lib/cards';

interface CardProps {
  value: string;
  selected?: boolean;
  faceDown?: boolean;
  onClick?: () => void;
  small?: boolean;
}

export function Card({ value, selected, faceDown, onClick, small }: CardProps) {
  const label = getCardLabel(value);

  if (faceDown) {
    return (
      <button
        type="button"
        className={`card card--back ${small ? 'card--small' : ''}`}
        aria-label="Carte cachée"
      >
        <span className="card__back-inner">?</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      className={`card ${selected ? 'card--selected' : ''} ${small ? 'card--small' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
      aria-label={`Carte ${label}`}
    >
      <span className="card__value">{label}</span>
    </button>
  );
}
