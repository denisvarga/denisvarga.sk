# denisvarga.sk

Personal CV site of Denis Varga, in Slovak at [denisvarga.sk](https://denisvarga.sk) and in English at [denisvarga.dev](https://denisvarga.dev), with an AI agent that answers questions about his work.

## Architecture

- **Static pages.** React 19 and TypeScript, built with Vite and prerendered to plain HTML for both languages (`scripts/prerender.ts`), together with `sitemap.xml`, `llms.txt` and `llms-full.txt`. The PDF CVs in `public/cv/` are printed from the same data (`pnpm cv`).
- **One Cloudflare Worker.** Pages are served as static assets; the Worker script (`worker/`) runs only for `/api/*`, `/prehlad` and `/prehlad/*`. It is a Hono app with the `POST /api/ask` and `POST /api/contact` endpoints, the private overview and a daily cron (`worker/scheduled.ts`).
- **Chat.** The agent answers through the OpenAI Responses API from a fixed fact sheet and rules (`worker/agent/`), behind Cloudflare Turnstile. The fact sheet and rules go first as one prefix with an explicit prompt cache breakpoint, shared by both languages; the site the visitor is on and the current year follow it per request. Explicit cache breakpoints need a GPT-5.6 or later model in `OPENAI_MODEL` (`wrangler.jsonc`); earlier models offer only implicit caching, so switching to one needs a change to the request in `worker/ask/openai.ts` first. Each logged answer records the prompt revision (`PROMPT_VERSION`) and the input tokens read from and written to the prompt cache.
- **Contact hand-off.** When a visitor wants something from Denis, the agent may offer once to draft a short message and, after the visitor agrees, propose it through one strict function tool (`propose_contact_message`). The Worker turns the call into a `handoff_draft` reply, signed like an answer, and never answers the call itself. The chat shows a confirm card where the visitor edits the message and enters a name and email, which therefore never reach OpenAI or the question log; only the Send button posts to `/api/contact`, which emails the message and the verified conversation to Denis (`worker/contact/`, `src/chat/contact-card.tsx`). The mail goes through a `send_email` binding pinned to one verified Email Routing destination, so the endpoint cannot relay mail anywhere else, with the reply going to the visitor. Nothing of the message is stored.
- **Projects.** One list in `shared/projects.ts` feeds the project rail and index, the PDF CVs, `llms.txt` and the chat agent's facts. The work history in `shared/jobs.ts` and the skills in `shared/skills.ts` feed the page, the PDF CVs, `llms.txt` and the agent's experience and stack facts the same way. The screenshots come from `scripts/project-shots/`: `capture.ts` photographs each site at desktop and phone size, `compose.ts --variants b` lays them out as a tilted browser and a phone.
- **Storage.** A D1 database created in the EU jurisdiction holds the question log and the daily counters per client and for contact messages, and backs every cap (`migrations/`). The cron at 03:17 UTC deletes questions older than `CHAT_LOG_RETENTION_DAYS` (365) and counters older than yesterday; a period under 30 days or a malformed value deletes nothing.
- **Private overview.** `/prehlad` shows statistics, a daily chart and a searchable table of the question log with a CSV export (`worker/admin/`). Cloudflare Access protects it, and the Worker verifies the Access JWT itself as well (signature against the team's keys, audience, issuer and expiry, and the email when `ACCESS_ALLOWED_EMAILS` is set). An unknown key ID fetches the team's keys again once the cached set is 30 seconds old. It answers 404 until `ACCESS_AUD` is set.
- **Analytics.** Google Analytics 4 through Google Tag Manager, loaded only on the production domains and only after the visitor accepts it in the cookie bar (`src/consent/`). The container ID is set in `src/consent/gtm-config.ts`.

## Security

- Strict Content Security Policy (`public/_headers`): `default-src 'none'`, scripts only from the site, Turnstile and, after consent, Google Tag Manager, and Trusted Types required (`goog#html` is the policy Google's tag scripts create).
- Every chat request passes an origin check, a body size limit, schema validation and a rate limit of 5 requests per minute per IP address (per /64 for IPv6). Questions for the model also pass a Turnstile check, a budget of `CLIENT_DAILY_CAP` (20) model calls per client and UTC day and the global `DAILY_CAP`. Easter eggs and canned replies to manipulation attempts skip Turnstile and both caps, since they never reach the model or D1.
- `/api/contact` answers 503 until `CONTACT_ENABLED` is `"true"` and the `CONTACT_MAIL` binding exists. It then checks the origin and the fields (the name is reduced to one line, so it cannot add a mail header), has its own rate limit of 3 per minute (`CONTACT_LIMITER`), its own Turnstile action (`TURNSTILE_CONTACT_ACTION`) and caps of `CONTACT_CLIENT_DAILY_CAP` (3) messages per client and `CONTACT_DAILY_CAP` (30) in total per UTC day. The email carries only the conversation turns whose signatures verify.
- Manipulation attempts (overriding or revealing the instructions, role-play, injected system blocks) are checked in every user turn. An attempt in the last turn gets an unsigned canned reply before Turnstile and the model, an earlier one is dropped from the history with the replies after it, and a model answer that repeats the instructions is replaced with an unsigned canned reply and logged as refused.
- Every answer and easter egg is signed with HMAC-SHA256 over the language, the UTC day and the question it answers; canned replies stay unsigned. History sent back by the browser keeps an assistant turn only when its signature verifies against the question before it (today or yesterday), and an earlier question only when a verified reply follows it. The model therefore only sees earlier questions the Worker already answered, and answers cannot be forged or replayed after another question.
- The question log stores the time, language, question, answer, model, prompt revision, latency, token counts, outcome and reply kind. Email addresses and phone numbers in questions and answers are replaced with placeholders, except Denis's own. A proposed contact message is logged as outcome `ok` with reply kind `handoff_draft` and no answer. No IP address, user agent or other visitor identifier is stored. The per-client counter is keyed by an HMAC of the UTC day and the client network and is gone within three days. The privacy disclosure in the footer of each page tells visitors the same.

## Contact hand-off rollout

`CONTACT_ENABLED` in `wrangler.jsonc` is the kill switch: while it is not `"true"` the model is not offered the tool, the prompt has no contact rule and `/api/contact` answers 503.

0. Before the first deploy of this code, flag off or not, run `pnpm db:migrate:remote`: every logged answer writes the `reply_kind` column from migration `0004`, so the Worker must never run before it.

Before turning the flag on, in the Cloudflare dashboard:

1. Export the DNS records (rollback).
2. Enable Email Routing on the subdomain `notify.denisvarga.sk` only, which `CONTACT_FROM` uses. Stop if the dashboard proposes changing the apex MX records.
3. Add `hello@denisvarga.sk` (`CONTACT_TO`, the binding's `destination_address`) as a destination address and click the verification link.
4. Let `POST /api/contact` through the WAF custom rule with the same Origin and JSON conditions as `/api/ask`, and extend the WAF rate-limit rule to it.

Then set `CONTACT_ENABLED` to `"true"`, deploy and send one real message from the site; its raw headers should show `dkim=pass` and `dmarc=pass`. To switch it off again, set the flag back to `"false"` and deploy.

## Tests and evals

- `pnpm test` runs the Vitest suite: components, copy parity between languages, SEO output, the PDF CV markup and the Worker routes against a fake D1.
- `pnpm eval` runs the golden questions in `worker/agent/evals/` against the real OpenAI API with keys from `.dev.vars`, with the contact tool enabled. Local only, never in CI.

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
