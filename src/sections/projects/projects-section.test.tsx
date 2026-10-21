import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROJECT_DETAILS_SK } from '../../../shared/project-details-sk';
import { PROJECT_IMAGE_SIZE, PROJECTS } from '../../data/projects';
import { copySk } from '../../i18n/copy-sk';
import { LangProvider } from '../../i18n/lang-context';
import type { Lang } from '../../i18n/types';
import { ui } from '../../i18n/ui-copy';
import { loadProjectDetails } from './project-drawer-content';
import { pad2 } from './project-format';
import { ProjectsSection } from './projects-section';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const enChunkLoaded = vi.hoisted(() => vi.fn());
vi.mock('../../../shared/project-details-en', async (importOriginal) => {
  enChunkLoaded();
  return importOriginal();
});

const page = (lang: Lang) => (
  <LangProvider lang={lang}>
    <ProjectsSection />
  </LangProvider>
);

let container: HTMLDivElement;
let root: Root;

// The drawer texts are a lazy chunk; with it loaded the drawer renders them on the first frame.
// The loading state is covered in project-drawer-content.test.tsx.
beforeAll(() => loadProjectDetails('sk'));

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
  act(() => root.render(page('sk')));
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  document.documentElement.style.overflow = '';
});

const toggle = () => container.querySelector<HTMLButtonElement>('button[aria-controls]')!;
const label = () => toggle().firstElementChild?.textContent;
const panel = () => document.getElementById(toggle().getAttribute('aria-controls')!)!;
const cards = () => [...panel().querySelectorAll<HTMLButtonElement>('li > button')];
const dialog = () => container.querySelector<HTMLElement>('[role="dialog"]')!;
const scopeRows = () => {
  const heading = [...dialog().querySelectorAll('span')].find((el) => el.textContent === ui.sk.scope)!;
  return [...heading.parentElement!.children].slice(1).map((row) => [...row.children].map((cell) => cell.textContent));
};
const click = (el: HTMLElement) => act(() => el.click());
const press = (key: string) => act(() => void document.dispatchEvent(new KeyboardEvent('keydown', { key })));

describe('project rail', () => {
  it('shows only the featured projects, numbered against the full list', () => {
    const featured = PROJECTS.filter((p) => p.featured);
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.length).toBeLessThan(PROJECTS.length);

    const names = [...container.querySelectorAll('h3')];
    expect(names.map((h) => h.textContent)).toEqual(featured.map((p) => p.name));
    expect(names.map((h) => h.previousElementSibling?.textContent)).toEqual(
      featured.map((p) => `${pad2(PROJECTS.indexOf(p) + 1)} / ${pad2(PROJECTS.length)}`),
    );
  });

  it('describes each rail image by the project name and kind', () => {
    const featured = PROJECTS.filter((p) => p.featured);
    // Index thumbnails are decorative (alt=""), and the closed drawer has no image yet.
    const alts = [...container.querySelectorAll('img')].map((img) => img.getAttribute('alt')).filter(Boolean);
    expect(alts).toEqual(featured.map((p) => `${p.name}, ${p.kind.sk}`));
  });

  it('adds the credit under the description only on cards whose project has one', () => {
    const featured = PROJECTS.filter((p) => p.featured);
    const credits = [...container.querySelectorAll('h3')].map((h) => h.parentElement?.querySelector('small')?.textContent);
    expect(credits).toEqual(featured.map((p) => p.credit?.sk));
    expect(credits.some((credit) => credit === undefined)).toBe(true);
    expect(credits.some((credit) => credit !== undefined)).toBe(true);
  });
});

describe('all projects toggle', () => {
  it('starts collapsed with the grid inert but rendered', () => {
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(label()).toBe(`Všetky projekty (${PROJECTS.length})`);
    expect(panel().hasAttribute('inert')).toBe(true);
    expect(panel().hasAttribute('data-open')).toBe(false);
    expect(panel().hasAttribute('data-primed')).toBe(false);
    expect(cards()).toHaveLength(PROJECTS.length);
  });

  it('expands and collapses the list, keeping focus on the toggle', () => {
    toggle().focus();
    click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('true');
    expect(label()).toBe(copySk.work.hide);
    expect(panel().hasAttribute('inert')).toBe(false);
    expect(panel().hasAttribute('data-open')).toBe(true);
    expect(document.activeElement).toBe(toggle());

    click(toggle());
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(label()).toBe(`${copySk.work.all} (${PROJECTS.length})`);
    expect(panel().hasAttribute('inert')).toBe(true);
    // Stays rendered after the first expand so the close can animate.
    expect(panel().hasAttribute('data-primed')).toBe(true);
  });
});

describe('all projects grid', () => {
  it('renders every project as one card button with number, name, kind and context', () => {
    expect(cards()).toHaveLength(PROJECTS.length);
    cards().forEach((card, i) => {
      const project = PROJECTS[i]!;
      expect(card.textContent).toContain(`${pad2(i + 1)} / ${pad2(PROJECTS.length)}`);
      expect(card.textContent).toContain(project.name);
      expect(card.textContent).toContain(`${project.kind.sk} · ${copySk.work.contexts[project.context]}`);
      expect(card.textContent).toContain(project.desc.sk);
      expect(card.querySelector('a, button, input, [tabindex]')).toBeNull();
    });
  });

  it('shows each project image lazily, at its intrinsic size', () => {
    cards().forEach((card, i) => {
      const img = card.querySelector('img')!;
      expect(img.getAttribute('src')).toBe(PROJECTS[i]!.image);
      expect(img.getAttribute('loading')).toBe('lazy');
      expect(img.getAttribute('decoding')).toBe('async');
      expect(img.getAttribute('width')).toBe(String(PROJECT_IMAGE_SIZE.width));
      expect(img.getAttribute('height')).toBe(String(PROJECT_IMAGE_SIZE.height));
    });
  });

  it('adds the credit only where it names more than the employer in the context line', () => {
    const credits = cards().map((card) => card.querySelector('small')?.textContent);
    expect(credits).toEqual(
      PROJECTS.map((p) => (p.context === 'grandpano' || p.context === 'vibration' ? undefined : p.credit?.sk)),
    );
    expect(credits.some((credit) => credit === undefined)).toBe(true);
    expect(credits.some((credit) => credit !== undefined)).toBe(true);
  });

  it('opens the drawer at each card\'s project and returns focus to the card', () => {
    click(toggle());
    PROJECTS.forEach((project, i) => {
      const card = cards()[i]!;
      click(card);
      expect(dialog().closest('[inert]')).toBeNull();
      expect(dialog().querySelector('h2')?.textContent).toBe(project.name);
      expect(dialog().textContent).toContain(`${pad2(i + 1)} / ${pad2(PROJECTS.length)}`);
      expect(dialog().querySelector('h2 + p')?.textContent).toBe(
        `${project.kind.sk} · ${copySk.work.contexts[project.context]}`,
      );

      press('Escape');
      expect(dialog().closest('[inert]')).not.toBeNull();
      expect(document.activeElement).toBe(card);
    });
  });

  it('steps the drawer through every project, not just the featured ones', () => {
    click(toggle());
    click(cards().at(-1)!);
    press('ArrowRight');
    expect(dialog().querySelector('h2')?.textContent).toBe(PROJECTS[0]!.name);
    press('ArrowLeft');
    expect(dialog().querySelector('h2')?.textContent).toBe(PROJECTS.at(-1)!.name);
  });
});

describe('project drawer', () => {
  it('mounts its content on the first open and keeps it while it slides closed', () => {
    expect(dialog().querySelector('h2, img')).toBeNull();
    expect(dialog().hasAttribute('aria-labelledby')).toBe(false);
    click(toggle());
    click(cards()[1]!);
    const title = dialog().querySelector('h2')!;
    expect(title.textContent).toBe(PROJECTS[1]!.name);
    expect(dialog().getAttribute('aria-labelledby')).toBe(title.id);
    press('Escape');
    expect(dialog().closest('[inert]')).not.toBeNull();
    expect(dialog().querySelector('h2')?.textContent).toBe(PROJECTS[1]!.name);
  });

  it('opens with the summary, the numbered scope and the credit only when the project has one', () => {
    click(toggle());
    click(cards()[0]!);
    for (const project of PROJECTS) {
      expect(dialog().querySelector('h2')?.textContent).toBe(project.name);
      const details = PROJECT_DETAILS_SK[project.slug]!;
      expect([...dialog().querySelectorAll('p')].map((p) => p.textContent)).toContain(details.summary);
      expect(scopeRows()).toEqual(details.scope.map((item, i) => [pad2(i + 1), item]));
      expect(dialog().querySelector('small')?.textContent).toBe(project.credit?.sk);
      press('ArrowRight');
    }
    expect(PROJECTS.some((p) => p.credit)).toBe(true);
    expect(PROJECTS.some((p) => !p.credit)).toBe(true);
  });

  it('links a public project out and shows a private one as a label without any link', () => {
    click(toggle());
    click(cards()[0]!);
    for (const project of PROJECTS) {
      const links = [...dialog().querySelectorAll('a')];
      if (project.url) {
        expect(links.map((a) => a.getAttribute('href'))).toEqual([project.url, project.url]);
        expect(
          links.every((a) => a.target === '_blank' && a.rel === 'noopener noreferrer' && a.getAttribute('referrerpolicy') === 'no-referrer'),
        ).toBe(true);
        expect(links.at(-1)?.textContent).toContain(ui.sk.open);
        expect(dialog().textContent).not.toContain(ui.sk.privateProject);
      } else {
        expect(links).toEqual([]);
        expect(dialog().textContent).toContain(ui.sk.privateProject);
      }
      press('ArrowRight');
    }
    expect(PROJECTS.some((p) => p.url === null)).toBe(true);
  });
});

describe('drawer text prefetch', () => {
  it('starts loading the page language\'s drawer texts when the pointer reaches the rail', async () => {
    act(() => root.render(page('en')));
    expect(enChunkLoaded).not.toHaveBeenCalled();
    act(() => void container.querySelector('h3')!.dispatchEvent(new Event('pointerover', { bubbles: true })));
    await vi.waitFor(() => expect(enChunkLoaded).toHaveBeenCalledTimes(1));
  });
});

describe('prerendered markup', () => {
  it('carries the full grid while collapsed, inside an inert panel', () => {
    const doc = new DOMParser().parseFromString(renderToString(page('sk')), 'text/html');
    const button = doc.querySelector('button[aria-controls]')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    const list = doc.getElementById(button.getAttribute('aria-controls')!)!;
    expect(list.hasAttribute('inert')).toBe(true);
    expect(list.querySelectorAll('li')).toHaveLength(PROJECTS.length);
    for (const project of PROJECTS) expect(list.textContent).toContain(project.name);
    const images = [...list.querySelectorAll('img')];
    expect(images.map((img) => img.getAttribute('src'))).toEqual(PROJECTS.map((p) => p.image));
    expect(images.every((img) => img.getAttribute('loading') === 'lazy')).toBe(true);
  });

  it('has the section title as its only h2, with no content in the closed drawer', () => {
    const doc = new DOMParser().parseFromString(renderToString(page('sk')), 'text/html');
    expect([...doc.querySelectorAll('h2')].map((h) => h.textContent)).toEqual(['Čo som postavil']);
    expect(doc.querySelector('[role="dialog"]')!.querySelector('h2, img, p')).toBeNull();
  });

  it('uses the English labels on the English page', () => {
    const html = renderToString(page('en'));
    expect(html).toContain(`All projects (${PROJECTS.length})`);
    expect(html).toContain('At GrandPano');
    expect(html).toContain('Own project');
  });
});
