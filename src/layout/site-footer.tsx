import { openConsentSettings } from '../consent/consent-store';
import { useLang } from '../i18n/lang-context';
import { useCurrentYear } from '../lib/use-current-year';
import { goTo } from '../motion/scroll-to';
import styles from './site-footer.module.css';

export function SiteFooter() {
  const { t } = useLang();
  const year = useCurrentYear();

  return (
    <footer className={styles.footer}>
      <span>© {year} Denis Varga</span>
      <div className={styles.actions}>
        <button type="button" className={styles.action} onClick={openConsentSettings}>
          {t.consent.settings}
        </button>
        <button type="button" className={styles.action} onClick={() => goTo(0)}>
          {t.contact.top} <span aria-hidden="true">↑</span>
        </button>
      </div>
    </footer>
  );
}
