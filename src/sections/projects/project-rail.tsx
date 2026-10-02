import { useEffect, useRef } from 'react';
import { PROJECTS } from '../../data/projects';
import { useLang } from '../../i18n/lang-context';
import { matchesMedia, REDUCED_MOTION_QUERY } from '../../motion/use-media-query';
import { useReveal } from '../../motion/use-reveal';
import { ProjectCard } from './project-card';
import styles from './projects.module.css';

const CARD_GAP_PX = 20;

interface ProjectRailProps {
  readonly onOpen: (index: number, opener: HTMLElement | null) => void;
}

export function ProjectRail({ onOpen }: ProjectRailProps) {
  const { ui } = useLang();
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  useReveal(wrapRef);

  useEffect(() => {
    const track = trackRef.current;
    const bar = barRef.current;
    if (!track || !bar) return;
    let shown = '';
    const update = () => {
      const fill = track.scrollWidth > 0 ? (track.scrollLeft + track.clientWidth) / track.scrollWidth : 1;
      const value = fill.toFixed(4);
      if (value === shown) return;
      shown = value;
      bar.style.transform = `scaleX(${value})`;
    };
    update();
    track.addEventListener('scroll', update, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(update);
    observer?.observe(track);
    return () => {
      track.removeEventListener('scroll', update);
      observer?.disconnect();
    };
  }, []);

  const step = (direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const first = track.firstElementChild;
    const width = first ? first.getBoundingClientRect().width + CARD_GAP_PX : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * width, behavior: matchesMedia(REDUCED_MOTION_QUERY) ? 'instant' : 'smooth' });
  };

  return (
    <div ref={wrapRef} data-reveal className={styles.rail}>
      <div ref={trackRef} className={styles.track}>
        {PROJECTS.map((project, i) => (
          <ProjectCard key={project.slug} project={project} index={i} total={PROJECTS.length} onOpen={onOpen} />
        ))}
      </div>
      <div className={styles.controls}>
        <div className={styles.progress} aria-hidden="true">
          <span ref={barRef} className={styles.progressBar} />
        </div>
        <button type="button" className={styles.arrow} aria-label={ui.prev} onClick={() => step(-1)}>
          ←
        </button>
        <button type="button" className={styles.arrow} aria-label={ui.next} onClick={() => step(1)}>
          →
        </button>
      </div>
    </div>
  );
}
