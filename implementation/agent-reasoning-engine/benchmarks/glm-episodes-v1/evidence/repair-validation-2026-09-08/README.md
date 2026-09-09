# Secret diagnostics and public repair validation

Implemented safe secret failure diagnostics and a standalone validator using visible task evidence. The public validator rejects both confirmed semantic defects among the six submitted proposals. A third historical failed repair was actually interrupted oracle child execution; its unchanged proposal passes the separate recheck. The original fixed run remains **3/8 repairs**, with no replacement or retry of its trials.

## Secret resolution

The process provider now classifies `timeout`, `spawn-failed`, `stdin-failed`, `output-limit`, `process-failed` and `empty-output`. The neutral registry and GLM transport preserve only this fixed vocabulary, with `unknown` for unsupported/untrusted errors. A failed GLM receipt can carry `secret_resolution_failure`; the existing `glm.secret-resolution-failed` reason and attempt accounting remain intact. No child stderr, secret bytes, locator or arbitrary error message is exported. No retry or deadline change was added.

Twenty predeclared real local secret consumptions all succeeded, taking 201–449 ms at the unchanged 5000 ms limit. They made no model/tokenizer API calls and exported no material. Thus the earlier just-over-five-second failures are consistent with timeout, but their root cause remains unconfirmed. Synthetic tests verify the new categories and a transport-level test confirms typed timeout reaches the receipt without a network dispatch.

## Repair validation and corrected diagnosis

| Retained submission | Public checks | Separate oracle recheck |
| --- | --- | --- |
| Long recent, repetition 1 | Reject: empty history | 7/8, same output mismatch |
| Archive recent, repetition 1 | Pass | 8/8 |
| Scoring clear, repetition 1 | Pass | 8/8 |
| Scoring clear, repetition 2 | Pass | 8/8 |
| Archive recent, repetition 2 | Reject: interior start | 7/8, same output mismatch |
| Long recent, repetition 2 | Pass | 8/8 |

The original long-recent repetition 2 record reports `invalid-or-failed-child-output` for duplicate IDs and reordered results, rather than `output-mismatch`. Its unchanged source contains both validation checks. The earlier narrative description of three incorrect repairs was too strong: the evidence establishes two semantic mismatches, one oracle-execution failure and two secret interruptions. All five remain failed trials in the original denominator. The precise child-process failure cause was not retained by that oracle and cannot now be reconstructed.

The [public validator](../../PUBLIC-VALIDATION.md) is a standalone candidate component. It checks declarative cases against exact source/selector bindings with bounded child execution and parent comparison. Visible-example adapters are manually authored for these tasks. No hidden oracle inputs feed the public checker, and no public failure is returned to the model in this increment. Retrospective detection after seeing failures is not prospective repair improvement or unseen-task validation.

## Validation and evidence

Affected Node tests: **298 passed, 0 failed, 1 skipped** (299 total). The skipped check is the optional preserved-real-run report test. Coverage includes synthetic bridge failures/redaction, registry behavior, GLM receipt propagation, candidate source/selector drift, execution timeout, restricted reads, argument mutation and malformed output. Real bridge integration and the GLM/episode suites passed. This is the exact executed subset, not a claim to rerun every repository test.

Evidence: [test output](tests.tap), [20-resolution probe](secret-probe.json), [public replay](public-replay.json), [separate oracle recheck](oracle-recheck.json), and [construction plan](PLAN.md). Probe/recheck source files preserve the exact diagnostic scripts used. Source hashes are recorded in [construction-result.json](construction-result.json). Historical evidence bytes and scores are unchanged; later narrative corrections are additive. CAV2-D65 candidate construction, no activation or authority effect.

## Open Questions

Why do local secret resolution and oracle children intermittently stall or fail? The new typed secret receipts will distinguish the next occurrence, but the oracle still needs finer process diagnostics. How should public validation feed a bounded repair turn without leaking hidden tests or granting mutation authority? Can authored checks cover unrelated tasks and catch new defects without overfitting? A future frozen live run must evaluate any feedback integration prospectively. Provider-internal compaction remains unobservable.
