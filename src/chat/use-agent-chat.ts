import { useCallback, useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import type { AskLang } from '../../shared/ask-contract';
import { postAsk, type AskOutcome } from './api-client';
import { chatReducer, initialChatState, requestMessages, type ChatState } from './chat-reducer';
import type { TokenClient } from './use-turnstile-token';

export interface AgentChatOptions {
  readonly lang: AskLang;
  /** Copy appended in place of a reply on any failure (`t.ask.error`). */
  readonly errorText: string;
  readonly tokens: Pick<TokenClient, 'getToken' | 'refresh'>;
  readonly post?: typeof postAsk;
}

export interface AgentChat {
  readonly state: ChatState;
  readonly setInput: (value: string) => void;
  readonly ask: (question: string) => Promise<void>;
}

export function useAgentChat({ lang, errorText, tokens, post = postAsk }: AgentChatOptions): AgentChat {
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

  const ask = useCallback(
    async (question: string) => {
      const text = question.trim();
      if (!text || busy.current || committed.current.loading) return;
      busy.current = true;
      const messages = requestMessages(committed.current.messages, text);
      dispatch({ type: 'ask', text });

      const controller = new AbortController();
      request.current = controller;
      let reply: Extract<AskOutcome, { ok: true }> | null = null;
      try {
        const turnstileToken = await tokens.getToken();
        try {
          const outcome = await post({ messages, lang, turnstileToken }, { signal: controller.signal });
          if (outcome.ok) reply = outcome;
        } finally {
          tokens.refresh();
        }
      } catch {
        // Token deadline, script or widget failure: the error copy below covers every case.
      }
      if (controller.signal.aborted) return;
      dispatch(reply === null ? { type: 'fail', text: errorText } : { type: 'reply', text: reply.reply, sig: reply.sig });
    },
    [lang, errorText, tokens, post],
  );

  return { state, setInput, ask };
}
