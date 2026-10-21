import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LangProvider } from '../i18n/lang-context';
import { AboutSection } from '../sections/about/about-section';
import { AiSection } from '../sections/ai/ai-section';
import { ContactSection } from '../sections/contact/contact-section';
import { ExperienceSection } from '../sections/experience/experience-section';
import { HeroSection } from '../sections/hero/hero-section';
import { ProjectsSection } from '../sections/projects/projects-section';
import { StackSection } from '../sections/stack/stack-section';
import { ProgressBar } from './progress-bar';
import { SiteChrome } from './site-chrome';
import { BUILD_YEAR } from '../lib/use-current-year';

const goTo = vi.hoisted(() => vi.fn());
vi.mock('../motion/scroll-to', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../motion/scroll-to')>()),
  goTo,
}));

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  vi.useFakeTimers();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <LangProvider lang="sk">
        <SiteChrome />
        <main id="top">
          <button type="button">inside main</button>
        </main>
      </LangProvider>,
    ),
  );
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  goTo.mockReset();
  vi.useRealTimers();
});

const toggle = () => container.querySelector<HTMLButtonElement>('[aria-controls="site-menu"]')!;
const overlay = () => container.querySelector<HTMLElement>('#site-menu')!;
const header = () => container.querySelector('header')!;
const main = () => container.querySelector('main')!;
const click = (el: HTMLElement) => act(() => el.click());
const plainClick = () => new MouseEvent('click', { bubbles: true, cancelable: true });
const navItems = () => [...overlay().querySelectorAll<HTMLAnchorElement>('nav a')];
const contactPill = () => [...header().querySelectorAll<HTMLAnchorElement>('a')].find((a) => a.textContent === 'Kontakt')!;
const langLinks = (scope: ParentNode) =>
  [...scope.querySelectorAll<HTMLAnchorElement>('a[hreflang]')].map((a) => [
    a.hreflang,
    a.getAttribute('href'),
    a.getAttribute('aria-current'),
  ]);

describe('menu overlay', () => {
  it('starts closed and inert, with the toggle collapsed', () => {
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(overlay().hasAttribute('inert')).toBe(true);
    expect(main().hasAttribute('inert')).toBe(false);
  });

  it('opens: toggle expanded, overlay live, the page behind inert', () => {
    click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(toggle().textContent).toContain('Zavrieť');
    expect(overlay().hasAttribute('inert')).toBe(false);
    expect(overlay().getAttribute('role')).toBe('dialog');
    expect(main().hasAttribute('inert')).toBe(true);
    expect(document.documentElement.style.overflow).toBe('hidden');
  });

  it('closes on Escape and returns focus to the toggle', () => {
    click(toggle());
    overlay().querySelector<HTMLAnchorElement>('nav a')!.focus();
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle());
    expect(main().hasAttribute('inert')).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('nav items are links to the section anchors', () => {
    expect(navItems().map((a) => [a.textContent, a.getAttribute('href')])).toEqual([
      ['01O mne', '#o-mne'],
      ['02AI', '#ai'],
      ['03Projekty', '#projekty'],
    ]);
  });

  it('nav item closes the menu first and scrolls 380 ms later instead of jumping', () => {
    click(toggle());
    const event = plainClick();
    act(() => navItems()[2]!.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(true);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(goTo).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(379));
    expect(goTo).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(goTo).toHaveBeenCalledWith(4);
  });

  it('leaves a modified click on a nav item to the browser, for a new tab', () => {
    click(toggle());
    const event = new MouseEvent('click', { bubbles: true, cancelable: true, metaKey: true });
    act(() => navItems()[0]!.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(false);
    act(() => vi.advanceTimersByTime(1000));
    expect(goTo).not.toHaveBeenCalled();
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
  });

  it('header contact pill links to #kontakt and scrolls to section 6 right away when the menu is closed', () => {
    expect(contactPill().getAttribute('href')).toBe('#kontakt');
    const event = plainClick();
    act(() => contactPill().dispatchEvent(event));
    expect(event.defaultPrevented).toBe(true);
    expect(goTo).toHaveBeenCalledWith(6);
  });

  it('header name links to #top and scrolls there', () => {
    const name = header().querySelector<HTMLAnchorElement>('a[href="#top"]')!;
    expect(name.textContent).toBe('Denis Varga');
    click(name);
    expect(goTo).toHaveBeenCalledWith('#top');
  });

  it('SK/EN are plain links to the language pages, the current one marked', () => {
    // jsdom runs on localhost, a single-host preview, so the links stay relative there.
    expect(langLinks(overlay())).toEqual([
      ['sk', '/', 'page'],
      ['en', '/en/', null],
    ]);
    const navigate = new MouseEvent('click', { bubbles: true, cancelable: true });
    act(() => overlay().querySelector('a[hreflang="en"]')!.dispatchEvent(navigate));
    expect(navigate.defaultPrevented).toBe(false);
  });
});

describe('header language switch', () => {
  it('has the same SK/EN links as the overlay, before the contact pill', () => {
    expect(langLinks(header())).toEqual([
      ['sk', '/', 'page'],
      ['en', '/en/', null],
    ]);
    const en = header().querySelector('a[hreflang="en"]')!;
    expect(en.compareDocumentPosition(contactPill()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    const navigate = new MouseEvent('click', { bubbles: true, cancelable: true });
    act(() => en.dispatchEvent(navigate));
    expect(navigate.defaultPrevented).toBe(false);
  });

  it('stays reachable while the menu is open and adds no duplicate ids', () => {
    click(toggle());
    expect(header().closest('[inert]')).toBeNull();
    expect(langLinks(header())).toHaveLength(2);
    const ids = [...container.querySelectorAll('[id]')].map((el) => el.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(['sk', 'en'] as const)('%s prerender: production URLs, the current language marked', (lang) => {
    const html = renderToString(
      <LangProvider lang={lang}>
        <SiteChrome />
      </LangProvider>,
    );
    const prerendered = new DOMParser().parseFromString(html, 'text/html').querySelector('header')!;
    expect(langLinks(prerendered)).toEqual([
      ['sk', 'https://denisvarga.sk/', lang === 'sk' ? 'page' : null],
      ['en', 'https://denisvarga.dev/', lang === 'en' ? 'page' : null],
    ]);
  });
});

describe('prerendered markup', () => {
  it('has no style attributes or data-in in either language', () => {
    for (const lang of ['sk', 'en'] as const) {
      const html = renderToString(
        <LangProvider lang={lang}>
          <ProgressBar />
          <SiteChrome />
          <HeroSection />
          <AboutSection />
          <ExperienceSection />
          <ContactSection />
        </LangProvider>,
      );
      expect(html).not.toContain(' style=');
      expect(html).not.toContain('data-in');
      expect(html).toContain(lang === 'sk' ? 'href="mailto:hello@denisvarga.sk"' : 'href="mailto:hello@denisvarga.dev"');
      expect(html).toContain('href="https://denisvarga.sk/" hrefLang="sk"');
      expect(html).toContain('href="https://denisvarga.dev/" hrefLang="en"');
      expect(html).toContain('href="tel:+421902074830"');
      expect(html).toContain(`2018 - ${BUILD_YEAR}`);
      expect(html).toContain('rel="noopener"');
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const profiles = [...doc.querySelectorAll('a[rel~="me"]')];
      expect(profiles.map((a) => [a.textContent, a.getAttribute('href'), a.getAttribute('target'), a.getAttribute('rel')])).toEqual([
        ['LinkedIn', 'https://www.linkedin.com/in/denisvarg/', '_blank', 'me noopener noreferrer'],
        ['GitHub', 'https://github.com/denisvarga', '_blank', 'me noopener noreferrer'],
      ]);
      expect(html.match(/data-heroimg/g)).toHaveLength(2);
    }
  });

  it.each([
    ['sk', ['o-mne', 'skusenosti', 'ai', 'projekty', 'nastroje', 'kontakt'], 'Moja práca'],
    ['en', ['about', 'experience', 'ai', 'work', 'stack', 'contact'], 'My work'],
  ] as const)('%s: every section after the hero has its anchor, and every in-page link has a target', (lang, ids, workCta) => {
    const html = renderToString(
      <LangProvider lang={lang}>
        <SiteChrome />
        <main id="top">
          <HeroSection />
          <AboutSection />
          <ExperienceSection />
          <AiSection />
          <ProjectsSection />
          <StackSection />
          <ContactSection />
        </main>
      </LangProvider>,
    );
    const doc = new DOMParser().parseFromString(html, 'text/html');
    expect([...doc.querySelectorAll('section[data-sec]')].map((section) => section.id)).toEqual(['', ...ids]);
    const inPage = [...doc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
    expect(inPage.filter((a) => !doc.getElementById(a.getAttribute('href')!.slice(1)))).toEqual([]);
    expect(inPage.find((a) => a.textContent?.includes(workCta))?.getAttribute('href')).toBe(`#${ids[3]}`);
  });
});
