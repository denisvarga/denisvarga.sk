import { useRef } from 'react';
import { PulseDot } from '../../components/pulse-dot';
import pill from '../../components/pill-link.module.css';
import { SplitHeading } from '../../components/split-heading';
import { useLang } from '../../i18n/lang-context';
import { parseTitleMarkup } from '../../lib/title-markup';
import { goTo } from '../../motion/scroll-to';
import { useMagnet } from '../../motion/use-magnet';
import styles from './hero.module.css';
import { HeroImage } from './hero-image';
import { useHeroEntranceDone, type EntranceStep } from './use-hero-entrance-done';
import { useHeroParallax } from './use-hero-parallax';

const PROJECTS_SECTION = 4;

export function HeroSection() {
  const { t } = useLang();
  const sectionRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const leadRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const workRef = useRef<HTMLButtonElement>(null);
  const askRef = useRef<HTMLButtonElement>(null);

  // The desktop image (fade, 350 + 1600 ms) is display:none on mobile, so it is left out; it
  // never ends last anyway (the badge ends at 2100 ms).
  const steps: EntranceStep[] = [
    { kind: 'split', delay: 200, words: parseTitleMarkup(t.hero.title).length, target: () => textRef.current?.querySelector('h1') ?? null },
    { kind: 'rise', delay: 550, target: () => leadRef.current },
    { kind: 'rise', delay: 700, target: () => ctaRef.current },
    { kind: 'rise', delay: 800, target: () => badgeRef.current },
  ];
  useHeroEntranceDone(sectionRef, steps);
  useHeroParallax(textRef);
  useMagnet(workRef);
  useMagnet(askRef);

  return (
    <section ref={sectionRef} data-sec="" className={styles.hero}>
      <div className={styles.inner}>
        <div ref={textRef} className={styles.text}>
          <SplitHeading as="h1" text={t.hero.title} className={styles.title} delay={200} enter />
          <p ref={leadRef} className={styles.lead} data-enter="" data-delay="550">
            {t.hero.lead}
          </p>
          <div ref={ctaRef} className={styles.ctas} data-enter="" data-delay="700">
            <button ref={workRef} type="button" className={`${pill.pill} ${pill.dark} ${styles.cta}`} onClick={() => goTo(PROJECTS_SECTION)}>
              <span>{t.hero.cta1}</span>
              <span aria-hidden="true">↓</span>
            </button>
            <button ref={askRef} type="button" className={`${pill.pill} ${pill.outline} ${styles.cta}`} onClick={() => goTo('#ask')}>
              {t.hero.cta2}
            </button>
          </div>
          <div ref={badgeRef} className={styles.badge} data-enter="" data-delay="800">
            <PulseDot />
            <span>{t.hero.badge}</span>
          </div>
        </div>
        <div className={`${styles.mask} ${styles.mobileImage}`}>
          <HeroImage />
        </div>
      </div>
      <div className={styles.overlay}>
        <div className={styles.overlayInner}>
          <div className={`${styles.mask} ${styles.desktopImage}`} data-enter="fade" data-delay="350">
            <HeroImage />
          </div>
        </div>
      </div>
    </section>
  );
}
