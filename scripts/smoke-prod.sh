#!/usr/bin/env bash
# Production smoke test for denisvarga.sk (Slovak) and denisvarga.dev (English).
#   pnpm smoke
#   CONNECT_IP=104.21.65.48 pnpm smoke   # pin every request to one Cloudflare edge IP
# Each host gets 3 requests to /api/ask; 4 POSTs in total pass the Worker limiter (5 per IP per
# minute, shared by both hosts), so run it at most once a minute.
set -euo pipefail

HOSTS="denisvarga.sk denisvarga.dev"
EN_ROOT="https://denisvarga.dev/"
EGG_BODY='{"messages":[{"role":"user","content":"whoami"}],"lang":"sk","turnstileToken":"x"}'
DUMMY_BODY='{"messages":[{"role":"user","content":"What does Denis build?"}],"lang":"en","turnstileToken":"XXXX.DUMMY.TOKEN.XXXX"}'

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAILS=0
STATUS=""
LABEL=""

pass() { printf 'PASS  %s\n' "$1"; }
fail() {
  printf 'FAIL  %s (%s)\n' "$1" "$2"
  FAILS=$((FAILS + 1))
}

# request <label> <host> <url> [curl args...]: sets STATUS, writes $TMP/headers and $TMP/body.
request() {
  LABEL="$1"
  local host="$2" url="$3"
  shift 3
  local pin=()
  if [[ -n "${CONNECT_IP:-}" ]]; then
    pin=(--connect-to "$host:443:$CONNECT_IP:443")
  fi
  : >"$TMP/headers"
  : >"$TMP/body"
  STATUS="$(curl -sS --max-time 20 ${pin[@]+"${pin[@]}"} -o "$TMP/body" -D "$TMP/headers" -w '%{http_code}' "$@" "$url")" || STATUS="000"
}

header() {
  { grep -i "^$1:" "$TMP/headers" || true; } | tail -n 1 | cut -d: -f2- | tr -d '\r' | sed 's/^ *//'
}

expect_status() {
  if [[ "$STATUS" == "$1" ]]; then pass "$LABEL -> $1"; else fail "$LABEL -> $1" "got $STATUS"; fi
}

expect_header() {
  local value
  value="$(header "$1")"
  if [[ -n "$value" ]]; then pass "$LABEL has $1"; else fail "$LABEL has $1" "missing"; fi
}

expect_location() {
  local value
  value="$(header location)"
  if [[ "$value" == "$1" ]]; then pass "$LABEL Location $1"; else fail "$LABEL Location $1" "got '${value}'"; fi
}

expect_no_store() {
  if header cache-control | grep -qi 'no-store'; then pass "$LABEL cache-control no-store"; else fail "$LABEL cache-control no-store" "got '$(header cache-control)'"; fi
}

expect_hsts_without_subdomains() {
  local value
  value="$(header strict-transport-security)"
  if printf '%s' "$value" | grep -qi 'includesubdomains'; then
    fail "$LABEL HSTS without includeSubDomains" "got '$value'"
  else
    pass "$LABEL HSTS without includeSubDomains${value:+ ($value)}"
  fi
}

expect_body() {
  if grep -Eq "$1" "$TMP/body"; then pass "$LABEL body matches $1"; else fail "$LABEL body matches $1" "not found"; fi
}

for host in $HOSTS; do
  lang="sk"
  if [[ "$host" == "denisvarga.dev" ]]; then lang="en"; fi
  base="https://$host"
  echo "== $host"

  request "$host GET /" "$host" "$base/"
  expect_status 200
  expect_body "<html[^>]* lang=\"$lang\""
  expect_header content-security-policy
  expect_hsts_without_subdomains

  request "$host GET /en/" "$host" "$base/en/"
  expect_status 301
  expect_location "$EN_ROOT"

  request "$host GET /nope" "$host" "$base/nope"
  expect_status 404

  request "$host GET /.well-known/security.txt" "$host" "$base/.well-known/security.txt"
  expect_status 200

  request "www.$host GET /a?b=1" "www.$host" "https://www.$host/a?b=1"
  expect_status 301
  expect_location "$base/a?b=1"

  request "$host GET /api/ask (WAF)" "$host" "$base/api/ask"
  expect_status 403
  expect_hsts_without_subdomains

  request "$host POST /api/ask whoami" "$host" "$base/api/ask" \
    -X POST -H "Origin: $base" -H 'Content-Type: application/json' --data "$EGG_BODY"
  expect_status 200
  expect_body '"kind":"easter_egg"'
  expect_body '"sig":"[A-Za-z0-9_-]+"'
  expect_no_store
  expect_hsts_without_subdomains

  request "$host POST /api/ask dummy Turnstile token" "$host" "$base/api/ask" \
    -X POST -H "Origin: $base" -H 'Content-Type: application/json' --data "$DUMMY_BODY"
  expect_status 403
  expect_body '"error":"verification_failed"'
  expect_no_store
  expect_hsts_without_subdomains
done

if ((FAILS > 0)); then
  echo "$FAILS check(s) failed"
  exit 1
fi
echo "All checks passed"
