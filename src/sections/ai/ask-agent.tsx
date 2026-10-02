import { useId, useRef, type KeyboardEvent } from 'react';
import { MAX_USER_CONTENT } from '../../../shared/ask-contract';
import { ChatLog } from '../../chat/chat-log';
import { useAgentChat } from '../../chat/use-agent-chat';
import { useTurnstileToken } from '../../chat/use-turnstile-token';
import { useLang } from '../../i18n/lang-context';
import { useReveal } from '../../motion/use-reveal';
import styles from './ask-agent.module.css';

// keyCode 229 covers Safari, which reports isComposing false on the Enter that ends composition.
function isComposing(event: KeyboardEvent<HTMLInputElement>): boolean {
  return event.nativeEvent.isComposing || event.keyCode === 229;
}

export function AskAgent() {
  const { lang, t } = useLang();
  const cardRef = useRef<HTMLDivElement>(null);
  const widgetRef = useRef<HTMLDivElement>(null);
  const inputId = useId();
  useReveal(cardRef);

  const tokens = useTurnstileToken(widgetRef);
  const { state, setInput, ask } = useAgentChat({ lang, errorText: t.ask.error, tokens });
  const submit = (question: string) => void ask(question);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || isComposing(event)) return;
    event.preventDefault();
    submit(state.input);
  };

  return (
    <div id="ask" ref={cardRef} data-reveal="" className={styles.card}>
      <span className={styles.label}>{t.ask.label}</span>
      <span className={styles.title}>
        {t.ask.title1} <span className={styles.strong}>{t.ask.title2}</span>
      </span>
      <div className={styles.field}>
        <div className={styles.pill}>
          <label htmlFor={inputId} className="visually-hidden">
            {t.ask.placeholder}
          </label>
          <input
            id={inputId}
            className={styles.input}
            value={state.input}
            maxLength={MAX_USER_CONTENT}
            placeholder={t.ask.placeholder}
            autoComplete="off"
            onChange={(event) => setInput(event.target.value)}
            onFocus={tokens.warmUp}
            onKeyDown={onKeyDown}
          />
          <button type="button" className={styles.send} aria-label={t.ask.send} onClick={() => submit(state.input)}>
            ↑
          </button>
        </div>
        <div ref={widgetRef} className={styles.widget} />
      </div>
      <div className={styles.chips}>
        {t.ask.suggestions.map((question) => (
          <button key={question} type="button" className={styles.chip} onClick={() => submit(question)}>
            {question}
          </button>
        ))}
      </div>
      <ChatLog
        messages={state.messages}
        loading={state.loading}
        typingId={state.typingId}
        labels={{ you: t.ask.you, agent: t.ask.agent, thinking: t.ask.thinking }}
      />
      <span className={styles.note}>{t.ask.note}</span>
    </div>
  );
}
