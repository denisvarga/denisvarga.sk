import { useRef, type RefObject } from 'react';
import { parseTitleMarkup, plainTitle } from '../lib/title-markup';
import { useReveal } from '../motion/use-reveal';
import styles from './split-heading.module.css';

export interface SplitHeadingProps {
  readonly as: 'h1' | 'h2';
  readonly text: string;
  readonly className?: string;
  readonly delay?: 0 | 200;
  /** Hero only: first-paint keyframes (data-enter-split) instead of the scroll reveal. */
  readonly enter?: boolean;
}

const NO_REF: RefObject<HTMLHeadingElement | null> = { current: null };

// Word spans sit side by side without whitespace (spacing is the mask margin, as in the design),
// so screen readers get the plain title from a visually hidden copy instead.
export function SplitHeading({ as: Tag, text, className, delay, enter = false }: SplitHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  useReveal(enter ? NO_REF : ref);
  const words = parseTitleMarkup(text);
  const mode = enter ? { 'data-enter-split': '' } : { 'data-split': '' };

  return (
    <Tag ref={ref} className={className ? `${styles.heading} ${className}` : styles.heading} data-delay={delay} {...mode}>
      {words.map((word, i) => (
        <span key={`${i}-${word.text}`} className="word-mask" aria-hidden="true">
          <span className={`word ${word.bold ? styles.bold : styles.light}`}>{word.text}</span>
        </span>
      ))}
      <span className="visually-hidden">{plainTitle(text)}</span>
    </Tag>
  );
}
