import { CONTACT_EMAIL_EN, CONTACT_EMAIL_SK, CONTACT_PHONE } from '../agent/facts';

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g;
// 9 to 15 digits with common separators. Nine is the shortest Slovak number without its leading 0,
// and stays above dates such as 21.10.2026 or year ranges such as 2015-2017. A longer digit run
// that is not a phone number gets redacted too, which is the safe direction for a log.
const PHONE = /(?<![\w+])\+?\d(?:[ \t()./-]{0,3}\d){8,14}(?!\w)/g;

const OWN_EMAILS = new Set([CONTACT_EMAIL_SK, CONTACT_EMAIL_EN].map((email) => email.toLowerCase()));
const digits = (value: string): string => value.replace(/\D/g, '');
const OWN_INTERNATIONAL = digits(CONTACT_PHONE);
const OWN_NATIONAL = OWN_INTERNATIONAL.replace(/^421/, '');
const OWN_PHONES = new Set([OWN_INTERNATIONAL, `00${OWN_INTERNATIONAL}`, OWN_NATIONAL, `0${OWN_NATIONAL}`]);

/**
 * Replaces email addresses and phone numbers with placeholders before text reaches the question
 * log, so contact details a visitor types into the chat are never stored. Denis's own public
 * contacts stay, since answers quote them.
 */
export function redactContacts(text: string): string {
  return text
    .replace(EMAIL, (match) => (OWN_EMAILS.has(match.toLowerCase()) ? match : '[email]'))
    .replace(PHONE, (match) => (OWN_PHONES.has(digits(match)) ? match : '[telefón]'));
}
