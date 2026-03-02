export const CARD_VALUES = [
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

export type CardValue = (typeof CARD_VALUES)[number]['value'];

export function getCardLabel(value: string): string {
  const card = CARD_VALUES.find((c) => c.value === value);
  return card?.label ?? value;
}
