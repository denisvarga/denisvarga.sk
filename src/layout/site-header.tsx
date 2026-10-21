import type { RefObject } from 'react';
import { LangSwitch } from '../components/lang-switch';
import { useLang } from '../i18n/lang-context';
import { sectionIds } from '../i18n/ui-copy';
import { onScrollLinkClick, type ScrollTarget } from '../motion/scroll-to';
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
  const { lang, t, ui } = useLang();

  return (
    <header className={styles.header} data-open={open ? '' : undefined}>
      <a href="#top" className={styles.name} onClick={(event) => onScrollLinkClick(event, () => onGo('#top'))}>
        Denis Varga
      </a>
      <div className={styles.actions}>
        <LangSwitch />
        <a
          href={`#${sectionIds[lang].contact}`}
          className={styles.contact}
          onClick={(event) => onScrollLinkClick(event, () => onGo(CONTACT_SECTION))}
        >
          {t.nav.contact}
        </a>
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
