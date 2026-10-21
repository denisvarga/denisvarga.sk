import * as z from 'zod/mini';
import type { ContactDraft } from '../../shared/ask-contract';
import { CONTACT_EMAIL_PATTERN, MAX_CONTACT_EMAIL, MAX_CONTACT_NAME, MAX_DRAFT_MESSAGE } from '../../shared/contact-contract';
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
