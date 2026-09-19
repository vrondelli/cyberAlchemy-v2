# TASK-SFC-PILOT-READINESS — Independent operation and owner handoff

Layer/slice/wave: L3 / SFC-S5 / W4.

## Objective

Prove that a non-author operator can run and recover the exact candidate and that
an independent verifier can assemble a complete, non-self-authorizing owner handoff.

## SWU-SFC-019 — green/red operator and support pilot

- Primary behavior: one independent operator installs from the private candidate
  instructions, runs green/red cases, collects redacted diagnostics, recovers,
  exercises rollback/withdrawal guidance, and reaches the named support owner.
- Independent acceptance: signed/identified pilot receipt binds candidate hash,
  commands, outputs, time, recovery, support response; author assistance, leaked
  data, undocumented step, unsupported environment, or missing red case fails.
- Split analysis: install/run/diagnose/recover/support form one end-to-end operator
  journey; splitting would hide handoff gaps. Independent evidence audit remains 020.
- Dependencies: SWU-SFC-018 and late-bound SFC-PR-004 identities.
- Write scope:
  - `projects/domainspec-v2/development/first-production-release/stable-foundation-cli/tools/validate-operator-pilot.mjs`
  - `projects/domainspec-v2/development/first-production-release/stable-foundation-cli/evidence/operator-pilot`
- Done: operator identity distinct from author, exact candidate binding, green/red,
  redacted bundle, recovery and support route evidence, no release act.
- Validation: `VC-SFC-019`.
- Execution owner: manual independent operator with Task Session evidence capture.
- Expected receipt: `runs/SWU-SFC-019/TASK-SESSION-RESULT.json`.

## SWU-SFC-020 — independent candidate-readiness audit

- Primary behavior: independently verify complete evidence joins and issue only a
  `candidate-ready-for-owner-review` or fail verdict.
- Independent acceptance: all 20 source/closeout receipts, design/decision hashes,
  build/security/resource/compatibility/recovery/pilot evidence, owner separation,
  and claim ceiling resolve; missing/stale/self-authored/changed evidence fails.
- Split analysis: receipt coverage and owner/claim audit must join one exact candidate;
  separate partial approvals would permit false completeness. Actual release approval
  remains outside the unit and Work Pack.
- Dependencies: SWU-SFC-019.
- Write scope:
  - `projects/domainspec-v2/development/first-production-release/stable-foundation-cli/tools/validate-candidate-readiness.mjs`
  - `projects/domainspec-v2/development/first-production-release/stable-foundation-cli/evidence/readiness`
- Done: independent verifier identity, total evidence join, zero unresolved candidate
  blocker, explicit excluded/full-product gaps, owner-review handoff, authority none.
- Validation: `VC-SFC-020`.
- Execution owner: manual independent verifier with read-only audit.
- Expected receipt: `runs/SWU-SFC-020/TASK-SESSION-RESULT.json`.

## Terminal policy

Successful SWU-020 has no automatic successor. It hands the exact candidate to
DomainSpec-v2 Owners for a separate decision. It cannot create or approve a release.

