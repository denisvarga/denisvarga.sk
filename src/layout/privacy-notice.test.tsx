import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyEn } from '../i18n/copy-en';
import { copySk } from '../i18n/copy-sk';
import { LangProvider } from '../i18n/lang-context';
import { LANGS, type Lang } from '../i18n/types';
import { openPrivacyNotice, PrivacyNotice } from './privacy-notice';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const COPY = { sk: copySk, en: copyEn } as const;
const IDS = { sk: 'sukromie', en: 'privacy' } as const;
const EMAILS = { sk: 'hello@denisvarga.sk', en: 'hello@denisvarga.dev' } as const;

let container: HTMLDivElement | undefined;
let root: Root | undefined;

function mount(lang: Lang): HTMLDetailsElement {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root!.render(
      <LangProvider lang={lang}>
        <PrivacyNotice />
      </LangProvider>,
    ),
  );
  return container.querySelector('details')!;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
  vi.unstubAllGlobals();
});

describe('PrivacyNotice', () => {
  it.each(LANGS)('prerenders closed in %s with the facts a visitor must get', (lang) => {
    const html = renderToString(
      <LangProvider lang={lang}>
        <PrivacyNotice />
      </LangProvider>,
    );
    expect(html).toContain(`<details id="${IDS[lang]}"`);
    expect(html).not.toMatch(/<details[^>]* open/);
    const text = COPY[lang].privacy.sections.map((s) => s.text).join(' ');
    for (const fact of [EMAILS[lang], '365', 'OpenAI', '30', '20', 'Cloudflare', 'D1', 'Turnstile', 'Google Analytics', 'GDPR']) {
      expect(text, fact).toContain(fact);
    }
    expect(text).not.toContain(EMAILS[lang === 'sk' ? 'en' : 'sk']);
  });

  it.each(LANGS)('opens, scrolls to and focuses its summary in %s', (lang) => {
    const scrollTo = vi.fn();
    vi.stubGlobal('scrollTo', scrollTo);
    const details = mount(lang);
    expect(details.open).toBe(false);
    openPrivacyNotice(lang);
    expect(details.open).toBe(true);
    expect(document.activeElement).toBe(details.querySelector('summary'));
    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('does nothing when the page has no disclosure for that language', () => {
    const details = mount('sk');
    openPrivacyNotice('en');
    expect(details.open).toBe(false);
  });
});
