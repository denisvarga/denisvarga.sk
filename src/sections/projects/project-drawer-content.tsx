import { PROJECT_IMAGE_SIZE, type Project } from '../../data/projects';
import { useLang } from '../../i18n/lang-context';
import styles from './drawer-content.module.css';
import { pad2, projectDomain } from './project-format';

interface ProjectDrawerContentProps {
  readonly project: Project;
  readonly titleId: string;
}

export function ProjectDrawerContent({ project, titleId }: ProjectDrawerContentProps) {
  const { lang, t, ui } = useLang();

  return (
    <>
      <div className={styles.media}>
        <img
          className={styles.img}
          src={project.image}
          alt={project.name}
          width={PROJECT_IMAGE_SIZE.width}
          height={PROJECT_IMAGE_SIZE.height}
          loading="lazy"
          decoding="async"
        />
      </div>
      <div className={styles.head}>
        <h2 id={titleId} className={styles.name}>
          {project.name}
        </h2>
        <p className={styles.kind}>
          {project.kind[lang]} · {t.work.contexts[project.context]}
        </p>
        {project.url ? (
          <a className={styles.domain} href={project.url} target="_blank" rel="noopener">
            {projectDomain(project.url)} <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span className={styles.private}>{ui.privateProject}</span>
        )}
      </div>
      <div className={styles.intro}>
        <p className={styles.summary}>{project.summary[lang]}</p>
        {project.credit && <small className={styles.credit}>{project.credit[lang]}</small>}
      </div>
      <div className={styles.scope}>
        <span className={styles.scopeLabel}>{ui.scope}</span>
        {project.scope[lang].map((item, i) => (
          <div key={item} className={styles.scopeRow}>
            <span className={styles.scopeNum} aria-hidden="true">
              {pad2(i + 1)}
            </span>
            <span>{item}</span>
          </div>
        ))}
      </div>
      {project.url && (
        <a className={styles.cta} href={project.url} target="_blank" rel="noopener">
          {ui.open} <span aria-hidden="true">↗</span>
        </a>
      )}
    </>
  );
}
