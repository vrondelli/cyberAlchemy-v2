# Refresh Patch Proposal — Post-kernel sequencing repair

## Apply Contract

- Mode required: `invoke:refresh:apply-approved`
- Approval required: explicit approval of this exact proposal
- Apply must fail closed if any target SHA-256 differs from the recorded preimage.
- Apply scope is limited to the four target files below plus a run-local apply receipt.
- Applying this proposal does not select or execute `SWU-BTE-003`.

## Preimage Gate

| Target | Required SHA-256 |
| --- | --- |
| `WORK-PACK.md` | `31b4f81aeab4d6200bfd47e7e3b7b023e48bc1434e68499b015ae77f284c6007` |
| `EXECUTION-PACK.md` | `9e764da29529a01f1e4d187dbbc8a2d66d3522f36cd2db6842374d0b80d92717` |
| `IMPLEMENTATION-LAYERING.md` | `a58424cf8a8ff6a352f5626da856250923317d647f49193ed6c3eb9fac7444f0` |
| `EXECUTION-DISPATCH.json` | `ced40ba443c3015434e9a257f4ecc451cb570857656989a5116e1f242aa6bfbe` |

## Exact Proposed Patch

```diff
--- a/projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/WORK-PACK.md
+++ b/projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/WORK-PACK.md
@@ -61 +61 @@
-| `SWU-BTE-003` | [NODE COVERAGE](work-pack/tasks/TASK-BTE-NODE-COVERAGE.md) | Normalize minted node bodies and enforce all rule forms | 001, 002 | `impl/tools/minted-project/`; compiler tests | No type-name branches beyond profile/schema selection; eight rule forms pass/fail | tools tests + typecheck | local-fallback | blocked |
+| `SWU-BTE-003` | [NODE COVERAGE](work-pack/tasks/TASK-BTE-NODE-COVERAGE.md) | Normalize minted node bodies and enforce all rule forms | 001 | `impl/tools/minted-project/`; compiler tests | No type-name branches beyond profile/schema selection; eight rule forms pass/fail | tools tests + typecheck | local-fallback | ready-after-selection |
@@ -70 +70 @@
-SWU-BTE-001 is complete and no continuation SWU is selected. Invoke owns the post-run package refresh that reconciles dependency readiness; any later mutation-capable handoff must again select exactly one dependency-ready SWU and build a fresh Context Builder pack.
+SWU-BTE-001 is complete and SWU-BTE-003 is the sole next dependency-ready candidate; no continuation SWU is selected. A later mutation-capable Task Session must select SWU-BTE-003 explicitly and build a fresh strict Context Builder pack. SWU-BTE-002 remains blocked until W1 kernel-and-adapter evidence passes.
@@ -112 +112 @@
-The plan’s smallest coherent implementation unit was `SWU-BTE-001`: its shared criterion kernel now preserves existing behavior and enables later surfaces. Recomposition passes. The supported-profile and contract-mapping owner gates are accepted and resolved; no later mutation is available until Invoke refreshes downstream readiness and a dependency-ready SWU is separately selected and authorized through a bounded Task Session. See `DISTILL-VALIDATION.md`.
+The plan’s first coherent implementation unit, `SWU-BTE-001`, is complete: its shared criterion kernel preserves existing behavior and enables later surfaces. Recomposition passes. The next coherent W1 unit is `SWU-BTE-003`, the minted-node adapter; it remains unselected until a separate bounded Task Session builds fresh strict context and authorizes execution. `SWU-BTE-002` remains behind the W1 exit gate. See `DISTILL-VALIDATION.md` for the original plan validation.

--- a/projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/EXECUTION-PACK.md
+++ b/projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/EXECUTION-PACK.md
@@ -22 +22 @@
-| [W1](work-pack/waves/W1-SHARED-KERNEL.md) | L0 | Can one kernel serve Markdown, instance, and node surfaces? | CONTRACT 001; NODE 003 | W0 pass | eight rule-form parity proof | ready |
+| [W1](work-pack/waves/W1-SHARED-KERNEL.md) | L0 | Can one kernel serve Markdown, instance, and node surfaces? | CONTRACT 001; NODE 003 | W0 pass | eight rule-form parity proof | in-progress — 001 complete; 003 next |

--- a/projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/IMPLEMENTATION-LAYERING.md
+++ b/projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/IMPLEMENTATION-LAYERING.md
@@ -45,3 +45,3 @@
-- Next layer: L0, after a separate authorized Task Session selects one dependency-ready SWU.
-- First executable SWU: `SWU-BTE-001` shared criterion kernel.
-- Decision unlocked: whether the YAML criterion authority can be reused across all three representation surfaces without semantic invention.
+- Next layer: L0 continuation, after a separate authorized Task Session selects `SWU-BTE-003`.
+- Next executable SWU: `SWU-BTE-003` minted-node body adapter.
+- Decision unlocked: whether minted node bodies can reuse the proven YAML criterion kernel across all eight rule forms without semantic invention or a competing evaluator.

--- a/projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/EXECUTION-DISPATCH.json
+++ b/projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/EXECUTION-DISPATCH.json
@@ -74 +74 @@
-    "trigger": "The next eligible implementation is one bounded shared-kernel SWU with deterministic local checks.",
+    "trigger": "The next eligible implementation is one bounded minted-node adapter SWU with deterministic local checks.",
@@ -77,2 +77,2 @@
-        "SWU-BTE-001 is the narrowest next unit after the accepted profile gate.",
-      "SWU-BTE-002 through SWU-BTE-010 remain dependency and Task Session gated."
+      "SWU-BTE-003 is the narrowest next unit after the completed SWU-BTE-001 kernel receipt.",
+      "SWU-BTE-002 remains W1-exit gated; SWU-BTE-004 through SWU-BTE-010 remain predecessor and Task Session gated."
```

## Post-Apply Invariants

1. Exactly one Work Pack row has status `ready-after-selection`: `SWU-BTE-003`.
2. `SWU-BTE-003` depends on completed `SWU-BTE-001` only.
3. `SWU-BTE-002` remains `blocked` until W1 adapter evidence passes.
4. `activeLayerWindow` remains `n/a`; no SWU is selected by Refresh.
5. W1 is `in-progress`; W2 remains `pending predecessor`.
6. Dispatch Spec validation returns zero blocks and zero flags.
7. No implementation, authority, definitions, Craft, Inventory, public Arcanum, or Task Session receipt is changed.

## Apply Validation

```bash
jq empty projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/EXECUTION-DISPATCH.json
python3 arcanum/formulae/dispatch-spec/scripts/validate-dispatch.py \
  projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/EXECUTION-DISPATCH.json \
  --json
rg -n 'ready-after-selection|SWU-BTE-003|SWU-BTE-002|activeLayerWindow' \
  projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/WORK-PACK.md
git diff --check -- \
  projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/WORK-PACK.md \
  projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/EXECUTION-PACK.md \
  projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/IMPLEMENTATION-LAYERING.md \
  projects/domainspec-v2/development/first-production-release/backend-type-test-engine-completeness/EXECUTION-DISPATCH.json
```

## Next Route After Apply

`task-session:select-and-execute SWU-BTE-003` with a fresh strict Context Builder pack.
