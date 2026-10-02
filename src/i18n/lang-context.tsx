import { createContext, use, useMemo, type ReactNode } from 'react';
import { copyEn } from './copy-en';
import { copySk } from './copy-sk';
import type { Copy, Lang, Localized, UiCopy } from './types';
import { ui } from './ui-copy';

const copy: Localized<Copy> = { sk: copySk, en: copyEn };

export interface LangValue {
  readonly lang: Lang;
  readonly t: Copy;
  readonly ui: UiCopy;
}

const LangContext = createContext<LangValue | null>(null);

// Each language lives on its own domain, so the page language is fixed for the document's lifetime.
export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo<LangValue>(() => ({ lang, t: copy[lang], ui: ui[lang] }), [lang]);
  return <LangContext value={value}>{children}</LangContext>;
}

export function useLang(): LangValue {
  const value = use(LangContext);
  if (!value) throw new Error('useLang must be used inside <LangProvider>');
  return value;
}
