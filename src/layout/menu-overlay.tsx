import type { Ref } from 'react';
import { LangSwitch } from '../components/lang-switch';
import { useLang } from '../i18n/lang-context';
import { contact } from '../i18n/ui-copy';
import type { ScrollTarget } from '../motion/scroll-to';
import { sectionIndex, SECTIONS, type SectionKey } from '../sections/section-order';
import styles from './menu-overlay.module.css';

// Sections of the menu items in t.nav.items order (O mne, AI, Projekty).
const NAV_SECTIONS: readonly SectionKey[] = ['about', 'ai', 'projects'];

interface MenuOverlayProps {
  readonly id: string;
  readonly ref: Ref<HTMLDivElement>;
  readonly open: boolean;
  readonly onGo: (target: ScrollTarget) => void;
}

export function MenuOverlay({ id, ref, open, onGo }: MenuOverlayProps) {
  const { lang, t, ui } = useLang();
  const links = contact[lang];
  const items = NAV_SECTIONS.flatMap((key, i) => (SECTIONS.includes(key) ? [{ key, name: t.nav.items[i] }] : []));

  return (
    <div
      ref={ref}
      id={id}
      role="dialog"
      aria-label={ui.menu}
      className={styles.overlay}
      data-open={open ? '' : undefined}
      data-lenis-prevent=""
      inert={!open}
    >
      <nav className={styles.nav}>
        {items.map(({ key, name }, i) => (
          <div key={key} className={styles.row}>
            <button type="button" className={styles.item} onClick={() => onGo(sectionIndex(key))}>
              <span className={styles.index} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={styles.label}>{name}</span>
            </button>
          </div>
        ))}
      </nav>
      <div className={styles.footer}>
        <div className={styles.links}>
          <a href={links.emailHref}>{links.email}</a>
          <a href={links.phoneHref}>{links.phone}</a>
        </div>
        <LangSwitch />
      </div>
    </div>
  );
}
