import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const sceneMock = vi.hoisted(() => ({
  create: vi.fn(),
  dispose: vi.fn(),
}));

const sceneModule = vi.hoisted(() => () => ({ createParticleScene: sceneMock.create }));

vi.mock('./particle-scene', sceneModule);

const flush = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

beforeEach(() => {
  vi.resetModules();
  sceneMock.create.mockReset().mockResolvedValue({ dispose: sceneMock.dispose });
  sceneMock.dispose.mockReset();
  vi.stubGlobal('requestIdleCallback', (cb: IdleRequestCallback) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 0));
  vi.stubGlobal('cancelIdleCallback', (id: number) => clearTimeout(id));
  vi.stubGlobal('WebGL2RenderingContext', function WebGL2RenderingContext() {});
});

afterEach(() => {
  vi.doMock('./particle-scene', sceneModule);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('startParticles', () => {
  it('creates the scene after idle and disposes it on teardown', async () => {
    const { startParticles } = await import('./load-particles');
    const container = document.createElement('div');
    const stop = startParticles(container, 'animated');
    expect(sceneMock.create).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(sceneMock.create).toHaveBeenCalledWith(container, 'animated', expect.any(AbortSignal)));
    await flush();
    stop();
    expect(sceneMock.dispose).toHaveBeenCalledOnce();
  });

  it('never loads the scene when torn down before idle', async () => {
    const { startParticles } = await import('./load-particles');
    startParticles(document.createElement('div'), 'static')();
    await flush();
    await flush();
    expect(sceneMock.create).not.toHaveBeenCalled();
  });

  it('stays empty without WebGL 2', async () => {
    vi.stubGlobal('WebGL2RenderingContext', undefined);
    const { startParticles } = await import('./load-particles');
    startParticles(document.createElement('div'), 'animated');
    await flush();
    await flush();
    expect(sceneMock.create).not.toHaveBeenCalled();
  });

  it('logs one error code when the chunk import fails', async () => {
    vi.doMock('./particle-scene', () => {
      throw new Error('chunk failed');
    });
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { startParticles } = await import('./load-particles');
    const container = document.createElement('div');
    startParticles(container, 'animated');
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith('gl_import_failed', expect.anything()));
    expect(container.childElementCount).toBe(0);
  });

  it('logs gl_init_failed when the scene cannot be created', async () => {
    sceneMock.create.mockRejectedValue(new Error('no context'));
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { startParticles } = await import('./load-particles');
    startParticles(document.createElement('div'), 'animated');
    await vi.waitFor(() => expect(error).toHaveBeenCalledWith('gl_init_failed', expect.any(Error)));
  });
});
