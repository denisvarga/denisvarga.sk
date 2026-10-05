import { grantAnalytics, grantAnalyticsWhenIdle, revokeAnalytics } from './gtm-loader';

export const CONSENT_KEY = 'dv-consent';
const CONSENT_VERSION = 1;

export interface ConsentChoice {
  readonly v: typeof CONSENT_VERSION;
  readonly analytics: boolean;
  readonly ts: number;
}

/** prompt: no stored choice yet; settings: reopened from the footer; hidden: nothing to show. */
export type ConsentView = 'hidden' | 'prompt' | 'settings';

export interface ConsentState {
  readonly choice: ConsentChoice | null;
  readonly view: ConsentView;
}

function isChoice(value: unknown): value is ConsentChoice {
  if (typeof value !== 'object' || value === null) return false;
  const { v, analytics, ts } = value as Record<string, unknown>;
  return v === CONSENT_VERSION && typeof analytics === 'boolean' && typeof ts === 'number' && Number.isFinite(ts);
}

export function readConsent(): ConsentChoice | null {
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    if (raw === null) return null;
    const value: unknown = JSON.parse(raw);
    return isChoice(value) ? { v: value.v, analytics: value.analytics, ts: value.ts } : null;
  } catch {
    return null;
  }
}

export function writeConsent(analytics: boolean, ts = Date.now()): ConsentChoice {
  const choice: ConsentChoice = { v: CONSENT_VERSION, analytics, ts };
  try {
    window.localStorage.setItem(CONSENT_KEY, JSON.stringify(choice));
  } catch {
    // Blocked or full storage: the choice still applies to this page view.
  }
  return choice;
}

// Prerendered markup has no bar, so hydration starts hidden and the client snapshot follows.
const SERVER_STATE: ConsentState = { choice: null, view: 'hidden' };
let state: ConsentState | null = null;
const listeners = new Set<() => void>();

export function getConsentState(): ConsentState {
  if (!state) {
    const choice = readConsent();
    state = { choice, view: choice ? 'hidden' : 'prompt' };
  }
  return state;
}

export function getServerConsentState(): ConsentState {
  return SERVER_STATE;
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function setState(next: ConsentState): void {
  state = next;
  for (const listener of listeners) listener();
}

export function chooseAnalytics(analytics: boolean): void {
  setState({ choice: writeConsent(analytics), view: 'hidden' });
  if (analytics) grantAnalytics();
  else revokeAnalytics();
}

export function openConsentSettings(): void {
  setState({ ...getConsentState(), view: 'settings' });
}

/** A stored grant loads GTM once the page is idle, unless the visitor revokes it first. */
export function bootConsent(): void {
  if (getConsentState().choice?.analytics) grantAnalyticsWhenIdle(() => getConsentState().choice?.analytics === true);
}
