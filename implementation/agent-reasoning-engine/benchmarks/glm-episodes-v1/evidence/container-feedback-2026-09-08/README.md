# Integrated container feedback result

The fixed v3 evaluation met its full target: **2/2 corrective proposals passed both public validation and the separate oracle; all six final proposals passed 8/8 oracle checks each**. The other four original proposals passed unchanged without model calls. Eight validation containers completed with zero execution failures and verified cleanup.

| Original proposal | Feedback outcome | Separate oracle |
| --- | --- | --- |
| Long recent 1 | REPAIRED | 8/8 |
| Archive recent 1 | UNCHANGED | 8/8 |
| Scoring clear 1 | UNCHANGED | 8/8 |
| Scoring clear 2 | UNCHANGED | 8/8 |
| Archive recent 2 | REPAIRED | 8/8 |
| Long recent 2 | UNCHANGED | 8/8 |

Two model attempts and two tokenizer attempts were used, within caps of two/four. Readiness passed before each corrective call. No retry, second correction or failure replacement occurred. The original empty-history and archive-start defects were re-presented to the model; this run did not simply revalidate previously corrected source. The hidden oracle ran separately after all feedback calls and never entered prompts. Original v20 and earlier feedback scores remain separate.

## Integration

`container-public-validation.mjs` packages only the candidate, source-bound public evidence, trusted validator and worker program. It remaps evidence paths inside the read-only worker mount, then checks the returned source/plan hashes, case identities, totals and outcomes. The receipt preserves both the original plan binding and the worker's remapped plan binding. Container failure or malformed output becomes an execution failure, never a semantic repair hint or host-execution fallback. Cleanup uncertainty stops the feedback run.

The explicit stage records `public-feedback-v3` when given this backend; the live runner selects it for both before/after validation. Native v2 remains available to existing programmatic callers that omit a backend. Default coding-agent policy is unchanged. Resource limits and process isolation do not reserve host capacity; the separate hidden oracle still uses host processes.

## Tests and provenance

All **20 affected tests passed**, covering adapter source/result binding, evidence drift, no fallback on container failure, cleanup failures, worker lifecycle, and one-turn feedback behavior. The first CLI launch then failed at parse time because a source-list edit also altered an import. It created no run and made no container/provider calls. That diagnostic is retained in [runner-startup-failure.txt](runner-startup-failure.txt). After the import fix, `node --check` passed and the live run started. No executable source changed during it; all 97 enumerated entries matched after completion.

Evidence: [plan](PLAN.md), [tests](tests.tap), [frozen manifest](run/manifest.json), [aggregate](run/result.json), and individual before/after, readiness and transport receipts. All eight generated validation containers were verified absent; temporary staged inputs were removed. Private admission ledgers remain under `/tmp/are-container-feedback-34`. No provider reasoning was exported. CAV2-D65 candidate construction, authority effect none.

## Open Questions

This is a successful corrective-stage test on six selected retained proposals, not fresh end-to-end model reliability or an unseen-task evaluation. The next bounded evaluation should generate new initial proposals, preserve all first-pass outcomes, and measure whether the integrated correction improves a predeclared task/window matrix. Sustained host pressure, broader coverage and default activation remain separate work.
