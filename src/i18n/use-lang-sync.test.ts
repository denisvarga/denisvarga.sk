import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { headCopy, SITE_URL } from './head-copy';
import { LangProvider, useLang } from './lang-context';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let switchTo: ((lang: 'sk' | 'en') => void) | null = null;

function Probe() {
  const { lang, setLang, t } = useLang();
  switchTo = setLang;
  return createElement('p', { 'data-lang': lang }, t.nav.contact);
}

const app = () => createElement(LangProvider, { initialLang: 'sk', children: createElement(Probe) });

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  window.history.replaceState(null, '', '/?ref=test#about');
  document.documentElement.lang = 'sk';
  document.title = headCopy.sk.title;
  document.head.innerHTML = `<meta name="description" content="${headCopy.sk.description}"><link rel="canonical" href="${SITE_URL}/">`;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

describe('useLangSync', () => {
  it('does not touch history on the initial render', () => {
    const replace = vi.spyOn(window.history, 'replaceState');
    act(() => root.render(app()));
    expect(replace).not.toHaveBeenCalled();
    expect(container.textContent).toBe('Kontakt');
  });

  it('switches language with replaceState and syncs the head', () => {
    act(() => root.render(app()));
    const replace = vi.spyOn(window.history, 'replaceState');
    const lengthBefore = window.history.length;

    act(() => switchTo?.('en'));

    expect(container.textContent).toBe('Contact');
    expect(replace).toHaveBeenCalledTimes(1);
    expect(replace.mock.calls[0]?.[2]).toBe('/en/?ref=test#about');
    expect(window.location.pathname).toBe('/en/');
    expect(window.history.length).toBe(lengthBefore);
    expect(document.documentElement.lang).toBe('en');
    expect(document.title).toBe(headCopy.en.title);
    expect(document.querySelector('meta[name="description"]')?.getAttribute('content')).toBe(headCopy.en.description);
    expect(document.querySelector('link[rel="canonical"]')?.getAttribute('href')).toBe(`${SITE_URL}/en/`);

    act(() => switchTo?.('sk'));

    expect(window.location.pathname).toBe('/');
    expect(window.history.length).toBe(lengthBefore);
    expect(document.documentElement.lang).toBe('sk');
  });
});
