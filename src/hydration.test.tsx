import { act } from 'react';
import { hydrateRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LANGS, type Lang } from './i18n/types';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | undefined;

afterEach(() => {
  act(() => root?.unmount());
  root = undefined;
  document.body.replaceChildren();
  vi.restoreAllMocks();
});

// Production prerenders in Node and hydrates in the browser, so the two renderers never share
// context objects; fresh module graphs reproduce that inside one jsdom realm.
async function prerender(lang: Lang): Promise<string> {
  vi.resetModules();
  const { renderApp } = await import('./entry-prerender');
  const html = await renderApp(lang);
  vi.resetModules();
  return html;
}

describe.each(LANGS)('prerendered App (%s)', (lang) => {
  it('hydrates without recoverable errors or console errors', async () => {
    const html = await prerender(lang);
    const { App } = await import('./app');
    document.documentElement.lang = lang;
    document.body.innerHTML = `<div id="root">${html}</div>`;
    const container = document.getElementById('root')!;
    const onRecoverableError = vi.fn();
    const consoleError = vi.spyOn(console, 'error');

    await act(async () => {
      root = hydrateRoot(container, <App lang={lang} />, { onRecoverableError });
    });

    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
    expect(container.querySelectorAll('section[data-sec]')).toHaveLength(7);
  });
});
