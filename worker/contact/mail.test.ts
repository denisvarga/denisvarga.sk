import { describe, expect, it } from 'vitest';
import { fakeMail } from '../test-support/ask-harness';
import { buildContactMail, contactSubject, contactText, isContactEnabled, mailErrorCode, sendContactMail, type ContactMail } from './mail';

const mail: ContactMail = {
  lang: 'sk',
  name: 'Jana',
  email: 'jana@firma.sk',
  message: 'Potrebujem e-shop.',
  transcript: [
    { role: 'user', content: 'Áno.' },
    { role: 'assistant', content: 'Návrh správy pre Denisa:\n\nPotrebujem e-shop.' },
  ],
};

describe('isContactEnabled', () => {
  it('needs the flag set to "true" and the binding', () => {
    expect(isContactEnabled({ CONTACT_ENABLED: 'true', CONTACT_MAIL: fakeMail() })).toBe(true);
    expect(isContactEnabled({ CONTACT_ENABLED: ' true ', CONTACT_MAIL: fakeMail() })).toBe(true);
    for (const flag of ['false', 'TRUE', '1', '', undefined]) expect(isContactEnabled({ CONTACT_ENABLED: flag, CONTACT_MAIL: fakeMail() }), String(flag)).toBe(false);
    expect(isContactEnabled({ CONTACT_ENABLED: 'true' })).toBe(false);
  });
});

describe('contact mail', () => {
  it('keeps the subject at 120 characters without splitting a character', () => {
    expect(contactSubject('Jana')).toBe('Správa z denisvarga.sk od Jana');
    const long = contactSubject('🙂'.repeat(100));
    expect(Array.from(long)).toHaveLength(120);
    expect(long.endsWith('🙂...')).toBe(true);
  });

  it('lists the visitor details, the message and the transcript in plain text', () => {
    expect(contactText(mail)).toBe(
      [
        'Meno: Jana',
        'E-mail: jana@firma.sk',
        'Jazyk: slovenčina (denisvarga.sk)',
        '',
        'Správa:',
        'Potrebujem e-shop.',
        '',
        'Rozhovor s agentom:',
        'Návštevník: Áno.\n\nAgent: Návrh správy pre Denisa:\n\nPotrebujem e-shop.',
        '',
        'Odpoveď na tento e-mail pôjde na adresu návštevníka.',
      ].join('\n'),
    );
  });

  it('sends from the configured sender to the pinned recipient with the reply to the visitor', () => {
    expect(buildContactMail({ from: 'web@notify.denisvarga.sk', to: 'hello@denisvarga.sk' }, mail)).toEqual({
      from: 'web@notify.denisvarga.sk',
      to: 'hello@denisvarga.sk',
      replyTo: 'jana@firma.sk',
      subject: 'Správa z denisvarga.sk od Jana',
      text: contactText(mail),
    });
  });
});

describe('sendContactMail', () => {
  it('reports success and turns a rejection into its fixed error code only', async () => {
    const message = buildContactMail({ from: 'a@b.sk', to: 'c@d.sk' }, mail);
    expect(await sendContactMail(fakeMail(), message)).toEqual({ ok: true });
    expect(await sendContactMail(fakeMail('E_RECIPIENT_NOT_ALLOWED'), message)).toEqual({ ok: false, code: 'E_RECIPIENT_NOT_ALLOWED' });
  });

  it('never passes on anything but an E_ code', () => {
    expect(mailErrorCode(Object.assign(new Error('x'), { code: 'E_DAILY_LIMIT_EXCEEDED' }))).toBe('E_DAILY_LIMIT_EXCEEDED');
    for (const error of [new Error('jana@firma.sk rejected'), { code: 'jana@firma.sk' }, { code: 42 }, 'E_TEXT', null]) {
      expect(mailErrorCode(error)).toBe('E_UNKNOWN');
    }
  });
});
