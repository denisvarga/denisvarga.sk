-- Marks a model call that proposed a contact message instead of answering: such a row has outcome
-- 'ok', reply_kind 'handoff_draft' and no answer, because the draft is never stored. NULL on every
-- other row. Nullable and without a CHECK, so older rows and the previous Worker version keep
-- working and a later kind needs no table rebuild.
ALTER TABLE chat_log ADD COLUMN reply_kind TEXT;
