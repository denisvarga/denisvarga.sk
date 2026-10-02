import { whenIdle, whenLoaded } from './init-slices';
import type { ParticleScene, SceneMode } from './particle-scene';

const IDLE_FALLBACK_MS = 200;

// three r163+ renders through WebGL 2 only.
function hasWebGL2(): boolean {
  return typeof WebGL2RenderingContext !== 'undefined';
}

// Starts the particle scene after the load event and an idle period, so neither the three chunk
// nor its init competes with first paint. Any failure leaves the container empty. Returns the
// teardown, which also aborts a load that is still in progress.
export function startParticles(container: HTMLElement, mode: SceneMode): () => void {
  const controller = new AbortController();
  const { signal } = controller;
  let scene: ParticleScene | null = null;

  const start = async () => {
    try {
      await whenLoaded(signal);
      await whenIdle(signal, IDLE_FALLBACK_MS);
    } catch {
      return;
    }
    if (!hasWebGL2()) return;
    let module: typeof import('./particle-scene');
    try {
      module = await import('./particle-scene');
    } catch (error) {
      console.error('gl_import_failed', error);
      return;
    }
    if (signal.aborted) return;
    try {
      scene = await module.createParticleScene(container, mode, signal);
    } catch (error) {
      if (!signal.aborted) console.error('gl_init_failed', error);
    }
  };
  void start();

  return () => {
    controller.abort();
    scene?.dispose();
    scene = null;
  };
}
