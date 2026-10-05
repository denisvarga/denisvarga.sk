import { useRef } from 'react';
import heading from '../../components/split-heading.module.css';
import { SplitHeading } from '../../components/split-heading';
import { PROJECTS } from '../../data/projects';
import { useLang } from '../../i18n/lang-context';
import { useReveal } from '../../motion/use-reveal';
import { ProjectDrawer } from './project-drawer';
import { ProjectIndex } from './project-index';
import { ProjectRail } from './project-rail';
import styles from './projects.module.css';
import { useProjectDrawer } from './use-project-drawer';

export function ProjectsSection() {
  const { t } = useLang();
  const drawer = useProjectDrawer(PROJECTS.length);
  const labelRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  useReveal(labelRef);
  useReveal(bodyRef);

  return (
    <section data-sec className={styles.section}>
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
