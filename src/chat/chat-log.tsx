import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import type { ContactCopy } from '../i18n/types';
import styles from './chat-log.module.css';
import type { ChatMessage } from './chat-reducer';
import { ContactCard, draftAnnouncement } from './contact-card';
import { TypingBubble } from './typing-bubble';
import type { ContactFields, ContactTokens } from './use-agent-chat';

/** How close to the bottom the reader must stay for the log to keep following new text. */
export const FOLLOW_SLACK_PX = 24;

interface ChatLogProps {
  readonly messages: readonly ChatMessage[];
  readonly loading: boolean;
  readonly typingId: number | null;
  readonly labels: { readonly you: string; readonly agent: string; readonly thinking: string; readonly retry: string };
  readonly contact: ContactCopy;
  readonly onRetry: (id: number) => void;
  readonly onSendDraft: (id: number, fields: ContactFields, tokens: ContactTokens) => void;
  readonly onCancelDraft: (id: number) => void;
}

function liveText(messages: readonly ChatMessage[], loading: boolean, thinking: string, contact: ContactCopy): string {
  if (loading) return thinking;
  const last = messages.at(-1);
  if (last?.draft) return draftAnnouncement(last.draft, contact);
  return last?.role === 'assistant' ? last.text : '';
}

/**
 * A new question and the thinking line scroll to the bottom. A new reply is followed only until
 * its top reaches the top of the log, so a long answer is read from its start. Once the reader
 * scrolls the log, growth is followed only while they stay near the bottom.
 */
function useChatScroll(visible: boolean, last: ChatMessage | undefined) {
  const logRef = useRef<HTMLDivElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const anchor = useRef<HTMLElement | null>(null);
  const follow = useRef(true);
  // Our own scroll positions, so the scroll events they fire are not taken for the reader's.
  const ownTop = useRef<number | null>(null);

  const apply = useCallback(() => {
    const log = logRef.current;
    if (!log || !follow.current) return;
    const bottom = log.scrollHeight - log.clientHeight;
    const replyTop = anchor.current
      ? anchor.current.getBoundingClientRect().top - log.getBoundingClientRect().top + log.scrollTop
      : Number.POSITIVE_INFINITY;
    const target = Math.max(0, Math.min(replyTop, bottom));
    if (Math.abs(log.scrollTop - target) < 1) return;
    log.scrollTop = target;
    ownTop.current = log.scrollTop;
  }, []);

  const lastId = last?.id;
  const lastIsReply = last?.role === 'assistant';
  useLayoutEffect(() => {
    if (lastId === undefined) return;
    follow.current = true;
    anchor.current = lastIsReply ? (logRef.current?.querySelector<HTMLElement>(`[data-message-id="${lastId}"]`) ?? null) : null;
    apply();
  }, [lastId, lastIsReply, apply]);

  useEffect(() => {
    const log = logRef.current;
    const stack = stackRef.current;
    if (!visible || !log || !stack || typeof ResizeObserver === 'undefined') return;
    const onScroll = () => {
      if (ownTop.current !== null && Math.abs(log.scrollTop - ownTop.current) < 2) return;
      ownTop.current = null;
      anchor.current = null;
      follow.current = log.scrollHeight - log.clientHeight - log.scrollTop <= FOLLOW_SLACK_PX;
    };
    const observer = new ResizeObserver(apply);
    observer.observe(stack);
    log.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      observer.disconnect();
      log.removeEventListener('scroll', onScroll);
    };
  }, [visible, apply]);

  return { logRef, stackRef };
}

/**
 * The visible log is not a live region; the hidden polite region below announces the thinking
 * line and then each reply once, in full, while the bubble types it out. A proposed message is
 * announced as its card; the card announces a failed send itself.
 */
export function ChatLog({ messages, loading, typingId, labels, contact, onRetry, onSendDraft, onCancelDraft }: ChatLogProps) {
  const visible = messages.length > 0 || loading;
  const { logRef, stackRef } = useChatScroll(visible, messages.at(-1));

  return (
    <>
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {liveText(messages, loading, labels.thinking, contact)}
      </div>
      {visible && (
        <div ref={logRef} className={styles.log} data-lenis-prevent="" aria-busy={loading}>
          <div ref={stackRef} className={styles.stack}>
            {messages.map((m, i) => {
              const user = m.role === 'user';
              // Only the latest turn: an older failure was already followed by another question.
              const canRetry = m.retryable === true && i === messages.length - 1;
              return (
                <div key={m.id} data-message-id={m.id} className={`${styles.message} ${user ? styles.user : styles.agent}`}>
                  <span className={styles.who}>{user ? labels.you : labels.agent}</span>
                  {user ? (
                    <span className={styles.bubble}>{m.text}</span>
                  ) : m.draft ? (
                    <ContactCard
                      draft={m.draft}
                      copy={contact}
                      onSend={(fields, tokens) => onSendDraft(m.id, fields, tokens)}
                      onCancel={() => onCancelDraft(m.id)}
                    />
                  ) : (
                    <TypingBubble
                      className={m.failed ? `${styles.bubble} ${styles.failed}` : styles.bubble}
                      text={m.text}
                      animate={m.id === typingId}
                    />
                  )}
                  {canRetry && (
                    <button
                      type="button"
                      className={styles.retry}
                      aria-disabled={loading || undefined}
                      onClick={() => onRetry(m.id)}
                    >
                      {labels.retry}
                    </button>
                  )}
                </div>
              );
            })}
            {loading && (
              <span className={styles.thinking} data-pulse="">
                {labels.thinking}
              </span>
            )}
          </div>
        </div>
      )}
    </>
  );
}
