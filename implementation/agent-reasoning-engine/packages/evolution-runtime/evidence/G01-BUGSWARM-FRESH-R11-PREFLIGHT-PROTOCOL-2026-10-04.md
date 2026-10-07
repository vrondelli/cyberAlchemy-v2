# G01 fresh r11 — HTTPS source/log preflight

Status: fixed before r11 network preflight. Input is the 24-case metadata-only cohort SHA-256 `67a8e940d6635ab332d1ec639cfe7d76dccb86582faf76857fe8bd1d09b390bd`. This phase opens neither passing-commit source nor patch labels and makes no ranking or model call.

Attempt every sealed case exactly once in order from private WSL storage, with TLS verification, HTTPS-only redirects, 10-second connection timeout, 45-second request timeout, and no automatic retries. For the exact failed commit, request the GitHub codeload tarball by `HEAD` and require HTTP 200. For the failure job, request the BugSwarm artifact page and require HTTP 200 plus a strict GitHub Actions or Travis-CI job-and-repository identity match in the page header. Request the raw log by `HEAD`; require HTTP 200 and an integer `Content-Length` in `(0, 8 MiB]`. Only then request the raw log once, at most 8 MiB, and require HTTP 200, exact `Content-Length` equality, and strict UTF-8. Preserve each attempted page, HEAD response, and log body (including partial/failing bodies) as private compressed evidence with byte hashes and per-case receipts. Do not print log text or credentials.

Admit a slot only if all source, page, and raw-log checks pass. Report all 24 attempts and the exact failures. If fewer than 24 pass, stop this r11 admission version—do not score a smaller denominator, retry selectively, or substitute a case in place. A separately versioned score-blind repair may traverse the original source order after this result, excluding all previously selected and attempted repositories.

## Open Questions

- How many of the 24 metadata candidates have exact failed commits and authenticated original logs within the cap?
- Are any failures recoverable by a prospective source/log repair without inspecting labels or scores?
