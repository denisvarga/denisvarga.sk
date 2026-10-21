-- Model calls per client per UTC day. key is an HMAC of the UTC day and the client network (IPv4
-- address or IPv6 /64), so it never holds the address and cannot be linked across days. The daily
-- retention cron deletes rows older than yesterday, so a key is gone within three days.
CREATE TABLE client_quota (
  day INTEGER NOT NULL,
  key TEXT NOT NULL,
  n INTEGER NOT NULL,
  PRIMARY KEY (day, key)
);
