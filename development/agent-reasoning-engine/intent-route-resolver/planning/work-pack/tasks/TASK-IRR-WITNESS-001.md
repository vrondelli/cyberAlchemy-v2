# TASK-IRR-WITNESS-001 — L0 witness

## Objective and mapping

- Slice: S-IRR-04
- Layer/wave: L0 / W4
- Goal: execute the fixed fixture matrix and persist one immutable claim-bounded
  L0 receipt.

## SWU-IRR-007

- Primary behavior: materialize a complete resolver witness from literal fixed
  fixtures through a validation harness outside the exported resolver API.
- Independent boundary: one generated run can be digest-verified and reviewed
  without a host, UI, or product adapter.
- Split analysis: the runner and terminal receipt were considered; neither
  alone proves an immutable executed witness, so they remain one SWU.
- Dependencies: SWU-IRR-006 owner receipt.
- Source anchors:
  - `../../../define/SPEC.md#acceptance-criteria`
  - `../../../design/VALIDATION-CONTRACTS.md`
  - `../../IMPLEMENTATION-LAYERING.md#layer-decision-table`
- Write scope:
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/scripts/run-witness.mjs`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/fixtures/witness/**`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/witness.test.mjs`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/browser/**`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/generated/runs/intent-route-resolver-v1-<run-id>/**`
- Fixture matrix: unique candidate, overlapping routes, missing material key,
  unsupported intent, request version failure, catalog digest mismatch,
  duplicate ID, dominance cycle, route permutation, evidence-removal
monotonicity.
- Portable matrix: generic JSON candidate, malformed JSON, unknown protocol,
  selected-local mapping, missing selector, Node/Chromium canonical byte parity,
  browser worker import, and forbidden dependency graph.
- Receipt fields: run ID, package identity, git/source digest inventory,
  fixture input/output digests, assertions, dependency/import audit, exported
  core external/filesystem/persistence call count, harness write inventory,
  claim ceiling, residue, terminal status.
- Done when: full package tests pass; runner writes only selected run directory;
  every fixture has exact hashes; Node and Chromium conformance bytes match;
  exported core
  external/model/filesystem/persistence/dispatch/effect calls equal zero; the
  harness records only its selected output-directory writes; receipt
  self-verifies.
- Validation:
  - `node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/*.test.mjs`
  - run witness with explicit output directory
  - validate the generated browser witness in shared Chromium
  - verify all JSON with `jq empty`
  - scoped `git diff --check`
- Execution owner: local-fallback.
- Handoff: terminal result must state this is a private L0 typed-input and
  browser-runtime conformance witness, not natural-language, host, product UX,
  approval, or execution evidence.

## Completion

Invoke refresh synchronizes evidence, then TASK-IRR-VERIFY performs closure.
No automatic L1 selection is allowed.

Open questions are owned in
[../../../OPEN-QUESTIONS.md](../../../OPEN-QUESTIONS.md).
