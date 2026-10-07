# G01 fresh r13 — bounded authenticated page-header admission

Status: fixed after r12's terminal 10/24 receipt and before r13 adjudication or new network requests. The 24 metadata cases remain SHA-256 `67a8e940d6635ab332d1ec639cfe7d76dccb86582faf76857fe8bd1d09b390bd`; r12 receipt is SHA-256 `da3767a0e46462db27e0891587ad3562ad4a5384b6ae6eeb688d8ed258a04585`. No labels, rankings, or model outputs have been opened for this cohort.

R13 changes only the artifact-page identity proof. A page need not finish transmitting its irrelevant embedded log, but its TLS-validated HTTPS response must be HTTP 200 and its bounded returned bytes must decode as strict UTF-8 and contain, **before the complete `View raw log` marker**, the exact GitHub Actions or Travis-CI job ID and repository link using the r12 strict matcher. Require the marker to be present; a mere unclosed prefix is insufficient. `curl` exit 56 may be accepted for this page-header proof only when these conditions hold. Preserve the exact partial-page bytes, hash, HTTP status, exit code, and reason. R12 pages that already meet this rule are reused byte-for-byte; pages with zero body get exactly one fresh HTTPS GET, with no `--max-filesize` restriction because only a bounded prefix is relevant. Stop the request when at most 64 KiB of body have been received; preserve that prefix. Do not retry.

Exact failed-source HEAD must still return 200. Raw-log HEAD must still return 200 with integer `Content-Length` in `(0, 8 MiB]`; a raw-log GET must return 200, exit 0, strict UTF-8, and exact length match. Reuse r12's complete raw-log body where available, or make exactly one capped raw-log GET for a newly page-admitted case. Preserve all 24 per-case receipts and complete body hashes in private WSL. No passing source, patch label, score, or model call enters this phase. If fewer than 24 cases pass, stop r13 and use a separately frozen score-blind source-order replacement; never score a partial denominator.

## Open Questions

- How many page failures are resolved by a complete authenticated identity prefix plus complete raw log?
- Which slots still need score-blind replacement for source 404 or missing identity?
