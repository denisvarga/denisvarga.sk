import { useCallback, useEffect, useLayoutEffect, useReducer, useRef } from 'react';
import type { AskLang } from '../../shared/ask-contract';
import type { ContactRequest } from '../../shared/contact-contract';
import { postAsk, postContact, type AskFailure, type AskOutcome, type ContactFailure, type ContactOutcome } from './api-client';
import {
  chatReducer,
  initialChatState,
  isDraftOpen,
  requestMessages,
  transcriptMessages,
  type ChatAction,
  type ChatState,
  type DraftFailure,
} from './chat-reducer';
import type { TokenClient } from './use-turnstile-token';

export type ContactFields = Pick<ContactRequest, 'name' | 'email' | 'message'>;
export type ContactTokens = Pick<TokenClient, 'getToken' | 'refresh'>;

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
  readonly send?: typeof postContact;
}

export interface AgentChat {
  readonly state: ChatState;
  readonly setInput: (value: string) => void;
  readonly ask: (question: string) => Promise<void>;
  /** Asks the question of the failed reply `id` again. */
  readonly retry: (id: number) => Promise<void>;
  /** Posts the draft of reply `id` with the card's fields; `tokens` carry the contact action. */
  readonly sendDraft: (id: number, fields: ContactFields, tokens: ContactTokens) => Promise<void>;
  readonly cancelDraft: (id: number) => void;
}

/** The daily cap lasts until midnight UTC, so it offers no retry; everything else does. */
export function failureReply(error: AskFailure | null, errors: AskErrorCopy): Extract<ChatAction, { type: 'fail' }> {
  if (error === 'daily_cap') return { type: 'fail', text: errors.dailyCap, retryable: false };
  return { type: 'fail', text: error === 'rate_limited' ? errors.rateLimited : errors.fallback, retryable: true };
}

/**
 * No retry where it cannot help: the caps and the switch last, and the limiter is meant to slow a
 * visitor down. After a timeout the message may already be in Denis's inbox, so a retry could
 * send it twice. Everything else, a missing token included, sent nothing and may be tried again.
 */
export function contactFailure(error: ContactFailure | null): DraftFailure {
  switch (error) {
    case 'daily_cap':
      return 'dailyCap';
    case 'rate_limited':
      return 'rateLimited';
    case 'unavailable':
      return 'unavailable';
    case 'timeout':
      return 'timeout';
    default:
      return 'failed';
  }
}

export function useAgentChat({ lang, errors, tokens, post = postAsk, send: sendContact = postContact }: AgentChatOptions): AgentChat {
  const [state, dispatch] = useReducer(chatReducer, initialChatState);
  const committed = useRef(state);
  // Set synchronously on ask and released only once a non-loading state is committed, so a second
  // question can neither overlap a request nor read a history that misses the previous reply.
  const busy = useRef(false);
  const request = useRef<AbortController | null>(null);
  const contactRequests = useRef(new Map<number, AbortController>());

  useLayoutEffect(() => {
    committed.current = state;
    if (!state.loading) busy.current = false;
  });

  useEffect(() => {
    const contacts = contactRequests.current;
    return () => {
      request.current?.abort();
      for (const controller of contacts.values()) controller.abort();
    };
  }, []);

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
      dispatch(reply === null ? failureReply(error, errors) : { type: 'reply', text: reply.reply, sig: reply.sig, draft: reply.draft });
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

  const sendDraft = useCallback(
    async (id: number, fields: ContactFields, contactTokens: ContactTokens) => {
      const draft = committed.current.messages.find((m) => m.id === id)?.draft;
      // The map also stops a second click that lands before the sending state is committed.
      if (!draft || !isDraftOpen(draft) || contactRequests.current.has(id)) return;
      const controller = new AbortController();
      contactRequests.current.set(id, controller);
      const messages = transcriptMessages(committed.current.messages, id);
      dispatch({ type: 'draft', id, status: 'sending' });

      let outcome: ContactOutcome | null = null;
      try {
        const turnstileToken = await contactTokens.getToken();
        outcome = await sendContact({ lang, turnstileToken, ...fields, messages }, { signal: controller.signal });
      } catch {
        // Token deadline, script or widget failure: nothing was sent, so the retryable copy covers it.
      }
      contactRequests.current.delete(id);
      if (controller.signal.aborted) return;
      if (outcome?.ok) {
        dispatch({ type: 'sent', id, email: fields.email, reply: outcome.reply, sig: outcome.sig });
        return;
      }
      const failure = contactFailure(outcome?.error ?? null);
      // A fresh token is worth fetching only when the visitor may send again.
      if (failure === 'failed') contactTokens.refresh();
      dispatch({ type: 'failed', id, failure });
    },
    [lang, sendContact],
  );

  const cancelDraft = useCallback((id: number) => dispatch({ type: 'draft', id, status: 'cancelled' }), []);

  return { state, setInput, ask, retry, sendDraft, cancelDraft };
}
