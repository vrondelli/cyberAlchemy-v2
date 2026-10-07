# G01 fresh r14 — score-blind 24-slot source/log repair

Status: fixed before r14 queue construction or network attempts. Inputs are the sealed fresh 24-case metadata cohort SHA-256 `67a8e940d6635ab332d1ec639cfe7d76dccb86582faf76857fe8bd1d09b390bd` and terminal r13 source/log result SHA-256 `8359293ecb0b33b1b9bc6a24c686c270eb591134afecd6f1db5e4400fd683569`. Eleven cases passed r13 and remain unchanged. Thirteen failed slots remain, five Python and eight Java. No label, score, rank, or model output for these 24 has been opened.

Reconstruct and verify r11's exact 134-repository exclusion set from its pinned metadata sources and 35 prior repair-attempt receipts. Also exclude all 24 r11 metadata repositories, including the thirteen failed ones. For each language, continue the original sealed failure-side source order **after** the last r11 selected position (Python 214, Java 745). Keep only unchanged metadata-eligible cases in previously unused repositories; take at most one candidate per repository. Seal the complete per-language replacement queue and all input hashes before network access. No patch, passing-commit source, original log, or score may influence queue order. If the remaining pool cannot fill the slots, record that fact rather than altering the order.

Process failed slots in original ordinal order. For each, attempt the next unused queue candidate of the same language exactly once until one passes or the queue is exhausted. Use TLS-validated HTTPS-only source HEAD for the exact failed commit; require HTTP 200. For BugSwarm page identity, fetch at most 64 KiB of authenticated body and require HTTP 200, strict UTF-8, the complete `View raw log` marker, and exact GitHub Actions or Travis-CI job/repository link before the marker. For raw log, require HTTPS HEAD 200 with integer `Content-Length` in `(0, 8 MiB]`, followed by one GET capped at 8 MiB that exits 0, returns HTTP 200, matches the declared length, and decodes as strict UTF-8. A partial log is never admitted. Preserve every attempted header, page prefix and log body privately with hashes, even when the attempt fails. Do not automatically retry a candidate or switch networks based on an observed outcome.

Keep the eleven r13 admitted slots by hash reference; a replaced slot records its original failed identity and complete ordered attempt history. Stop if any slot cannot be filled. A 24/24 r14 result proves only source/log availability; exact source archives, code projection, authenticated evaluator labels, frozen rank/packet/model predictions and whole-cohort scoring remain separate gates. Any eventual claim must disclose availability selection and full cost.

## Open Questions

- Does the remaining metadata population contain enough complete-log cases to fill all thirteen slots?
- How many source-order attempts and bytes does score-blind repair require?
- Can the final 24 survive exact archive and evaluator-label admission without outcome-based substitution?
