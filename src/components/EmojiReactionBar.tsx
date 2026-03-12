const EMOJIS = ['👍', '👏', '😂', '🎉', '❤️', '🔥'];

interface EmojiReactionBarProps {
  onSelect: (emoji: string) => void;
}

export function EmojiReactionBar({ onSelect }: EmojiReactionBarProps) {
  return (
    <div className="emoji-reaction-bar" role="toolbar" aria-label="Réagir avec un emoji">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          className="emoji-reaction-bar__btn"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(emoji);
          }}
          aria-label={`Envoyer ${emoji}`}
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}
