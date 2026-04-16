export type CardScale = 'fibonacci' | 'tshirt';

const FIBONACCI_VALUES = [
  { value: '1', label: '1', emoji: false },
  { value: '2', label: '2', emoji: false },
  { value: '3', label: '3', emoji: false },
  { value: '5', label: '5', emoji: false },
  { value: '8', label: '8', emoji: false },
  { value: '13', label: '13', emoji: false },
  { value: '20', label: '20', emoji: false },
  { value: '40', label: '40', emoji: false },
  { value: '100', label: '100', emoji: false },
  { value: '?', label: '⏳', emoji: true },
  { value: 'break', label: '☕', emoji: true },
] as const;

const TSHIRT_VALUES = [
  { value: 'XS', label: 'XS', emoji: false },
  { value: 'S', label: 'S', emoji: false },
  { value: 'M', label: 'M', emoji: false },
  { value: 'L', label: 'L', emoji: false },
  { value: 'XL', label: 'XL', emoji: false },
  { value: 'XXL', label: 'XXL', emoji: false },
  { value: '?', label: '⏳', emoji: true },
  { value: 'break', label: '☕', emoji: true },
] as const;

/** Valeurs par défaut (Fibonacci) — pour compatibilité avec le code existant. */
export const CARD_VALUES = FIBONACCI_VALUES;

export function getCardsByScale(scale: CardScale): readonly { value: string; label: string; emoji: boolean }[] {
  return scale === 'tshirt' ? TSHIRT_VALUES : FIBONACCI_VALUES;
}

export function getCardLabel(value: string, scale: CardScale = 'fibonacci'): string {
  const cards = getCardsByScale(scale);
  const card = (cards as readonly { value: string; label: string }[]).find((c) => c.value === value);
  return card?.label ?? value;
}
