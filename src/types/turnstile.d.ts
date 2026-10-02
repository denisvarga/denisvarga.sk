// Minimal typing for the parts of Cloudflare Turnstile and Trusted Types this site uses;
// TypeScript's DOM lib ships neither. Import the types so every tsconfig that reaches the chat
// code (app, and node through the prerender entry) also sees the Window augmentation.

export interface TurnstileRenderOptions {
  readonly sitekey: string;
  readonly action?: string;
  readonly execution?: 'render' | 'execute';
  readonly appearance?: 'always' | 'execute' | 'interaction-only';
  readonly theme?: 'auto' | 'light' | 'dark';
  readonly 'response-field'?: boolean;
  readonly callback?: (token: string) => void;
  /** Returning a truthy value tells Turnstile the error was handled (no console warning). */
  readonly 'error-callback'?: (code: string) => boolean;
  readonly 'expired-callback'?: () => void;
  readonly 'timeout-callback'?: () => void;
  readonly 'unsupported-callback'?: () => void;
  readonly 'before-interactive-callback'?: () => void;
}

export interface TurnstileApi {
  render(container: HTMLElement | string, options: TurnstileRenderOptions): string | undefined;
  execute(container: HTMLElement | string): void;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

export interface TrustedScriptURL {
  readonly __brand: 'TrustedScriptURL';
}

export interface TrustedTypePolicy {
  readonly name: string;
  createScriptURL(input: string): TrustedScriptURL;
}

export interface TrustedTypePolicyFactory {
  createPolicy(
    name: string,
    rules: { readonly createScriptURL?: (input: string) => string },
  ): TrustedTypePolicy;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    trustedTypes?: TrustedTypePolicyFactory;
  }

  interface ImportMetaEnv {
    readonly VITE_TURNSTILE_SITE_KEY?: string;
  }
}
