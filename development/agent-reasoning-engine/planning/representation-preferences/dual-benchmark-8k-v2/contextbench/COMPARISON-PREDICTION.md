# Response-bound comparison prediction reconstruction

Status: ten offline integration tests pass. Independent review and scorer integration pending.

[comparison-prediction.mjs](comparison-prediction.mjs) rebuilds final model-selected source context using existing exact exporters, then requires equality with the saved native export. Current ARE uses its terminal packet and final response capture; candidates use one minimal conversation or three investigations plus synthesis, a single terminal-packet boundary, and separately captured final requests/responses. Candidates must declare the issue-resolution protocol and a closed phase state.

Every supplied source snapshot's UTF8 bytes must match its declared digest. Reconstructed output must match the complete saved native export; candidate output must also match the episode export. No archive union or inferred final selection is substituted. Evaluator references are not used.

## Tests and limits

Run: node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-prediction.test.mjs

Ten groups reuse actual prepared repair runners, temporary Git source pairs, native tools and scripted transport. Both candidates perform real edits and reconstruct their saved predictions. Changed prediction commits, omitted terminal journals and altered snapshots reject in both arms. The first snapshot-mutation test exposed that unchanged base-source projection could ignore a supplied inconsistent snapshot; explicit snapshot digest validation now rejects it.

The current-ARE branch reuses the original terminal exporter and selection checks. A retained historical candidate for replay had no remaining source checkout, so no real current-ARE wrapper replay was claimed and no source clones were recreated. Direct current-ARE integration coverage remains needed before complete scorer readiness.

## Open questions and next work

This function consumes parsed evidence and a caller-supplied base repository. The scoring adapter must load and pin the exact snapshots/base revision, bind result/events to the campaign manifest, check all assigned rows before evaluator access, and repeat integrity checks after scoring. The bounded native evaluator is still to be connected. Outer process settlement, prospective experiment amendment and exact freeze remain pending. Coordinator owns integration/review. D:/WSL admission applies; C: is excluded. Context score does not certify patch correctness, and no live quality/savings result follows from these tests.
