import { useRef, type MouseEvent } from 'react';
import { PROJECT_IMAGE_SIZE, type Project } from '../../data/projects';
import { useLang } from '../../i18n/lang-context';
import { useReveal } from '../../motion/use-reveal';
import { pad2 } from './project-format';
import styles from './project-grid-card.module.css';

// The context line already names the employer, so the credit only shows when it adds a partner.
const EMPLOYERS: ReadonlySet<Project['context']> = new Set(['grandpano', 'vibration']);

interface ProjectGridCardProps {
  readonly project: Project;
  readonly index: number;
  readonly total: number;
  readonly onOpen: (index: number, opener: HTMLElement | null) => void;
}

// The whole card is one button, so it holds only phrasing content. The spaces between the spans
// are dropped by the flex layout but keep the accessible name and the crawled text readable as
// separate words. The name follows in the same button, so the image is decorative here.
export function ProjectGridCard({ project, index, total, onOpen }: ProjectGridCardProps) {
  const { lang, t } = useLang();
  const ref = useRef<HTMLLIElement>(null);
  useReveal(ref);
  const open = (event: MouseEvent<HTMLButtonElement>) => onOpen(index, event.currentTarget);

  return (
    <li ref={ref} data-reveal>
      <button type="button" className={styles.card} onClick={open}>
        <span className={styles.media}>
          <img
            className={styles.img}
            src={project.image}
            alt=""
            width={PROJECT_IMAGE_SIZE.width}
            height={PROJECT_IMAGE_SIZE.height}
            loading="lazy"
            decoding="async"
          />
        </span>{' '}
        <span className={styles.num} aria-hidden="true">
          {pad2(index + 1)} / {pad2(total)}
        </span>{' '}
        <span className={styles.name}>{project.name}</span>{' '}
        <span className={styles.kind}>
          {project.kind[lang]} · {t.work.contexts[project.context]}
        </span>{' '}
        <span className={styles.desc}>{project.desc[lang]}</span>
        {project.credit && !EMPLOYERS.has(project.context) && (
          <>
            {' '}
            <small className={styles.credit}>{project.credit[lang]}</small>
          </>
        )}
      </button>
    </li>
  );
}
