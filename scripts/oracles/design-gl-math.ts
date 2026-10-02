// @ts-nocheck -- The bodies below are kept textually close to the design's untyped JS so they stay
// diffable against design/Denis Varga CV v7.dc.html (makeShapes, initGL, paintColors, renderGL);
// typing them would mean rewriting them. Only the exported signatures are typed.
// Changes from the source: Math.random is the R parameter, DOM reads come from `env`, and three
// objects are plain records. Used only by parity tests.

export type OracleRand = () => number;

// mulberry32, a small deterministic PRNG for seeded parity runs.
export function seededRandom(seed: number): OracleRand {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const GOFF = [[2.15, 0.35, 0.95, 0.85], [-2.6, 0, 0.85, 1], [2.75, 0, 0.8, 1], [2.6, 0, 0.9, 1], [0.8, -0.4, 1.0, 0.25], [2.8, -0.3, 0.7, 0.55], [0, 0.2, 1, 0.35]];
const clamp01 = x => Math.min(1, Math.max(0, x));
function hexToRgb(h) { h = (h || '#000').replace('#',''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); const n = parseInt(h.slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }

export function designMakeShapes(n: number, R: OracleRand): Float32Array[] {
  const out = [];
  // oxlint-disable-next-line unicorn/consistent-function-scoping -- verbatim design line
  const rotX = (a, k, t) => { const y = a[k+1], z = a[k+2], c = Math.cos(t), s = Math.sin(t); a[k+1] = y*c - z*s; a[k+2] = y*s + z*c; };
  const jit = s => (R()+R()+R()-1.5)*s;
  let a = new Float32Array(n*3);
  for (let i = 0; i < n; i++) { const k = i*3; if (i % 7 === 0) { const r = 1.6*Math.cbrt(R()), u = R()*2-1, p = R()*6.2832, q = Math.sqrt(1-u*u); a[k] = q*Math.cos(p)*r; a[k+1] = u*r; a[k+2] = q*Math.sin(p)*r; } else { const y = 1 - 2*(i+0.5)/n, q = Math.sqrt(1-y*y), ph = i*2.39996; a[k] = q*Math.cos(ph)*2.05; a[k+1] = y*2.05; a[k+2] = q*Math.sin(ph)*2.05; } }
  out.push(a);
  a = new Float32Array(n*3);
  for (let i = 0; i < n; i++) { const k = i*3, t = R()*6.2832, r = 1.25 + 0.55*Math.cos(3*t); a[k] = r*Math.cos(2*t) + jit(0.09); a[k+1] = r*Math.sin(2*t) + jit(0.09); a[k+2] = 0.6*Math.sin(3*t) + jit(0.09); rotX(a,k,0.4); }
  out.push(a);
  a = new Float32Array(n*3);
  for (let i = 0; i < n; i++) { const k = i*3; if (i % 5 === 0) { const st = Math.round(R()*24)/24, t = st*2-1, an = t*Math.PI*3, u = R()*2-1; a[k] = Math.cos(an)*1.05*u; a[k+1] = t*2.1; a[k+2] = Math.sin(an)*1.05*u; } else { const t = R()*2-1, an = t*Math.PI*3 + (i % 2 ? Math.PI : 0); a[k] = Math.cos(an)*1.05 + jit(0.05); a[k+1] = t*2.1 + jit(0.03); a[k+2] = Math.sin(an)*1.05 + jit(0.05); } rotX(a,k,0.18); }
  out.push(a);
  a = new Float32Array(n*3); const L = [4,7,9,7,4], nodes = [];
  L.forEach((c, l) => { const arr = [], rad = 0.25 + c*0.11; for (let j = 0; j < c; j++) { const an = j/c*6.2832 + l*0.4; arr.push([-2.6 + l*1.3, Math.cos(an)*rad, Math.sin(an)*rad]); } nodes.push(arr); });
  for (let i = 0; i < n; i++) { const k = i*3; if (R() < 0.34) { const l = (R()*5)|0, nd = nodes[l][(R()*nodes[l].length)|0]; for (let d = 0; d < 3; d++) a[k+d] = nd[d] + jit(0.06); } else { const l = (R()*4)|0, A = nodes[l][(R()*nodes[l].length)|0], B = nodes[l+1][(R()*nodes[l+1].length)|0], t = R(); for (let d = 0; d < 3; d++) a[k+d] = A[d] + (B[d]-A[d])*t; } }
  out.push(a);
  a = new Float32Array(n*3);
  for (let i = 0; i < n; i++) { const k = i*3, gx = (R()*2-1)*3.2, gz = (R()*2-1)*2.2, x = Math.round(gx*6)/6, z = R() < 0.5 ? Math.round(gz*6)/6 : gz, xx = R() < 0.5 ? gx : x; a[k] = xx; a[k+2] = z; a[k+1] = 0.32*Math.sin(xx*1.4) + 0.28*Math.cos(z*1.9); rotX(a,k,0.55); }
  out.push(a);
  a = new Float32Array(n*3);
  for (let i = 0; i < n; i++) { const k = i*3, l = i%6, r = 1.9*((1 + ((R()*5)|0))/5), an = R()*6.2832; a[k] = Math.cos(an)*r; a[k+1] = (l-2.5)*0.44; a[k+2] = Math.sin(an)*r; rotX(a,k,0.42); }
  out.push(a);
  a = new Float32Array(n*3);
  for (let i = 0; i < n; i++) { const k = i*3; if (i % 20 < 10) { const u = R()*2-1, p = R()*6.283, q = Math.sqrt(1-u*u); a[k] = q*Math.cos(p)*0.95; a[k+1] = u*0.95; a[k+2] = q*Math.sin(p)*0.95; } else { const j = i%3, Rr = [1.7,2.15,2.6][j], an = R()*6.2832, x = Math.cos(an)*Rr, y = Math.sin(an)*Rr; const ax = [1.2,0.4,-0.7][j], ay = [0.3,-0.9,0.6][j]; const y2 = y*Math.cos(ax), z2 = y*Math.sin(ax); a[k] = x*Math.cos(ay) + z2*Math.sin(ay); a[k+1] = y2; a[k+2] = -x*Math.sin(ay) + z2*Math.cos(ay); } }
  out.push(a);
  return out;
}

export interface OracleAttributes { dir: Float32Array; ph: Float32Array; col: Float32Array; size: Float32Array }

export function designPointAttributes(n: number, R: OracleRand, accent = '#F2541B'): OracleAttributes {
  const dir = new Float32Array(n*3), ph = new Float32Array(n), col = new Float32Array(n*3), size = new Float32Array(n), isAcc = new Uint8Array(n), shade = new Float32Array(n);
  for (let i = 0; i < n; i++) { const u = R()*2-1, p = R()*6.283, q = Math.sqrt(1-u*u), m = 0.4 + R()*1.4; dir[i*3] = q*Math.cos(p)*m; dir[i*3+1] = u*m; dir[i*3+2] = q*Math.sin(p)*m; ph[i] = R()*6.283; isAcc[i] = R() < 0.12 ? 1 : 0; shade[i] = 0.08 + R()*0.28; size[i] = isAcc[i] ? 1.25 : 0.7 + R()*0.6; }
  const [r, g, b] = hexToRgb(accent).map(v => v/255);
  for (let i = 0; i < n; i++) { const k = i*3, f = shade[i]; if (isAcc[i]) { col[k] = r; col[k+1] = g; col[k+2] = b; } else { col[k] = f; col[k+1] = f*1.02; col[k+2] = f*1.05; } }
  return { dir, ph, col, size };
}

export interface OracleGL {
  shapes: Float32Array[]; pos: Float32Array; dir: Float32Array; ph: Float32Array; n: number;
  nodes: Uint32Array; lpos: Float32Array; lcol: Float32Array; MAXS: number; drawCount: number;
  ox: number; oy: number; os: number; op: number; t0: number;
  group: { position: { x: number; y: number }; scale: number; rotation: { x: number; y: number; z: number } };
  camera: { x: number; y: number };
  U: { uOpacity: number; uTime: number; uAspect: number; uMouse: { x: number; y: number } };
}

// The component fields renderGL reads and writes (this.Ts, this.vel, this.mouse, ...).
export interface OracleSelf {
  Ts: number; vel: number; mouse: { x: number; y: number }; coarse: boolean; mobile: boolean;
  mSm?: { x: number; y: number }; spin: number; lastSy2: number; rotY?: number;
}

export interface OracleEnv {
  innerWidth: number; innerHeight: number; scrollY: number;
  // getBoundingClientRect().top of each [data-sec], and of the first [data-heroimg] (null when absent).
  tops: number[]; hero: { left: number; top: number; width: number; height: number } | null;
}

export function designInitGL(n: number, NN: number, shapes: Float32Array[], attrs: OracleAttributes, t0: number): OracleGL {
  const stp = Math.floor(n / NN), nodes = new Uint32Array(NN); for (let i = 0; i < NN; i++) nodes[i] = i * stp;
  const MAXS = 2600, lpos = new Float32Array(MAXS * 6), lcol = new Float32Array(MAXS * 8);
  return { shapes, pos: new Float32Array(shapes[0]), dir: attrs.dir, ph: attrs.ph, n, nodes, lpos, lcol, MAXS, drawCount: 0,
    ox: GOFF[0][0], oy: GOFF[0][1], os: 0.6, op: 0, t0,
    group: { position: { x: 0, y: 0 }, scale: 1, rotation: { x: 0, y: 0, z: 0 } }, camera: { x: 0, y: 0 },
    U: { uOpacity: 0, uTime: 0, uAspect: 1, uMouse: { x: 5, y: 5 } } };
}

export function designRenderGL(G: OracleGL, self: OracleSelf, env: OracleEnv, time: number): void {
  const { innerWidth, innerHeight } = env;
  const vh = innerHeight, focus = vh * 0.5, tops = []; let idx = 0;
  env.tops.forEach((top, i) => { tops.push(top); if (top <= focus) idx = i; });
  let T = idx; if (idx < tops.length - 1) { const x = clamp01(1 - (tops[idx+1] - focus) / (vh * 0.75)); T = idx + x*x*(3-2*x); }
  self.Ts += (T - self.Ts) * 0.06;
  const last = G.shapes.length - 1, a = Math.min(last, Math.floor(self.Ts)), b = Math.min(last, a + 1), m = clamp01(self.Ts - a);
  const A = G.shapes[a], B = G.shapes[b], pos = G.pos, dir = G.dir, ph = G.ph, tt = time * 0.0009;
  const it = clamp01((time - G.t0) / 2600), intro = Math.pow(1 - it, 3), burst = Math.sin(m * Math.PI) * 0.5 + intro * 2.8 + Math.min(0.35, Math.abs(self.vel || 0) * 0.004);
  for (let i = 0, k = 0; i < G.n; i++, k += 3) {
    pos[k] = A[k] + (B[k]-A[k])*m + dir[k]*burst + Math.sin(tt + ph[i]) * 0.025;
    pos[k+1] = A[k+1] + (B[k+1]-A[k+1])*m + dir[k+1]*burst + Math.cos(tt*1.3 + ph[i]) * 0.025;
    pos[k+2] = A[k+2] + (B[k+2]-A[k+2])*m + dir[k+2]*burst;
  }
  { const th = 0.52, th2 = th * th, P = G.pos, Nd = G.nodes, NN = Nd.length, LP = G.lpos, LC = G.lcol; let s = 0;
    for (let i = 0; i < NN && s < G.MAXS; i++) { const ia = Nd[i] * 3, ax = P[ia], ay = P[ia+1], az = P[ia+2];
      for (let j = i + 1; j < NN; j++) { const ib = Nd[j] * 3, dx = P[ib] - ax, dy = P[ib+1] - ay, dz = P[ib+2] - az, d2 = dx*dx + dy*dy + dz*dz;
        if (d2 < th2) { const o = s * 6, c = s * 8, al = (1 - Math.sqrt(d2) / th) * 0.42 * G.op;
          LP[o] = ax; LP[o+1] = ay; LP[o+2] = az; LP[o+3] = P[ib]; LP[o+4] = P[ib+1]; LP[o+5] = P[ib+2];
          LC[c] = LC[c+4] = 0.08; LC[c+1] = LC[c+5] = 0.08; LC[c+2] = LC[c+6] = 0.09; LC[c+3] = LC[c+7] = al;
          if (++s >= G.MAXS) break; } } }
    G.drawCount = s * 2; }
  const mob = self.mobile, e = m*m*(3-2*m), lp = j => GOFF[a][j] + (GOFF[b][j] - GOFF[a][j]) * e;
  const asp = Math.min(1, (innerWidth / innerHeight) / 1.6);
  let tx = mob ? 0 : lp(0) * asp, ty = mob ? 0 : lp(1), ts = lp(2) * (mob ? 0.6 : 1);
  const to = lp(3) * (mob ? 0.35 : 1) * (1 - intro * 0.6);
  const hi = env.hero;
  if (hi && a === 0) {
    const r = hi;
    if (r.width > 0) {
      const halfH = Math.tan(21 * Math.PI / 180) * 8.2, halfW = halfH * innerWidth / innerHeight;
      const hx = ((r.left + r.width * 0.5) / innerWidth * 2 - 1) * halfW, hy = -((r.top + r.height * 0.36) / innerHeight * 2 - 1) * halfH;
      const hs = Math.max(0.45, (r.width / innerHeight) * 2 * halfH / 4.6);
      tx = hx + (tx - hx) * e; ty = hy + (ty - hy) * e; ts = hs + (ts - hs) * e;
    }
  }
  G.ox += (tx - G.ox) * 0.06; G.oy += (ty - G.oy) * 0.06; G.os += (ts - G.os) * 0.06; G.op += (to - G.op) * 0.05;
  G.group.position.x = G.ox; G.group.position.y = G.oy; G.group.scale = G.os; const U = G.U; U.uOpacity = G.op; U.uTime = time * 0.001; U.uAspect = innerWidth / innerHeight; self.mSm = self.mSm || { x: 5, y: 5 }; const mxT = self.coarse ? 5 : self.mouse.x, myT = self.coarse ? 5 : -self.mouse.y; self.mSm.x += (mxT - self.mSm.x) * 0.12; self.mSm.y += (myT - self.mSm.y) * 0.12; U.uMouse.x = self.mSm.x; U.uMouse.y = self.mSm.y;
  const sy = env.scrollY; self.spin += (sy - self.lastSy2) * 0.0006; self.lastSy2 = sy;
  self.rotY = (self.rotY || 0) + ((time * 0.0001 + self.spin) - (self.rotY || 0)) * 0.08; G.group.rotation.y = self.rotY; G.group.rotation.z = Math.sin(time * 0.00025) * 0.05;
  G.group.rotation.x += ((self.mouse.y * 0.15 + 0.12) - G.group.rotation.x) * 0.04;
  G.camera.x += (self.mouse.x * 0.3 - G.camera.x) * 0.04;
  G.camera.y += (-self.mouse.y * 0.22 - G.camera.y) * 0.04;
}

// The design's per-frame velocity update from the rAF loop.
export function designVelocityStep(state: { vel: number; lastSy: number }, sy: number): void {
  state.vel += ((sy - state.lastSy) - state.vel) * 0.12; state.lastSy = sy;
}
