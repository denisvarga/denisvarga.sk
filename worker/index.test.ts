import { describe, expect, it } from 'vitest';
import app from './index';

describe('worker', () => {
  it('answers the health check', async () => {
    const res = await app.request('/api/health');
    expect(await res.json()).toEqual({ ok: true });
  });
});
