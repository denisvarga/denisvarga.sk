import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './app';
import { SECTIONS, SHOW_AI } from './sections/section-order';

const h1Text = (html: string) => new DOMParser().parseFromString(html, 'text/html').querySelector('h1')?.textContent;

describe('App', () => {
  it('renders every section of SECTIONS inside main#top', () => {
    const html = renderToString(<App lang="sk" />);
    expect(html).toContain('<main id="top">');
    expect(html.match(/<section data-sec/g)).toHaveLength(SECTIONS.length);
    expect(h1Text(html)).toBe('Ahoj, som Denis.');
  });

  it('renders the English copy for lang="en"', () => {
    expect(h1Text(renderToString(<App lang="en" />))).toBe("Hi, I'm Denis.");
  });

  it.runIf(SHOW_AI)('captions the terminal demo as illustrative in each language', () => {
    expect(renderToString(<App lang="sk" />)).toContain('Ilustračná ukážka postupu, nie záznam reálneho behu.');
    expect(renderToString(<App lang="en" />)).toContain('Illustrative workflow, not a recorded run.');
  });

  it.runIf(!SHOW_AI)('leaves out the AI section, the chat and the hero chat button', () => {
    const html = renderToString(<App lang="sk" />);
    expect(html).not.toContain('id="ask"');
    expect(html).not.toContain('Ilustračná ukážka postupu');
    expect(html).not.toContain('Spýtať sa môjho AI agenta');
  });

  it('never renders a style attribute or data-in', () => {
    const html = renderToString(<App lang="sk" />) + renderToString(<App lang="en" />);
    expect(html).not.toContain(' style=');
    expect(html).not.toContain('data-in');
  });
});
