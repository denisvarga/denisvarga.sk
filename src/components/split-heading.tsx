import { useRef, type RefObject } from 'react';
import { parseTitleMarkup } from '../lib/title-markup';
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

// The visible gap between words is the mask margin (as in the design). Each mask but the last also
// ends with a real space, zero-size and preserved, so crawlers, screen readers and copy-paste get
// the plain sentence once. Kept inside the mask, the space adds no line-break opportunity, so
// wrapping (text-wrap: balance included) stays exactly as with bare masks.
export function SplitHeading({ as: Tag, text, className, delay, enter = false }: SplitHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);
  useReveal(enter ? NO_REF : ref);
  const words = parseTitleMarkup(text);
  const mode = enter ? { 'data-enter-split': '' } : { 'data-split': '' };

  return (
    <Tag ref={ref} className={className ? `${styles.heading} ${className}` : styles.heading} data-delay={delay} {...mode}>
      {words.map((word, i) => (
        <span key={`${i}-${word.text}`} className="word-mask">
          <span className={`word ${word.bold ? styles.bold : styles.light}`}>{word.text}</span>
          {i < words.length - 1 && <span className={styles.space}>{' '}</span>}
        </span>
      ))}
    </Tag>
  );
}
