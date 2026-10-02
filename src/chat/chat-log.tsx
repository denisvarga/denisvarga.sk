import { useEffect, useRef, type RefObject } from 'react';
import styles from './chat-log.module.css';
import type { ChatMessage } from './chat-reducer';
import { TypingBubble } from './typing-bubble';

interface ChatLogProps {
  readonly messages: readonly ChatMessage[];
  readonly loading: boolean;
  readonly typingId: number | null;
  readonly labels: { readonly you: string; readonly agent: string; readonly thinking: string };
}

function liveText(messages: readonly ChatMessage[], loading: boolean, thinking: string): string {
  if (loading) return thinking;
  const last = messages.at(-1);
  return last?.role === 'assistant' ? last.text : '';
}

function useStickToBottom(logRef: RefObject<HTMLDivElement | null>, visible: boolean) {
  const stackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const log = logRef.current;
    const stack = stackRef.current;
    if (!visible || !log || !stack || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => {
      log.scrollTop = log.scrollHeight;
    });
    observer.observe(stack);
    return () => observer.disconnect();
  }, [logRef, visible]);
  return stackRef;
}

/**
 * The visible log is not a live region; the hidden polite region below announces the thinking
 * line and then each reply once, in full, while the bubble types it out.
 */
export function ChatLog({ messages, loading, typingId, labels }: ChatLogProps) {
  const visible = messages.length > 0 || loading;
  const logRef = useRef<HTMLDivElement>(null);
  const stackRef = useStickToBottom(logRef, visible);

  return (
    <>
      <div className="visually-hidden" aria-live="polite" aria-atomic="true">
        {liveText(messages, loading, labels.thinking)}
      </div>
      {visible && (
        <div ref={logRef} className={styles.log} data-lenis-prevent="">
          <div ref={stackRef} className={styles.stack}>
            {messages.map((m) => {
              const user = m.role === 'user';
              return (
                <div key={m.id} className={`${styles.message} ${user ? styles.user : styles.agent}`}>
                  <span className={styles.who}>{user ? labels.you : labels.agent}</span>
                  {user ? (
                    <span className={styles.bubble}>{m.text}</span>
                  ) : (
                    <TypingBubble className={styles.bubble} text={m.text} animate={m.id === typingId} />
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
