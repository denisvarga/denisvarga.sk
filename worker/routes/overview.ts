import { Hono } from 'hono';
import { NONCE, secureHeaders } from 'hono/secure-headers';
import { ACCESS_JWT_HEADER, accessConfig, verifyAccessJwt } from '../admin/access';
import { buildCsv } from '../admin/csv';
import { renderPage } from '../admin/page';
import { filterSchema, loadExport, loadOverview } from '../admin/query';
import { localDateKey } from '../admin/time';
import { logEvent } from '../ask/errors';

const UNAVAILABLE = 'Databáza je dočasne nedostupná.';

export const overviewRoute = new Hono<{ Bindings: CloudflareBindings }>();

overviewRoute.use(
  '*',
  secureHeaders({
    // The zone sets HSTS for the whole host; a second header here would conflict with it.
    strictTransportSecurity: false,
    xFrameOptions: 'DENY',
    referrerPolicy: 'no-referrer',
    xContentTypeOptions: 'nosniff',
    contentSecurityPolicy: {
      defaultSrc: ["'none'"],
      styleSrc: [NONCE],
      imgSrc: ["'self'", 'data:'],
      formAction: ["'self'"],
      baseUri: ["'none'"],
      frameAncestors: ["'none'"],
    },
  }),
  async (c, next) => {
    await next();
    c.res.headers.set('Cache-Control', 'no-store');
    c.res.headers.set('X-Robots-Tag', 'noindex, nofollow');
  },
  async (c, next) => {
    const config = accessConfig(c.env);
    if (!config) return c.notFound();
    if (!(await verifyAccessJwt(c.req.header(ACCESS_JWT_HEADER), config))) return c.text('Forbidden', 403);
    await next();
  },
);

overviewRoute.get('/', async (c) => {
  const nonce = c.get('secureHeadersNonce');
  if (!nonce) throw new Error('missing CSP nonce');
  const filter = filterSchema.parse(c.req.query());
  const now = Date.now();
  try {
    const overview = await loadOverview(c.env.DB, filter, now);
    return c.html(renderPage({ overview, filter, nonce, now }));
  } catch {
    logEvent('d1_error', 503);
    return c.text(UNAVAILABLE, 503);
  }
});

overviewRoute.get('/export.csv', async (c) => {
  const filter = filterSchema.parse(c.req.query());
  try {
    const rows = await loadExport(c.env.DB, filter);
    return c.body(buildCsv(rows), 200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="chat-log-${localDateKey(Date.now())}.csv"`,
    });
  } catch {
    logEvent('d1_error', 503);
    return c.text(UNAVAILABLE, 503);
  }
});
