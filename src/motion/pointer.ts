import { COARSE_POINTER_QUERY, matchesMedia } from './use-media-query';

export interface PointerNdc {
  readonly x: number;
  // Positive downward, like the design's mouse.y.
  readonly y: number;
}

let pointer: PointerNdc = { x: 0, y: 0 };
let coarse = false;
let retainCount = 0;

export function getPointer(): PointerNdc {
  return pointer;
}

// Read once when tracking starts, like the design.
export function isCoarsePointer(): boolean {
  return coarse;
}

function onMouseMove(event: MouseEvent): void {
  pointer = { x: (event.clientX / window.innerWidth) * 2 - 1, y: (event.clientY / window.innerHeight) * 2 - 1 };
}

export function retainPointer(): () => void {
  retainCount += 1;
  if (retainCount === 1) {
    coarse = matchesMedia(COARSE_POINTER_QUERY);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    retainCount -= 1;
    if (retainCount === 0) window.removeEventListener('mousemove', onMouseMove);
  };
}
