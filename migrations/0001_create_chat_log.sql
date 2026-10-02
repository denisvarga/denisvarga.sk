-- One row per model call reservation. No IP, user agent, session or any visitor identifier.
CREATE TABLE chat_log (
  id INTEGER PRIMARY KEY,
  created_at INTEGER NOT NULL,
  lang TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  model TEXT,
  latency_ms INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  outcome TEXT NOT NULL CHECK (outcome IN ('pending', 'ok', 'truncated', 'refused', 'error', 'capped', 'unavailable_quota'))
);

CREATE INDEX idx_chat_log_created_at ON chat_log (created_at);
