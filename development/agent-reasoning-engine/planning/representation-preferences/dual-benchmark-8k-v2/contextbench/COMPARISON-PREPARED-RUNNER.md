# Common prepared runner for two candidate arms

Status: additive offline integration; eight test groups pass across the initial seven-group run and the added baseline-failure test. Independent review pending. No provider calls or live admission.

## Composition

[comparison-native-driver.mjs](comparison-native-driver.mjs) selects the reviewed minimal-history episode or corrected independent episode v2 over the same native measured driver. Unknown arm names fail before creating that driver. It drains/closes the driver on success or error and attaches episode evidence if close fails.

[orchestrate-comparison-v1.mjs](discovery-v1/orchestrate-comparison-v1.mjs) derives additively from the reviewed prepared independent runner. It preserves task/source identity verification, source/evidence separation, one base/work pair, guarded persistence, provider-health checks and reconstructed native export equality. The cell explicitly declares comparison_arm as minimal-history or independent-investigations. Successful completion requires respectively one or three evidence containers, plus closed phases. There is no arm-name fallback.

The runner passes the same signal argument to both the client factory and native driver. The client factory must actually supply that signal to the GLM adapter; merely accepting the argument is not proof of in-flight cancellation. The existing local HTTP cancellation tests establish native client/driver behavior when both are correctly wired. Production factory integration still needs its own verification.

This common runner selects the corrected independent episode, resolving the old wrapper's v1 import for this new path. Frozen v1 sources and their old reviews remain unchanged. The current-ARE comparator is not yet supported by this runner; it must be explicitly bound through the three-arm campaign with declared differences and common scoring/accounting.

## Verification and limitations

```sh
node --test development/agent-reasoning-engine/planning/representation-preferences/dual-benchmark-8k-v2/contextbench/comparison-prepared-runner.test.mjs
```

Tests use real isolated temporary Git repositories and repository tools, bounded native recycler, guarded persistence and native evidence reconstruction. Model replies/token measurements are synthetic and ledger binding is stubbed. Tests cover source/task rejection, unknown arm rejection, source-pair reuse, export equality, reasoning replay for both arms, forwarding the exact abort signal, provider failure with known/unknown cost retention and shared dispatch denial for both arms.

The three-call minimal fixture and eight-call independent fixture prove wiring only. They are not matched quality trials or measured token-efficiency comparisons. The actual GLM transport ledger and cancellation have separate reviewed tests; production campaign reconciliation remains required. No frozen implementation was edited.

## Product frontier and operations

Coordinator owns next integration: exact GLM client factory wiring, current-ARE comparator binding, protocol-valid independent history policy and the twelve-outcome campaign/scorer. Real tokenizer qualification, prospective prompt/budget/difference declaration, exact reviewed freeze and D:/WSL guards precede generation. C: is excluded. Release/deployment are deferred residue.

## Open questions

Can all three arm outputs be sealed, reconstructed and scored under one contract with no dropped failed costs? Does the production factory wire the shared signal? Can independent histories fit realistic investigations without losing required protocol fields? Perfect native quality and at least 15% cumulative-token reduction against both comparators remain unproved, with untouched confirmation still required.
