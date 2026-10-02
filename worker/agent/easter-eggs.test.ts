import { describe, expect, it } from 'vitest';
import { easterEgg, normalizeCommand } from './easter-eggs';

describe('easterEgg', () => {
  it('answers the four commands in both languages', () => {
    expect(easterEgg('help', 'sk')).toMatch(/^Príkazy: help, whoami, sudo hire denis\./);
    expect(easterEgg('help', 'en')).toMatch(/^Commands: help, whoami, sudo hire denis\./);
    expect(easterEgg('whoami', 'en')).toBe('visitor@denisvarga.sk - a curious visitor. Exactly the kind Denis likes to meet.');
    expect(easterEgg('hire denis', 'sk')).toBe('Permission denied. Skúste to so sudo.');
    expect(easterEgg('sudo hire denis', 'sk')).toContain('hello@denisvarga.sk alebo zavoláte na +421 902 074 830');
    expect(easterEgg('sudo hire denis', 'en')).toContain('email hello@denisvarga.sk or call +421 902 074 830');
  });

  it('normalises case, whitespace and trailing punctuation', () => {
    expect(normalizeCommand('  SUDO   Hire\tDenis!?. ')).toBe('sudo hire denis');
    expect(easterEgg('Help!', 'en')).not.toBeNull();
  });

  it('ignores near misses and object prototype keys', () => {
    expect(easterEgg('help me', 'sk')).toBeNull();
    expect(easterEgg('please hire denis', 'en')).toBeNull();
    expect(easterEgg('constructor', 'en')).toBeNull();
    expect(easterEgg('__proto__', 'sk')).toBeNull();
  });
});
