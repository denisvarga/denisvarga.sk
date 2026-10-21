import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { LangProvider } from '../../i18n/lang-context';
import { HeroSection } from './hero-section';

const render = () =>
  new DOMParser().parseFromString(
    renderToString(
      <LangProvider lang="sk">
        <HeroSection />
      </LangProvider>,
    ),
    'text/html',
  );

// The lead (mobile) and the desktop image are the LCP candidates; an opacity fade with a delay
// holds back LCP until it becomes visible.
describe('HeroSection entrance', () => {
  it('lets the lead rise without a fade', () => {
    expect(render().querySelector('p')?.getAttribute('data-enter')).toBe('rise');
  });

  it('starts the desktop image fade at once', () => {
    const fades = [...render().querySelectorAll('[data-enter="fade"]')];
    expect(fades).toHaveLength(1);
    expect(fades[0]?.getAttribute('data-delay')).toBe('0');
    expect(fades[0]?.querySelector('[data-heroimg]')).not.toBeNull();
  });
});
