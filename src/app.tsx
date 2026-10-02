import type { Lang } from './entry-prerender';
import styles from './app.module.css';

export function App({ lang }: { lang: Lang }) {
  return <main className={styles.placeholder}>{lang === 'sk' ? 'Denis Varga' : 'Denis Varga (EN)'}</main>;
}
