# G01 fresh r12 — corrected HTTPS source/log preflight

Status: fixed after terminal r11 preflight and before any r12 network request. The 24 metadata IDs and order remain sealed at SHA-256 `67a8e940d6635ab332d1ec639cfe7d76dccb86582faf76857fe8bd1d09b390bd`. R11 remains failed; its exact receipt is SHA-256 `70f53d84c6c0c6a64524880a1fba6a2407c640246fcfafc571e2c989335b18b0`. No labels, scores, rankings, or model calls have been opened for these 24.

Repeat all 24 preflight slots exactly once in original order, with HTTPS-only redirects, TLS verification, 10-second connection and 45-second request limits, and no automatic retry. Correct only the HEAD handling: do **not** apply `curl --max-filesize` to source or raw-log HEAD requests. HEAD transfers only response headers; the raw-log `Content-Length` itself is the admission measurement. Preserve source HTTP 200, strict job/repository page identity over HTTPS, raw-log HTTP 200 and integer `Content-Length` in `(0, 8 MiB]`, then a single capped raw-log GET of at most 8 MiB with HTTP 200, exact length match and strict UTF-8. Preserve all attempted responses as private compressed evidence and report every failure. Do not inspect passing source or labels.

If fewer than 24 pass, stop r12; do not shrink the denominator or silently replace slots. Any repair is a separately versioned score-blind source-order operation. The r12 result remains source/log availability only, not a benchmark score or superiority claim.

## Open Questions

- Which r11 failures remain after the HEAD-only correction?
- Are the remaining failures source 404, page identity, or log-body integrity issues needing distinct score-blind repair?
