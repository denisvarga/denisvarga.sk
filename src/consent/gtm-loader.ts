import type { TrustedTypePolicy } from '../types/turnstile';
import { GA_MEASUREMENT_ID, GTM_HOSTS, GTM_ID } from './gtm-config';

declare global {
  interface Window {
    dataLayer?: unknown[];
    [key: `ga-disable-${string}`]: boolean | undefined;
  }
}

export const GTM_TT_POLICY = 'gtm-loader';
const GA_COOKIE = /^_ga(?:_.+)?$/;
// GA's documented opt-out flag. gtag checks it before every hit, so a revoke also silences the
// rest of a page view in which GTM already runs.
const GA_DISABLE = `ga-disable-${GA_MEASUREMENT_ID}` as const;
// Idle callbacks can starve while the particle scene renders every frame.
const IDLE_TIMEOUT_MS = 5000;

const DEFAULT_CONSENT = {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
} as const;

type ConsentParams = Readonly<Partial<Record<keyof typeof DEFAULT_CONSENT, 'granted' | 'denied'>>>;

// undefined = not created yet, null = browser without Trusted Types.
let policy: TrustedTypePolicy | null | undefined;
let loaded = false;
let granted = false;

export const gtmSrc = (id: string) => `https://www.googletagmanager.com/gtm.js?id=${id}`;

export function canLoadGtm(): boolean {
  return GTM_HOSTS.has(window.location.hostname);
}

const dataLayer = (): unknown[] => (window.dataLayer ??= []);

function gtag(..._args: [command: 'consent', action: 'default' | 'update', params: ConsentParams]): void {
  // gtm.js recognises a gtag command only by its Arguments object, so the rest array is not pushed.
  dataLayer().push(arguments);
}

function gtmPolicy(src: string): TrustedTypePolicy | null {
  if (policy !== undefined) return policy;
  const factory = window.trustedTypes;
  policy = factory
    ? factory.createPolicy(GTM_TT_POLICY, {
        createScriptURL(input) {
          if (input !== src) throw new TypeError(`${GTM_TT_POLICY}: URL not allowed`);
          return input;
        },
      })
    : null;
  return policy;
}

function injectGtm(): void {
  const src = gtmSrc(GTM_ID);
  const ttPolicy = gtmPolicy(src);
  const script = document.createElement('script');
  script.async = true;
  // script.src is a Trusted Types sink; the DOM accepts the TrustedScriptURL object, while TS's
  // DOM lib only knows the string form.
  script.src = (ttPolicy ? ttPolicy.createScriptURL(src) : src) as unknown as string;
  document.head.append(script);
}

/** Loads GTM with analytics granted, or re-grants it when GTM already runs in this page view. */
export function grantAnalytics(): void {
  if (!canLoadGtm()) return;
  window[GA_DISABLE] = false;
  if (loaded) {
    if (!granted) gtag('consent', 'update', { analytics_storage: 'granted' });
  } else {
    gtag('consent', 'default', DEFAULT_CONSENT);
    gtag('consent', 'update', { analytics_storage: 'granted' });
    dataLayer().push({ 'gtm.start': Date.now(), event: 'gtm.js' });
    injectGtm();
    loaded = true;
  }
  granted = true;
}

/** Waits for the load event and an idle moment, then loads GTM if consent still stands. */
export function grantAnalyticsWhenIdle(stillGranted: () => boolean): void {
  if (!canLoadGtm()) return;
  const run = () => {
    if (stillGranted()) grantAnalytics();
  };
  const whenIdle = () => {
    if (typeof window.requestIdleCallback === 'function') window.requestIdleCallback(run, { timeout: IDLE_TIMEOUT_MS });
    else window.setTimeout(run, 0);
  };
  if (document.readyState === 'complete') whenIdle();
  else window.addEventListener('load', whenIdle, { once: true });
}

/** Host-only, host and registrable-domain variants, so a cookie set on any of them is matched. */
export function gaCookieDomains(hostname: string): ReadonlyArray<string | null> {
  const domain = hostname.split('.').slice(-2).join('.');
  return [...new Set([null, hostname, `.${hostname}`, domain, `.${domain}`])];
}

function clearGaCookies(): void {
  const names = new Set(
    document.cookie
      .split(';')
      .map((pair) => pair.split('=')[0]?.trim() ?? '')
      .filter((name) => GA_COOKIE.test(name)),
  );
  const domains = gaCookieDomains(window.location.hostname);
  for (const name of names) {
    for (const domain of domains) {
      document.cookie = `${name}=; Path=/; Max-Age=0${domain ? `; Domain=${domain}` : ''}`;
    }
  }
}

export function revokeAnalytics(): void {
  if (loaded && granted) gtag('consent', 'update', { analytics_storage: 'denied' });
  window[GA_DISABLE] = true;
  granted = false;
  clearGaCookies();
}
