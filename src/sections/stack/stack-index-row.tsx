import { useId, useRef } from 'react';
import { useReveal } from '../../motion/use-reveal';
import styles from './stack.module.css';

interface StackIndexRowProps {
  readonly index: number;
  readonly name: string;
  readonly items: readonly string[];
  readonly active: boolean;
  readonly onPick: (index: number) => void;
}

const pad2 = (n: number) => String(n).padStart(2, '0');

export function StackIndexRow({ index, name, items, active, onPick }: StackIndexRowProps) {
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();
  useReveal(ref);
  const pick = () => onPick(index);

  return (
    <div ref={ref} data-reveal className={styles.row} data-on={active ? '' : undefined} onMouseEnter={pick}>
      <button type="button" className={styles.header} aria-expanded={active} aria-controls={panelId} onClick={pick}>
        <span className={styles.idx} aria-hidden="true">
          {pad2(index + 1)}
        </span>
        <span className={styles.name}>{name}</span>
        <span className={styles.count} aria-hidden="true">
          {pad2(items.length)}
        </span>
      </button>
      <div id={panelId} className={styles.expander} aria-hidden={!active}>
        <div className={styles.clip}>
          <div className={styles.chips}>
            {items.map((item) => (
              <span key={item} className={styles.chip}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
