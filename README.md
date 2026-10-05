# denisvarga.sk

Personal CV site of Denis Varga, in Slovak at [denisvarga.sk](https://denisvarga.sk) and in English at [denisvarga.dev](https://denisvarga.dev), with an AI agent that answers questions about his work.

## Architecture

- **Static pages.** React 19 and TypeScript, built with Vite and prerendered to plain HTML for both languages (`scripts/prerender.ts`), together with `sitemap.xml`, `llms.txt` and `llms-full.txt`. The PDF CVs in `public/cv/` are printed from the same data (`pnpm cv`).
- **One Cloudflare Worker.** Pages are served as static assets; the Worker script (`worker/`) runs only for `/api/*`. It is a Hono app with a single `POST /api/ask` endpoint.
- **Chat.** The agent answers through the OpenAI Responses API from a fixed fact sheet and rules (`worker/agent/`), behind Cloudflare Turnstile.
- **Storage.** A D1 database created in the EU jurisdiction holds the question log and backs the daily cap (`migrations/`).
- **Analytics.** Google Analytics 4 through Google Tag Manager, loaded only on the production domains and only after the visitor accepts it in the cookie bar (`src/consent/`). The container ID is set in `src/consent/gtm-config.ts`.

## Security

- Strict Content Security Policy (`public/_headers`): `default-src 'none'`, scripts only from the site, Turnstile and, after consent, Google Tag Manager, and Trusted Types required (`goog#html` is the policy Google's tag scripts create).
- Every chat request passes an origin check, a body size limit, schema validation, a Turnstile check, a rate limit of 5 requests per minute per IP address (per /64 for IPv6) and a daily cap on model calls.
- Every reply is signed with HMAC-SHA256. History sent back by the browser keeps only the assistant turns whose signature verifies, so earlier answers cannot be forged.
- The question log stores the time, language, question, answer, model, latency, token counts and outcome. No IP address, user agent or other visitor identifier is stored.

## Tests and evals

- `pnpm test` runs the Vitest suite: components, copy parity between languages, SEO output, the PDF CV markup and the Worker routes against a fake D1.
- `pnpm eval` runs the golden questions in `worker/agent/evals/` against the real OpenAI API with keys from `.dev.vars`. Local only, never in CI.

## Development

Requires Node.js 22.16 or newer and pnpm.

```bash
pnpm install
cp .dev.vars.example .dev.vars   # add an OpenAI key; Turnstile test keys are prefilled
pnpm db:migrate:local
pnpm dev
```

| Command | Purpose |
|---|---|
| `pnpm typecheck` | TypeScript project build check |
| `pnpm lint` | oxlint |
| `pnpm test` | Unit and integration tests |
| `pnpm build` | Production build, prerender and dist checks |
| `pnpm ci:local` | Typecheck, lint, test, build and dependency audit in one go |
| `pnpm cv` | Build, then print both PDF CVs to `public/cv/` |
| `pnpm eval` | Golden-question eval of the chat agent |

## Licence

Code under the MIT licence. Content and images are not licensed, see [NOTICE](./NOTICE).
