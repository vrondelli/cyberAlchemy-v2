# G01 fresh r13 — authenticated page-header result

Status, 2026-10-04: **r13 stopped at 11/24 source/log-admitted cases; no labels, rankings, or GLM calls.** The fixed 24 metadata identities remained unchanged. The private `fresh-r11/header-r13/RESULT.json` is SHA-256 `8359293ecb0b33b1b9bc6a24c686c270eb591134afecd6f1db5e4400fd683569`.

All 24 cases had an authenticated BugSwarm page prefix with exact job/repository identity and a complete `View raw log` marker under the [prospective r13 rule](G01-BUGSWARM-FRESH-R13-HEADER-ADMISSION-PROTOCOL-2026-10-04.md). Eleven source and page identities nevertheless failed raw-log integrity: HTTPS returned HTTP 200 but `curl` exit 56 after only **32,571–32,572 bytes**, short of the advertised `Content-Length`. Two further failed-commit source HEAD requests returned 404. Eleven cases had complete, length-matched, strict-UTF-8 raw logs and exact source availability. R13 therefore failed its whole-denominator admission condition and must not be scored as 11/24.

A read-only probe of one failed raw-log URL from the VPS also returned HTTP 200 then `curl` exit 56 after **65,339 bytes**, still short of its declared 1,197,708 bytes. This is not merely a WSL transport path problem. No truncated log is admitted as complete. The next separate version must either recover complete original logs from an independent authenticated source or make score-blind repository-disjoint replacements in the fixed failure-side order, preserving every attempt and the 24-case denominator.

## Open Questions

- Is there an authenticated independent log endpoint that supplies exact complete bytes for these eleven jobs?
- How many score-blind source-order candidates are needed to replace the thirteen non-admitted slots?
- Does availability selection affect the scope of any eventual bounded claim?
