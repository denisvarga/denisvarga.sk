import {
  MAX_ASSISTANT_CONTENT,
  MAX_MESSAGES,
  MAX_TOTAL,
  MAX_USER_CONTENT,
  type AskMessage,
  type AskRole,
} from '../../shared/ask-contract';

export interface ChatMessage {
  readonly id: number;
  readonly role: AskRole;
  readonly text: string;
  /** Error copy shown in place of a reply; never sent back to the model. */
  readonly failed: boolean;
  /** Set on a failed reply whose question may be asked again from the log. */
  readonly retryable?: true;
  /** Server signature of an assistant reply, returned with it so the server trusts the turn. */
  readonly sig?: string;
}

export interface ChatState {
  readonly messages: readonly ChatMessage[];
  readonly input: string;
  readonly loading: boolean;
  /** Assistant message whose typewriter may still run; any new question completes it. */
  readonly typingId: number | null;
  readonly nextId: number;
}

export type ChatAction =
  | { readonly type: 'input'; readonly value: string }
  | { readonly type: 'ask'; readonly text: string }
  | { readonly type: 'reply'; readonly text: string; readonly sig?: string }
  | { readonly type: 'fail'; readonly text: string; readonly retryable: boolean }
  /** Removes the failed reply `id` and its question, then asks that question again. */
  | { readonly type: 'retry'; readonly id: number };

export const initialChatState: ChatState = {
  messages: [],
  input: '',
  loading: false,
  typingId: null,
  nextId: 1,
};

function appendAssistant(state: ChatState, reply: Omit<ChatMessage, 'id' | 'role'>): ChatState {
  if (!state.loading) return state;
  const id = state.nextId;
  return {
    ...state,
    messages: [...state.messages, { id, role: 'assistant', ...reply }],
    loading: false,
    typingId: id,
    nextId: id + 1,
  };
}

function startQuestion(state: ChatState, messages: readonly ChatMessage[], text: string): ChatState {
  const id = state.nextId;
  return { ...state, messages: [...messages, { id, role: 'user', text, failed: false }], loading: true, typingId: null, nextId: id + 1 };
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'input':
      return { ...state, input: action.value };
    case 'ask': {
      const text = action.text.trim();
      if (!text || state.loading) return state;
      return { ...startQuestion(state, state.messages, text), input: '' };
    }
    case 'retry': {
      const index = state.messages.findIndex((m) => m.id === action.id);
      const question = state.messages[index - 1];
      if (state.loading || !state.messages[index]?.retryable || question?.role !== 'user') return state;
      // The input is left alone: the visitor may be typing the next question.
      return startQuestion(
        state,
        state.messages.filter((_, i) => i !== index && i !== index - 1),
        question.text,
      );
    }
    case 'reply':
      return appendAssistant(state, { text: action.text, failed: false, ...(action.sig ? { sig: action.sig } : {}) });
    case 'fail':
      return appendAssistant(state, { text: action.text, failed: true, ...(action.retryable ? { retryable: true } : {}) });
  }
}

function clamp(message: ChatMessage): AskMessage {
  const limit = message.role === 'user' ? MAX_USER_CONTENT : MAX_ASSISTANT_CONTENT;
  const content = message.text.slice(0, limit);
  // The signature covers the full reply, so a clamped one goes unsigned instead of failing it.
  return message.sig && content === message.text
    ? { role: message.role, content, sig: message.sig }
    : { role: message.role, content };
}

/**
 * Payload history for a new question: failed replies dropped, the last MAX_MESSAGES kept, each
 * turn clamped to its role limit (assistant turns keep their signature), and oldest turns dropped
 * while the total exceeds MAX_TOTAL. The window then starts at a question, because the server
 * drops a reply whose question was cut off. The question itself is always the last entry.
 */
export function requestMessages(history: readonly ChatMessage[], question: string): AskMessage[] {
  // A failed reply takes its question with it, so retries are not sent twice.
  const turns = history.filter((m, i) => !m.failed && !(m.role === 'user' && history[i + 1]?.failed)).map(clamp);
  turns.push({ role: 'user', content: question.trim().slice(0, MAX_USER_CONTENT) });
  const recent = turns.slice(-MAX_MESSAGES);
  let total = recent.reduce((sum, m) => sum + m.content.length, 0);
  while (total > MAX_TOTAL && recent.length > 1) {
    total -= recent.shift()?.content.length ?? 0;
  }
  while (recent.length > 1 && recent[0]?.role === 'assistant') recent.shift();
  return recent;
}
