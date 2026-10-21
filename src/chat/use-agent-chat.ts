import { useCallback, useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import type { AskLang } from '../../shared/ask-contract';
import { postAsk, type AskFailure, type AskOutcome } from './api-client';
import { chatReducer, initialChatState, requestMessages, type ChatAction, type ChatState } from './chat-reducer';
import type { TokenClient } from './use-turnstile-token';

/** Copy shown in place of a reply (`t.ask.errors`). */
export interface AskErrorCopy {
  readonly rateLimited: string;
  readonly dailyCap: string;
  /** Every other failure, including a missing Turnstile token. */
  readonly fallback: string;
}

export interface AgentChatOptions {
  readonly lang: AskLang;
  readonly errors: AskErrorCopy;
  readonly tokens: Pick<TokenClient, 'getToken' | 'refresh'>;
  readonly post?: typeof postAsk;
}

export interface AgentChat {
  readonly state: ChatState;
  readonly setInput: (value: string) => void;
  readonly ask: (question: string) => Promise<void>;
  /** Asks the question of the failed reply `id` again. */
  readonly retry: (id: number) => Promise<void>;
}

/** The daily cap lasts until midnight UTC, so it offers no retry; everything else does. */
export function failureReply(error: AskFailure | null, errors: AskErrorCopy): Extract<ChatAction, { type: 'fail' }> {
  if (error === 'daily_cap') return { type: 'fail', text: errors.dailyCap, retryable: false };
  return { type: 'fail', text: error === 'rate_limited' ? errors.rateLimited : errors.fallback, retryable: true };
}

export function useAgentChat({ lang, errors, tokens, post = postAsk }: AgentChatOptions): AgentChat {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const committed = useRef(state);
  // Set synchronously on ask and released only once a non-loading state is committed, so a second
  // question can neither overlap a request nor read a history that misses the previous reply.
  const busy = useRef(false);
  const request = useRef<AbortController | null>(null);

  useLayoutEffect(() => {
    committed.current = state;
    if (!state.loading) busy.current = false;
  });

  useEffect(() => () => request.current?.abort(), []);

  const setInput = useCallback((value: string) => dispatch({ type: 'input', value }), []);

  const send = useCallback(
    async (text: string, start: Extract<ChatAction, { type: 'ask' | 'retry' }>) => {
      busy.current = true;
      // Failed replies and their questions are left out, so a retried question is sent once.
      const messages = requestMessages(committed.current.messages, text);
      dispatch(start);

      const controller = new AbortController();
      request.current = controller;
      let reply: Extract<AskOutcome, { ok: true }> | null = null;
      let error: AskFailure | null = null;
      try {
        const turnstileToken = await tokens.getToken();
        try {
          const outcome = await post({ messages, lang, turnstileToken }, { signal: controller.signal });
          if (outcome.ok) reply = outcome;
          else error = outcome.error;
        } finally {
          tokens.refresh();
        }
      } catch {
        // Token deadline, script or widget failure: the fallback copy covers it.
      }
      if (controller.signal.aborted) return;
      dispatch(reply === null ? failureReply(error, errors) : { type: 'reply', text: reply.reply, sig: reply.sig });
    },
    [lang, errors, tokens, post],
  );

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || busy.current || committed.current.loading) return;
      await send(text, { type: 'ask', text });
    },
    [send],
  );

  const retry = useCallback(
    async (id: number) => {
      if (busy.current || committed.current.loading) return;
      const messages = committed.current.messages;
      const index = messages.findIndex((m) => m.id === id);
      const question = messages[index - 1];
      if (!messages[index]?.retryable || question?.role !== 'user') return;
      await send(question.text, { type: 'retry', id });
    },
    [send],
  );

  return { state, setInput, ask, retry };
}
