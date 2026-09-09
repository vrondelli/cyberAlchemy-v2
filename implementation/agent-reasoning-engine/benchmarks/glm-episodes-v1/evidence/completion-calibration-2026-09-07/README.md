# Verified completion and calibration results — 2026-09-07

All12 fixed trials passed repair and the explicit completion gate. Ten exercised recycling and passed full continuity. The two v2 archive-slicing trials completed all required reads without recycling; conditional recovery was therefore not required. They remain counted as no continuity coverage, not as demonstrated recycling. All four12K long-window trials passed six-file delivery and recovery.

| Measure | Previous v7 evaluation | Frozen v8 rerun |
| --- | ---: | ---: |
| Correct repairs | 9/12 | 12/12 |
| Recycling continuity | 7/12 | 10/12 |
| Provider failures | 2 | 0 |
| Token reservation failures | 1 | 0 |
| 12K repair plus continuity | 2/4 | 4/4 |

The [same schedule](fixed-evaluation/manifest.json), task manifests, request hashes, fixture bytes and oracles were verified against the previous run. The candidate changed, so these small non-simultaneous samples are not a controlled causal estimate; absence of provider failures cannot be attributed to the engine change. [Every trial](fixed-evaluation/README.md) remains recorded. No retries or replacements occurred.

## Implementation

The opt-in verified-completion-v8 policy validates explicit completion_requirements: required_reads, distinct_turns, archive_after_recycle. Requirements are included in scope binding and cannot change on resume. Before candidate acceptance, the gate checks confirmed full-file delivery, the required distinct read turns and confirmed meaningful archive recovery after any recycle. Deferred, attempted, undelivered or partial reads cannot satisfy a whole-file requirement. Early valid patch submission returns glm.completion-requirements-unmet and no accepted candidate; it never triggers an automatic retry or patch rewriting.

The CLI and benchmark bind a512-token tokenizer margin for v8. Programmatic clients must match it. The256-token soft-headroom reservation and2048 output reserve remain separate and unchanged. The prompt replaces duplicate per-file progress with a compact gate view; full ledger evidence is retained. Existing policies and defaults retain their behavior. Reports independently check requirement/task bindings and reject accepted candidates with unmet requirements.

## Calibration

The [prior calibration](calibration.json) used108 paired measured responses and excluded two unknown-usage model receipts. Its maximum observed underestimate was262 tokens. The selection rule adds128 tokens of slack and rounds upward to a128-token boundary, yielding512. [calibrate.py](calibrate.py) reproduces the calculation without provider calls.
The frozen rerun supplied78 measured responses; the maximum difference was177 tokens, within512. This remains empirical calibration, not a universal bound; the runtime underestimate check remains enabled.

## Validation and limits

All379 local tests passed ([log](tests.tap)), including early rejection, confirmed recovery acceptance, missing recovery rejection, scope drift on resume, requirement validation and margin binding. The12 live arms used78 model and90 tokenizer attempts. Minimum measured soft headroom was389 tokens. Per-arm caps remained12/24 attempts and580 seconds.

Source hashes matched before/after each arm and at aggregation; calibration evidence hashes and unchanged task identities were checked ([validation](validation.json)). Oracle checks ran in isolated copies. Recorded reports verify bindings and receipts, not cryptographic authenticity or a fresh oracle replay. Complete private inputs remain under /tmp/are-glm-completion-fixed-evaluation; exported traces omit raw message history and provider reasoning and are not complete report inputs.

This verifies ARE admission and observable recovery, not absence of provider-internal compaction. No default activation, publication or deployment occurred. The [construction plan](PLAN.md) preserves D65 scope and operational residue.

## Open Questions

- Does512 cover other languages, tool schemas and substantially longer requests?
- How stable are these outcomes across larger independent samples and provider conditions?
- Should workloads that never recycle be tested separately from forced continuity workloads?
- What evidence would justify default activation?
