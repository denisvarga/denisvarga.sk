import type { Ref } from 'react';
import { LangSwitch } from '../components/lang-switch';
import { useLang } from '../i18n/lang-context';
import { contact, sectionIds, type SectionIds } from '../i18n/ui-copy';
import { onScrollLinkClick, type ScrollTarget } from '../motion/scroll-to';
import styles from './menu-overlay.module.css';

// Anchors of the three menu items (O mne, AI, Projekty); clicks and new tabs share the same target.
const NAV_SECTIONS: readonly (keyof SectionIds)[] = ['about', 'ai', 'work'];

interface MenuOverlayProps {
  readonly id: string;
  readonly ref: Ref<HTMLDivElement>;
  readonly open: boolean;
  readonly onGo: (target: ScrollTarget) => void;
}

export function MenuOverlay({ id, ref, open, onGo }: MenuOverlayProps) {
  const { lang, t, ui } = useLang();
  const links = contact[lang];
  const ids = sectionIds[lang];

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
        {NAV_SECTIONS.map((anchor, i) => (
          <div key={anchor} className={styles.row}>
            <a href={`#${ids[anchor]}`} className={styles.item} onClick={(event) => onScrollLinkClick(event, () => onGo(`#${ids[anchor]}`))}>
              <span className={styles.index} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className={styles.label}>{t.nav.items[i]}</span>
            </a>
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
