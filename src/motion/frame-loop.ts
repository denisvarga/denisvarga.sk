export type FrameCallback = (time: number) => void;

export const FRAME_PRIORITY = {
  lenis: 0,
  progress: 10,
  velocity: 30,
  parallax: 40,
  gl: 50,
  demo: 60,
  stack: 70,
} as const;

interface Subscriber {
  readonly name: string;
  readonly priority: number;
  readonly callback: FrameCallback;
  active: boolean;
}

let subscribers: Subscriber[] = [];
let rafId: number | null = null;

function remove(subscriber: Subscriber): void {
  subscriber.active = false;
  subscribers = subscribers.filter((s) => s !== subscriber);
  if (subscribers.length === 0 && rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
}

function tick(time: number): void {
  rafId = null;
  for (const subscriber of subscribers) {
    if (!subscriber.active) continue;
    try {
      subscriber.callback(time);
    } catch (error) {
      remove(subscriber);
      console.error('frame_subscriber_failed', subscriber.name, error);
    }
  }
  // No document.hidden handling on purpose: browsers already pause rAF in hidden tabs, and a
  // manual stop is what failed to resume. The loop stops only when nobody is subscribed.
  if (subscribers.length > 0 && rafId === null) rafId = requestAnimationFrame(tick);
}

export function subscribeFrame(name: string, priority: number, callback: FrameCallback): () => void {
  const subscriber: Subscriber = { name, priority, callback, active: true };
  const index = subscribers.findIndex((s) => s.priority > priority);
  const at = index === -1 ? subscribers.length : index;
  subscribers = [...subscribers.slice(0, at), subscriber, ...subscribers.slice(at)];
  if (rafId === null) rafId = requestAnimationFrame(tick);
  return () => {
    if (subscriber.active) remove(subscriber);
  };
}

export function isFrameLoopRunning(): boolean {
  return rafId !== null;
}
