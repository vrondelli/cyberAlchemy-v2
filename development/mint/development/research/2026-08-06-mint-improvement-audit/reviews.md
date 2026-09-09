# Mint improvement audit — reviewer verdicts, loop 0

Status: non-authoritative review evidence. Precedent passed with binding repairs; non-vacuity blocked; definitional soundness failed. One bounded synthesis feedback loop is required.

## Precedent gate — pass with binding repairs

- C01: identify the exact existing projection/generation owner; do not create a second synchronizer.
- C02/C03/C08 owner split: `domainspec-new-repo` owns L0 path/write/conflict mechanics; Mint owns cross-stage plan binding, semantic casting, and composition; decision-gate/boundaries owns visibility/public-private policy.
- C04 consumes authority-triage results; no Mint-local classifier.
- C05 keeps validators under Mint and fixtures under `experiment-harness`; OPA is precedent only.
- C09 is a Mint manifest adapter plus existing attestation invocation, not new cryptography.
- C11 must bind an exact existing observability owner/sink before implementation; no Mint telemetry ledger.
- C12 may borrow version/conflict semantics from Copier but selects neither the engine, answer-file authority, migrations, nor arbitrary tasks.
- C15/C16 retain public OIDC/transparency, hosted portals, centralized policy, and permanent controllers as non-selected current-scope patterns, not imported features.

## Non-vacuity gate — block pending bounded revision

| Candidate | Required repair |
|---|---|
| C01 | Pin chosen canonical source digest; synchronized projection positive plus one-byte drift negative. |
| C02 | Missing dependency yields typed pre-write block with unchanged target; admitted dependency yields versioned no-write plan. |
| C03 | Replace disjunctive recovery oracle with exact normal/stale/failure/resume/abandon/interruption/replay traces below. |
| C04 | One admissible result emits one named output; unknown/blocked/malformed/wrong-owner yields zero writes. |
| C05 | One persisted expanded positive plus 13 single-fault negatives, each failing exactly one stable check ID. |
| C06 | Current inconsistent defer fixture must fail; selected representation must agree across skill/template/validator/output. |
| C07 | Canon-equivalent valid; semantic mutation tampered; malformed/schema/version distinct typed error without traceback. |
| C08 | Split target containment, attach/privacy, input escaping, lock, and receipt redaction; each gets finite positive/negative. |
| C09 | Hold until subject, repository binding, sidecar, producer/ratifier schema, install point and failure state are bound. |
| C10 | Plan manifest must exactly equal output path/operation/ownership/digest set; incomplete input and omitted output block pre-write. |
| C11 | Fixed failed receipt with exact expected last stage, safe action and owner; runtime recovery stays under C03. |
| C12 | v1→v2 positive; local edit and authority edit remain byte-identical with distinct typed conflicts. |
| C13 | Kill bundle; replace with focused prospective generation criterion. Stale/failure/replay belong to C03; upgrade to C12. |
| C14 | Pin exact Body War artifact/digest and meaningful mutation; claim only attestation-pattern generality. |
| C15 | Complete decision-schema positive; omission of any trust/custody/rotation/revocation/error/secret field blocks key work. |
| C16 | Remove from ranked improvement; retain public/private rule as boundary invariant. |

### Exact transaction traces required

1. `PLAN-NORMAL`: bind target state `S0`, input/source/template/dependency identities; plan digest `P`, complete manifest/ownership/expected final set; zero target writes; target remains `S0`.
2. `APPLY-NORMAL`: consume only `P`, recheck bindings, write attempt-owned staging, checks 1–13, one install boundary; target becomes exactly `S1`; receipt complete; no residue. Installed does not mean promoted/released.
3. `PLAN-STALE`: alter one bound target/source/template/attach/privacy value; return `PLAN_STALE` before mutation; no silent re-plan.
4. `MID-L1-FAILURE`: fail after third emit and separately at one validator; target stays `S0`; no close/ratify/attestation record; receipt names attempt, stage/check, staged paths/hashes and one safe continuation.
5. `RESUME`: repair cause and resume same attempt/plan; valid steps skipped, failed step retried once, no duplicate/overwrite; target exactly `S1`.
6. `ABANDON/ROLLBACK`: remove only attempt-owned staging/backup; target `S0`; existing bytes hash-identical; terminal receipt cannot resume.
7. `INSTALL-INTERRUPTION`: observable target exactly `S0` or `S1`, never mixed; journal selects deterministic safe next action.
8. `REPLAY`: reapply completed plan; typed already-complete/zero-write result; target remains `S1`.

### Exact attestation traces required

1. Canonical Mint manifest over pinned repo/file set returns valid.
2. Semantic content mutation returns tampered.
3. Add/delete/rename/symlink-target/wrong-repo/unsupported version each returns declared non-valid result.
4. Malformed artifact returns typed invalid, never traceback or cryptographic tampered.
5. Header/actor mutation without recomputation returns tampered.
6. Full attacker recomputation may return valid at unkeyed L1; record this forgery ceiling.
7. Replay remains unproved until C15 chooses a freshness model.
8. Body War has a separate predeclared valid/mutation pair and remains outside frozen N=3.

## Definitional gate — fail pending decomposition

Key principles:

- Intended-not-shipped implementation gaps are not automatically defect fixes.
- Canonical source, installed projection, plan, harness, fixture, experiment, Inventory, implementation, validation, promotion, and shipment remain distinct.
- Reserve `adopt-back` for Mint L3 domain-to-cav2 import; use `source/projection reconciliation` here.
- C02 is `dependency availability reconciliation` until one pinned checkout resolves the conflicting observations.
- Mint must not duplicate `domainspec-new-repo`, inflate authority-triage, reimplement attestation, create a new observability system, or treat provenance as continuing cav2 authority.

Required decompositions:

- C01 → C01-D canonical-source/reconciliation decision; C01-F generated-package drift fix; C01-S surface-specific status correction.
- C02 → dependency availability reconciliation, then admit existing capability or typed unavailable block.
- C03 → C03-I executable orchestration implementation; C03-H staging/atomic/no-overwrite hardening; C03-R recovery/resume operability.
- C04 → contract/integration fix: triage evidence versus Mint emission; neither is ratification/promotion.
- C05 → C05-V validator implementation and C05-E evidence-fixture package.
- C06 → C06-D semantic decision, C06-F contract/projection fix, C06-V validator repair, C06-A separate ratifier-actor decision.
- C07 → C07-A verifier totality fix and C07-B canonical-equivalence terminology/harness correction.
- C08 → Mint input/path hardening; scaffolder attach/backup; decision-gated visibility/privacy; Mint lock; observability redaction.
- C09 → C09-M manifest builder; C09-A attestation subject/verify interface; C09-S sidecar/storage lifecycle decision; C09-T transaction integration.
- C11 → state-machine implementation; receipt/telemetry hardening; privacy-scrub validation; novice/expert docs.
- C13 → C13-E reproducible current fixture and C13-X separately preregistered prospective experiment.
- C15 → deferred owner decision/dependency, not non-goal.
- C16 → C16-B public Mint decision block and C16-N current-scope non-goals; public OIDC/transparency is outside scope, not permanently forbidden.

C10 and C14 pass their class boundaries. C12 passes with the explicit guard that minted-repository owners authorize every upgrade and locally owned authority is never auto-migrated.
