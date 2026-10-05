import { useId, useRef, useState } from 'react';
import { PROJECTS } from '../../data/projects';
import { useLang } from '../../i18n/lang-context';
import { useReveal } from '../../motion/use-reveal';
import { ProjectIndexRow } from './project-index-row';
import styles from './project-index.module.css';

interface ProjectIndexProps {
  readonly onOpen: (index: number, opener: HTMLElement | null) => void;
}

// The list is always rendered so the prerendered page carries every project for crawlers;
// collapsed it is only squeezed to zero height and made inert.
export function ProjectIndex({ onOpen }: ProjectIndexProps) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);

  return (
    <div ref={ref} data-reveal className={styles.index}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{open ? t.work.hide : `${t.work.all} (${PROJECTS.length})`}</span>
        <span className={styles.icon} aria-hidden="true">
          +
        </span>
      </button>
      <div id={panelId} className={styles.panel} data-open={open ? '' : undefined} inert={!open}>
        <div className={styles.clip}>
          <ol className={styles.list}>
            {PROJECTS.map((project, i) => (
              <ProjectIndexRow key={project.slug} project={project} index={i} onOpen={onOpen} />
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
