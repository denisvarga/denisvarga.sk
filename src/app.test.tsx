import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { App } from './app';

describe('App', () => {
  it('renders the name', () => {
    expect(renderToString(<App lang="sk" />)).toContain('Denis Varga');
  });
});
