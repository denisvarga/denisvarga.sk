// Oracle for the chat typewriter, ported line by line from the design's `ask()` in
// `design/Denis Varga CV v7.dc.html`: `typed` starts at 0, an 18 ms interval adds 3 and stops
// once it reaches the text length, and the bubble shows `text.slice(0, typed)`.
// Drive it with fake timers next to the real component and compare the visible text.

export const DESIGN_TYPE_TICK_MS = 18;
export const DESIGN_TYPE_STEP = 3;

export interface DesignTypewriter {
  visible(): string;
  stop(): void;
}

export function startDesignTypewriter(text: string): DesignTypewriter {
  let typed = 0;
  const typeTimer = setInterval(() => {
    const n = typed + DESIGN_TYPE_STEP;
    if (n >= text.length) clearInterval(typeTimer);
    typed = n;
  }, DESIGN_TYPE_TICK_MS);
  return {
    visible: () => text.slice(0, typed),
    stop: () => clearInterval(typeTimer),
  };
}
