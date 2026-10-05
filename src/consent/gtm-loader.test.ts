import { afterEach, describe, expect, it, vi } from 'vitest';
import headers from '../../public/_headers?raw';
import type { TrustedScriptURL } from '../types/turnstile';

const TEST_ID = 'GTM-TEST123';
const TEST_SRC = `https://www.googletagmanager.com/gtm.js?id=${TEST_ID}`;

type Loader = typeof import('./gtm-loader');

async function loader({ hostname, id = TEST_ID }: { hostname: string; id?: string }): Promise<Loader> {
  vi.resetModules();
  vi.doMock('./gtm-config', async (importOriginal) => ({
    ...(await importOriginal<typeof import('./gtm-config')>()),
    GTM_ID: id,
  }));
  vi.stubGlobal('location', { hostname });
  return import('./gtm-loader');
}

const isArguments = (value: unknown) => Object.prototype.toString.call(value) === '[object Arguments]';
const commands = () => (window.dataLayer ?? []).filter(isArguments).map((entry) => Array.from(entry as ArrayLike<unknown>));
const scripts = () => [...document.head.querySelectorAll('script')];
const deletions = (name: string, host: string) =>
  ['', `; Domain=${host}`, `; Domain=.${host}`].map((domain) => `${name}=; Path=/; Max-Age=0${domain}`);

function clearCookies(): void {
  for (const pair of document.cookie.split(';')) {
    const name = pair.split('=')[0]?.trim();
    if (name) document.cookie = `${name}=; Path=/; Max-Age=0`;
  }
}

afterEach(() => {
  delete window.dataLayer;
  delete window['ga-disable-G-XMK9J72476'];
  delete window.trustedTypes;
  document.head.replaceChildren();
  clearCookies();
  vi.doUnmock('./gtm-config');
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

describe('gating', () => {
  it.each(['localhost', '127.0.0.1', 'denisvarga-sk.denis.workers.dev', 'www.denisvarga.sk', 'denisvarga.sk.evil.example'])(
    'never loads on %s',
    async (hostname) => {
      const { canLoadGtm, grantAnalytics } = await loader({ hostname });
      expect(canLoadGtm()).toBe(false);
      grantAnalytics();
      expect(window.dataLayer).toBeUndefined();
      expect(scripts()).toHaveLength(0);
    },
  );

  it.each(['denisvarga.sk', 'denisvarga.dev'])('loads on %s with a real ID', async (hostname) => {
    const { canLoadGtm } = await loader({ hostname });
    expect(canLoadGtm()).toBe(true);
  });
});

describe('grantAnalytics', () => {
  it('sets denied defaults, grants analytics, starts GTM and injects one async script, in that order', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(42);
    const { grantAnalytics } = await loader({ hostname: 'denisvarga.sk' });
    grantAnalytics();
    expect(window.dataLayer).toHaveLength(3);
    expect(commands()).toEqual([
      [
        'consent',
        'default',
        {
          ad_storage: 'denied',
          ad_user_data: 'denied',
          ad_personalization: 'denied',
          analytics_storage: 'denied',
          functionality_storage: 'denied',
          personalization_storage: 'denied',
          security_storage: 'granted',
        },
      ],
      ['consent', 'update', { analytics_storage: 'granted' }],
    ]);
    expect(window.dataLayer?.[2]).toEqual({ 'gtm.start': 42, event: 'gtm.js' });
    expect(scripts().map((s) => [s.src, s.async])).toEqual([[TEST_SRC, true]]);
  });

  it('loads once; revoke then grant in the same page view only updates consent', async () => {
    const { grantAnalytics, revokeAnalytics } = await loader({ hostname: 'denisvarga.dev' });
    grantAnalytics();
    grantAnalytics();
    revokeAnalytics();
    grantAnalytics();
    expect(scripts()).toHaveLength(1);
    expect(commands().slice(2)).toEqual([
      ['consent', 'update', { analytics_storage: 'denied' }],
      ['consent', 'update', { analytics_storage: 'granted' }],
    ]);
  });

  it('creates the gtm-loader Trusted Types policy once and only allows the exact GTM URL', async () => {
    const createPolicy = vi.fn((name: string, rules: { createScriptURL?: (input: string) => string }) => ({
      name,
      createScriptURL: (input: string) => rules.createScriptURL?.(input) as unknown as TrustedScriptURL,
    }));
    window.trustedTypes = { createPolicy };
    const { grantAnalytics, revokeAnalytics } = await loader({ hostname: 'denisvarga.sk' });
    grantAnalytics();
    revokeAnalytics();
    grantAnalytics();
    expect(scripts()[0]?.src).toBe(TEST_SRC);
    expect(createPolicy).toHaveBeenCalledTimes(1);
    expect(createPolicy.mock.calls[0]?.[0]).toBe('gtm-loader');
    const rules = createPolicy.mock.calls[0]?.[1];
    expect(rules?.createScriptURL?.(TEST_SRC)).toBe(TEST_SRC);
    expect(() => rules?.createScriptURL?.(`${TEST_SRC}&l=x`)).toThrow(TypeError);
    expect(() => rules?.createScriptURL?.('https://www.googletagmanager.com/gtag/js?id=G-1')).toThrow(TypeError);
  });
});

describe('grantAnalyticsWhenIdle', () => {
  it('waits for the load event, then an idle callback, and rechecks consent', async () => {
    const readyState = vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    const idle = vi.fn<(callback: IdleRequestCallback, options?: IdleRequestOptions) => number>(() => 1);
    vi.stubGlobal('requestIdleCallback', idle);
    const { grantAnalyticsWhenIdle } = await loader({ hostname: 'denisvarga.sk' });
    let granted = true;
    grantAnalyticsWhenIdle(() => granted);
    expect(idle).not.toHaveBeenCalled();
    readyState.mockReturnValue('complete');
    window.dispatchEvent(new Event('load'));
    expect(idle).toHaveBeenCalledWith(expect.any(Function), { timeout: 5000 });
    expect(scripts()).toHaveLength(0);
    granted = false;
    idle.mock.calls[0]?.[0]({ didTimeout: false, timeRemaining: () => 10 });
    expect(scripts()).toHaveLength(0);
    granted = true;
    idle.mock.calls[0]?.[0]({ didTimeout: false, timeRemaining: () => 10 });
    expect(scripts()).toHaveLength(1);
  });

  it('falls back to a timeout without requestIdleCallback', async () => {
    vi.useFakeTimers();
    const { grantAnalyticsWhenIdle } = await loader({ hostname: 'denisvarga.sk' });
    expect(window.requestIdleCallback).toBeUndefined();
    grantAnalyticsWhenIdle(() => true);
    expect(scripts()).toHaveLength(0);
    vi.runAllTimers();
    expect(scripts()).toHaveLength(1);
  });

  it('schedules nothing off the production hosts', async () => {
    const addListener = vi.spyOn(window, 'addEventListener');
    vi.spyOn(document, 'readyState', 'get').mockReturnValue('loading');
    const { grantAnalyticsWhenIdle } = await loader({ hostname: 'localhost' });
    grantAnalyticsWhenIdle(() => true);
    expect(addListener).not.toHaveBeenCalledWith('load', expect.anything(), expect.anything());
  });
});

describe('revokeAnalytics', () => {
  it('denies analytics and deletes _ga and _ga_* on every domain variant', async () => {
    document.cookie = '_ga=GA1.1.123.456; Path=/';
    document.cookie = '_ga_ABC123=GS1.1.789; Path=/';
    document.cookie = 'keep=1; Path=/';
    const { grantAnalytics, revokeAnalytics } = await loader({ hostname: 'denisvarga.sk' });
    grantAnalytics();
    const writes = vi.spyOn(document, 'cookie', 'set');
    revokeAnalytics();
    expect(commands().at(-1)).toEqual(['consent', 'update', { analytics_storage: 'denied' }]);
    expect(window['ga-disable-G-XMK9J72476']).toBe(true);
    grantAnalytics();
    expect(window['ga-disable-G-XMK9J72476']).toBe(false);
    revokeAnalytics();
    expect(writes.mock.calls.map(([value]) => value)).toEqual([
      ...deletions('_ga', 'denisvarga.sk'),
      ...deletions('_ga_ABC123', 'denisvarga.sk'),
    ]);
    expect(document.cookie).toBe('keep=1');
  });

  it('only deletes cookies when GTM never loaded in this page view', async () => {
    document.cookie = '_ga=GA1.1.1.1; Path=/';
    const { revokeAnalytics } = await loader({ hostname: 'denisvarga.dev' });
    revokeAnalytics();
    expect(window.dataLayer).toBeUndefined();
    expect(document.cookie).toBe('');
  });

  it('covers the host, its registrable domain and their dotted forms', async () => {
    const { gaCookieDomains } = await loader({ hostname: 'denisvarga.sk' });
    expect(gaCookieDomains('www.denisvarga.sk')).toEqual([
      null,
      'www.denisvarga.sk',
      '.www.denisvarga.sk',
      'denisvarga.sk',
      '.denisvarga.sk',
    ]);
    expect(gaCookieDomains('denisvarga.dev')).toEqual([null, 'denisvarga.dev', '.denisvarga.dev']);
  });
});

describe('site CSP', () => {
  // gtm.js and the gtag.js it loads each create a goog#html policy; without it gtag.js is blocked.
  it('allows the GTM script, the gtm-loader policy and the Google tag policy', async () => {
    const { GTM_TT_POLICY } = await loader({ hostname: 'denisvarga.sk' });
    const csp = /^\/\*\n\s+Content-Security-Policy: (.+)$/m.exec(headers)?.[1] ?? '';
    const directives = new Map(
      csp.split(';').map((part) => {
        const [name = '', ...values] = part.trim().split(/\s+/);
        return [name, values];
      }),
    );
    expect(directives.get('script-src')).toContain('https://*.googletagmanager.com');
    expect(directives.get('trusted-types')).toEqual(['turnstile-loader', GTM_TT_POLICY, 'goog#html', "'allow-duplicates'"]);
  });
});
