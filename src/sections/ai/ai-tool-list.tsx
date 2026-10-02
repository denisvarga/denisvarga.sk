import type { RefObject } from 'react';
import type { AiTool } from '../../i18n/types';
import styles from './ai.module.css';

interface AiToolListProps {
  readonly tools: readonly AiTool[];
  readonly active: number;
  readonly terminalId: string;
  /** The terminal writes each tool's progress bar through these (CSSOM, never rendered). */
  readonly barRefs: RefObject<(HTMLElement | null)[]>;
  readonly onPick: (index: number) => void;
}

export function AiToolList({ tools, active, terminalId, barRefs, onPick }: AiToolListProps) {
  return (
    <div className={styles.tools}>
      {tools.map((tool, i) => {
        const on = i === active;
        return (
          <button
            key={tool.name}
            type="button"
            className={styles.tool}
            data-on={on ? '' : undefined}
            aria-pressed={on}
            aria-controls={terminalId}
            onClick={() => onPick(i)}
          >
            <span className={styles.toolHead}>
              <span className={styles.toolName}>
                <span aria-hidden="true" className={styles.toolNameSizer}>
                  {tool.name}
                </span>
                <span className={styles.toolNameText}>{tool.name}</span>
              </span>
              <span className={styles.toolNum} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
            </span>
            <span className={styles.toolDesc}>{tool.desc}</span>
            <span
              ref={(el) => {
                barRefs.current[i] = el;
              }}
              className={styles.toolBar}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}
