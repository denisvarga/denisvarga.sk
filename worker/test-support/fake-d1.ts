import { FINALIZE_SQL } from '../ask/chat-log';
import { COUNT_TODAY_SQL, INSERT_PENDING_SQL, MARK_CAPPED_SQL } from '../ask/daily-cap';

export interface ChatRow {
  id: number;
  created_at: number;
  lang: string;
  question: string;
  answer: string | null;
  model: string | null;
  latency_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  outcome: string;
}

const BILLABLE = new Set(['pending', 'ok', 'truncated', 'refused', 'error']);

/** Executes exactly the statements the Worker issues; anything else throws so new SQL cannot go untested. */
export class FakeD1 {
  rows: ChatRow[] = [];
  writes = 0;
  fail = false;

  seed(row: Partial<ChatRow> & Pick<ChatRow, 'outcome' | 'created_at'>): void {
    this.rows.push({
      id: this.rows.length + 1,
      lang: 'sk',
      question: 'seed',
      answer: null,
      model: null,
      latency_ms: null,
      input_tokens: null,
      output_tokens: null,
      ...row,
    });
  }

  private execute(sql: string, args: unknown[]): Record<string, unknown>[] {
    if (this.fail) throw new Error('D1_ERROR');
    switch (sql) {
      case INSERT_PENDING_SQL: {
        this.writes++;
        this.seed({ created_at: Number(args[0]), lang: String(args[1]), question: String(args[2]), outcome: 'pending' });
        return [{ id: this.rows.length }];
      }
      case COUNT_TODAY_SQL: {
        const since = Number(args[0]);
        const n = this.rows.filter((r) => r.created_at >= since && BILLABLE.has(r.outcome)).length;
        return [{ n: Math.min(n, Number(args[1])) }];
      }
      case MARK_CAPPED_SQL:
        this.writes++;
        this.update(Number(args[0]), { outcome: 'capped' });
        return [];
      case FINALIZE_SQL: {
        this.writes++;
        const [answer, model, latency_ms, input_tokens, output_tokens, outcome, id] = args;
        this.update(Number(id), {
          answer: answer as string | null,
          model: model as string | null,
          latency_ms: latency_ms as number | null,
          input_tokens: input_tokens as number | null,
          output_tokens: output_tokens as number | null,
          outcome: String(outcome),
        });
        return [];
      }
      default:
        throw new Error(`FakeD1: unexpected SQL ${sql}`);
    }
  }

  private update(id: number, patch: Partial<ChatRow>): void {
    const row = this.rows.find((r) => r.id === id);
    if (row) Object.assign(row, patch);
  }

  prepare(sql: string) {
    return {
      bind: (...args: unknown[]) => ({
        sql,
        args,
        run: async () => ({ success: true, results: this.execute(sql, args), meta: {} }),
      }),
    };
  }

  async batch(statements: { sql: string; args: unknown[] }[]) {
    return statements.map((s) => ({ success: true, results: this.execute(s.sql, s.args), meta: {} }));
  }

  asBinding(): D1Database {
    // Structural double covering only prepare/bind/run/batch; the full D1 surface is not needed here.
    return this as unknown as D1Database;
  }
}
