-- Ties each logged answer to the prompt revision that produced it and records how many input
-- tokens were billed as prompt cache reads and writes. Nullable, so older rows and the previous
-- Worker version keep working.
ALTER TABLE chat_log ADD COLUMN prompt_version TEXT;
ALTER TABLE chat_log ADD COLUMN cached_tokens INTEGER;
ALTER TABLE chat_log ADD COLUMN cache_write_tokens INTEGER;
