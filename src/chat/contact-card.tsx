import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { CONTACT_EMAIL_PATTERN, MAX_CONTACT_EMAIL, MAX_CONTACT_MESSAGE, MAX_CONTACT_NAME } from '../../shared/contact-contract';
import type { ContactCopy } from '../i18n/types';
import type { DraftState } from './chat-reducer';
import styles from './contact-card.module.css';
import { linkify } from './linkify';
import type { ContactFields, ContactTokens } from './use-agent-chat';
import { useTurnstileToken } from './use-turnstile-token';

const EMAIL = new RegExp(`^(?:${CONTACT_EMAIL_PATTERN})$`);

interface ContactCardProps {
  readonly draft: DraftState;
  readonly copy: ContactCopy;
  readonly onSend: (fields: ContactFields, tokens: ContactTokens) => void;
  readonly onCancel: () => void;
}

/** What the chat's live region reads when the card appears; it stays the same while the status changes. */
export function draftAnnouncement(draft: DraftState, copy: ContactCopy): string {
  return `${copy.title}. ${copy.lead} ${draft.proposal.message}`;
}

type Field = 'name' | 'email' | 'message';

function ContactForm({ draft, copy, onSend, onCancel }: ContactCardProps) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const tokens = useTurnstileToken(widgetRef, 'contact');
  const [fields, setFields] = useState<ContactFields>({
    name: draft.proposal.name ?? '',
    email: draft.proposal.email ?? '',
    message: draft.proposal.message,
  });
  const [editing, setEditing] = useState(false);
  const [invalid, setInvalid] = useState<Field | null>(null);
  const refs = {
    name: useRef<HTMLInputElement>(null),
    email: useRef<HTMLInputElement>(null),
    message: useRef<HTMLTextAreaElement>(null),
  };
  const sendRef = useRef<HTMLButtonElement>(null);
  const leadId = useId();
  const nameId = useId();
  const emailId = useId();
  const sending = draft.status === 'sending';
  const proposal = draft.proposal;

  // preventScroll leaves scrolling to the chat log, which keeps a new reply's top in view.
  useEffect(() => {
    tokens.warmUp();
    const first = !proposal.name ? refs.name.current : !proposal.email ? refs.email.current : sendRef.current;
    first?.focus({ preventScroll: true });
    // Mount only: the card takes focus once, when it appears.
  }, []);

  useEffect(() => {
    if (editing) refs.message.current?.focus({ preventScroll: true });
  }, [editing]);

  const change = (field: Field, value: string) => {
    setFields((current) => ({ ...current, [field]: value }));
    if (invalid === field) setInvalid(null);
  };

  // The browser's own validation runs first; this also catches a name or message of spaces only.
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending) return;
    const clean = { name: fields.name.trim(), email: fields.email.trim(), message: fields.message.trim() };
    const bad: Field | null = !clean.name ? 'name' : !EMAIL.test(clean.email) ? 'email' : !clean.message ? 'message' : null;
    if (bad) {
      setInvalid(bad);
      refs[bad].current?.focus();
      return;
    }
    onSend(clean, tokens);
  };

  return (
    <form className={styles.form} aria-busy={sending} onSubmit={submit}>
      <p id={leadId} className={styles.lead}>
        {copy.lead}
      </p>
      {editing ? (
        <textarea
          ref={refs.message}
          className={styles.textarea}
          value={fields.message}
          maxLength={MAX_CONTACT_MESSAGE}
          rows={4}
          required
          aria-labelledby={leadId}
          aria-invalid={invalid === 'message' || undefined}
          onChange={(event) => change('message', event.target.value)}
        />
      ) : (
        <p className={styles.message}>{fields.message}</p>
      )}
      <div className={styles.fields}>
        <label className={styles.field} htmlFor={nameId}>
          <span className={styles.label}>{copy.name}</span>
          <input
            ref={refs.name}
            id={nameId}
            className={styles.input}
            value={fields.name}
            maxLength={MAX_CONTACT_NAME}
            autoComplete="name"
            required
            aria-invalid={invalid === 'name' || undefined}
            onChange={(event) => change('name', event.target.value)}
          />
        </label>
        <label className={styles.field} htmlFor={emailId}>
          <span className={styles.label}>{copy.email}</span>
          <input
            ref={refs.email}
            id={emailId}
            className={styles.input}
            type="email"
            value={fields.email}
            maxLength={MAX_CONTACT_EMAIL}
            pattern={CONTACT_EMAIL_PATTERN}
            autoComplete="email"
            required
            aria-invalid={invalid === 'email' || undefined}
            onChange={(event) => change('email', event.target.value)}
          />
        </label>
      </div>
      <p className={styles.consent}>{copy.consent}</p>
      {draft.status === 'failed' && <p className={styles.failed}>{linkify(copy.failed)}</p>}
      <div>
        <div className={styles.actions}>
          <button ref={sendRef} type="submit" className={styles.send} aria-disabled={sending || undefined}>
            {copy.send}
          </button>
          {!editing && (
            <button type="button" className={styles.secondary} aria-disabled={sending || undefined} onClick={() => !sending && setEditing(true)}>
              {copy.edit}
            </button>
          )}
          <button type="button" className={styles.secondary} aria-disabled={sending || undefined} onClick={() => !sending && onCancel()}>
            {copy.cancel}
          </button>
        </div>
        <div ref={widgetRef} className={styles.widget} />
      </div>
    </form>
  );
}

/**
 * Confirm card for a message the agent proposed. Nothing is sent until the visitor presses Send;
 * the form, and with it the card's own Turnstile widget, goes away once the message is sent or
 * cancelled, and focus moves to the status line.
 */
export function ContactCard(props: ContactCardProps) {
  const { draft, copy } = props;
  const titleId = useId();
  const statusRef = useRef<HTMLParagraphElement>(null);
  const done = draft.status === 'sent' || draft.status === 'cancelled';

  useEffect(() => {
    if (done) statusRef.current?.focus({ preventScroll: true });
  }, [done]);

  return (
    <div className={styles.card} role="group" aria-labelledby={titleId}>
      <span id={titleId} className={styles.title}>
        {copy.title}
      </span>
      {done ? (
        <p ref={statusRef} className={styles.status} tabIndex={-1}>
          {draft.status === 'sent' ? copy.sent.replace('{email}', draft.sentTo ?? '') : copy.cancelled}
        </p>
      ) : (
        <ContactForm {...props} />
      )}
      <span className="visually-hidden" aria-live="polite">
        {draft.status === 'failed' ? copy.failed : ''}
      </span>
    </div>
  );
}
