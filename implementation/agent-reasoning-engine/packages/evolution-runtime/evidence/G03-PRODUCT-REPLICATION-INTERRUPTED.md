# G03 LongMemEval-S product replication — interrupted, not scored

Status: **incomplete**, 2026-09-27. No G03 accuracy or product-page superiority result exists from this 80-question cohort. A separately frozen r2 cohort was subsequently attempted and also failed before scoring; see [the r2 attempt note](G03-PRODUCT-REPLICATION-R2-ATTEMPT.md).

The source-only cohort at `/opt/are/evolution-runtime/g03-product-replication-r1/source/manifest.json` fixed 80 questions across six types before generation. The initial `/output` attempt stopped after three pre-model gateway process-limit failures. Raising the gateway cgroup limit from 64 to 128 allowed a same-cohort run at `/opt/are-benchmark-runs/longmemeval-product80-20260927-v1/output-pids128-r2` to complete **56/80** questions with two answers and fully reconciled usage (7,929,188 known model tokens). An SSH transport timeout then killed that attached process; tasks 57 and 58 had partial trails. The [recovery freeze](G03-RECOVERY-FREEZE.json) binds the 56 completed receipts and records 23 completed model calls (88,395 known tokens) plus one unsettled dispatched call for question 57, and an unsettled tokenizer call for question 58.

A separate, durable system-service recovery at `/opt/are-benchmark-runs/longmemeval-product80-20260927-v1/output-resume-r3` was stopped after the first provider rejections. Its task 57 attempt was partial when stopped (14 completed model calls, 53,396 known tokens, one unsettled dispatched call). Task 58 made one completed model call (1,665 known tokens) before a provider HTTP 400 with unknown usage; tasks 59 and 60 failed during tokenizer planning with HTTP 400 and no model calls. A source-only tokenizer diagnostic reproduced HTTP 400 / business code **1301** on question 59; it printed only status/error metadata, not source text or credentials. [Z.AI's official error reference](https://docs.z.ai/api-reference/api-code) identifies 1301 as a potentially unsafe or sensitive content rejection. We did not alter the rejected content or continue sending the remaining frozen cohort after identifying that safety boundary.

The completed 56-question prefix is not a prespecified standalone cohort, and partial attempts have unknown all-in usage. The strict 80-question reference projection and native scorer were **not** run; evaluator references remain unopened. Neither a 56-question accuracy number nor an 80-question quality/cost claim should be placed on the product page. The [post-generation runbook](G03-PRODUCT-REPLICATION-SCORING-RUNBOOK.md) remains a procedure for a future admitted cohort, not a claim that this one completed.

The three local attempt directories are preserved in a verified, private [content-addressed archive](G03-ARCHIVE-MANIFEST.json) on the VPS. The raw source directories also remain intact; nothing was deleted. The archive does not by itself include the separately frozen source manifest or recovery-freeze JSON, which are linked above.

The r2 campaign used a newly frozen, independently selected source-only cohort without altering this one, but also encountered tokenizer HTTP 400. A future campaign would need an explicit provider-eligibility policy or different provider, rather than silently replacing these questions or modifying their content. The original and recovery receipts remain linked as failed-attempt evidence.

## Open Questions

- Which explicit provider-eligibility policy or different provider should govern a future G03 cohort, if any?
- Can the provider state which source-only questions are ineligible without revealing or transforming the rejected content?
- What retention and reviewer access should apply to the private partial-attempt archives?
