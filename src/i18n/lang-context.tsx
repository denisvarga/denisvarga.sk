import { createContext, use, useMemo, useState, type ReactNode } from 'react';
import { copyEn } from './copy-en';
import { copySk } from './copy-sk';
import type { Copy, Lang, Localized, UiCopy } from './types';
import { ui } from './ui-copy';
import { useLangSync } from './use-lang-sync';

const copy: Localized<Copy> = { sk: copySk, en: copyEn };

export interface LangValue {
  readonly lang: Lang;
  readonly setLang: (lang: Lang) => void;
  readonly t: Copy;
  readonly ui: UiCopy;
}

const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ initialLang, children }: { initialLang: Lang; children: ReactNode }) {
  const [lang, setLang] = useState(initialLang);
  useLangSync(lang);
  const value = useMemo<LangValue>(() => ({ lang, setLang, t: copy[lang], ui: ui[lang] }), [lang]);
  return <LangContext value={value}>{children}</LangContext>;
}

export function useLang(): LangValue {
  const value = use(LangContext);
  if (!value) throw new Error('useLang must be used inside <LangProvider>');
  return value;
}
