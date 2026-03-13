import { useEffect, useRef, useState } from 'react';

const FLY_DURATION_MS = 600;
const FLY_MAX_VISIBLE_MS = 2000;

interface FlyingEmojiProps {
  id: string;
  emoji: string;
  fromLeft: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  onEnd: (id: string) => void;
}

export function FlyingEmoji({
  id,
  emoji,
  fromLeft,
  startX,
  startY,
  endX,
  endY,
  onEnd,
}: FlyingEmojiProps) {
  const onEndRef = useRef(onEnd);
  const elRef = useRef<HTMLDivElement | null>(null);
  const animationRef = useRef<Animation | null>(null);
  const endedRef = useRef(false);
  const [hidden, setHidden] = useState(false);
  onEndRef.current = onEnd;

  useEffect(() => {
    setHidden(false);
    const thisId = id;
    endedRef.current = false;

    const doEnd = () => {
      if (endedRef.current) return;
      endedRef.current = true;
      setHidden(true);
      onEndRef.current(thisId);
    };

    const safetyTimer = setTimeout(doEnd, 700);
    const maxTimer = setTimeout(doEnd, FLY_MAX_VISIBLE_MS);

    const raf = requestAnimationFrame(() => {
      const el = elRef.current;
      if (!el) return;

      const animation = el.animate(
        [
          { left: `${startX}px`, top: `${startY}px` },
          { left: `${endX}px`, top: `${endY}px` },
        ],
        {
          duration: FLY_DURATION_MS,
          easing: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
          fill: 'forwards',
        }
      );

      animationRef.current = animation;
      animation.onfinish = doEnd;
    });

    return () => {
      clearTimeout(safetyTimer);
      clearTimeout(maxTimer);
      cancelAnimationFrame(raf);
      animationRef.current?.cancel();
    };
  }, [id, startX, startY, endX, endY]);

  if (hidden) return null;

  return (
    <div
      ref={elRef}
      className={`flying-emoji flying-emoji--${fromLeft ? 'from-left' : 'from-right'}`}
      style={{
        position: 'fixed',
        left: `${startX}px`,
        top: `${startY}px`,
        transform: 'translate(-50%, -50%)',
        fontSize: '2rem',
        lineHeight: 1,
        minWidth: '2rem',
        minHeight: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
      role="img"
      aria-hidden
    >
      {emoji}
    </div>
  );
}
