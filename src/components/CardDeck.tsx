import { CARD_VALUES } from '../lib/cards';
import { Card } from './Card';

interface CardDeckProps {
  selectedValue: string | null;
  onSelect: (value: string) => void;
  disabled?: boolean;
}

export function CardDeck({ selectedValue, onSelect, disabled }: CardDeckProps) {
  return (
    <div className="card-deck">
      {CARD_VALUES.map(({ value }) => (
        <Card
          key={value}
          value={value}
          selected={selectedValue === value}
          onClick={() => !disabled && onSelect(value)}
          faceDown={false}
        />
      ))}
    </div>
  );
}
