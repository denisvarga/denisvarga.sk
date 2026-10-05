import { act } from 'react';
import { createRoot, hydrateRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { copyEn } from '../i18n/copy-en';
import { copySk } from '../i18n/copy-sk';
import { LANGS, type Lang } from '../i18n/types';
import { CONSENT_KEY } from './consent-store';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const COPY = { sk: copySk, en: copyEn } as const;

let container: HTMLDivElement | undefined;
let root: Root | undefined;

// The store keeps its state for the page's lifetime, so each visit gets fresh modules; the
// provider has to come from the same module graph as the components that read it.
async function visit(lang: Lang, { hydrate = false } = {}) {
  vi.resetModules();
  const [{ LangProvider }, { ConsentBar }, { SiteFooter }, store] = await Promise.all([
    import('../i18n/lang-context'),
    import('./consent-bar'),
    import('../layout/site-footer'),
    import('./consent-store'),
  ]);
  const page = (
    <LangProvider lang={lang}>
      <main>
        <SiteFooter />
      </main>
      <ConsentBar />
    </LangProvider>
  );
  leave();
  container = document.createElement('div');
  document.body.append(container);
  const onRecoverableError = vi.fn();
  const html = hydrate ? renderToString(page) : '';
  if (hydrate) {
    container.innerHTML = html;
    await act(async () => {
      root = hydrateRoot(container!, page, { onRecoverableError });
    });
  } else {
    root = createRoot(container);
    act(() => root!.render(page));
  }
  return { store, html, onRecoverableError };
}

function leave(): void {
  act(() => root?.unmount());
  container?.remove();
  root = undefined;
  container = undefined;
}

const region = () => container?.querySelector<HTMLElement>('[role="region"]') ?? null;
const button = (name: string) => [...(container?.querySelectorAll('button') ?? [])].find((b) => b.textContent === name)!;
const click = (el: HTMLElement) => act(() => el.click());

afterEach(() => {
  leave();
  document.body.replaceChildren();
  localStorage.clear();
  vi.restoreAllMocks();
});

describe.each(LANGS)('ConsentBar (%s)', (lang) => {
  const copy = COPY[lang].consent;

  it('is absent from the prerendered markup and appears after hydration without a mismatch', async () => {
    const { html, onRecoverableError } = await visit(lang, { hydrate: true });
    expect(html).toContain(copy.settings);
    expect(html).not.toContain('role="region"');
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(region()?.getAttribute('aria-label')).toBe(copy.label);
  });

  it('shows on a first visit with both choices and the cookie list, without taking focus', async () => {
    const outside = document.createElement('button');
    document.body.append(outside);
    outside.focus();
    await visit(lang);
    const bar = region()!;
    expect(bar.querySelector('p')?.textContent).toBe(copy.text);
    expect([...bar.querySelectorAll('button')].map((b) => [b.type, b.textContent])).toEqual([
      ['button', copy.accept],
      ['button', copy.reject],
    ]);
    expect(bar.querySelector('details summary')?.textContent).toBe(copy.details);
    expect([...bar.querySelectorAll('li code')].map((code) => code.textContent)).toEqual([
      CONSENT_KEY,
      '_ga',
      '_ga_XMK9J72476',
    ]);
    expect(bar.textContent).not.toContain(copy.granted);
    expect(document.activeElement).toBe(outside);
  });

  it.each([
    ['accept', true],
    ['reject', false],
  ] as const)('hides after %s, stores the choice and stays hidden on the next visit', async (action, analytics) => {
    const { store } = await visit(lang);
    click(button(copy[action]));
    expect(region()).toBeNull();
    expect(store.readConsent()).toMatchObject({ v: 1, analytics });
    await visit(lang);
    expect(region()).toBeNull();
  });

  it('reopens from the footer with the current choice and hands focus back after a new one', async () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: 1, analytics: true, ts: 1 }));
    await visit(lang);
    expect(region()).toBeNull();
    const settings = button(copy.settings);
    settings.focus();
    click(settings);
    expect(region()?.textContent).toContain(copy.granted);
    expect(document.activeElement).toBe(region());
    click(button(copy.reject));
    expect(region()).toBeNull();
    expect(document.activeElement).toBe(settings);
    click(settings);
    expect(region()?.textContent).toContain(copy.denied);
  });
});
