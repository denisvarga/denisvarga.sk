import { useEffect, useState } from 'react';
import { matchesMedia, REDUCED_MOTION_QUERY } from '../motion/use-media-query';

export const TYPE_TICK_MS = 18;
export const TYPE_STEP = 3;

interface TypingBubbleProps {
  readonly text: string;
  /** False shows the full text at once (older messages, or a new question cut the typing short). */
  readonly animate: boolean;
  readonly className?: string;
}

// Ticks update only this component's state, so the rest of the chat never re-renders while typing.
export function TypingBubble({ text, animate, className }: TypingBubbleProps) {
  const [reducedMotion] = useState(() => matchesMedia(REDUCED_MOTION_QUERY));
  const [typed, setTyped] = useState(0);
  const instant = !animate || reducedMotion;

  useEffect(() => {
    if (instant) return;
    let count = 0;
    const timer = setInterval(() => {
      count += TYPE_STEP;
      setTyped(count);
      if (count >= text.length) clearInterval(timer);
    }, TYPE_TICK_MS);
    return () => clearInterval(timer);
  }, [instant, text]);

  return (
    <span className={className}>
      <span className="visually-hidden">{text}</span>
      <span aria-hidden="true">{instant ? text : text.slice(0, typed)}</span>
    </span>
  );
}
