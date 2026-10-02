import { useLang } from '../i18n/lang-context';
import { goTo } from '../motion/scroll-to';
import styles from './site-footer.module.css';

export function SiteFooter() {
  const { t } = useLang();

  return (
    <footer className={styles.footer}>
      <span>© 2026 Denis Varga</span>
      <button type="button" className={styles.top} onClick={() => goTo(0)}>
        {t.contact.top} <span aria-hidden="true">↑</span>
      </button>
    </footer>
  );
}
