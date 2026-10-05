import type { TrustedTypePolicy, TurnstileApi } from '../types/turnstile';

export const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
export const TT_POLICY_NAME = 'turnstile-loader';

// undefined = not created yet, null = browser without Trusted Types.
let policy: TrustedTypePolicy | null | undefined;
let scriptPromise: Promise<TurnstileApi> | null = null;

function turnstilePolicy(): TrustedTypePolicy | null {
  if (policy !== undefined) return policy;
  const factory = window.trustedTypes;
  policy = factory
    ? factory.createPolicy(TT_POLICY_NAME, {
        createScriptURL(input) {
          if (input !== TURNSTILE_SRC) throw new TypeError(`${TT_POLICY_NAME}: URL not allowed`);
          return input;
        },
      })
    : null;
  return policy;
}

function insertScript(resolve: (api: TurnstileApi) => void, reject: (error: Error) => void): void {
  const script = document.createElement('script');
  const ttPolicy = turnstilePolicy();
  // script.src is a Trusted Types sink; the DOM accepts the TrustedScriptURL object, while TS's
  // DOM lib only knows the string form.
  script.src = (ttPolicy ? ttPolicy.createScriptURL(TURNSTILE_SRC) : TURNSTILE_SRC) as unknown as string;
  script.addEventListener(
    'load',
    () => {
      if (window.turnstile) resolve(window.turnstile);
      else reject(new Error('Turnstile script loaded without window.turnstile'));
    },
    { once: true },
  );
  script.addEventListener(
    'error',
    () => {
      script.remove();
      reject(new Error('Turnstile script failed to load'));
    },
    { once: true },
  );
  document.head.append(script);
}

/** Loads api.js once; a failed load clears the memo so the next call inserts a fresh script. */
export function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise<TurnstileApi>(insertScript).catch((error: unknown) => {
    scriptPromise = null;
    throw error;
  });
  return scriptPromise;
}
