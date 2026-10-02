import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { SplitHeading } from './split-heading';

function render(text: string): HTMLHeadingElement {
  const host = document.createElement('div');
  host.innerHTML = renderToString(<SplitHeading as="h2" text={text} />);
  return host.querySelector('h2')!;
}

describe('SplitHeading', () => {
  it('reads as the plain sentence, once', () => {
    const heading = render('AI píše, ja *rozhodujem.*');
    expect(heading.textContent).toBe('AI píše, ja rozhodujem.');
    expect(heading.querySelector('.visually-hidden, [aria-hidden]')).toBeNull();
  });

  it('ends every mask but the last with one space, so the masks stay the only children', () => {
    const heading = render('Ahoj, som *Denis.*');
    const masks = [...heading.children];
    expect(masks.every((el) => el.classList.contains('word-mask'))).toBe(true);
    expect(masks.map((el) => el.textContent)).toEqual(['Ahoj, ', 'som ', 'Denis.']);
    expect([...heading.querySelectorAll('.word')].map((w) => w.textContent)).toEqual(['Ahoj,', 'som', 'Denis.']);
  });
});
