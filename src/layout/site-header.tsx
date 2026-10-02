import type { RefObject } from 'react';
import { useLang } from '../i18n/lang-context';
import type { ScrollTarget } from '../motion/scroll-to';
import styles from './site-header.module.css';

const CONTACT_SECTION = 6;

interface SiteHeaderProps {
  readonly open: boolean;
  readonly menuId: string;
  readonly toggleRef: RefObject<HTMLButtonElement | null>;
  readonly onToggle: () => void;
  readonly onGo: (target: ScrollTarget) => void;
}

export function SiteHeader({ open, menuId, toggleRef, onToggle, onGo }: SiteHeaderProps) {
  const { t, ui } = useLang();

  return (
    <header className={styles.header} data-open={open ? '' : undefined}>
      <button type="button" className={styles.name} onClick={() => onGo('#top')}>
        Denis Varga
      </button>
      <div className={styles.actions}>
        <button type="button" className={styles.contact} onClick={() => onGo(CONTACT_SECTION)}>
          {t.nav.contact}
        </button>
        <button
          ref={toggleRef}
          type="button"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={menuId}
          onClick={onToggle}
        >
          <span>{open ? ui.menuClose : ui.menu}</span>
          <span className={styles.icon} aria-hidden="true">
            <span className={styles.line} />
            <span className={styles.line} />
          </span>
        </button>
      </div>
    </header>
  );
}
