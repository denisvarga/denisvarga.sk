import { useLang } from '../i18n/lang-context';
import type { Lang, Localized } from '../i18n/types';
import { goTo } from '../motion/scroll-to';
import styles from './privacy-notice.module.css';

const PRIVACY_ID: Localized<string> = { sk: 'sukromie', en: 'privacy' };

/** Opens the disclosure and scrolls to it; focus moves to its summary so keyboard users land there too. */
export function openPrivacyNotice(lang: Lang): void {
  const details = document.getElementById(PRIVACY_ID[lang]);
  if (!(details instanceof HTMLDetailsElement)) return;
  details.open = true;
  details.querySelector('summary')?.focus({ preventScroll: true });
  goTo(details);
}

// No data-sec: the footer sits inside the contact section and must not shift the section indices.
export function PrivacyNotice() {
  const { lang, t } = useLang();
  return (
    <details id={PRIVACY_ID[lang]} className={styles.notice}>
      <summary className={styles.summary}>{t.privacy.title}</summary>
      <dl className={styles.list}>
        {t.privacy.sections.map(({ title, text }) => (
          <div key={title} className={styles.item}>
            <dt className={styles.term}>{title}</dt>
            <dd className={styles.text}>{text}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
