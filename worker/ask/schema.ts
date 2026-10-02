// zod/mini instead of the classic API: the classic build adds about 120 KB to the Worker bundle.
import * as z from 'zod/mini';
import { MAX_ASSISTANT_CONTENT, MAX_MESSAGES, MAX_TOTAL, MAX_USER_CONTENT } from '../../shared/ask-contract';

// C0 controls except tab and newline, DEL and C1 controls.
function isControl(code: number): boolean {
  return (code < 0x20 && code !== 0x09 && code !== 0x0a) || (code >= 0x7f && code <= 0x9f);
}

export function cleanContent(value: string): string {
  const normalized = value.replace(/\r\n?/g, '\n');
  let out = '';
  for (const ch of normalized) if (!isControl(ch.codePointAt(0) ?? 0)) out += ch;
  return out.trim();
}

const content = (max: number) =>
  z.pipe(z.pipe(z.string(), z.transform(cleanContent)), z.string().check(z.minLength(1), z.maxLength(max)));

const message = z.discriminatedUnion('role', [
  z.object({ role: z.literal('user'), content: content(MAX_USER_CONTENT) }),
  z.object({ role: z.literal('assistant'), content: content(MAX_ASSISTANT_CONTENT) }),
]);

export const askSchema = z.object({
  messages: z
    .array(message)
    .check(
      z.minLength(1),
      z.maxLength(MAX_MESSAGES),
      z.refine((list) => list.at(-1)?.role === 'user', 'last message must come from the user'),
      z.refine((list) => list.reduce((sum, m) => sum + m.content.length, 0) <= MAX_TOTAL, 'history too long'),
    ),
  lang: z.enum(['sk', 'en']),
  turnstileToken: z.string().check(z.minLength(1), z.maxLength(2048)),
});

export type AskInput = z.output<typeof askSchema>;

export function lastUserMessage(input: AskInput): string {
  return input.messages.at(-1)?.content ?? '';
}
