# TASK-SFC-RELEASE-EVIDENCE — Candidate recovery and acceptance binding

Layer/slice/wave: L3 / SFC-S4 / W3-W4.

## Objective

Exercise immutable patch/rollback/withdrawal/quarantine/supersession behavior and
freeze one exact candidate acceptance binding without creating a release/tag.

## SWU-SFC-017 — immutable candidate recovery drill

- Primary behavior: simulate owner-approved release-record transitions over local
  candidate fixtures while preserving every historical byte and causal link.
- Independent acceptance: patch creates a new version; rollback selects a proven
  immutable predecessor; withdrawal/quarantine/supersession remain visible; in-place
  repair, automatic rollback, missing approval, incompatible predecessor, and history
  deletion mutants fail.
- Split analysis: patch/rollback/withdrawal/quarantine/supersession are one recovery
  state machine and must preserve shared history invariants. Candidate freeze remains 018.
- Dependencies: SWU-SFC-016.
- Write scope:
  - `projects/domainspec-v2/impl/cli/contracts/release-recovery.schema.json`
  - `projects/domainspec-v2/impl/cli/tools/run-release-recovery-drill.mjs`
  - `projects/domainspec-v2/impl/cli/acceptance/release-recovery`
  - `projects/domainspec-v2/development/first-production-release/stable-foundation-cli/evidence/release-recovery`
- Done: versioned local drill records, compatibility/approval preconditions,
  immutable graph, explicit no-release authority.
- Validation: `VC-SFC-017`.
- Execution owner: Task Session; actual `releases/**`, tags, and Git are forbidden.
- Expected receipt: `runs/SWU-SFC-017/TASK-SESSION-RESULT.json`.

## SWU-SFC-018 — exact candidate freeze and invalidation matrix

- Primary behavior: freeze all acceptance-bound source/dependency/artifact/runtime/
  schema/profile/fixture/receipt bytes and prove every declared mutation invalidates it.
- Independent acceptance: manifest verify shows no added/removed/changed paths;
  profile, meta-type, relationship, runtime, dependency, source, schema, rule,
  evidence, and owner-receipt mutants all invalidate; cleanup cannot mask failure.
- Split analysis: corpus freeze and invalidation matrix are inseparable because a
  stable hash without discriminating invalidation does not prove binding semantics.
  Operator usability remains independently testable in 019.
- Dependencies: SWU-SFC-017, SWU-SFC-010, SWU-SFC-012, SWU-SFC-014.
- Write scope:
  - `projects/domainspec-v2/development/first-production-release/stable-foundation-cli/tools/verify-candidate-freeze.py`
  - `projects/domainspec-v2/development/first-production-release/stable-foundation-cli/evidence/candidate`
- Done: exact selector, tracked/ignored classification, aggregate hash, candidate
  binding, complete invalidation matrix, independent recheck input.
- Validation: `VC-SFC-018`; preserve first failing status.
- Execution owner: Task Session plus independent verifier for recheck.
- Expected receipt: `runs/SWU-SFC-018/TASK-SESSION-RESULT.json`.

## Claim ceiling

The result is a candidate ready for independent operator/verifier work, not a tag,
release, publication, deployment, production approval, or complete July product.

