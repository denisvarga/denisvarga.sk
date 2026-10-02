import { useId, type MouseEvent } from 'react';
import { PROJECT_IMAGE_SIZE, type Project } from '../../data/projects';
import { useLang } from '../../i18n/lang-context';
import { pad2 } from './project-scope';
import styles from './projects.module.css';

interface ProjectCardProps {
  readonly project: Project;
  readonly index: number;
  readonly total: number;
  readonly onOpen: (index: number, opener: HTMLElement | null) => void;
}

export function ProjectCard({ project, index, total, onOpen }: ProjectCardProps) {
  const { lang, ui } = useLang();
  const nameId = useId();
  const open = (event: MouseEvent<HTMLButtonElement>) => onOpen(index, event.currentTarget);

  return (
    <div className={styles.card}>
      <button type="button" className={styles.media} onClick={open}>
        <img
          className={styles.img}
          src={project.image}
          alt={project.name}
          width={PROJECT_IMAGE_SIZE.width}
          height={PROJECT_IMAGE_SIZE.height}
          loading="lazy"
          decoding="async"
          draggable={false}
        />
      </button>
      <div className={styles.meta}>
        <div className={styles.text}>
          <span className={styles.num}>
            {pad2(index + 1)} / {pad2(total)}
          </span>
          <h3 id={nameId} className={styles.name}>
            {project.name}
          </h3>
          <span className={styles.desc}>{project.desc[lang]}</span>
        </div>
        <button type="button" className={styles.more} aria-label={ui.more} aria-describedby={nameId} onClick={open}>
          +
        </button>
      </div>
    </div>
  );
}
