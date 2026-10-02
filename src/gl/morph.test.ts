import { describe, expect, it } from 'vitest';
import {
  designInitGL,
  designMakeShapes,
  designPointAttributes,
  designRenderGL,
  seededRandom,
  type OracleEnv,
  type OracleSelf,
} from '../../scripts/oracles/design-gl-math';
import { makePointAttributes, makeShapes } from './make-shapes';
import { createFrameState, morphProgress, stepFrame, writeMorphPositions, type FrameInput } from './morph';
import { createLineBuffers, makeLineNodes, writeNetworkLines } from './network-lines';

const SECTION_TOPS = [0, 900, 2100, 3000, 4300, 5600, 6400];

// Index of the first differing element, -1 when identical; much faster than toEqual per frame.
function firstMismatch(a: ArrayLike<number>, b: ArrayLike<number>, length = a.length): number {
  if (a.length < length || b.length < length) return 0;
  for (let i = 0; i < length; i++) if (!Object.is(a[i], b[i])) return i;
  return -1;
}

interface Sample {
  time: number;
  scrollY: number;
  vel: number;
  mouse: { x: number; y: number };
  width: number;
  height: number;
  hero: OracleEnv['hero'];
  coarse: boolean;
}

function samples(count: number, seed: number): Sample[] {
  const R = seededRandom(seed), out: Sample[] = [];
  let scrollY = 0;
  for (let i = 0; i < count; i++) {
    scrollY = Math.max(0, Math.min(6400, scrollY + (R() - 0.3) * 160));
    const width = i < count / 2 ? 1440 : 390, height = width === 1440 ? 900 : 844;
    out.push({
      time: 1000 + i * 16.7,
      scrollY,
      vel: (R() - 0.5) * 120,
      mouse: { x: R() * 2 - 1, y: R() * 2 - 1 },
      width,
      height,
      hero: R() < 0.8 ? { left: width * 0.5, top: 120 - scrollY, width: width * 0.45, height: width * 0.45 } : null,
      coarse: i % 37 === 0,
    });
  }
  return out;
}

function runParity(n: number, NN: number, seed: number, frames: number) {
  const shapesR = seededRandom(seed), oracleR = seededRandom(seed);
  const shapes = makeShapes(n, shapesR), attrs = makePointAttributes(n, shapesR);
  const G = designInitGL(n, NN, designMakeShapes(n, oracleR), designPointAttributes(n, oracleR), 1000);
  const self: OracleSelf = { Ts: 0, vel: 0, mouse: { x: 0, y: 0 }, coarse: false, mobile: false, spin: 0, lastSy2: 0 };
  const state = createFrameState(1000), pos = new Float32Array(shapes[0]!), nodes = makeLineNodes(n, NN), lines = createLineBuffers();
  for (const s of samples(frames, seed)) {
    const tops = SECTION_TOPS.map((t) => t - s.scrollY), mobile = s.width < 900;
    Object.assign(self, { vel: s.vel, mouse: s.mouse, coarse: s.coarse, mobile });
    designRenderGL(G, self, { innerWidth: s.width, innerHeight: s.height, scrollY: s.scrollY, tops, hero: s.hero }, s.time);
    const input: FrameInput = {
      time: s.time, tops, viewportWidth: s.width, viewportHeight: s.height, hero: s.hero, velocity: s.vel,
      scrollY: s.scrollY, mouseX: s.mouse.x, mouseY: s.mouse.y, coarse: s.coarse, mobile,
    };
    const r = stepFrame(state, input);
    writeMorphPositions(shapes[r.a]!, shapes[r.b]!, attrs.dir, attrs.ph, pos, r.m, r.burst, r.tt);
    const segments = writeNetworkLines(pos, nodes, lines, r.lineOpacity);
    expect(firstMismatch(pos, G.pos)).toBe(-1);
    expect(segments * 2).toBe(G.drawCount);
    expect(firstMismatch(lines.positions, G.lpos, segments * 6)).toBe(-1);
    expect(firstMismatch(lines.colors, G.lcol, segments * 8)).toBe(-1);
    expect([state.ox, state.oy, state.os, state.op]).toEqual([G.group.position.x, G.group.position.y, G.group.scale, G.U.uOpacity]);
    expect([state.mouseX, state.mouseY]).toEqual([G.U.uMouse.x, G.U.uMouse.y]);
    expect([state.rotX, state.rotY, r.rotZ]).toEqual([G.group.rotation.x, G.group.rotation.y, G.group.rotation.z]);
    expect([state.camX, state.camY]).toEqual([G.camera.x, G.camera.y]);
    expect(state.Ts).toBe(self.Ts);
  }
  return state;
}

describe('per-frame morph parity with the design renderGL', () => {
  it('matches every output over a desktop-then-mobile scroll sequence', () => {
    const state = runParity(12000, 420, 11, 240);
    expect(state.Ts).toBeGreaterThan(0.5);
  });

  it('matches with the mobile point and node counts', () => {
    runParity(7000, 240, 23, 120);
  });
});

describe('morphProgress', () => {
  it('holds the section index until the next top nears the focus line', () => {
    // focus = 450; the blend starts once the next top is within 0.75 vh (675 px) below it.
    expect(morphProgress([0, 1200, 2400], 900)).toBe(0);
    expect(morphProgress([-1200, 0, 1200], 900)).toBe(1);
    expect(morphProgress([0, 900, 1800], 900)).toBeCloseTo(0.2593, 4);
    expect(morphProgress([-450, 450, 1650], 900)).toBe(1);
    expect(morphProgress([-2400, -1200, 0], 900)).toBe(2);
  });

  it('returns 0 when no sections are measured', () => {
    expect(morphProgress([], 900)).toBe(0);
  });
});
