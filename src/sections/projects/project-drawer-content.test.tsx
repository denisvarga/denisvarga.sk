import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PROJECTS } from '../../data/projects';
import { LangProvider } from '../../i18n/lang-context';
import type { Lang } from '../../i18n/types';
import { ProjectDrawerContent } from './project-drawer-content';

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean | undefined;
}
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// The SK chunk resolves only when the test opens the gate; the EN chunk fails on its first load.
const chunks = vi.hoisted(() => ({ gate: Promise.withResolvers<void>(), enLoads: 0 }));
vi.mock('../../../shared/project-details-sk', async (importOriginal) => {
  await chunks.gate.promise;
  return importOriginal();
});
vi.mock('../../../shared/project-details-en', async (importOriginal) => {
  chunks.enLoads += 1;
  if (chunks.enLoads === 1) throw new Error('chunk_load_failed');
  return importOriginal();
});

// The real texts for the assertions, past the mocks.
const { PROJECT_DETAILS_SK } = await vi.importActual<typeof import('../../../shared/project-details-sk')>(
  '../../../shared/project-details-sk',
);
const { PROJECT_DETAILS_EN } = await vi.importActual<typeof import('../../../shared/project-details-en')>(
  '../../../shared/project-details-en',
);

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  vi.restoreAllMocks();
});

const render = (lang: Lang, index: number) =>
  act(() =>
    root.render(
      <LangProvider lang={lang}>
        <ProjectDrawerContent project={PROJECTS[index]!} titleId="t" />
      </LangProvider>,
    ),
  );
const intro = () => container.querySelector('p:not(h2 + p)')?.parentElement;
const summary = () => intro()?.querySelector('p')?.textContent;

describe('ProjectDrawerContent', () => {
  it('shows the card line as a busy placeholder until the details chunk arrives', async () => {
    const project = PROJECTS[0]!;
    render('sk', 0);
    expect(container.querySelector('h2')?.textContent).toBe(project.name);
    expect(summary()).toBe(project.desc.sk);
    expect(intro()?.getAttribute('aria-busy')).toBe('true');
    expect(container.textContent).not.toContain(PROJECT_DETAILS_SK[project.slug]!.scope[0]);

    await act(async () => chunks.gate.resolve());
    await vi.waitFor(() => expect(summary()).toBe(PROJECT_DETAILS_SK[project.slug]!.summary));
    expect(intro()?.hasAttribute('aria-busy')).toBe(false);
    expect(container.textContent).toContain(PROJECT_DETAILS_SK[project.slug]!.scope.at(-1));
  });

  it('renders the details on the first frame once the chunk has loaded', () => {
    const project = PROJECTS[1]!;
    render('sk', 1);
    expect(summary()).toBe(PROJECT_DETAILS_SK[project.slug]!.summary);
    expect(intro()?.hasAttribute('aria-busy')).toBe(false);
    for (const item of PROJECT_DETAILS_SK[project.slug]!.scope) expect(container.textContent).toContain(item);
  });

  it('keeps the card line when the chunk fails and loads it again on the next project', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {});
    render('en', 0);
    await vi.waitFor(() => expect(logged).toHaveBeenCalledWith('project_details_failed', expect.any(Error)));
    expect(summary()).toBe(PROJECTS[0]!.desc.en);
    expect(intro()?.hasAttribute('aria-busy')).toBe(false);

    render('en', 1);
    const next = PROJECTS[1]!;
    await vi.waitFor(() => expect(summary()).toBe(PROJECT_DETAILS_EN[next.slug]!.summary));
    expect(chunks.enLoads).toBe(2);
  });
});
