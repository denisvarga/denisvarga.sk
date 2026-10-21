import { headCopy } from '../i18n/head-copy';
import type { Lang } from '../i18n/types';
import { SHOW_AI } from '../sections/section-order';
import { ASCII_PORTRAIT } from '../seo/ascii-portrait';

const ART_STYLE = 'font-family:ui-monospace,Menlo,Consolas,monospace;font-size:7px;line-height:1;color:#8a8c90';
const NAME_STYLE = 'font:700 28px/1.3 Manrope,system-ui,sans-serif;color:#131416;background:#ECECE9;padding:4px 12px;border-left:6px solid #f2541b';
const TEXT_STYLE = 'color:#f2541b;font-weight:600;line-height:1.5';

let greeted = false;

export function logConsoleGreeting(lang: Lang): void {
  if (greeted) return;
  greeted = true;
  console.log(`%c${ASCII_PORTRAIT}`, ART_STYLE);
  console.log('%cDenis Varga', NAME_STYLE);
  const { consoleGreeting, consoleChatHint } = headCopy[lang];
  console.info(`%c${SHOW_AI ? `${consoleGreeting} ${consoleChatHint}` : consoleGreeting}`, TEXT_STYLE);
}
