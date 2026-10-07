# G01 fresh r11 — preflight terminal result and diagnosed HEAD-cap bug

Status, 2026-10-04: **r11 preflight failed at 4/24 admitted; no ranking, GLM call, label access, or claim.** The fixed 24-case metadata cohort is SHA-256 `67a8e940d6635ab332d1ec639cfe7d76dccb86582faf76857fe8bd1d09b390bd`. All 24 HTTPS source/log preflight slots were attempted in order. The private `fresh-r11/preflight/PREFLIGHT-RESULT.json` receipt is SHA-256 `70f53d84c6c0c6a64524880a1fba6a2407c640246fcfafc571e2c989335b18b0`.

The admission failure is substantially explained by an implementation error: the runner passed a 64 KiB `--max-filesize` limit to raw-log **HEAD**. `curl` exit code 63 appeared in **19/24** raw-log HEAD receipts even though their HTTP response was 200 and `Content-Length` was between 76,868 and 4,498,770 bytes—within the protocol's 8 MiB body limit. Four smaller logs passed all checks; one other small-log case failed page identity. Two cases also had failed-commit source HTTP 404. Five pages failed the strict job/repository identity check. These counts overlap and are not alternative denominators.

Do not reinterpret r11 as admitted or score only the four passing slots. A separately fixed r12 preflight must omit the transfer-size cap for HEAD while preserving the same cohort, HTTPS identity checks, 8 MiB GET cap, exact content-length comparison, full 24-case denominator, and all r11 receipts. It may reveal additional real failures; any case replacement requires a later score-blind version.

## Open Questions

- After correcting HEAD handling, how many cases truly pass source, page, and log admission?
- Can any remaining failures be replaced in the fixed source order without label or score access?
