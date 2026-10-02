# denisvarga.sk

Personal CV site of Denis Varga with an AI agent that answers questions about his work.

React 19 and TypeScript, prerendered with Vite, served by a single Cloudflare Worker that also runs the chat API (Hono, OpenAI).

Work in progress; full documentation lands with the first release.

## Development

```bash
pnpm install
cp .dev.vars.example .dev.vars
pnpm dev
```

## Licence

Code under the MIT licence. Content and images are not licensed, see [NOTICE](./NOTICE).
