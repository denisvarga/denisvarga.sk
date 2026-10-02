import { SOURCE_URL, headCopy } from '../i18n/head-copy';
import { ASCII_PORTRAIT } from './ascii-portrait';

// Build-time only: importing this from client code would pull the portrait into the entry chunk.
export const HEAD_COMMENT = `<!--

${ASCII_PORTRAIT}

  Ahoj, zvedavec. / Hi, curious one.

  Tento web postavil tím AI agentov, ktorý som riadil. Zdrojový kód je verejný.
  This site was built by an AI agent team I directed. The source is public.
  ${SOURCE_URL}

  Skúste v chate / try in the chat:  sudo hire denis
  ${headCopy.sk.email} / ${headCopy.en.email}

-->`;
