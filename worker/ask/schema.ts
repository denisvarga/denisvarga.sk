// zod/mini instead of the classic API: the classic build adds about 120 KB to the Worker bundle.
import * as z from 'zod/mini';
import { MAX_ASSISTANT_CONTENT, MAX_MESSAGES, MAX_TOTAL, MAX_USER_CONTENT } from '../../shared/ask-contract';
import { cleanContent } from './clean-text';

const content = (max: number) =>
  z.pipe(z.pipe(z.string(), z.transform(cleanContent)), z.string().check(z.minLength(1), z.maxLength(max)));

// A malformed signature only costs the turn (dropped later), never the whole request.
const signature = z.catch(z.optional(z.string().check(z.maxLength(128))), undefined);

const message = z.discriminatedUnion('role', [
  z.object({ role: z.literal('user'), content: content(MAX_USER_CONTENT) }),
  z.object({ role: z.literal('assistant'), content: content(MAX_ASSISTANT_CONTENT), sig: signature }),
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
