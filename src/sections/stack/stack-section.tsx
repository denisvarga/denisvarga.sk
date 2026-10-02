import { useCallback, useEffect, useRef, useState } from 'react';
import heading from '../../components/split-heading.module.css';
import { SplitHeading } from '../../components/split-heading';
import { skillLabel, SKILLS } from '../../data/skills';
import { useLang } from '../../i18n/lang-context';
import { FRAME_PRIORITY, subscribeFrame } from '../../motion/frame-loop';
import { useInViewport } from '../../motion/use-in-viewport';
import { REDUCED_MOTION_QUERY, useMediaQuery } from '../../motion/use-media-query';
import { useReveal } from '../../motion/use-reveal';
import { StackIndexRow } from './stack-index-row';
import styles from './stack.module.css';

const CYCLE_MS = 3200;

export function StackSection() {
  const { lang, t } = useLang();
  const reduced = useMediaQuery(REDUCED_MOTION_QUERY);
  const [active, setActive] = useState(0);
  const [manual, setManual] = useState(false);
  const labelRef = useRef<HTMLSpanElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const visibleRef = useInViewport(listRef);
  useReveal(labelRef);

  // Same rule as the design: the cycle timer only runs while the list is not fully off screen.
  // The first hover or click stops the auto-cycle for good.
  useEffect(() => {
    if (manual || reduced) return;
    let t0: number | null = null;
    return subscribeFrame('stack-cycle', FRAME_PRIORITY.stack, (time) => {
      if (!visibleRef.current) {
        t0 = time;
        return;
      }
      t0 ??= time;
      if (time - t0 > CYCLE_MS) {
        t0 = time;
        setActive((i) => (i + 1) % SKILLS.length);
      }
    });
  }, [manual, reduced]);

  const pick = useCallback((index: number) => {
    setManual(true);
    setActive(index);
  }, []);

  return (
    <section data-sec className={styles.section}>
      <div className={styles.inner}>
        <div className={styles.head}>
          <span ref={labelRef} data-reveal className={styles.label}>
            {t.stack.label}
          </span>
          <SplitHeading as="h2" text={t.stack.title} className={heading.sectionTitle} />
        </div>
        <div ref={listRef} className={styles.list}>
          {SKILLS.map((group, i) => (
            <StackIndexRow
              key={group.name.en}
              index={i}
              name={group.name[lang]}
              items={group.items.map((item) => skillLabel(item, lang))}
              active={i === active}
              onPick={pick}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
