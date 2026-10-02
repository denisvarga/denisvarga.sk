import { describe, expect, it } from 'vitest';
import { parseTitleMarkup, plainTitle } from './title-markup';

describe('parseTitleMarkup', () => {
  it('marks a single starred word bold', () => {
    expect(parseTitleMarkup('Ahoj, som *Denis.*')).toEqual([
      { text: 'Ahoj,', bold: false },
      { text: 'som', bold: false },
      { text: 'Denis.', bold: true },
    ]);
  });

  it('keeps a bold run open across words until the closing star', () => {
    expect(parseTitleMarkup('keď to začalo *dávať zmysel.*')).toEqual([
      { text: 'keď', bold: false },
      { text: 'to', bold: false },
      { text: 'začalo', bold: false },
      { text: 'dávať', bold: true },
      { text: 'zmysel.', bold: true },
    ]);
  });

  it('returns plain words when there is no markup', () => {
    expect(parseTitleMarkup('Kde som pracoval')).toEqual([
      { text: 'Kde', bold: false },
      { text: 'som', bold: false },
      { text: 'pracoval', bold: false },
    ]);
  });

  it('ignores empty words from repeated spaces', () => {
    expect(parseTitleMarkup('a  *b*')).toEqual([
      { text: 'a', bold: false },
      { text: 'b', bold: true },
    ]);
  });

  it('keeps apostrophes and punctuation intact', () => {
    expect(parseTitleMarkup("Hi, I'm *Denis.*").map((w) => w.text)).toEqual(['Hi,', "I'm", 'Denis.']);
  });
});

describe('plainTitle', () => {
  it('strips the markup', () => {
    expect(plainTitle('Máte projekt alebo miesto v tíme? *Napíšte mi.*')).toBe(
      'Máte projekt alebo miesto v tíme? Napíšte mi.',
    );
  });
});
