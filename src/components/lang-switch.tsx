import { Fragment, useSyncExternalStore } from 'react';
import { useLang } from '../i18n/lang-context';
import { isSingleHost, langHref } from '../i18n/lang-href';
import { LANGS, type Lang } from '../i18n/types';
import styles from './lang-switch.module.css';

const LABEL: Record<Lang, string> = { sk: 'SK', en: 'EN' };

const noSubscription = () => () => {};
const onSingleHost = () => isSingleHost(window.location.hostname);
// The prerendered markup carries the production URLs; hydration starts from them and React
// re-renders with the relative paths when the page runs on a single-host preview.
const prerenderedHost = () => false;

export function LangSwitch({ className }: { readonly className?: string }) {
  const { lang } = useLang();
  const singleHost = useSyncExternalStore(noSubscription, onSingleHost, prerenderedHost);

  return (
    <div className={className ? `${styles.switch} ${className}` : styles.switch}>
      {LANGS.map((code, i) => (
        <Fragment key={code}>
          {i > 0 && <span aria-hidden="true">/</span>}
          <a
            href={langHref(code, singleHost)}
            hrefLang={code}
            lang={code}
            className={styles.link}
            aria-current={code === lang ? 'page' : undefined}
          >
            {LABEL[code]}
          </a>
        </Fragment>
      ))}
    </div>
  );
}
