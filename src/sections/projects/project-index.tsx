import { useId, useRef, useState } from 'react';
import { PROJECTS } from '../../data/projects';
import { useLang } from '../../i18n/lang-context';
import { useReveal } from '../../motion/use-reveal';
import { ProjectGridCard } from './project-grid-card';
import styles from './project-index.module.css';

interface ProjectIndexProps {
  readonly onOpen: (index: number, opener: HTMLElement | null) => void;
}

// The list is always rendered so the prerendered page carries every project for crawlers;
// collapsed it is only squeezed to zero height and made inert. Until the first expand it also has
// no box, because Chromium fetches lazy images inside a zero-height clip; afterwards it keeps one
// so closing can animate (Firefox cannot transition display).
export function ProjectIndex({ onOpen }: ProjectIndexProps) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const [primed, setPrimed] = useState(false);
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
        onClick={() => {
          setOpen((value) => !value);
          setPrimed(true);
        }}
      >
        <span>{open ? t.work.hide : `${t.work.all} (${PROJECTS.length})`}</span>
        <span className={styles.icon} aria-hidden="true">
          +
        </span>
      </button>
      <div
        id={panelId}
        className={styles.panel}
        data-open={open ? '' : undefined}
        data-primed={primed ? '' : undefined}
        inert={!open}
      >
        <div className={styles.clip}>
          <ol className={styles.list}>
            {PROJECTS.map((project, i) => (
              <ProjectGridCard key={project.slug} project={project} index={i} total={PROJECTS.length} onOpen={onOpen} />
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
