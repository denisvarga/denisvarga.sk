import { useEffect, useRef, useSyncExternalStore } from 'react';
import { useLang } from '../i18n/lang-context';
import styles from './consent-bar.module.css';
import { chooseAnalytics, getConsentState, getServerConsentState, subscribeConsent } from './consent-store';

export function ConsentBar() {
  const { t } = useLang();
  const copy = t.consent;
  const { choice, view } = useSyncExternalStore(subscribeConsent, getConsentState, getServerConsentState);
  const regionRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<HTMLElement | null>(null);

  // Reopening from the footer is the visitor's own action, so focus follows it into the card; the
  // first-visit prompt leaves focus where it is.
  useEffect(() => {
    if (view !== 'settings') return;
    openerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    regionRef.current?.focus({ preventScroll: true });
  }, [view]);

  if (view === 'hidden') return null;

  const choose = (analytics: boolean) => {
    // The card unmounts with the choice, which would drop focus inside it to <body>.
    if (regionRef.current?.contains(document.activeElement)) openerRef.current?.focus({ preventScroll: true });
    openerRef.current = null;
    chooseAnalytics(analytics);
  };

  return (
    <div
      ref={regionRef}
      role="region"
      aria-label={copy.label}
      tabIndex={-1}
      className={styles.bar}
      data-lenis-prevent=""
    >
      <p className={styles.text}>{copy.text}</p>
      {view === 'settings' && choice && (
        <p className={styles.current}>{choice.analytics ? copy.granted : copy.denied}</p>
      )}
      <div className={styles.actions}>
        <button type="button" className={styles.button} onClick={() => choose(true)}>
          {copy.accept}
        </button>
        <button type="button" className={styles.button} onClick={() => choose(false)}>
          {copy.reject}
        </button>
      </div>
      <details className={styles.details}>
        <summary className={styles.summary}>{copy.details}</summary>
        <ul className={styles.list}>
          {copy.cookies.map(({ name, desc }) => (
            <li key={name}>
              <code className={styles.name}>{name}</code> {desc}
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}
