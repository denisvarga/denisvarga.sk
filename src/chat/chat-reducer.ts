import {
  MAX_ASSISTANT_CONTENT,
  MAX_MESSAGES,
  MAX_TOTAL,
  MAX_USER_CONTENT,
  type AskMessage,
  type AskRole,
  type ContactDraft,
} from '../../shared/ask-contract';

export type DraftStatus = 'pending' | 'sending' | 'sent' | 'failed' | 'cancelled';

/** A proposed message for Denis and where the visitor is with it; edits live in the card. */
export interface DraftState {
  readonly proposal: ContactDraft;
  readonly status: DraftStatus;
  /** Address the sent copy names. */
  readonly sentTo?: string;
  /** Signed confirmation from /api/contact, sent back right after the draft turn. */
  readonly confirmation?: { readonly text: string; readonly sig: string };
}

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
  /** Set on a reply that proposes a message for Denis; the log shows the confirm card for it. */
  readonly draft?: DraftState;
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
  | { readonly type: 'reply'; readonly text: string; readonly sig?: string; readonly draft?: ContactDraft }
  | { readonly type: 'fail'; readonly text: string; readonly retryable: boolean }
  /** Removes the failed reply `id` and its question, then asks that question again. */
  | { readonly type: 'retry'; readonly id: number }
  | { readonly type: 'draft'; readonly id: number; readonly status: 'sending' | 'failed' | 'cancelled' }
  | { readonly type: 'sent'; readonly id: number; readonly email: string; readonly reply: string; readonly sig: string };

/** Statuses each draft status may be entered from; `sent` and `cancelled` are final. */
const DRAFT_FROM: Readonly<Record<DraftStatus, readonly DraftStatus[]>> = {
  pending: [],
  sending: ['pending', 'failed'],
  failed: ['sending'],
  cancelled: ['pending', 'failed'],
  sent: ['sending'],
};

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

function updateDraft(state: ChatState, id: number, next: DraftStatus, patch: Partial<DraftState> = {}): ChatState {
  const index = state.messages.findIndex((m) => m.id === id);
  const draft = state.messages[index]?.draft;
  if (!draft || !DRAFT_FROM[next].includes(draft.status)) return state;
  const messages = state.messages.map((m, i) => (i === index ? { ...m, draft: { ...draft, ...patch, status: next } } : m));
  return { ...state, messages };
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
      return appendAssistant(state, {
        text: action.text,
        failed: false,
        ...(action.sig ? { sig: action.sig } : {}),
        ...(action.draft ? { draft: { proposal: action.draft, status: 'pending' } } : {}),
      });
    case 'fail':
      return appendAssistant(state, { text: action.text, failed: true, ...(action.retryable ? { retryable: true } : {}) });
    case 'draft':
      return updateDraft(state, action.id, action.status);
    case 'sent':
      return updateDraft(state, action.id, 'sent', { sentTo: action.email, confirmation: { text: action.reply, sig: action.sig } });
  }
}

function clamp(role: AskRole, text: string, sig: string | undefined): AskMessage {
  const content = text.slice(0, role === 'user' ? MAX_USER_CONTENT : MAX_ASSISTANT_CONTENT);
  // The signature covers the full reply, so a clamped one goes unsigned instead of failing it.
  return sig && content === text ? { role, content, sig } : { role, content };
}

/** Failed replies go with their questions, so retries are not sent twice; a sent draft adds its confirmation. */
function historyTurns(history: readonly ChatMessage[]): AskMessage[] {
  return history
    .filter((m, i) => !m.failed && !(m.role === 'user' && history[i + 1]?.failed))
    .flatMap((m) => {
      const turn = clamp(m.role, m.text, m.sig);
      const sent = m.draft?.confirmation;
      return sent ? [turn, clamp('assistant', sent.text, sent.sig)] : [turn];
    });
}

/**
 * The last MAX_MESSAGES turns, oldest dropped while the total exceeds MAX_TOTAL, then starting at
 * a question, because the server drops a reply whose question was cut off.
 */
function recentWindow(turns: readonly AskMessage[]): AskMessage[] {
  const recent = turns.slice(-MAX_MESSAGES);
  let total = recent.reduce((sum, m) => sum + m.content.length, 0);
  while (total > MAX_TOTAL && recent.length > 1) {
    total -= recent.shift()?.content.length ?? 0;
  }
  while (recent.length > 1 && recent[0]?.role === 'assistant') recent.shift();
  return recent;
}

/**
 * Payload history for a new question: each turn clamped to its role limit (assistant turns keep
 * their signature) within the recent window. The question itself is always the last entry.
 */
export function requestMessages(history: readonly ChatMessage[], question: string): AskMessage[] {
  return recentWindow([...historyTurns(history), { role: 'user', content: question.trim().slice(0, MAX_USER_CONTENT) }]);
}

/**
 * The conversation sent with a contact message: the recent window ending at the draft `id`, so the
 * confirmation is signed for the question the draft answers and fits right after it in the history.
 */
export function transcriptMessages(history: readonly ChatMessage[], id: number): AskMessage[] {
  const end = history.findIndex((m) => m.id === id);
  return end < 0 ? [] : recentWindow(historyTurns(history.slice(0, end + 1)));
}
