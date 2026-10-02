import { describe, expect, it } from 'vitest';
import { designInitGL, designMakeShapes, designPointAttributes, designRenderGL, seededRandom } from '../../scripts/oracles/design-gl-math';
import { createLineBuffers, lineNodeCount, makeLineNodes, MAX_SEGMENTS, writeNetworkLines } from './network-lines';

const env = { innerWidth: 1440, innerHeight: 900, scrollY: 0, tops: [0, 900, 1800], hero: null };
const self = () => ({ Ts: 0, vel: 0, mouse: { x: 0, y: 0 }, coarse: false, mobile: false, spin: 0, lastSy2: 0 });

describe('network lines', () => {
  it('uses the design node counts and stride', () => {
    expect(lineNodeCount(390)).toBe(240);
    expect(lineNodeCount(1440)).toBe(420);
    expect(Array.from(makeLineNodes(7000, 240).slice(0, 3))).toEqual([0, 29, 58]);
  });

  it('writes the same pairs in the same order as the design loop', () => {
    for (const [n, NN] of [[7000, 240], [12000, 420]] as const) {
      const R = seededRandom(n);
      const shapes = designMakeShapes(n, R);
      const G = designInitGL(n, NN, shapes, designPointAttributes(n, R), 0);
      G.op = 0.7;
      designRenderGL(G, self(), env, 400);
      const buffers = createLineBuffers();
      const segments = writeNetworkLines(G.pos, makeLineNodes(n, NN), buffers, 0.7);
      expect(segments * 2).toBe(G.drawCount);
      expect(segments).toBeGreaterThan(0);
      expect(buffers.positions.subarray(0, segments * 6)).toEqual(G.lpos.subarray(0, segments * 6));
      expect(buffers.colors.subarray(0, segments * 8)).toEqual(G.lcol.subarray(0, segments * 8));
    }
  });

  it('stops at 2600 segments and keeps the first pairs in loop order', () => {
    const n = 12000, nodes = makeLineNodes(n, 420), P = new Float32Array(n * 3).fill(0.1);
    const buffers = createLineBuffers();
    expect(writeNetworkLines(P, nodes, buffers, 1)).toBe(MAX_SEGMENTS);
    // Coincident points: every pair qualifies with full alpha 0.42.
    expect(buffers.colors[3]).toBeCloseTo(0.42);
    expect(buffers.colors[MAX_SEGMENTS * 8 - 1]).toBeCloseTo(0.42);
  });

  it('writes nothing when no pair is within the threshold', () => {
    const nodes = makeLineNodes(10, 2), P = new Float32Array(30);
    P[15] = 1;
    expect(writeNetworkLines(P, nodes, createLineBuffers(), 1)).toBe(0);
  });
});
