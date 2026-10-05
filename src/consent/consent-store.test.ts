import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loader = vi.hoisted(() => ({
  grantAnalytics: vi.fn(),
  grantAnalyticsWhenIdle: vi.fn(),
  revokeAnalytics: vi.fn(),
}));
vi.mock('./gtm-loader', () => loader);

type Store = typeof import('./consent-store');

// The store keeps its state for the page's lifetime, so every test starts from a fresh module.
async function freshStore(): Promise<Store> {
  vi.resetModules();
  return import('./consent-store');
}

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
});

describe('consent storage', () => {
  it('has no choice when nothing is stored', async () => {
    const { readConsent } = await freshStore();
    expect(readConsent()).toBeNull();
  });

  it('writes the versioned choice under dv-consent and reads it back', async () => {
    const { CONSENT_KEY, readConsent, writeConsent } = await freshStore();
    expect(CONSENT_KEY).toBe('dv-consent');
    expect(writeConsent(true, 1_700_000_000_000)).toEqual({ v: 1, analytics: true, ts: 1_700_000_000_000 });
    expect(JSON.parse(localStorage.getItem('dv-consent')!)).toEqual({ v: 1, analytics: true, ts: 1_700_000_000_000 });
    expect(readConsent()).toEqual({ v: 1, analytics: true, ts: 1_700_000_000_000 });
    writeConsent(false, 5);
    expect(readConsent()).toEqual({ v: 1, analytics: false, ts: 5 });
  });

  it.each([
    ['not JSON', '{nope'],
    ['null', 'null'],
    ['an array', '[1]'],
    ['another version', '{"v":2,"analytics":true,"ts":1}'],
    ['no version', '{"analytics":true,"ts":1}'],
    ['a non-boolean choice', '{"v":1,"analytics":"yes","ts":1}'],
    ['a missing timestamp', '{"v":1,"analytics":true}'],
    ['a non-numeric timestamp', '{"v":1,"analytics":true,"ts":"1"}'],
  ])('treats %s as no choice', async (_label, raw) => {
    const { readConsent } = await freshStore();
    localStorage.setItem('dv-consent', raw);
    expect(readConsent()).toBeNull();
  });

  it('drops unknown fields from a valid stored choice', async () => {
    const { readConsent } = await freshStore();
    localStorage.setItem('dv-consent', '{"v":1,"analytics":false,"ts":3,"extra":true}');
    expect(readConsent()).toEqual({ v: 1, analytics: false, ts: 3 });
  });

  it('survives storage that throws on read and write', async () => {
    const { readConsent, writeConsent } = await freshStore();
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('full', 'QuotaExceededError');
    });
    expect(readConsent()).toBeNull();
    expect(writeConsent(true, 9)).toEqual({ v: 1, analytics: true, ts: 9 });
  });
});

describe('consent state', () => {
  it('prompts without a stored choice and stays hidden with one', async () => {
    expect((await freshStore()).getConsentState()).toEqual({ choice: null, view: 'prompt' });
    localStorage.setItem('dv-consent', '{"v":1,"analytics":false,"ts":1}');
    expect((await freshStore()).getConsentState()).toEqual({ choice: { v: 1, analytics: false, ts: 1 }, view: 'hidden' });
  });

  it('starts hidden on the server snapshot, whatever is stored', async () => {
    const { getServerConsentState } = await freshStore();
    expect(getServerConsentState()).toEqual({ choice: null, view: 'hidden' });
  });

  it('returns the same snapshot until something changes', async () => {
    const { getConsentState, openConsentSettings } = await freshStore();
    const first = getConsentState();
    expect(getConsentState()).toBe(first);
    openConsentSettings();
    expect(getConsentState()).not.toBe(first);
  });

  it('accepting stores the choice, hides the bar, notifies and grants analytics', async () => {
    const { chooseAnalytics, getConsentState, readConsent, subscribeConsent } = await freshStore();
    const listener = vi.fn();
    const unsubscribe = subscribeConsent(listener);
    chooseAnalytics(true);
    expect(readConsent()?.analytics).toBe(true);
    expect(getConsentState()).toMatchObject({ view: 'hidden', choice: { analytics: true } });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(loader.grantAnalytics).toHaveBeenCalledTimes(1);
    expect(loader.revokeAnalytics).not.toHaveBeenCalled();
    unsubscribe();
    chooseAnalytics(true);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('rejecting stores the choice and revokes analytics', async () => {
    const { chooseAnalytics, readConsent } = await freshStore();
    chooseAnalytics(true);
    chooseAnalytics(false);
    expect(readConsent()?.analytics).toBe(false);
    expect(loader.revokeAnalytics).toHaveBeenCalledTimes(1);
  });

  it('reopens as settings and keeps the current choice', async () => {
    localStorage.setItem('dv-consent', '{"v":1,"analytics":true,"ts":1}');
    const { getConsentState, openConsentSettings } = await freshStore();
    openConsentSettings();
    expect(getConsentState()).toEqual({ choice: { v: 1, analytics: true, ts: 1 }, view: 'settings' });
  });
});

describe('bootConsent', () => {
  it('schedules GTM only for a stored grant, and the schedule follows a later revoke', async () => {
    localStorage.setItem('dv-consent', '{"v":1,"analytics":true,"ts":1}');
    const { bootConsent, chooseAnalytics } = await freshStore();
    bootConsent();
    expect(loader.grantAnalyticsWhenIdle).toHaveBeenCalledTimes(1);
    const stillGranted = loader.grantAnalyticsWhenIdle.mock.calls[0]?.[0] as () => boolean;
    expect(stillGranted()).toBe(true);
    chooseAnalytics(false);
    expect(stillGranted()).toBe(false);
  });

  it.each([
    ['no stored choice', null],
    ['a stored refusal', '{"v":1,"analytics":false,"ts":1}'],
  ])('does nothing with %s', async (_label, raw) => {
    if (raw) localStorage.setItem('dv-consent', raw);
    const { bootConsent } = await freshStore();
    bootConsent();
    expect(loader.grantAnalyticsWhenIdle).not.toHaveBeenCalled();
    expect(loader.grantAnalytics).not.toHaveBeenCalled();
  });
});
