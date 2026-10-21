import { useEffect, useRef } from 'react';
import heading from '../../components/split-heading.module.css';
import { SplitHeading } from '../../components/split-heading';
import { PROJECTS } from '../../data/projects';
import { whenIdle, whenLoaded } from '../../gl/init-slices';
import { useLang } from '../../i18n/lang-context';
import { sectionIds } from '../../i18n/ui-copy';
import { useReveal } from '../../motion/use-reveal';
import { ProjectDrawer } from './project-drawer';
import { prefetchProjectDetails } from './project-drawer-content';
import { ProjectIndex } from './project-index';
import { ProjectRail } from './project-rail';
import styles from './projects.module.css';
import { useProjectDrawer } from './use-project-drawer';

const IDLE_FALLBACK_MS = 1500;

export function ProjectsSection() {
  const { lang, t } = useLang();
  const drawer = useProjectDrawer(PROJECTS.length);
  const labelRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  useReveal(labelRef);
  useReveal(bodyRef);

  // Prefetches the drawer texts once the page is idle. Hover and focus on the lists start it
  // earlier, but on touch the first tap is the first signal.
  useEffect(() => {
    const controller = new AbortController();
    whenLoaded(controller.signal)
      .then(() => whenIdle(controller.signal, IDLE_FALLBACK_MS))
      .then(
        () => prefetchProjectDetails(lang),
        () => {}, // aborted by unmount
      );
    return () => controller.abort();
  }, [lang]);

  return (
    <section data-sec id={sectionIds[lang].work} className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <div className={styles.headText}>
            <span ref={labelRef} data-reveal className={styles.label}>
              {t.work.label}
            </span>
            <SplitHeading as="h2" text={t.work.title} className={`${heading.sectionTitle} ${styles.title}`} />
          </div>
          <p ref={bodyRef} data-reveal className={styles.body}>
            {t.work.body}
          </p>
        </div>
        <ProjectRail onOpen={drawer.openAt} />
        <ProjectIndex onOpen={drawer.openAt} />
      </div>
      {/* Outside every [data-reveal] wrapper: a transformed ancestor would break position: fixed. */}
      <ProjectDrawer drawer={drawer} />
    </section>
  );
}
