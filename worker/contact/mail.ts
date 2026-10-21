import type { AskLang, AskRole } from '../../shared/ask-contract';

interface ContactSwitch {
  readonly CONTACT_ENABLED?: string | undefined;
  readonly CONTACT_MAIL?: SendEmail | undefined;
}

/** The hand-off runs only with the flag set to "true" and the mail binding present. */
export function isContactEnabled(env: ContactSwitch): boolean {
  return env.CONTACT_ENABLED?.trim() === 'true' && env.CONTACT_MAIL !== undefined;
}

export interface ContactMail {
  readonly lang: AskLang;
  /** One line, already stripped of CR, LF and control characters. */
  readonly name: string;
  readonly email: string;
  readonly message: string;
  /** Verified turns only. */
  readonly transcript: readonly { readonly role: AskRole; readonly content: string }[];
}

const MAX_SUBJECT = 120;

const LANGUAGE: Readonly<Record<AskLang, string>> = {
  sk: 'slovenčina (denisvarga.sk)',
  en: 'angličtina (denisvarga.dev)',
};

/** Cut by code points, so a long name never leaves half a character. */
export function contactSubject(name: string): string {
  const chars = Array.from(`Správa z denisvarga.sk od ${name}`);
  return chars.length <= MAX_SUBJECT ? chars.join('') : `${chars.slice(0, MAX_SUBJECT - 3).join('')}...`;
}

// Always Slovak: the mail is for Denis, whatever language the visitor used.
export function contactText({ lang, name, email, message, transcript }: ContactMail): string {
  const turns = transcript.map(({ role, content }) => `${role === 'user' ? 'Návštevník' : 'Agent'}: ${content}`);
  return [
    `Meno: ${name}`,
    `E-mail: ${email}`,
    `Jazyk: ${LANGUAGE[lang]}`,
    '',
    'Správa:',
    message,
    '',
    'Rozhovor s agentom:',
    turns.length > 0 ? turns.join('\n\n') : '(bez rozhovoru)',
    '',
    'Odpoveď na tento e-mail pôjde na adresu návštevníka.',
  ].join('\n');
}

/** Plain text only, and the reply goes to the visitor; the binding pins the recipient. */
export function buildContactMail(route: { readonly from: string; readonly to: string }, mail: ContactMail): EmailMessageBuilder {
  return { from: route.from, to: route.to, replyTo: mail.email, subject: contactSubject(mail.name), text: contactText(mail) };
}

const ERROR_CODE = /^E_[A-Z0-9_]{1,64}$/;

/** Cloudflare's fixed error code, never the message, which may echo addresses. */
export function mailErrorCode(error: unknown): string {
  const code = typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
  return typeof code === 'string' && ERROR_CODE.test(code) ? code : 'E_UNKNOWN';
}

export type MailOutcome = { readonly ok: true } | { readonly ok: false; readonly code: string };

/** Never throws: a rejected send becomes its error code. */
export async function sendContactMail(binding: SendEmail, message: EmailMessageBuilder): Promise<MailOutcome> {
  try {
    await binding.send(message);
    return { ok: true };
  } catch (error) {
    return { ok: false, code: mailErrorCode(error) };
  }
}
