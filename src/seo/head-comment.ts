import { SOURCE_URL, headCopy } from '../i18n/head-copy';
import { SHOW_AI } from '../sections/section-order';
import { ASCII_PORTRAIT } from './ascii-portrait';

const CHAT_HINT = SHOW_AI ? '\n  Skúste v chate / try in the chat:  sudo hire denis' : '';

// Build-time only: importing this from client code would pull the portrait into the entry chunk.
export const HEAD_COMMENT = `<!--

${ASCII_PORTRAIT}

  Ahoj, zvedavec. / Hi, curious one.

  Tento web som postavil s pomocou AI agentov, ktorí pracovali pod mojou kontrolou.
  Zdrojový kód je verejný.
  I built this site with AI agents working under my control. The source is public.
  ${SOURCE_URL}
${CHAT_HINT}
  ${headCopy.sk.email} / ${headCopy.en.email}

-->`;
