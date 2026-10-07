# G03 fixed 80-question replication — post-generation scoring runbook

Status: historical procedure, updated 2026-09-28 UTC. The original r1 generation was interrupted, r2 failed after two assignments, and r3 failed after 23 assignments; see [r1](G03-PRODUCT-REPLICATION-INTERRUPTED.md), [r2](G03-PRODUCT-REPLICATION-R2-ATTEMPT.md), and [r3](G03-PRODUCT-REPLICATION-R3-FREEZE.md). **Do not run reference projection or scoring until a future generation result is terminal `completed` for all 80 questions with `unknown_usage=false`.**

Frozen source-only cohort: `/opt/are/evolution-runtime/g03-product-replication-r1/source`, manifest SHA-256 `dc9d04b064c8fbd58e94eaecf9f4adb20c61b70e55c08b3e68495038aed67413`.

Generation output: `/opt/are-benchmark-runs/longmemeval-product80-20260927-v1/output-pids128-r2`. The earlier `/output` directory is a stopped three-task pre-model gateway failure, not part of the score.

Code closure: `/opt/are/evolution-runtime/g03-product-replication-code-r1/development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/longmemeval/confirmation-v1/unexposed-live-v1`.

After generation completes, perform these gates in order:

1. Verify generation `RESULT.json` and all 80 per-task `RESULT.json` files: two answers, complete call usage, no unknown usage, source manifest/run bindings. Do not score a partial cohort or replace a question.
2. Run `replication-cohort-reference-project-v1.py` against the read-only pinned upstream `/opt/are-benchmark-data/longmemeval/98d7416c24c778c2fee6e6f3006e7a073259d48f/longmemeval_s_cleaned.json`, the source-only cohort `manifest.json`, the sealed generation `RESULT.json`, and a **new** private references directory under `/opt/are-benchmark-runs/longmemeval-product80-20260927-v1/`. It writes only 80 selected reference records and a SHA-bound manifest; keep it evaluator-only.
3. Verify the reference manifest binds the exact generation-result SHA and 80 question IDs. Verify pinned native rubric SHA-256 `64e3ee142988fecff66a37057e2259ad501978590ce4272ee88a5f39187f1f12` at `/opt/are-benchmark-runs/longmemeval-16paired-evaluation-20260926-v1/native-rubric.py`.
4. Run `replication-cohort-score-v1.mjs` with the source directory, generation result, reference directory, rubric file, and a **new** private scoring output directory. It plans 160 blinded GLM judgments, one per arm per question. Preserve all invalid judge outputs as incorrect and compute the control-favoring sensitivity bound.
5. Only when scoring `RESULT.json` is terminal and all 160 judgments are accounted for, run `analyze-product-longmemeval.mjs` from this evidence directory. Audit its paired intervals, exact McNemar test, efficiency ratios, and receipt hashes. Do not infer a directional product claim from an incomplete or failed score.
6. Write a compact result note and private content-addressed archive manifest. Raw reference values, model traces, and credentials do not belong on the public product page. Vlad and Dave review the sanitized card before publication.

## Open Questions

- Will every generated answer receive a parseable native yes/no judgment under the pinned rubric?
- What claim, if any, remains after the complete paired intervals and sensitivity bound are reviewed?
- What raw-retention period should Vlad and Dave approve before any source directory is deleted?
