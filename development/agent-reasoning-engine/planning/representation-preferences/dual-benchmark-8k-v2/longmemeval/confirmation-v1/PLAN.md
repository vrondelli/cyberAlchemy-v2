# Untouched long-history confirmation prerequisite

Status: source-only cohort candidate; **not admitted as genuinely long, not frozen, and no provider calls**. Four reserved tasks are available, but no existing measured-token metadata establishes that any exceeds 8,000 original-history tokens. This package exposes the gap rather than substituting byte counts for long-history qualification.

## Candidate and exposure boundary

[cohort-candidate.json](cohort-candidate.json) binds the existing source-only projection, provenance catalog and ten prior schedule/manifest files. The source projection contains eight rows with only task ID, split, question/date, history and source-record hash. Histories contain dated role/content messages and session identifiers; no answer/reference fields occur in that projection. The union of task IDs from the bound execution manifests excludes all four original development tasks. No outcome or judge artifacts were consulted.

The remaining four reserved candidates, ordered by metadata stratum then ID, are:

| Task | Existing metadata stratum | Original-history token qualification |
| --- | --- | --- |
| `longmemeval:09ba9854_abs` | abstention | needs real tokenizer |
| `longmemeval:06db6396` | knowledge update | needs real tokenizer |
| `longmemeval:cc06de0d` | multi-session | needs real tokenizer |
| `longmemeval:54026fce` | single-session preference | needs real tokenizer |

The deterministic rule first excludes previously scheduled task IDs, prefers existing measured histories strictly greater than 8,000 tokens, then takes one candidate per metadata stratum in sorted order before filling to four. There are no previously measured-long eligible rows, so all four remaining reserved rows are selected without ranking by history size, question content, difficulty or performance. Denominators are eight source rows, four excluded, four eligible and four provisional candidates. A later two-arm, one-repetition run would have eight planned answer slots; this is not permission to run them.

“Untouched” here means absent from the enumerated execution manifests and not used for outcome-based tuning in this preparation. The rows were already reserved and materialized, and this review inspected source metadata and hashes. This does not prove that no external actor ever saw them. Re-audit the exposure manifests immediately before confirmation; candidate status does not reserve them against other concurrent work.

## Provenance and full-history gap

The existing provenance catalog identifies the oracle-evidence-only variant of `xiaowu0162/longmemeval-cleaned`, revision `98d7416c24c778c2fee6e6f3006e7a073259d48f`, with upstream record hashes and an inherited MIT license declaration. Preserve that catalog, its attribution and individual source hashes. This preparation did not independently re-audit the upstream license or access the network.

With explicit coordinator permission, a local program inspected the schema of `/tmp/are-longmem-oracle.json` and projected only question ID/type/question/date and dated role/content history. No answer or reference-answer values were emitted, selected on, or exposed to model context. Its exact file SHA-256 is `821a2034d219ab45846873dd14c14f12cfe7776e73527a483f9dac095d38620c`. It contains 500 rows, each with the six allowed source fields; session-count distribution is 176 rows with one, 250 with two, 41 with three, 19 with four, 11 with five and three with six sessions. Histories range from 2 to 72 turns. The allowed source fields of all eight pinned oracle projections match exactly. This is consistent with, and bound to, the existing oracle source; it is **not evidence of a local full-history `longmemeval_s` dataset**.

The raw file's schema also names evaluator-only answer fields, so it must never be supplied directly to a generator. The original mixed file was parsed only by the permitted offline whitelist program; no answer values were inspected or output. Any later projection must additionally strip nested message annotations, retaining role/content only and date, with safe positional session identifiers rather than answer-linked labels. No large upstream dataset is copied here.

The [full-history source research](FULL-HISTORY-SOURCE.md) identifies the exact pinned S object and a bounded streaming plan. Acquisition and instrumentation remain pending; no further user permission is required for this already-authorized research. The missing local prerequisite for broad long-history confirmation is a pinned, licensed, source-only projection of genuine full histories, containing stable question IDs/types, question/date, dated role/content sessions and source hashes, with all evaluator labels removed and separately sealed. It also needs real target-model original-history token measurements. The local 500-row oracle file offers a larger oracle-only pool, not full-history stress. Its remaining 496 IDs have not been selected or tokenizer-qualified in this package.

## Comparisons and decisions still pending

For the original efficiency objective, the candidate comparison is unchanged sequential whole-history compact notes from [v1](../../../dual-benchmark-8k-v1/longmemeval/adapter.mjs) versus deterministic archived-source retrieval plus the common [v2 scope policy](../adapter.mjs). Both must receive the same applicable answer policy if the intended causal difference is memory handling; otherwise policy and retrieval effects are confounded. A narrower alternative compares v1 retrieval policy with v2 scope policy on identical projected evidence, following [the scope runner](../RUNNER.md). That alternative confirms only the policy mechanism and cannot establish whole-trajectory 15% savings.

Before any live use, the coordinator must choose that comparison, validate a source-only cohort with four histories strictly above 8,000 measured tokens, review chunking/projection compatibility with longer histories, and select exact repetitions and total budgets. The current runners hard-code the old development cohort; they cannot silently relabel these reserved rows as development. Add a separately reviewed confirmation adapter and freeze all source/prompt/code/scorer bindings. Every actual prompt plus reserved output must fit exactly 8,000 tokens; the original full history may exceed that window and require sequential exposure or retrieval.

Use a separately bound blind native judge with an explicit budget. Keep references solely in that scorer process. Count all ingestion, answer, reasoning, cached input, failed calls and judge usage; preserve every planned slot and unknown reservation. Confirmation must preserve completion and satisfy the declared native quality gate and at least 15% total input/output savings on the full comparison. Four qualified tasks remain a bounded confirmation cohort, not proof of full-benchmark perfection.

## Next order and open questions

1. Review this source-only candidate and its exposure exclusions; do not infer long qualification from the recorded byte counts.
2. Prepare the bounded tokenizer-only eligibility instrumentation, or obtain the safe full-history projection first under the already-authorized benchmark research. If these four do not qualify, do not replace them based on outcomes or call them long: specify a new deterministic source-only selection before any generation.
3. Freeze the scientific comparison, compatible adapter, cohort, budgets, independent scorer and failure accounting; only then consider dispatch.

Do any reserved oracle histories exceed the target-model threshold? Is the intended confirmation specifically oracle-memory retention, full distractor-history retrieval, or both as distinct studies? Which current memory/policy configuration deserves confirmation after the active diagnostics? What untouched full-history source can be admitted safely with pinned provenance? These unresolved questions block a genuinely long-history confirmation claim.
