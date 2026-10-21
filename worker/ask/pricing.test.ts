import { describe, expect, it } from 'vitest';
import { estimateCostUsd } from './pricing';

describe('estimateCostUsd', () => {
  it('prices input without cache use and output at list price', () => {
    const cost = estimateCostUsd({ inputTokens: 12_000, cachedTokens: 0, cacheWriteTokens: 0, outputTokens: 150 });
    expect(cost).toBeCloseTo(12_000 * 0.1e-6 + 150 * 0.5e-6, 12);
  });

  it('bills each input token once: reads at a tenth, writes at 1.25 times, the rest at list price', () => {
    const cost = estimateCostUsd({ inputTokens: 12_000, cachedTokens: 4_000, cacheWriteTokens: 7_000, outputTokens: 100 });
    expect(cost).toBeCloseTo(1_000 * 0.1e-6 + 4_000 * 0.01e-6 + 7_000 * 0.125e-6 + 100 * 0.5e-6, 12);
  });

  it('never prices plain input below zero when the cache counts exceed the total', () => {
    const cost = estimateCostUsd({ inputTokens: 100, cachedTokens: 80, cacheWriteTokens: 80, outputTokens: 0 });
    expect(cost).toBeCloseTo(80 * 0.01e-6 + 80 * 0.125e-6, 12);
  });
});
