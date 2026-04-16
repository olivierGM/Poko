import { getCardsByScale } from '../lib/cards';
import type { CardScale } from '../lib/cards';
import { Card } from './Card';

interface CardDeckProps {
  selectedValue: string | null;
  onSelect: (value: string) => void;
  disabled?: boolean;
  cardScale?: CardScale;
}

export function CardDeck({ selectedValue, onSelect, disabled, cardScale = 'fibonacci' }: CardDeckProps) {
  const cards = getCardsByScale(cardScale);
  return (
    <div className="card-deck">
      {cards.map(({ value }) => (
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
