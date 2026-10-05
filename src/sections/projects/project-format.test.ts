import { describe, expect, it } from 'vitest';
import { pad2, projectDomain } from './project-format';

describe('project format helpers', () => {
  it('pads numbers to two digits', () => {
    expect(pad2(3)).toBe('03');
    expect(pad2(12)).toBe('12');
  });

  it('strips the scheme from a project url', () => {
    expect(projectDomain('https://denva.studio')).toBe('denva.studio');
  });
});
