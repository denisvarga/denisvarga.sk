import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  it('renders the seven sections inside main#top', () => {
    const html = renderToString(<App lang="sk" />);
    expect(html).toContain('<main id="top">');
    expect(html.match(/<section data-sec/g)).toHaveLength(7);
    expect(html).toContain('Ahoj, som Denis.');
  });

  it('renders the English copy for lang="en"', () => {
    expect(renderToString(<App lang="en" />)).toContain("Hi, I&#x27;m Denis.");
  });

  it('never renders a style attribute or data-in', () => {
    const html = renderToString(<App lang="sk" />) + renderToString(<App lang="en" />);
    expect(html).not.toContain(' style=');
    expect(html).not.toContain('data-in');
  });
});
