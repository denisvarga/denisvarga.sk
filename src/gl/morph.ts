import { clamp01 } from '../lib/math';
import { groupOffset, SHAPE_COUNT } from './goff';
import { blendFromAnchor, heroAnchor, type GroupTarget, type ViewportRect } from './hero-anchor';

// Smoothed values carried between frames; initial values match the design's initGL.
export interface FrameState {
  t0: number;
  Ts: number;
  ox: number;
  oy: number;
  os: number;
  op: number;
  mouseX: number;
  mouseY: number;
  spin: number;
  lastScrollY: number;
  rotX: number;
  rotY: number;
  camX: number;
  camY: number;
}

export function createFrameState(t0: number): FrameState {
  const [ox, oy] = groupOffset(0);
  return { t0, Ts: 0, ox, oy, os: 0.6, op: 0, mouseX: 5, mouseY: 5, spin: 0, lastScrollY: 0, rotX: 0, rotY: 0, camX: 0, camY: 0 };
}

export interface FrameInput {
  time: number;
  // Section tops relative to the viewport, in document order.
  tops: ArrayLike<number>;
  viewportWidth: number;
  viewportHeight: number;
  hero: ViewportRect | null;
  velocity: number;
  scrollY: number;
  mouseX: number;
  mouseY: number;
  coarse: boolean;
  mobile: boolean;
}

export interface FrameResult {
  a: number;
  b: number;
  m: number;
  burst: number;
  tt: number;
  // The line pass runs before the opacity lerp in the design, so it uses last frame's opacity.
  lineOpacity: number;
  targetOpacity: number;
  rotZ: number;
}

export function morphProgress(tops: ArrayLike<number>, viewportHeight: number): number {
  const focus = viewportHeight * 0.5;
  let idx = 0;
  for (let i = 0; i < tops.length; i++) if (tops[i]! <= focus) idx = i;
  if (idx >= tops.length - 1) return idx;
  const x = clamp01(1 - (tops[idx + 1]! - focus) / (viewportHeight * 0.75));
  return idx + x * x * (3 - 2 * x);
}

export interface GroupTargets extends GroupTarget {
  opacity: number;
}

export function groupTargets(
  a: number,
  b: number,
  m: number,
  intro: number,
  input: Pick<FrameInput, 'viewportWidth' | 'viewportHeight' | 'hero' | 'mobile'>,
): GroupTargets {
  const { viewportWidth: vw, viewportHeight: vh, mobile: mob } = input;
  const A = groupOffset(a), B = groupOffset(b), e = m * m * (3 - 2 * m);
  const lp = (j: number) => A[j]! + (B[j]! - A[j]!) * e;
  const asp = Math.min(1, vw / vh / 1.6);
  let target: GroupTarget = { x: mob ? 0 : lp(0) * asp, y: mob ? 0 : lp(1), scale: lp(2) * (mob ? 0.6 : 1) };
  const opacity = lp(3) * (mob ? 0.35 : 1) * (1 - intro * 0.6);
  if (input.hero && a === 0) target = blendFromAnchor(heroAnchor(input.hero, vw, vh), target, e);
  return { ...target, opacity };
}

// One frame of the design's renderGL scalar math; mutates the state like the design mutates G.
export function stepFrame(s: FrameState, f: FrameInput): FrameResult {
  s.Ts += (morphProgress(f.tops, f.viewportHeight) - s.Ts) * 0.06;
  const last = SHAPE_COUNT - 1, a = Math.min(last, Math.floor(s.Ts)), b = Math.min(last, a + 1), m = clamp01(s.Ts - a);
  const it = clamp01((f.time - s.t0) / 2600), intro = Math.pow(1 - it, 3);
  const burst = Math.sin(m * Math.PI) * 0.5 + intro * 2.8 + Math.min(0.35, Math.abs(f.velocity) * 0.004);
  const lineOpacity = s.op;
  const t = groupTargets(a, b, m, intro, f);
  s.ox += (t.x - s.ox) * 0.06;
  s.oy += (t.y - s.oy) * 0.06;
  s.os += (t.scale - s.os) * 0.06;
  s.op += (t.opacity - s.op) * 0.05;
  const mxT = f.coarse ? 5 : f.mouseX, myT = f.coarse ? 5 : -f.mouseY;
  s.mouseX += (mxT - s.mouseX) * 0.12;
  s.mouseY += (myT - s.mouseY) * 0.12;
  s.spin += (f.scrollY - s.lastScrollY) * 0.0006;
  s.lastScrollY = f.scrollY;
  s.rotY += (f.time * 0.0001 + s.spin - s.rotY) * 0.08;
  s.rotX += (f.mouseY * 0.15 + 0.12 - s.rotX) * 0.04;
  s.camX += (f.mouseX * 0.3 - s.camX) * 0.04;
  s.camY += (-f.mouseY * 0.22 - s.camY) * 0.04;
  return { a, b, m, burst, tt: f.time * 0.0009, lineOpacity, targetOpacity: t.opacity, rotZ: Math.sin(f.time * 0.00025) * 0.05 };
}

export function writeMorphPositions(
  A: Float32Array,
  B: Float32Array,
  dir: Float32Array,
  ph: Float32Array,
  pos: Float32Array,
  m: number,
  burst: number,
  tt: number,
): void {
  for (let i = 0, k = 0; i < ph.length; i++, k += 3) {
    pos[k] = A[k]! + (B[k]! - A[k]!) * m + dir[k]! * burst + Math.sin(tt + ph[i]!) * 0.025;
    pos[k + 1] = A[k + 1]! + (B[k + 1]! - A[k + 1]!) * m + dir[k + 1]! * burst + Math.cos(tt * 1.3 + ph[i]!) * 0.025;
    pos[k + 2] = A[k + 2]! + (B[k + 2]! - A[k + 2]!) * m + dir[k + 2]! * burst;
  }
}
