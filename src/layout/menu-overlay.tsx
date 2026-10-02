import type { Ref } from 'react';
import { LangSwitch } from '../components/lang-switch';
import { useLang } from '../i18n/lang-context';
import { contact } from '../i18n/ui-copy';
import type { ScrollTarget } from '../motion/scroll-to';
import styles from './menu-overlay.module.css';

// Section indices of the three menu items (O mne, AI, Projekty).
const NAV_SECTIONS = [1, 3, 4] as const;

interface MenuOverlayProps {
  readonly id: string;
  readonly ref: Ref<HTMLDivElement>;
  readonly open: boolean;
  readonly onGo: (target: ScrollTarget) => void;
}

export function MenuOverlay({ id, ref, open, onGo }: MenuOverlayProps) {
  const { t, ui } = useLang();

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
        {t.nav.items.map((name, i) => (
          <div key={NAV_SECTIONS[i]} className={styles.row}>
            <button type="button" className={styles.item} onClick={() => onGo(NAV_SECTIONS[i] ?? 0)}>
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
          <a href={contact.emailHref}>{contact.email}</a>
          <a href={contact.phoneHref}>{contact.phone}</a>
        </div>
        <LangSwitch />
      </div>
    </div>
  );
}
