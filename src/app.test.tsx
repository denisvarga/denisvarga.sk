import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './app';
import { SHOW_INTRO_AND_DEMO } from './sections/ai/ai-section';

const h1Text = (html: string) => new DOMParser().parseFromString(html, 'text/html').querySelector('h1')?.textContent;

describe('App', () => {
  it('renders the seven sections inside main#top', () => {
    const html = renderToString(<App lang="sk" />);
    expect(html).toContain('<main id="top">');
    expect(html.match(/<section data-sec/g)).toHaveLength(7);
    expect(h1Text(html)).toBe('Ahoj, som Denis Varga.');
  });

  it('renders the English copy for lang="en"', () => {
    expect(h1Text(renderToString(<App lang="en" />))).toBe("Hi, I'm Denis Varga.");
  });

  it.runIf(!SHOW_INTRO_AND_DEMO)('keeps the chat but leaves out the AI heading, tools and terminal demo above it', () => {
    const html = renderToString(<App lang="sk" />);
    expect(html).toContain('id="ask"');
    expect(html).toContain('Spýtať sa môjho AI agenta');
    expect(html).not.toContain('Ilustračná ukážka postupu');
    expect(html).not.toContain('Agentom nechávam');
    expect(html).not.toContain('Hlavné prostredie, v ktorom vyvíjam');
  });

  it.runIf(SHOW_INTRO_AND_DEMO)('captions the terminal demo as illustrative in each language', () => {
    expect(renderToString(<App lang="sk" />)).toContain('Ilustračná ukážka postupu, nie záznam reálneho behu.');
    expect(renderToString(<App lang="en" />)).toContain('Illustrative workflow, not a recorded run.');
  });

  it('never renders a style attribute or data-in', () => {
    const html = renderToString(<App lang="sk" />) + renderToString(<App lang="en" />);
    expect(html).not.toContain(' style=');
    expect(html).not.toContain('data-in');
  });
});
