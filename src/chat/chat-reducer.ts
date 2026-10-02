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
  | { readonly type: 'reply'; readonly text: string }
  | { readonly type: 'fail'; readonly text: string };

export const initialChatState: ChatState = {
  messages: [],
  input: '',
  loading: false,
  typingId: null,
  nextId: 1,
};

function appendAssistant(state: ChatState, text: string, failed: boolean): ChatState {
  if (!state.loading) return state;
  const id = state.nextId;
  return {
    ...state,
    messages: [...state.messages, { id, role: 'assistant', text, failed }],
    loading: false,
    typingId: id,
    nextId: id + 1,
  };
}

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'input':
      return { ...state, input: action.value };
    case 'ask': {
      const text = action.text.trim();
      if (!text || state.loading) return state;
      const id = state.nextId;
      return {
        messages: [...state.messages, { id, role: 'user', text, failed: false }],
        input: '',
        loading: true,
        typingId: null,
        nextId: id + 1,
      };
    }
    case 'reply':
      return appendAssistant(state, action.text, false);
    case 'fail':
      return appendAssistant(state, action.text, true);
  }
}

function clamp(message: ChatMessage): AskMessage {
  const limit = message.role === 'user' ? MAX_USER_CONTENT : MAX_ASSISTANT_CONTENT;
  return { role: message.role, content: message.text.slice(0, limit) };
}

/**
 * Payload history for a new question: failed replies dropped, the last MAX_MESSAGES kept, each
 * turn clamped to its role limit, and oldest turns dropped while the total exceeds MAX_TOTAL.
 * The question itself is always the last entry.
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
  return recent;
}
