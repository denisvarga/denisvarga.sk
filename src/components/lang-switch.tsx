import { Fragment, type MouseEvent } from 'react';
import { useLang } from '../i18n/lang-context';
import { headCopy } from '../i18n/head-copy';
import { LANGS, type Lang } from '../i18n/types';
import styles from './lang-switch.module.css';

const LABEL: Record<Lang, string> = { sk: 'SK', en: 'EN' };

// Real links to the prerendered language URLs; with JS the switch is instant (replaceState in
// use-lang-sync), without JS they navigate.
export function LangSwitch({ className }: { readonly className?: string }) {
  const { lang, setLang } = useLang();
  const pick = (next: Lang) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    setLang(next);
  };

  return (
    <div className={className ? `${styles.switch} ${className}` : styles.switch}>
      {LANGS.map((code, i) => (
        <Fragment key={code}>
          {i > 0 && <span aria-hidden="true">/</span>}
          <a
            href={headCopy[code].path}
            hrefLang={code}
            lang={code}
            className={styles.link}
            aria-current={code === lang ? 'true' : undefined}
            onClick={pick(code)}
          >
            {LABEL[code]}
          </a>
        </Fragment>
      ))}
    </div>
  );
}
