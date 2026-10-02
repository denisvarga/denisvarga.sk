import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LangProvider } from '../i18n/lang-context';
import { AboutSection } from '../sections/about/about-section';
import { ContactSection } from '../sections/contact/contact-section';
import { ExperienceSection } from '../sections/experience/experience-section';
import { HeroSection } from '../sections/hero/hero-section';
import { ProgressBar } from './progress-bar';
import { SiteChrome } from './site-chrome';

const goTo = vi.hoisted(() => vi.fn());
vi.mock('../motion/scroll-to', () => ({ goTo }));

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
      <LangProvider initialLang="sk">
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
const main = () => container.querySelector('main')!;
const click = (el: HTMLElement) => act(() => el.click());

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
    overlay().querySelector('button')!.focus();
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(toggle());
    expect(main().hasAttribute('inert')).toBe(false);
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('nav item closes the menu first and scrolls 380 ms later', () => {
    click(toggle());
    const items = overlay().querySelectorAll<HTMLButtonElement>('nav button');
    expect(items).toHaveLength(3);
    click(items[2]!);
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(goTo).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(379));
    expect(goTo).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(goTo).toHaveBeenCalledWith(4);
  });

  it('header contact pill scrolls to Kontakt (section 6) right away when the menu is closed', () => {
    const contactPill = [...container.querySelectorAll('header button')].find((b) => b.textContent === 'Kontakt');
    click(contactPill as HTMLButtonElement);
    expect(goTo).toHaveBeenCalledWith(6);
  });

  it('SK/EN links switch the language without navigating', () => {
    const en = overlay().querySelector<HTMLAnchorElement>('a[hreflang="en"]')!;
    expect(en.getAttribute('href')).toBe('/en/');
    click(en);
    expect(en.getAttribute('aria-current')).toBe('true');
    expect(toggle().textContent).toContain('Menu');
  });
});

describe('prerendered markup', () => {
  it('has no style attributes or data-in in either language', () => {
    for (const lang of ['sk', 'en'] as const) {
      const html = renderToString(
        <LangProvider initialLang={lang}>
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
      expect(html).toContain('href="mailto:hello@denisvarga.sk"');
      expect(html).toContain('href="tel:+421902074830"');
      expect(html).toContain('rel="noopener"');
      expect(html.match(/data-heroimg/g)).toHaveLength(2);
    }
  });
});
