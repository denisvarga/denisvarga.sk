import { CONTACT_EMAIL_EN, CONTACT_EMAIL_SK, CONTACT_PHONE } from '../agent/facts';

// Letters and marks of any script, so "jožko@firma.sk" or an internationalised domain is caught whole.
const EMAIL = /[\p{L}\p{M}\p{N}._%+-]+@[\p{L}\p{M}\p{N}-]+(?:\.[\p{L}\p{M}\p{N}-]+)*\.[\p{L}\p{M}]{2,}/gu;
// 9 to 15 digits with common separators. Nine is the shortest Slovak number without its leading 0,
// and stays above dates such as 21.10.2026 or year ranges such as 2015-2017. A leading "+" may
// follow a word ("Tel+421..."); a bare digit run glued to letters or digits is left alone, and so is
// a run followed by ":" and a digit, the time in "2026-10-21 14:30". Another long digit run gets
// redacted too, which is the safe direction for a log.
const PHONE = /(?:\+|(?<![\p{L}\p{N}+]))\d(?:[ \t()./-]{0,3}\d){8,14}(?![\p{L}\p{N}]|:\d)/gu;

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
