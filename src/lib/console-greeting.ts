import { headCopy } from '../i18n/head-copy';
import type { Lang } from '../i18n/types';

const STYLE = 'color:#f2541b;font-weight:600;line-height:1.5';

let greeted = false;

export function logConsoleGreeting(lang: Lang): void {
  if (greeted) return;
  greeted = true;
  console.info(`%c${headCopy[lang].consoleGreeting}`, STYLE);
}
