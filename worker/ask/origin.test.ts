import { describe, expect, it } from 'vitest';
import { isAllowedRequest } from './origin';

const ALLOWED = 'https://denisvarga.sk, https://denisvarga.dev';
const headers = (origin: string | null, contentType = 'application/json') => {
  const h = new Headers({ 'Content-Type': contentType });
  if (origin !== null) h.set('Origin', origin);
  return h;
};

describe('isAllowedRequest', () => {
  it('accepts JSON from every listed origin', () => {
    expect(isAllowedRequest(headers('https://denisvarga.sk'), ALLOWED)).toBe(true);
    expect(isAllowedRequest(headers('https://denisvarga.dev', 'application/json; charset=utf-8'), ALLOWED)).toBe(true);
  });

  it('rejects other origins, a missing origin, non-JSON bodies and an empty list', () => {
    expect(isAllowedRequest(headers('https://www.denisvarga.dev'), ALLOWED)).toBe(false);
    expect(isAllowedRequest(headers('http://denisvarga.dev'), ALLOWED)).toBe(false);
    expect(isAllowedRequest(headers(null), ALLOWED)).toBe(false);
    expect(isAllowedRequest(headers('https://denisvarga.dev', 'text/plain'), ALLOWED)).toBe(false);
    expect(isAllowedRequest(headers('https://denisvarga.dev'), ' , ')).toBe(false);
  });
});
