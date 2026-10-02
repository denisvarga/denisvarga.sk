import { describe, expect, it } from 'vitest';
import { safetyIdentifier } from './safety-id';

describe('safetyIdentifier', () => {
  it('matches the RFC 4231 HMAC-SHA256 test vector', async () => {
    expect(await safetyIdentifier('Jefe', 'what do ya want for nothing?')).toBe(
      '5bdcc146bf60754e6a042426089575c75a003f089d2739839dec58b964ec3843',
    );
  });

  it('is stable per key, salt-dependent and never contains the key', async () => {
    const a = await safetyIdentifier('salt', '203.0.113.7');
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await safetyIdentifier('salt', '203.0.113.7')).toBe(a);
    expect(await safetyIdentifier('other', '203.0.113.7')).not.toBe(a);
    expect(a).not.toContain('203');
  });
});
