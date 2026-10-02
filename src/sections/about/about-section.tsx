import { useRef } from 'react';
import { SplitHeading } from '../../components/split-heading';
import heading from '../../components/split-heading.module.css';
import { useLang } from '../../i18n/lang-context';
import type { Fact } from '../../i18n/types';
import { useReveal } from '../../motion/use-reveal';
import styles from './about.module.css';

const FACT_DELAYS = ['0', '90', '180'] as const;

function FactItem({ fact, delay }: { fact: Fact; delay: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useReveal(ref);
  return (
    <div ref={ref} className={styles.fact} data-reveal="" data-delay={delay}>
      <span className={styles.factLabel}>{fact.label}</span>
      <span className={styles.factValue}>{fact.value}</span>
    </div>
  );
}

export function AboutSection() {
  const { t } = useLang();
  const labelRef = useRef<HTMLSpanElement>(null);
  const bodyRef = useRef<HTMLParagraphElement>(null);
  useReveal(labelRef);
  useReveal(bodyRef);

  return (
    <section data-sec="" className={styles.about}>
      <div className={styles.inner}>
        <span ref={labelRef} className={styles.label} data-reveal="">
          {t.about.label}
        </span>
        <SplitHeading as="h2" text={t.about.title} className={`${heading.sectionTitle} ${styles.title}`} />
        <div className={styles.row}>
          <p ref={bodyRef} className={styles.body} data-reveal="">
            {t.about.body}
          </p>
          <div className={styles.facts}>
            {t.about.facts.map((fact, i) => (
              <FactItem key={fact.label} fact={fact} delay={FACT_DELAYS[i] ?? '0'} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
