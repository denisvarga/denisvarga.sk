import { useRef } from 'react';
import { SplitHeading } from '../../components/split-heading';
import heading from '../../components/split-heading.module.css';
import { JOBS } from '../../data/jobs';
import { useLang } from '../../i18n/lang-context';
import { useReveal } from '../../motion/use-reveal';
import styles from './experience.module.css';

export function ExperienceSection() {
  const { lang, t } = useLang();
  const labelRef = useRef<HTMLSpanElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  useReveal(labelRef);
  useReveal(cardRef);

  return (
    <section data-sec="" className={styles.experience}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <span ref={labelRef} className={styles.label} data-reveal="">
            {t.exp.label}
          </span>
          <SplitHeading as="h2" text={t.exp.title} className={heading.sectionTitle} />
        </div>
        <div ref={cardRef} className={styles.card} data-reveal="">
          {JOBS.map((job) => (
            <div key={job.company} className={styles.job}>
              <span className={styles.period}>{job.period[lang]}</span>
              <div className={styles.who}>
                <span className={styles.company}>{job.company}</span>
                <span className={styles.role}>{job.role[lang]}</span>
              </div>
              <p className={styles.text}>{job.text[lang]}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
