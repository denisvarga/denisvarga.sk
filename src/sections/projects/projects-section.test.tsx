import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PROJECTS } from '../../data/projects';
import { copySk } from '../../i18n/copy-sk';
import { LangProvider } from '../../i18n/lang-context';
import type { Lang } from '../../i18n/types';
import { ui } from '../../i18n/ui-copy';
import { pad2 } from './project-format';
import { ProjectsSection } from './projects-section';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const page = (lang: Lang) => (
  <LangProvider lang={lang}>
    <ProjectsSection />
  </LangProvider>
);

let container: HTMLDivElement;
let root: Root;

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
const rows = () => [...panel().querySelectorAll<HTMLButtonElement>('li > button')];
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

  it('adds the credit under the description only on cards whose project has one', () => {
    const featured = PROJECTS.filter((p) => p.featured);
    const credits = [...container.querySelectorAll('h3')].map((h) => h.parentElement?.querySelector('small')?.textContent);
    expect(credits).toEqual(featured.map((p) => p.credit?.sk));
    expect(credits.some((credit) => credit === undefined)).toBe(true);
    expect(credits.some((credit) => credit !== undefined)).toBe(true);
  });
});

describe('all projects toggle', () => {
  it('starts collapsed with the list inert', () => {
    expect(toggle().getAttribute('aria-expanded')).toBe('false');
    expect(label()).toBe(`Všetky projekty (${PROJECTS.length})`);
    expect(panel().hasAttribute('inert')).toBe(true);
    expect(panel().hasAttribute('data-open')).toBe(false);
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
  });
});

describe('all projects list', () => {
  it('lists every project with name, kind, context and domain, without nested controls', () => {
    expect(rows()).toHaveLength(PROJECTS.length);
    rows().forEach((row, i) => {
      const project = PROJECTS[i]!;
      expect(row.textContent).toContain(pad2(i + 1));
      expect(row.textContent).toContain(project.name);
      expect(row.textContent).toContain(project.kind.sk);
      expect(row.textContent).toContain(copySk.work.contexts[project.context]);
      expect(row.textContent).toContain(project.url ? project.url.replace('https://', '') : ui.sk.privateProject);
      expect(row.querySelector('a, button, input, [tabindex]')).toBeNull();
    });
  });

  it('opens the drawer at the row\'s project and returns focus to the row', () => {
    click(toggle());
    for (const i of [0, PROJECTS.findIndex((p) => !p.featured), PROJECTS.length - 1]) {
      const project = PROJECTS[i]!;
      const row = rows()[i]!;
      click(row);
      expect(dialog().querySelector('h2')?.textContent).toBe(project.name);
      expect(dialog().textContent).toContain(`${pad2(i + 1)} / ${pad2(PROJECTS.length)}`);
      expect(dialog().querySelector('h2 + p')?.textContent).toBe(
        `${project.kind.sk} · ${copySk.work.contexts[project.context]}`,
      );

      press('Escape');
      expect(dialog().closest('[inert]')).not.toBeNull();
      expect(document.activeElement).toBe(row);
    }
  });

  it('steps the drawer through every project, not just the featured ones', () => {
    click(toggle());
    click(rows().at(-1)!);
    press('ArrowRight');
    expect(dialog().querySelector('h2')?.textContent).toBe(PROJECTS[0]!.name);
    press('ArrowLeft');
    expect(dialog().querySelector('h2')?.textContent).toBe(PROJECTS.at(-1)!.name);
  });
});

describe('project drawer', () => {
  it('opens with the summary, the numbered scope and the credit only when the project has one', () => {
    click(toggle());
    click(rows()[0]!);
    for (const project of PROJECTS) {
      expect(dialog().querySelector('h2')?.textContent).toBe(project.name);
      expect([...dialog().querySelectorAll('p')].map((p) => p.textContent)).toContain(project.summary.sk);
      expect(scopeRows()).toEqual(project.scope.sk.map((item, i) => [pad2(i + 1), item]));
      expect(dialog().querySelector('small')?.textContent).toBe(project.credit?.sk);
      press('ArrowRight');
    }
    expect(PROJECTS.some((p) => p.credit)).toBe(true);
    expect(PROJECTS.some((p) => !p.credit)).toBe(true);
  });

  it('links a public project out and shows a private one as a label without any link', () => {
    click(toggle());
    click(rows()[0]!);
    for (const project of PROJECTS) {
      const links = [...dialog().querySelectorAll('a')];
      if (project.url) {
        expect(links.map((a) => a.getAttribute('href'))).toEqual([project.url, project.url]);
        expect(links.every((a) => a.target === '_blank' && a.rel === 'noopener')).toBe(true);
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

describe('prerendered markup', () => {
  it('carries the full list while collapsed, inside an inert panel', () => {
    const doc = new DOMParser().parseFromString(renderToString(page('sk')), 'text/html');
    const button = doc.querySelector('button[aria-controls]')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');
    const list = doc.getElementById(button.getAttribute('aria-controls')!)!;
    expect(list.hasAttribute('inert')).toBe(true);
    expect(list.querySelectorAll('li')).toHaveLength(PROJECTS.length);
    for (const project of PROJECTS) expect(list.textContent).toContain(project.name);
  });

  it('uses the English labels on the English page', () => {
    const html = renderToString(page('en'));
    expect(html).toContain(`All projects (${PROJECTS.length})`);
    expect(html).toContain('At GrandPano');
    expect(html).toContain('Own project');
  });
});
