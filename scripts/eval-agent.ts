// Golden-question eval for the chat agent. Calls the real OpenAI API with the same prompt, client and
// manipulation guards as the Worker, with the contact hand-off enabled. Local only (`pnpm eval`, keys
// from .dev.vars); never runs in CI.
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import type { ContactDraft } from '../shared/ask-contract.ts';
import { easterEgg } from '../worker/agent/easter-eggs.ts';
import { guardAnswer, isManipulation, manipulationReply } from '../worker/agent/guard.ts';
import { buildInstructions, PROMPT_VERSION } from '../worker/agent/prompt.ts';
import { callOpenAI, type ModelResult, REASONING_EFFORTS, TOTAL_BUDGET_MS } from '../worker/ask/openai.ts';
import { estimateCostUsd } from '../worker/ask/pricing.ts';
import { safetyIdentifier } from '../worker/ask/safety-id.ts';
import { askSchema, lastUserMessage } from '../worker/ask/schema.ts';
import { draftReply } from '../worker/contact/draft-text.ts';

const CASES_FILE = new URL('../worker/agent/evals/golden-questions.json', import.meta.url);

const caseSchema = z.object({
  id: z.string().min(1),
  lang: z.enum(['sk', 'en']),
  question: z.string().min(1),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
  expect: z.object({
    mustInclude: z.array(z.string()).optional(),
    /** At least one of these must appear. */
    mustIncludeAny: z.array(z.string()).min(1).optional(),
    mustNotInclude: z.array(z.string()).optional(),
    maxChars: z.number().int().positive().optional(),
    /** Language the reply must be in, whatever the site language. */
    lang: z.enum(['sk', 'en']).optional(),
    /** Whether the model must (true) or must not (false) propose a contact message. */
    toolCall: z.boolean().optional(),
    /** Strings the proposed message itself must contain; implies a proposal. */
    messageMustInclude: z.array(z.string()).min(1).optional(),
    note: z.string(),
  }),
});
type EvalCase = z.infer<typeof caseSchema>;
type Lang = EvalCase['lang'];

// Words common in one language and rare in the other; two distinct hits mark a reply as that language.
const LANG_MARKERS: Readonly<Record<Lang, { readonly email: string; readonly words: readonly string[] }>> = {
  sk: {
    email: 'hello@denisvarga.sk',
    words: ['je', 'sa', 'aj', 'na', 'pre', 'ako', 'alebo', 'áno', 'nie', 'jeho', 'má', 'robí', 'robil', 'ktoré', 'ktorý', 'môžete', 'napíšte', 'tiež'],
  },
  en: { email: 'hello@denisvarga.dev', words: ['the', 'and', 'is', 'he', 'his', 'has', 'does', 'with', 'you', 'of'] },
};

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

function options() {
  const { values } = parseArgs({
    options: { only: { type: 'string' }, model: { type: 'string' }, effort: { type: 'string' } },
  });
  const effort = values.effort ?? process.env.OPENAI_REASONING_EFFORT ?? 'none';
  if (!REASONING_EFFORTS.some((e) => e === effort)) fail(`--effort must be one of: ${REASONING_EFFORTS.join(', ')}`);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) fail('OPENAI_API_KEY is empty: add the key to .dev.vars (never commit it).');
  return {
    apiKey,
    effort,
    only: values.only,
    model: values.model ?? process.env.OPENAI_MODEL ?? 'gpt-6-luna',
    salt: process.env.SAFETY_SALT?.trim() || 'eval',
  };
}

function loadCases(only: string | undefined): EvalCase[] {
  const parsed = z.array(caseSchema).safeParse(JSON.parse(readFileSync(CASES_FILE, 'utf8')));
  if (!parsed.success) fail(`golden-questions.json is invalid: ${parsed.error.message}`);
  const cases = only ? parsed.data.filter((c) => c.id === only) : parsed.data;
  if (cases.length === 0) fail(`no case with id "${only}"`);
  return cases;
}

function languageChecks(lower: string, lang: Lang): string[] {
  const other: Lang = lang === 'sk' ? 'en' : 'sk';
  const { email, words } = LANG_MARKERS[other];
  const present = new Set(lower.split(/[^\p{L}]+/u));
  const hits = words.filter((word) => present.has(word));
  return [
    ...(lower.includes(email) ? [`contains the ${other} contact ${email}`] : []),
    ...(hits.length >= 2 ? [`reads as ${other} (${hits.join(', ')})`] : []),
  ];
}

function toolChecks(draft: ContactDraft | undefined, expect: EvalCase['expect']): string[] {
  const message = draft?.message.toLowerCase() ?? '';
  const expectCall = expect.toolCall ?? (expect.messageMustInclude ? true : undefined);
  return [
    ...(expectCall === true && !draft ? ['no contact proposal'] : []),
    ...(expectCall === false && draft ? ['unexpected contact proposal'] : []),
    ...(draft ? (expect.messageMustInclude ?? []).filter((s) => !message.includes(s.toLowerCase())).map((s) => `message missing "${s}"`) : []),
  ];
}

/** `answer` is the visible reply; for a proposal that is the draft text the Worker would sign. */
function softChecks(answer: string, expect: EvalCase['expect'], draft?: ContactDraft): string[] {
  const lower = answer.toLowerCase();
  const has = (s: string) => lower.includes(s.toLowerCase());
  const any = expect.mustIncludeAny;
  return [
    ...toolChecks(draft, expect),
    ...(expect.mustInclude ?? []).filter((s) => !has(s)).map((s) => `missing "${s}"`),
    ...(any && !any.some(has) ? [`missing any of ${any.map((s) => `"${s}"`).join(', ')}`] : []),
    ...(expect.mustNotInclude ?? []).filter(has).map((s) => `contains "${s}"`),
    ...(expect.maxChars !== undefined && answer.length > expect.maxChars ? [`${answer.length} chars, over ${expect.maxChars}`] : []),
    ...(expect.lang ? languageChecks(lower, expect.lang) : []),
  ];
}

const softLine = (checks: string[], note: string) => `  soft:   ${checks.length ? checks.join('; ') : 'pass'} (${note})`;

const usage = (r: ModelResult) => ({
  inputTokens: r.inputTokens ?? 0,
  cachedTokens: r.cachedTokens ?? 0,
  cacheWriteTokens: r.cacheWriteTokens ?? 0,
  outputTokens: r.outputTokens ?? 0,
});

async function main(): Promise<void> {
  const opts = options();
  const cases = loadCases(opts.only);
  const year = new Date().getUTCFullYear();
  const safetyId = await safetyIdentifier(opts.salt, 'eval');
  console.log(`prompt ${PROMPT_VERSION} | model ${opts.model} | effort ${opts.effort} | ${cases.length} case(s)\n`);

  let hardFailures = 0;
  let softFailures = 0;
  const totals = { inputTokens: 0, cachedTokens: 0, cacheWriteTokens: 0, outputTokens: 0 };

  for (const testCase of cases) {
    const request = askSchema.safeParse({
      messages: [...(testCase.history ?? []), { role: 'user', content: testCase.question }],
      lang: testCase.lang,
      turnstileToken: 'eval',
    });
    console.log(`[${testCase.id}] (${testCase.lang}) ${testCase.question}`);
    if (!request.success) {
      hardFailures++;
      console.log('  FAIL: case violates the live request limits\n');
      continue;
    }

    // Same order as the route: exact commands first, then the input guard, then the model.
    const question = lastUserMessage(request.data);
    const egg = easterEgg(question, testCase.lang);
    const canned = egg ?? (isManipulation(question) ? manipulationReply(testCase.lang) : null);
    if (canned !== null) {
      const checks = softChecks(canned, testCase.expect);
      if (checks.length > 0) softFailures++;
      console.log(`  answer: ${canned}`);
      console.log(`  ${egg === null ? 'guard:  canned reply' : 'egg:    exact command'} before the model, no API call`);
      console.log(`${softLine(checks, testCase.expect.note)}\n`);
      continue;
    }

    const startedAt = Date.now();
    const answer = await callOpenAI({
      apiKey: opts.apiKey,
      model: opts.model,
      effort: opts.effort,
      instructions: buildInstructions(testCase.lang, year, true),
      messages: request.data.messages,
      safetyIdentifier: safetyId,
      contact: true,
      deadline: startedAt + TOTAL_BUDGET_MS,
    });
    const latency = Date.now() - startedAt;
    // Same as the route: a proposal is checked and guarded as the draft text the visitor would see.
    const draft = answer.outcome === 'handoff' ? answer.draft : undefined;
    const shown = draft ? { ...answer, text: draftReply(testCase.lang, draft.message) } : answer;
    const result = guardAnswer(shown, testCase.lang);
    const completed = (answer.outcome === 'ok' || answer.outcome === 'handoff') && answer.responseStatus === 'completed';
    const checks = result.text ? softChecks(result.text, testCase.expect, result.outcome === 'handoff' ? draft : undefined) : [];
    if (!completed) hardFailures++;
    if (checks.length > 0) softFailures++;
    const used = usage(result);
    totals.inputTokens += used.inputTokens;
    totals.cachedTokens += used.cachedTokens;
    totals.cacheWriteTokens += used.cacheWriteTokens;
    totals.outputTokens += used.outputTokens;

    console.log(`  answer: ${result.text ?? '(none)'}`);
    if (draft) console.log(`  draft:  name ${draft.name ?? 'null'} | email ${draft.email ?? 'null'}`);
    if (result !== shown) console.log(`  guard:  leaked instructions replaced, model said: ${shown.text ?? ''}`);
    console.log(`  status: ${result.responseStatus ?? 'none'} | outcome ${result.outcome} | http ${result.httpStatus}${completed ? '' : ' | FAIL'}`);
    console.log(softLine(checks, testCase.expect.note));
    console.log(
      `  tokens: ${used.inputTokens} in (${used.cachedTokens} cached, ${used.cacheWriteTokens} written) / ${used.outputTokens} out | ` +
        `${latency} ms | $${estimateCostUsd(used).toFixed(6)}\n`,
    );
  }

  console.log(
    `summary: ${cases.length - hardFailures}/${cases.length} completed | soft check misses in ${softFailures} case(s) | ` +
      `${totals.inputTokens} in (${totals.cachedTokens} cached, ${totals.cacheWriteTokens} written) / ${totals.outputTokens} out tokens | ` +
      `est. $${estimateCostUsd(totals).toFixed(5)}`,
  );
  if (hardFailures > 0) process.exit(1);
}

main().catch((error: unknown) => fail(`eval crashed: ${error instanceof Error ? error.message : String(error)}`));
