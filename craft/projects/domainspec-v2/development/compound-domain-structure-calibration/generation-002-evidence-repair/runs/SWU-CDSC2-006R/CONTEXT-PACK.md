---
task_session: SWU-CDSC2-006R
status: accepted
strict_coverage: pass
runtime: local
adapter: none
source_count: 14
---

# Context Pack: SWU-CDSC2-006R

## Selected Scope

Evaluate the frozen F3 compatibility projection with the unchanged v1 fixture
evaluator, compose it with the frozen F1/F2 results, prove same-process replay,
and append exactly one generation-2 entry. Write only generation-2 results, one
focused integration test, this SWU's evidence, and required status updates.

## Controlling Sources

- Refreshed work-pack, W2C wave, and SWU-CDSC2-006R contract.
- Accepted three-layer protocol and SWU-CDSC2-005B context, result, and receipt.
- Frozen parent F3, M1, M2, overlay, and compatibility projection handles.
- Deterministic compatibility builder and accepted overlay/materializer checks.
- Unchanged parent `evaluateFixture`, `evaluateSuite`, validators, and
  `cdsc-evaluator-v1` four-outcome decision table.
- Accepted successor wrapper and atomic generation-index implementation.
- Frozen F1/F2 results and generation-1 protected-files manifest.
- Current one-entry generation index and exact generation-1 tail.

## Exact Inputs

| Input | Handle |
| --- | --- |
| Parent F3 | `record:sha256:6d2066bded781e8dc739eb65f09f5237b131a4c55e7a858a03de8d1f5118681a` |
| M1 observation | `record:sha256:26cbc95a46c790b819ac0c9ebbef94771eed89a5457927fa0fd0967d32ec0140` |
| M2 observation | `record:sha256:55f0f6a99f8df7f5d9c4bf6da8c218f9366733a300e689c24ff8a2672e4309bd` |
| Overlay | `record:sha256:668ea537da92ee33b4640fe34175aaffa1b387b0809352984b552a7530dae8b5` |
| Compatibility projection | `record:sha256:8fa5b9015945b56aa2a9cdbf47d0743281a1a299fe1f0e8751b33518cbb03ccd` |
| F1 result | `record:sha256:9bcb2a315e6505cd01ab5f7aff4c37679ac3d0e4dc9f9238915702bb05289b2d` |
| F2 result | `record:sha256:c84b16072ad39c2c00d31b4752d7ffd4edf5d695b615051a2d8fb1ef501e14cb` |
| Generation-1 tail | `generation:sha256:2ff6a0109e08f188388d580125ab6b185b4ff5f198300cb6bd5db0d9fe31349f` |

## Evaluation Consequence

The evaluator result is not a decision. The compatibility receipt contains six
approved `indeterminate` cells, so the unchanged completeness rule implies an
`INSUFFICIENT-EVIDENCE` F3 outcome. With F1/F2 both `EXPLAINED`, the unchanged
suite table implies `CALIBRATION-DEFER`. These expectations are assertions
against frozen code, not permission to normalize or rewrite the result.

## Hard Gates

- Rebuild the compatibility projection and require exact equality before use.
- Verify generation-1 protected bytes and the protected first index entry.
- Validate exact F1/F2 and all layer/projection handles.
- Evaluate F3 twice and require identical complete envelopes and total outcome.
- Compose the suite twice with replay state `identical` and require exact
  equality, F2 control, and predecessor equal to the current tail.
- Build a validated generation entry, preflight append, then use the existing
  atomic file append exactly once.
- Reject duplicate generation IDs and wrong-tail writes without changing the
  accepted two-entry index.
- Preserve all prohibited inferences and five non-portability limits.

## Decisions

Blocker decisions: none. The accepted work-pack fixes the evaluator, control,
predecessor, replay policy, and append mechanism. Runtime is local with no
adapter, handoff pack, fallback search, subagent, or experiment-harness route.

## Validation

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/generation-002-integration.test.mjs
```

After the focused gate passes, run the complete parent plus generation-2 test
surface and independently parse the stored results, provenance, run receipt,
and two-entry index.
