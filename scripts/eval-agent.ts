// Golden-question eval for the chat agent. Calls the real OpenAI API with the same prompt, client and
// manipulation guards as the Worker. Local only (`pnpm eval`, keys from .dev.vars); never runs in CI.
import { readFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { z } from 'zod';
import { guardAnswer, isManipulation, manipulationReply } from '../worker/agent/guard.ts';
import { buildInstructions, PROMPT_VERSION } from '../worker/agent/prompt.ts';
import { callOpenAI, type ModelResult, REASONING_EFFORTS, TOTAL_BUDGET_MS } from '../worker/ask/openai.ts';
import { estimateCostUsd } from '../worker/ask/pricing.ts';
import { safetyIdentifier } from '../worker/ask/safety-id.ts';
import { askSchema, lastUserMessage } from '../worker/ask/schema.ts';

const CASES_FILE = new URL('../worker/agent/evals/golden-questions.json', import.meta.url);

const caseSchema = z.object({
  id: z.string().min(1),
  lang: z.enum(['sk', 'en']),
  question: z.string().min(1),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
  expect: z.object({
    mustInclude: z.array(z.string()).optional(),
    mustNotInclude: z.array(z.string()).optional(),
    note: z.string(),
  }),
});
type EvalCase = z.infer<typeof caseSchema>;

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

function softChecks(answer: string, expect: EvalCase['expect']): string[] {
  const lower = answer.toLowerCase();
  const misses = (expect.mustInclude ?? []).filter((s) => !lower.includes(s.toLowerCase())).map((s) => `missing "${s}"`);
  const leaks = (expect.mustNotInclude ?? []).filter((s) => lower.includes(s.toLowerCase())).map((s) => `contains "${s}"`);
  return [...misses, ...leaks];
}

const softLine = (checks: string[], note: string) => `  soft:   ${checks.length ? checks.join('; ') : 'pass'} (${note})`;

const cost = (r: ModelResult) => estimateCostUsd(r.inputTokens ?? 0, r.outputTokens ?? 0);

async function main(): Promise<void> {
  const opts = options();
  const cases = loadCases(opts.only);
  const instructions = buildInstructions();
  const safetyId = await safetyIdentifier(opts.salt, 'eval');
  console.log(`prompt ${PROMPT_VERSION} | model ${opts.model} | effort ${opts.effort} | ${cases.length} case(s)\n`);

  let hardFailures = 0;
  let softFailures = 0;
  let inputTokens = 0;
  let outputTokens = 0;
  let totalCost = 0;

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

    if (isManipulation(lastUserMessage(request.data))) {
      const reply = manipulationReply(testCase.lang);
      const checks = softChecks(reply, testCase.expect);
      if (checks.length > 0) softFailures++;
      console.log(`  answer: ${reply}`);
      console.log('  guard:  canned reply before the model, no API call');
      console.log(`${softLine(checks, testCase.expect.note)}\n`);
      continue;
    }

    const startedAt = Date.now();
    const answer = await callOpenAI({
      apiKey: opts.apiKey,
      model: opts.model,
      effort: opts.effort,
      instructions,
      messages: request.data.messages,
      safetyIdentifier: safetyId,
      deadline: startedAt + TOTAL_BUDGET_MS,
    });
    const latency = Date.now() - startedAt;
    const result = guardAnswer(answer, testCase.lang);
    const completed = answer.outcome === 'ok' && answer.responseStatus === 'completed';
    const checks = result.text ? softChecks(result.text, testCase.expect) : [];
    if (!completed) hardFailures++;
    if (checks.length > 0) softFailures++;
    inputTokens += result.inputTokens ?? 0;
    outputTokens += result.outputTokens ?? 0;
    totalCost += cost(result);

    console.log(`  answer: ${result.text ?? '(none)'}`);
    if (result !== answer) console.log(`  guard:  leaked instructions replaced, model said: ${answer.text ?? ''}`);
    console.log(`  status: ${result.responseStatus ?? 'none'} | outcome ${result.outcome} | http ${result.httpStatus}${completed ? '' : ' | FAIL'}`);
    console.log(softLine(checks, testCase.expect.note));
    console.log(
      `  tokens: ${result.inputTokens ?? 0} in / ${result.outputTokens ?? 0} out | ${latency} ms | $${cost(result).toFixed(6)}\n`,
    );
  }

  console.log(
    `summary: ${cases.length - hardFailures}/${cases.length} completed | soft check misses in ${softFailures} case(s) | ` +
      `${inputTokens} in / ${outputTokens} out tokens | est. $${totalCost.toFixed(5)} (no cache discount)`,
  );
  if (hardFailures > 0) process.exit(1);
}

main().catch((error: unknown) => fail(`eval crashed: ${error instanceof Error ? error.message : String(error)}`));
