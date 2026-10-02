// Verbatim from the design (PVS/PFS); point repulsion and depth fade live entirely on the GPU.
export const POINT_VERTEX_SHADER = `attribute vec3 aColor; attribute float aSize; attribute float aPh; uniform float uSize; uniform float uTime; uniform vec2 uMouse; uniform float uAspect; varying vec3 vC; varying float vF; varying float vT;
void main(){ vec4 mv = modelViewMatrix * vec4(position, 1.0); vec4 cp = projectionMatrix * mv; vec2 ndc = cp.xy / cp.w;
vec2 dd = ndc - uMouse; dd.x *= uAspect; float dist = length(dd); float near = smoothstep(0.32, 0.0, dist);
vec2 dir = dist > 0.0001 ? dd / dist : vec2(0.0); dir.x /= uAspect; cp.xy += dir * near * 0.07 * cp.w; gl_Position = cp;
float d = -mv.z; gl_PointSize = uSize * aSize * (8.2 / d) * (1.0 + near * 0.6); vC = aColor;
vF = clamp(1.0 - (d - 6.6) / 5.0, 0.2, 1.0); vT = 0.72 + 0.28 * sin(uTime * 1.4 + aPh); }`;

export const POINT_FRAGMENT_SHADER = `uniform float uOpacity; varying vec3 vC; varying float vF; varying float vT;
void main(){ float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; float a = smoothstep(0.5, 0.3, d); gl_FragColor = vec4(vC, a * vF * vT * uOpacity); }`;
