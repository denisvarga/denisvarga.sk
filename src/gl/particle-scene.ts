import {
  BufferAttribute,
  BufferGeometry,
  DynamicDrawUsage,
  Group,
  LineBasicMaterial,
  LineSegments,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';
import { FRAME_PRIORITY, subscribeFrame } from '../motion/frame-loop';
import { getLayout } from '../motion/layout-cache';
import { getPointer, isCoarsePointer, retainPointer } from '../motion/pointer';
import { getScrollVelocity, retainScrollVelocity } from '../motion/scroll-velocity';
import { runIdleSlices, type InitSlice } from './init-slices';
import { isMobileWidth, makePointAttributes, pointCount, SHAPE_BUILDERS } from './make-shapes';
import { createFrameState, groupTargets, stepFrame, writeMorphPositions, type FrameInput } from './morph';
import { createLineBuffers, lineNodeCount, makeLineNodes, writeNetworkLines, type LineBuffers } from './network-lines';
import { POINT_FRAGMENT_SHADER, POINT_VERTEX_SHADER } from './shaders';

export type SceneMode = 'animated' | 'static';

export interface ParticleScene {
  dispose(): void;
}

interface Stage { renderer: WebGLRenderer; scene: Scene; camera: PerspectiveCamera; group: Group }
interface Cloud {
  uniforms: { uSize: { value: number }; uOpacity: { value: number }; uTime: { value: number }; uMouse: { value: Vector2 }; uAspect: { value: number } };
  pos: Float32Array; dir: Float32Array; ph: Float32Array; attr: BufferAttribute;
}
interface Net { nodes: Uint32Array; buffers: LineBuffers; geo: BufferGeometry; posAttr: BufferAttribute; colAttr: BufferAttribute }

function createStage(container: HTMLElement): Stage {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);
  const camera = new PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 8.2;
  const scene = new Scene(), group = new Group();
  scene.add(group);
  return { renderer, scene, camera, group };
}

function createCloud({ renderer, group }: Stage, shape0: Float32Array, n: number, owned: { dispose(): void }[]): Cloud {
  const attrs = makePointAttributes(n), pos = new Float32Array(shape0), geo = new BufferGeometry(), attr = new BufferAttribute(pos, 3);
  geo.setAttribute('position', attr);
  geo.setAttribute('aColor', new BufferAttribute(attrs.col, 3));
  geo.setAttribute('aSize', new BufferAttribute(attrs.size, 1));
  geo.setAttribute('aPh', new BufferAttribute(attrs.ph, 1));
  const uniforms = {
    uSize: { value: 2.4 * renderer.getPixelRatio() },
    uOpacity: { value: 0 },
    uTime: { value: 0 },
    uMouse: { value: new Vector2(5, 5) },
    uAspect: { value: window.innerWidth / window.innerHeight },
  };
  const material = new ShaderMaterial({ uniforms, vertexShader: POINT_VERTEX_SHADER, fragmentShader: POINT_FRAGMENT_SHADER, transparent: true, depthWrite: false });
  owned.push(geo, material);
  group.add(new Points(geo, material));
  return { uniforms, pos, dir: attrs.dir, ph: attrs.ph, attr };
}

function createNet({ group }: Stage, n: number, nodeCount: number, owned: { dispose(): void }[]): Net {
  const buffers = createLineBuffers(), geo = new BufferGeometry();
  const posAttr = new BufferAttribute(buffers.positions, 3).setUsage(DynamicDrawUsage);
  const colAttr = new BufferAttribute(buffers.colors, 4).setUsage(DynamicDrawUsage);
  geo.setAttribute('position', posAttr);
  geo.setAttribute('color', colAttr);
  geo.setDrawRange(0, 0);
  const material = new LineBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false });
  const lines = new LineSegments(geo, material);
  lines.frustumCulled = false;
  group.add(lines);
  owned.push(geo, material);
  return { nodes: makeLineNodes(n, nodeCount), buffers, geo, posAttr, colAttr };
}

function updateLines(net: Net, pos: Float32Array, opacity: number): void {
  const count = writeNetworkLines(pos, net.nodes, net.buffers, opacity);
  net.geo.setDrawRange(0, count * 2);
  if (count === 0) return;
  // Upload only the written segments instead of the whole 2600-segment buffers.
  net.posAttr.clearUpdateRanges();
  net.posAttr.addUpdateRange(0, count * 6);
  net.posAttr.needsUpdate = true;
  net.colAttr.clearUpdateRanges();
  net.colAttr.addUpdateRange(0, count * 8);
  net.colAttr.needsUpdate = true;
}

// Builds the design's scene in idle-time slices (renderer, one slice per shape, point
// attributes, line buffers, shader compile, first render), then runs it on the frame loop, or
// keeps one still frame in static (reduced-motion) mode.
export async function createParticleScene(container: HTMLElement, mode: SceneMode, signal: AbortSignal): Promise<ParticleScene> {
  const width = window.innerWidth, n = pointCount(width), nodeCount = lineNodeCount(width);
  const built: { stage?: Stage; cloud?: Cloud; net?: Net; shapes: Float32Array[] } = { shapes: [] };
  const owned: { dispose(): void }[] = [];
  const cleanups: (() => void)[] = [];
  let mobile = isMobileWidth(width);
  let disposed = false;

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    for (const cleanup of cleanups.splice(0)) cleanup();
    for (const item of owned) item.dispose();
    built.stage?.renderer.dispose();
    built.stage?.renderer.forceContextLoss();
    built.stage?.renderer.domElement.remove();
  };
  const stageOf = () => {
    if (!built.stage) throw new Error('gl_slice_order');
    return built.stage;
  };
  const slices: InitSlice[] = [
    { name: 'renderer', run: () => void (built.stage = createStage(container)) },
    ...SHAPE_BUILDERS.map((build, i) => ({ name: `shape-${i}`, run: () => void built.shapes.push(build(n, Math.random)) })),
    { name: 'points', run: () => void (built.cloud = createCloud(stageOf(), built.shapes[0]!, n, owned)) },
    { name: 'lines', run: () => void (built.net = createNet(stageOf(), n, nodeCount, owned)) },
    { name: 'compile', run: () => stageOf().renderer.compileAsync(stageOf().scene, stageOf().camera).then(() => {}) },
  ];
  try {
    await runIdleSlices(slices, signal);
  } catch (error) {
    dispose();
    throw error;
  }
  const { stage, cloud, net, shapes } = built;
  if (!stage || !cloud || !net) {
    dispose();
    throw new Error('gl_slice_order');
  }
  const { renderer, scene, camera, group } = stage;
  const { uniforms } = cloud;

  // Reduced motion: shape 0 at its hero anchor for the top of the page; no time, mouse or burst.
  const renderStatic = () => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const t = groupTargets(0, 0, 0, 0, { viewportWidth: vw, viewportHeight: vh, hero: getLayout().heroImage, mobile });
    cloud.pos.set(shapes[0]!);
    cloud.attr.needsUpdate = true;
    updateLines(net, cloud.pos, t.opacity);
    group.position.set(t.x, t.y, 0);
    group.scale.setScalar(t.scale);
    group.rotation.set(0.12, 0, 0);
    uniforms.uOpacity.value = t.opacity;
    uniforms.uAspect.value = vw / vh;
    renderer.render(scene, camera);
  };

  const state = createFrameState(performance.now());
  const tops: number[] = [];
  const heroRect = { left: 0, top: 0, width: 0, height: 0 };
  const input: FrameInput = {
    time: 0, tops, viewportWidth: 0, viewportHeight: 0, hero: null, velocity: 0,
    scrollY: 0, mouseX: 0, mouseY: 0, coarse: false, mobile,
  };
  const frame = (time: number) => {
    const layout = getLayout(), scrollY = window.scrollY, pointer = getPointer(), hero = layout.heroImage;
    tops.length = layout.sectionTops.length;
    for (let i = 0; i < tops.length; i++) tops[i] = layout.sectionTops[i]! - scrollY;
    if (hero) Object.assign(heroRect, { left: hero.left - window.scrollX, top: hero.top - scrollY, width: hero.width, height: hero.height });
    Object.assign(input, {
      time, viewportWidth: window.innerWidth, viewportHeight: window.innerHeight, hero: hero ? heroRect : null,
      velocity: getScrollVelocity(), scrollY, mouseX: pointer.x, mouseY: pointer.y, coarse: isCoarsePointer(), mobile,
    });
    const r = stepFrame(state, input);
    if (state.op < 0.001 && r.targetOpacity < 0.001) return;
    writeMorphPositions(shapes[r.a]!, shapes[r.b]!, cloud.dir, cloud.ph, cloud.pos, r.m, r.burst, r.tt);
    cloud.attr.needsUpdate = true;
    updateLines(net, cloud.pos, r.lineOpacity);
    group.position.set(state.ox, state.oy, 0);
    group.scale.setScalar(state.os);
    group.rotation.set(state.rotX, state.rotY, r.rotZ);
    uniforms.uOpacity.value = state.op;
    uniforms.uTime.value = time * 0.001;
    uniforms.uAspect.value = input.viewportWidth / input.viewportHeight;
    uniforms.uMouse.value.set(state.mouseX, state.mouseY);
    camera.position.set(state.camX, state.camY, 8.2);
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  };

  let stopLoop: (() => void) | null = null;
  const resume = () => {
    if (mode === 'static') renderStatic();
    else stopLoop ??= subscribeFrame('particles', FRAME_PRIORITY.gl, frame);
  };
  const pause = () => {
    stopLoop?.();
    stopLoop = null;
  };
  const onResize = () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    mobile = isMobileWidth(window.innerWidth);
    if (mode === 'static') renderStatic();
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    pause();
  };
  // three rebuilds its GPU state on restore and re-uploads from the CPU-side buffers it keeps.
  const onContextRestored = () => {
    renderer.compileAsync(scene, camera).then(
      () => !disposed && resume(),
      (error: unknown) => console.error('gl_restore_failed', error),
    );
  };
  const canvas = renderer.domElement;
  window.addEventListener('resize', onResize, { passive: true });
  canvas.addEventListener('webglcontextlost', onContextLost);
  canvas.addEventListener('webglcontextrestored', onContextRestored);
  cleanups.push(pause, () => {
    window.removeEventListener('resize', onResize);
    canvas.removeEventListener('webglcontextlost', onContextLost);
    canvas.removeEventListener('webglcontextrestored', onContextRestored);
  });
  if (mode === 'animated') cleanups.push(retainScrollVelocity(), retainPointer());

  try {
    // First render uploads the buffers; in static mode it is the only frame.
    await runIdleSlices([{ name: 'first-render', run: () => (mode === 'static' ? renderStatic() : renderer.render(scene, camera)) }], signal);
  } catch (error) {
    dispose();
    throw error;
  }
  if (mode === 'animated') {
    // The intro burst is timed from the moment the scene starts moving, like the design's initGL.
    state.t0 = performance.now();
    resume();
  }
  return { dispose };
}
