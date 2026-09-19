# TASK-CDSC2-EXPERIMENTS

## Shared Experiment Contract

- Consume the same frozen manifest and baseline receipt.
- Copy the baseline model into one mutant-local in-memory structure.
- Change only the declared edit surface.
- Run every assigned vector twice.
- Record raw vector outputs before classifying the consequence.
- Never edit the baseline, another mutant, source repository, prediction, or
  observable set.

## SWU-CDSC2-003 - M1 Permitted Screen Substitution

**Goal:** observe whether replacing the step-9 screen adapter while preserving
`onNext`/`onBack` preserves the bounded orchestration decisions.

**Dependencies:** SWU-CDSC2-002 accepted.

**Allowed mutation:** replace only the step-9 adapter implementation in the
isolated screen registry. Preserve screen key `9` and callable `onNext` and
`onBack` ports.

**Ordered rules:**

1. Verify manifest and baseline receipt handles.
2. Assert baseline edit-surface digest.
3. Install a behaviorally distinct step-9 adapter with the same two ports.
4. Run active-complete step-9 render, next, and back vectors.
5. Compare committed step, screen key, next step, previous step, guard result,
   and notice presence to baseline.
6. Classify `supported` only when all declared values are equal; `refuted` when
   a total result differs; otherwise `indeterminate`.
7. Freeze raw output, mutation diff, and observation receipt.

**Write scope:** `experiments/generation-002/m1-permitted-screen/`,
`evidence/generation-002/m1-permitted-screen/`, focused test, and this SWU's
session evidence only.

**Done criteria:** mutation stays inside its edit surface; vector output is
total or explicitly indeterminate; deterministic rerun agrees; receipt validates.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/m1-permitted-screen.test.mjs
```

**Execution owner:** `subagent` after explicit runtime permission; local Task
Session fallback.

**Handoff context:** this SWU, frozen manifest, accepted baseline receipt,
baseline harness, and no Savvy source beyond manifest verification.

**State:** complete via local fallback on 2026-07-12.

**Evidence:** M2 mutant, raw run, edit-surface diff, immutable observation
receipt, focused test, and `runs/SWU-CDSC2-004/TASK-SESSION-RESULT.md`. M2 is
`supported`; focused tests passed 4/4 and the combined suite passed 49/49.

**State:** complete via local fallback on 2026-07-12.

**Evidence:** M1 mutant, raw run, edit-surface diff, immutable observation
receipt, focused test, and `runs/SWU-CDSC2-003/TASK-SESSION-RESULT.md`. M1 is
`supported`; focused tests passed 4/4.

## SWU-CDSC2-004 - M2 Breaking Guard Bypass

**Goal:** observe whether committing the requested step instead of the guard
result changes previously blocked navigation.

**Dependencies:** SWU-CDSC2-002 accepted.

**Allowed mutation:** replace only `committedStep = guardResult.step` with
`committedStep = requestedStep` in the isolated navigation commit function.

**Ordered rules:**

1. Verify manifest and baseline receipt handles.
2. Assert baseline edit-surface digest.
3. Install the one-line guard-bypass mutant.
4. Run inactive-to-step-9 and incomplete-to-later-step vectors.
5. Compare baseline guard result, committed step, and notice to mutant output.
6. Classify `supported` only when at least one baseline redirect is bypassed;
   `refuted` when all total outputs preserve baseline; otherwise
   `indeterminate`.
7. Freeze raw output, mutation diff, and observation receipt.

**Write scope:** `experiments/generation-002/m2-breaking-guard/`,
`evidence/generation-002/m2-breaking-guard/`, focused test, and this SWU's
session evidence only.

**Done criteria:** mutation stays inside its edit surface; vector output is
total or explicitly indeterminate; deterministic rerun agrees; receipt validates.

**Verification:**

```sh
node --test projects/domainspec-v2/development/compound-domain-structure-calibration/generation-002-evidence-repair/tests/m2-breaking-guard.test.mjs
```

**Execution owner:** `subagent` after explicit runtime permission; local Task
Session fallback.

**Handoff context:** this SWU, frozen manifest, accepted baseline receipt,
baseline harness, and no Savvy source beyond manifest verification.
