import { useRef, type MouseEvent } from 'react';
import type { Project } from '../../data/projects';
import { useLang } from '../../i18n/lang-context';
import { useReveal } from '../../motion/use-reveal';
import styles from './project-index.module.css';
import { pad2, projectDomain } from './project-scope';

interface ProjectIndexRowProps {
  readonly project: Project;
  readonly index: number;
  readonly onOpen: (index: number, opener: HTMLElement | null) => void;
}

// The spaces between the spans are dropped by the grid and flex layout but keep the button's
// accessible name and the crawled text readable as separate words.
export function ProjectIndexRow({ project, index, onOpen }: ProjectIndexRowProps) {
  const { lang, t } = useLang();
  const ref = useRef<HTMLLIElement>(null);
  useReveal(ref);
  const open = (event: MouseEvent<HTMLButtonElement>) => onOpen(index, event.currentTarget);

  return (
    <li ref={ref} data-reveal className={styles.item}>
      <button type="button" className={styles.row} onClick={open}>
        <span className={styles.idx} aria-hidden="true">
          {pad2(index + 1)}
        </span>{' '}
        <span className={styles.name}>{project.name}</span>{' '}
        <span className={styles.kind}>{project.kind[lang]}</span>{' '}
        <span className={styles.meta}>
          <span className={styles.context}>{t.work.contexts[project.context]}</span>{' '}
          <span className={styles.domain}>
            <span className={styles.dot} aria-hidden="true">
              ·
            </span>
            {projectDomain(project.url)}
          </span>
        </span>
      </button>
    </li>
  );
}
