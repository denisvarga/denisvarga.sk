import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { secureHeaders } from 'hono/secure-headers';
import { askError, logEvent } from './ask/errors';
import { askRoute } from './routes/ask';

const MAX_BODY_BYTES = 48 * 1024;

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use(
  '/api/*',
  secureHeaders({
    // The zone sets HSTS for the whole host; a second header here would conflict with it.
    strictTransportSecurity: false,
    xFrameOptions: 'DENY',
    referrerPolicy: 'strict-origin-when-cross-origin',
    crossOriginResourcePolicy: 'same-origin',
    xContentTypeOptions: 'nosniff',
    contentSecurityPolicy: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
    permissionsPolicy: { camera: [], microphone: [], geolocation: [], payment: [], usb: [] },
  }),
  async (c, next) => {
    await next();
    c.res.headers.set('Cache-Control', 'no-store');
  },
  bodyLimit({ maxSize: MAX_BODY_BYTES, onError: (c) => askError(c, 'invalid_input', 413) }),
);

app.route('/api', askRoute);

app.notFound((c) => c.json({ error: 'not_found' }, 404));

app.onError((_err, c) => {
  logEvent('internal_error', 500);
  return askError(c, 'internal');
});

export default app;
