import { useEffect, useState } from 'react';
import type { ProjectDetailsBySlug } from '../../../shared/projects';
import { PROJECT_IMAGE_SIZE, type Project } from '../../data/projects';
import { useLang } from '../../i18n/lang-context';
import type { Lang } from '../../i18n/types';
import styles from './drawer-content.module.css';
import { pad2, projectDomain } from './project-format';

// The drawer texts stay out of the entry chunk: each language is its own chunk, loaded on demand.
const DETAILS_CHUNKS: Readonly<Record<Lang, () => Promise<ProjectDetailsBySlug>>> = {
  sk: () => import('../../../shared/project-details-sk').then((m) => m.PROJECT_DETAILS_SK),
  en: () => import('../../../shared/project-details-en').then((m) => m.PROJECT_DETAILS_EN),
};
const requests = new Map<Lang, Promise<ProjectDetailsBySlug>>();
const loaded = new Map<Lang, ProjectDetailsBySlug>();

/** One request per language; a failed chunk load is forgotten, so the next call tries again. */
export function loadProjectDetails(lang: Lang): Promise<ProjectDetailsBySlug> {
  const known = requests.get(lang);
  if (known) return known;
  const request = DETAILS_CHUNKS[lang]().then(
    (details) => {
      loaded.set(lang, details);
      return details;
    },
    (error: unknown) => {
      requests.delete(lang);
      throw error;
    },
  );
  requests.set(lang, request);
  return request;
}

/** Warms the chunk on hover, focus or idle. A failure is reported by the drawer's own load. */
export function prefetchProjectDetails(lang: Lang): void {
  if (!requests.has(lang)) loadProjectDetails(lang).catch(() => {});
}

type DetailsState = ProjectDetailsBySlug | 'loading' | 'failed';

// Renders at once when a prefetch already resolved; otherwise loads, and retries on the next
// project after a failure.
function useProjectDetails(lang: Lang, slug: string): DetailsState {
  const [state, setState] = useState<DetailsState>(() => loaded.get(lang) ?? 'loading');
  const ready = typeof state === 'object';

  useEffect(() => {
    if (ready) return;
    let alive = true;
    loadProjectDetails(lang).then(
      (details) => {
        if (alive) setState(details);
      },
      (error: unknown) => {
        console.error('project_details_failed', error);
        if (alive) setState('failed');
      },
    );
    return () => {
      alive = false;
    };
  }, [lang, slug, ready]);

  return state;
}

interface ProjectDrawerContentProps {
  readonly project: Project;
  readonly titleId: string;
}

export function ProjectDrawerContent({ project, titleId }: ProjectDrawerContentProps) {
  const { lang, t, ui } = useLang();
  const state = useProjectDetails(lang, project.slug);
  const details = typeof state === 'object' ? state[project.slug] : undefined;

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
        {/* No referrer: the portfolio sites must not see that a visit came from this CV. */}
        {project.url ? (
          <a className={styles.domain} href={project.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
            {projectDomain(project.url)} <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <span className={styles.private}>{ui.privateProject}</span>
        )}
      </div>
      {/* Until the texts arrive (or if they never do) the card line stands in for the summary. */}
      <div className={styles.intro} aria-busy={state === 'loading' || undefined}>
        <p className={styles.summary}>{details ? details.summary : project.desc[lang]}</p>
        {project.credit && <small className={styles.credit}>{project.credit[lang]}</small>}
      </div>
      {details && (
        <div className={styles.scope}>
          <span className={styles.scopeLabel}>{ui.scope}</span>
          {details.scope.map((item, i) => (
            <div key={item} className={styles.scopeRow}>
              <span className={styles.scopeNum} aria-hidden="true">
                {pad2(i + 1)}
              </span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
      {project.url && (
        <a className={styles.cta} href={project.url} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">
          {ui.open} <span aria-hidden="true">↗</span>
        </a>
      )}
    </>
  );
}
