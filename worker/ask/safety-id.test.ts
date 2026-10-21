import { describe, expect, it } from 'vitest';
import { hmacHex, quotaKey, safetyIdentifier } from './safety-id';

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

describe('quotaKey', () => {
  it('is an HMAC over the prefixed day and client key, never containing the address', async () => {
    const day = Date.UTC(2026, 9, 21);
    const key = await quotaKey('salt', day, '203.0.113.7');
    expect(key).toBe(await hmacHex('salt', `quota:v1:${day}:203.0.113.7`));
    expect(key).toMatch(/^[0-9a-f]{64}$/);
    expect(key).not.toContain('203');
  });

  it('changes every day and differs from the safety identifier', async () => {
    const day = Date.UTC(2026, 9, 21);
    const today = await quotaKey('salt', day, '203.0.113.7');
    expect(await quotaKey('salt', day + 86_400_000, '203.0.113.7')).not.toBe(today);
    expect(await safetyIdentifier('salt', '203.0.113.7')).not.toBe(today);
  });
});
