import { describe, expect, it } from 'vitest';
import { designInitGL, designRenderGL, seededRandom, type OracleEnv } from '../../scripts/oracles/design-gl-math';
import { blendFromAnchor, heroAnchor } from './hero-anchor';
import { createFrameState, groupTargets, stepFrame } from './morph';

const EMPTY = new Float32Array(3);

function oracleFirstFrame(env: OracleEnv, mobile: boolean) {
  const G = designInitGL(1, 1, [EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY], { dir: EMPTY, ph: new Float32Array(1), col: EMPTY, size: new Float32Array(1) }, 0);
  designRenderGL(G, { Ts: 0, vel: 0, mouse: { x: 0, y: 0 }, coarse: false, mobile, spin: 0, lastSy2: 0 }, env, 5000);
  return G;
}

describe('hero anchoring parity', () => {
  it('matches the design group offsets for sampled hero rects, viewports and blend progress', () => {
    const R = seededRandom(5);
    for (let i = 0; i < 200; i++) {
      const width = [390, 768, 1280, 1440, 1920][i % 5]!, height = [844, 1024, 800, 900, 1080][i % 5]!;
      const size = width * (0.3 + R() * 0.5);
      const hero = { left: R() * width * 0.6, top: (R() - 0.5) * height, width: size, height: size };
      // The next section top sweeps the morph from the anchor (e = 0) towards GOFF[1].
      const tops = [-R() * height, height * (0.2 + R())];
      const env: OracleEnv = { innerWidth: width, innerHeight: height, scrollY: 0, tops, hero };
      const mobile = width < 900;
      const G = oracleFirstFrame(env, mobile);
      const state = createFrameState(0);
      stepFrame(state, {
        time: 5000, tops, viewportWidth: width, viewportHeight: height, hero, velocity: 0,
        scrollY: 0, mouseX: 0, mouseY: 0, coarse: false, mobile,
      });
      expect([state.ox, state.oy, state.os, state.op]).toEqual([G.ox, G.oy, G.os, G.op]);
    }
  });

  it('centres the anchor on a centred image and floors the scale at 0.45', () => {
    const a = heroAnchor({ left: 700, top: 450 - 0.36 * 40, width: 40, height: 40 }, 1440, 900);
    expect(a.x).toBeCloseTo(0);
    expect(a.y).toBeCloseTo(0);
    expect(a.scale).toBe(0.45);
  });

  it('blends from the anchor at e = 0 to the target at e = 1', () => {
    const anchor = { x: 1, y: 2, scale: 0.5 }, target = { x: 3, y: -2, scale: 1 };
    expect(blendFromAnchor(anchor, target, 0)).toEqual(anchor);
    expect(blendFromAnchor(anchor, target, 1)).toEqual(target);
  });

  it('ignores the hero image once the morph has left the first shape', () => {
    const hero = { left: 0, top: 0, width: 500, height: 500 };
    const input = { viewportWidth: 1440, viewportHeight: 900, hero, mobile: false };
    expect(groupTargets(1, 2, 0, 0, input)).toEqual(groupTargets(1, 2, 0, 0, { ...input, hero: null }));
    expect(groupTargets(0, 1, 0, 0, input)).not.toEqual(groupTargets(0, 1, 0, 0, { ...input, hero: null }));
  });
});
