import * as z from 'zod/mini';
import { MAX_ASSISTANT_CONTENT, MAX_MESSAGES, MAX_TOTAL, MAX_USER_CONTENT, type ContactDraft } from '../../shared/ask-contract';
import {
  CONTACT_EMAIL_PATTERN,
  MAX_CONTACT_EMAIL,
  MAX_CONTACT_MESSAGE,
  MAX_CONTACT_NAME,
  MAX_DRAFT_MESSAGE,
} from '../../shared/contact-contract';
import { cleanContent, plainReply } from '../ask/clean-text';

/** One line without control characters: CR, LF and tabs become spaces, so a name can never add a mail header. */
export function oneLine(value: string): string {
  return cleanContent(value).replace(/\s+/g, ' ');
}

export const contactEmail = z.email({ pattern: new RegExp(`^(?:${CONTACT_EMAIL_PATTERN})$`) }).check(z.maxLength(MAX_CONTACT_EMAIL));

// Strict function calling guarantees the shape; the values are still checked here.
const draftArguments = z.object({
  message: z.string(),
  name: z.nullable(z.string()),
  email: z.nullable(z.string()),
});

/**
 * The model's `propose_contact_message` arguments, or null when they are not valid JSON of the
 * tool's shape or the message is empty or over MAX_DRAFT_MESSAGE. A name or email that does not
 * pass becomes null instead, since the visitor fills both in the card anyway.
 */
export function parseDraftArguments(raw: string): ContactDraft | null {
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch {
    return null;
  }
  const parsed = draftArguments.safeParse(json);
  if (!parsed.success) return null;
  const message = plainReply(cleanContent(parsed.data.message)).trim();
  if (!message || message.length > MAX_DRAFT_MESSAGE) return null;
  const name = oneLine(parsed.data.name ?? '');
  const email = parsed.data.email?.trim() ?? '';
  return {
    message,
    name: name && name.length <= MAX_CONTACT_NAME ? name : null,
    email: contactEmail.safeParse(email).success ? email : null,
  };
}

const text = (max: number) =>
  z.pipe(z.pipe(z.string(), z.transform(cleanContent)), z.string().check(z.minLength(1), z.maxLength(max)));

// Same turn limits as /api/ask; a malformed signature only costs the turn, dropped later.
const turn = z.discriminatedUnion('role', [
  z.object({ role: z.literal('user'), content: text(MAX_USER_CONTENT) }),
  z.object({
    role: z.literal('assistant'),
    content: text(MAX_ASSISTANT_CONTENT),
    sig: z.catch(z.optional(z.string().check(z.maxLength(128))), undefined),
  }),
]);

/** The name goes into the subject, so it is reduced to one line; the message keeps its line breaks. */
export const contactSchema = z.object({
  lang: z.enum(['sk', 'en']),
  turnstileToken: z.string().check(z.minLength(1), z.maxLength(2048)),
  name: z.pipe(z.pipe(z.string(), z.transform(oneLine)), z.string().check(z.minLength(1), z.maxLength(MAX_CONTACT_NAME))),
  email: z.pipe(z.pipe(z.string(), z.transform((value: string) => value.trim())), contactEmail),
  message: text(MAX_CONTACT_MESSAGE),
  messages: z
    .array(turn)
    .check(
      z.maxLength(MAX_MESSAGES),
      z.refine((list) => list.reduce((sum, m) => sum + m.content.length, 0) <= MAX_TOTAL, 'history too long'),
    ),
});

export type ContactInput = z.output<typeof contactSchema>;
