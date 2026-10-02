export const LINE_THRESHOLD = 0.52;
export const MAX_SEGMENTS = 2600;

export function lineNodeCount(viewportWidth: number): number {
  return viewportWidth < 900 ? 240 : 420;
}

export function makeLineNodes(n: number, nodeCount: number): Uint32Array {
  const stride = Math.floor(n / nodeCount), nodes = new Uint32Array(nodeCount);
  for (let i = 0; i < nodeCount; i++) nodes[i] = i * stride;
  return nodes;
}

export interface LineBuffers {
  readonly positions: Float32Array;
  readonly colors: Float32Array;
}

export function createLineBuffers(max = MAX_SEGMENTS): LineBuffers {
  return { positions: new Float32Array(max * 6), colors: new Float32Array(max * 8) };
}

// The design's pair loop, unchanged: same pair order, squared-distance test and early exit at
// the cap. Returns the number of segments written.
export function writeNetworkLines(
  P: Float32Array,
  nodes: Uint32Array,
  buffers: LineBuffers,
  opacity: number,
  max = MAX_SEGMENTS,
): number {
  const th = LINE_THRESHOLD, th2 = th * th, NN = nodes.length, LP = buffers.positions, LC = buffers.colors;
  let s = 0;
  for (let i = 0; i < NN && s < max; i++) {
    const ia = nodes[i]! * 3, ax = P[ia]!, ay = P[ia + 1]!, az = P[ia + 2]!;
    for (let j = i + 1; j < NN; j++) {
      const ib = nodes[j]! * 3, dx = P[ib]! - ax, dy = P[ib + 1]! - ay, dz = P[ib + 2]! - az;
      const d2 = dx * dx + dy * dy + dz * dz;
      if (d2 < th2) {
        const o = s * 6, c = s * 8, al = (1 - Math.sqrt(d2) / th) * 0.42 * opacity;
        LP[o] = ax;
        LP[o + 1] = ay;
        LP[o + 2] = az;
        LP[o + 3] = P[ib]!;
        LP[o + 4] = P[ib + 1]!;
        LP[o + 5] = P[ib + 2]!;
        LC[c] = LC[c + 4] = 0.08;
        LC[c + 1] = LC[c + 5] = 0.08;
        LC[c + 2] = LC[c + 6] = 0.09;
        LC[c + 3] = LC[c + 7] = al;
        if (++s >= max) break;
      }
    }
  }
  return s;
}
