import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { accessHeaders, accessToken, AUD, rsaKey, stubJwks, type TestKey } from '../test-support/access-token';
import { makeEnv, send } from '../test-support/ask-harness';
import type { FakeD1 } from '../test-support/fake-d1';

let key: TestKey;
beforeAll(async () => {
  key = await rsaKey('kid-1');
});
beforeEach(() => {
  stubJwks([key.publicJwk]);
  vi.spyOn(console, 'error').mockImplementation(() => undefined);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function setup(): { env: ReturnType<typeof makeEnv>['env']; db: FakeD1 } {
  return makeEnv({ ACCESS_AUD: AUD });
}

async function get(env: ReturnType<typeof setup>['env'], path = '/prehlad') {
  return send({ env, path, method: 'GET', headers: accessHeaders(await accessToken(key)) });
}

const CSP = /^default-src 'none'; style-src 'nonce-([A-Za-z0-9+/=]{24})'; img-src 'self' data:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'$/;

function expectOverviewHeaders(res: Response): string {
  const csp = res.headers.get('Content-Security-Policy') ?? '';
  expect(csp).toMatch(CSP);
  expect(res.headers.get('X-Robots-Tag')).toBe('noindex, nofollow');
  expect(res.headers.get('Cache-Control')).toBe('no-store');
  expect(res.headers.get('Referrer-Policy')).toBe('no-referrer');
  expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  expect(res.headers.get('Strict-Transport-Security')).toBeNull();
  return CSP.exec(csp)?.[1] ?? '';
}

describe('GET /prehlad', () => {
  it('renders escaped visitor text: a script question shows as text', async () => {
    const { env, db } = setup();
    db.seed({ created_at: Date.now(), question: '<script>alert(1)</script>', answer: '<img src=x onerror=alert(2)> & "q"', outcome: 'ok' });
    const res = await get(env);
    const body = await res.text();
    expect(res.status).toBe(200);
    expect(body).not.toMatch(/<script|<img/i);
    expect(body).toContain('<td class="text">&lt;script&gt;alert(1)&lt;/script&gt;</td>');
    expect(body).toContain('&lt;img src=x onerror=alert(2)&gt; &amp; &quot;q&quot;');

    const searched = await (await get(env, `/prehlad?q=${encodeURIComponent('"><script>x</script>')}`)).text();
    expect(searched).not.toMatch(/<script/i);
    expect(searched).toContain('value="&quot;&gt;&lt;script&gt;x&lt;/script&gt;"');
  });

  it('shows the visitor question and answer as text inside the table', async () => {
    const { env, db } = setup();
    db.seed({ created_at: Date.now(), question: '<b>Kto</b> je Denis?', answer: 'Vývojár <i>webov</i>.', outcome: 'ok', latency_ms: 950 });
    const body = await (await get(env)).text();
    expect(body).toContain('&lt;b&gt;Kto&lt;/b&gt; je Denis?');
    expect(body).toContain('<details><summary>Zobraziť odpoveď</summary><div class="answer">Vývojár &lt;i&gt;webov&lt;/i&gt;.</div></details>');
    expect(body).toContain('950 ms');
  });

  it('sets the security headers with a fresh nonce that matches the only style element', async () => {
    const { env } = setup();
    const first = await get(env);
    const second = await get(env);
    const nonce = expectOverviewHeaders(first);
    expect(expectOverviewHeaders(second)).not.toBe(nonce);
    const body = await first.text();
    expect(body.match(/<style/g)).toHaveLength(1);
    expect(body).toContain(`<style nonce="${nonce}">`);
    expect(body).not.toMatch(/\sstyle="/);
    expect(body).not.toMatch(/<script/);
  });

  it('renders the summary numbers and an SVG bar per day', async () => {
    const { env, db } = setup();
    const now = Date.now();
    db.seed({ created_at: now - 1000, lang: 'sk', outcome: 'ok', latency_ms: 1000, input_tokens: 1200, output_tokens: 40 });
    db.seed({ created_at: now - 2000, lang: 'en', outcome: 'error', latency_ms: 3000 });
    const body = await (await get(env)).text();
    expect(body).toContain('<dt>Otázky spolu</dt><dd>2</dd>');
    expect(body).toContain('<dt>Slovensky / anglicky</dt><dd>1 / 1</dd>');
    expect(body).toContain('<dt>Priemerná latencia</dt><dd>2 000 ms</dd>');
    expect(body.match(/<rect /g)).toHaveLength(30);
    expect(body).toContain('<span class="badge alert">error</span>');
  });

  it('keeps the filters in the paging and export links and shows the filtered total', async () => {
    const { env, db } = setup();
    for (let i = 0; i < 60; i++) db.seed({ created_at: Date.now() - i * 1000, lang: 'en', question: `otázka ${i}`, outcome: 'ok' });
    db.seed({ created_at: Date.now(), lang: 'sk', outcome: 'ok' });
    const body = await (await get(env, '/prehlad?lang=en&q=ot%C3%A1zka')).text();
    expect(body).toContain('Zobrazené 1-50 z 60');
    expect(body).toContain('href="/prehlad?q=ot%C3%A1zka&amp;lang=en&amp;page=2">Staršie</a>');
    expect(body).toContain('href="/prehlad/export.csv?q=ot%C3%A1zka&amp;lang=en">Export CSV</a>');
    expect(body).toContain('<option value="en" selected>EN</option>');
    const second = await (await get(env, '/prehlad?lang=en&q=ot%C3%A1zka&page=2')).text();
    expect(second).toContain('Zobrazené 51-60 z 60');
    expect(second).toContain('href="/prehlad?q=ot%C3%A1zka&amp;lang=en">Novšie</a>');
  });

  it('answers 503 without details when D1 fails', async () => {
    const { env, db } = setup();
    db.fail = true;
    const res = await get(env);
    expect(res.status).toBe(503);
    expect(await res.text()).toBe('Databáza je dočasne nedostupná.');
    expectOverviewHeaders(res);
    expect(console.error).toHaveBeenCalledWith({ event: 'd1_error', status: 503 });
  });
});

describe('GET /prehlad/export.csv', () => {
  it('downloads a dated UTF-8 CSV with a BOM, filtered, quotes escaped and formulas neutralised', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(Date.UTC(2026, 9, 5, 22, 30));
    const { env, db } = setup();
    db.seed({ created_at: Date.UTC(2026, 9, 5, 20, 0), lang: 'sk', question: '=HYPERLINK("http://x")', answer: 'Povedal "áno"', outcome: 'ok', latency_ms: 700 });
    db.seed({ created_at: Date.UTC(2026, 9, 5, 21, 0), lang: 'en', question: 'Skip me', outcome: 'ok' });
    const res = await get(env, '/prehlad/export.csv?lang=sk');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/csv; charset=utf-8');
    expect(res.headers.get('Content-Disposition')).toBe('attachment; filename="chat-log-2026-10-06.csv"');
    expectOverviewHeaders(res);
    const bytes = new Uint8Array(await res.arrayBuffer());
    expect(bytes.slice(0, 3)).toEqual(new Uint8Array([0xef, 0xbb, 0xbf]));
    const lines = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes).slice(1).trimEnd().split('\r\n');
    expect(lines).toEqual([
      '"Čas";"Jazyk";"Otázka";"Odpoveď";"Výsledok";"Latencia (ms)"',
      '"5. 10. 2026 22:00";"SK";"\'=HYPERLINK(""http://x"")";"Povedal ""áno""";"ok";"700"',
    ]);
  });

  it('answers 503 when D1 fails', async () => {
    const { env, db } = setup();
    db.fail = true;
    expect((await get(env, '/prehlad/export.csv')).status).toBe(503);
  });
});
