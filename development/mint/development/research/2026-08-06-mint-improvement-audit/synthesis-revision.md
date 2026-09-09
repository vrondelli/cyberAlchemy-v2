# Mint improvement audit — revised synthesis, loop 1 of 1

Status: read-only, non-authoritative revision. No implementation, approval, authority, promotion, publication, deployment, release, shipment, or production readiness is established.

Evidence: explorer corpus `78b45e397b0e7877b54438987a8d261406a68a2f10d2a00514f0957f21c6b977`; original synthesis `96484e3562edf7357d45d9154982aee5040b3aa31305418bb5a45680222616ae`; loop-0 reviews `2d076be3be276a7ece8b85f71bc3995823cf7371286e9f23e91bd13a1762f2a0`; repository commit `ab46061bf14db23a01054c2fd3fafec60fb5eb2f`; DomainSpec source commit `4e8834ddf54baa28f8de91abcf86f9a367f63948`.

Bindings: Mint source `S=31ce2126…`; installed skill `I=9d6b2609…`; emit procedure `E=ba3ce845…`; authority-triage `T=5658e76b…`; attestation `A=772157b9…`; DomainSpec scaffolder `D=aee9bf95…`; signer/public-private decision `P=4cbade43…`; frozen corrected criterion/run `F=5c2ce5a1…/e116ffc0…`; Mint handoff `H=eaf4ad6c…`. Exact selectors are the `CS-*`, `E-POS-*`, and `E-NEG-*` rows in `research.md`.

## Baseline and reconciled disagreements

1. Mint has instructions/templates but no executable Mint runtime (`CS-11,14,19`; executed/observed).
2. Source and installed projections disagree. This is `source/projection reconciliation`; `adopt-back` remains reserved for Mint L3 domain-to-cav2 import (`CS-01–06,21`).
3. C02 is dependency-availability reconciliation: one explorer executed a missing named path/command while two observed contract `D` in another pinned source identity. One pinned checkout must resolve availability before either status is settled.
4. Triage classifies/routes and writes nothing; Mint owns admitted emission. Neither is ratification, promotion, or authority (`CS-13,20`).
5. Attestation L1 exists, Mint integration does not, and the unkeyed L1 proof ceiling remains (`CS-16,27`, `E-POS-04`, `E-NEG-01–06`).
6. Frozen N=3 remains exactly research/process/product; corrected content autonomy reused artifacts. Body War is adjacent attestation evidence only (`CS-08`, `E-POS-01–03,07`).

## Exact transaction traces

| ID | Required result |
|---|---|
| T1 PLAN-NORMAL | Bind target `S0` and all input/source/template/dependency identities; emit plan digest `P`, complete manifest/ownership/expected-final set; zero target writes; target remains `S0`. |
| T2 APPLY-NORMAL | Consume only `P`; recheck all bindings; attempt-owned staging; checks 1–13; one install boundary; target exactly `S1`; complete receipt; no residue. Installed does not mean promoted/released. |
| T3 PLAN-STALE | Alter exactly one target/source/template/attach/privacy binding; return `PLAN_STALE` before mutation; no silent re-plan. |
| T4 MID-L1-FAILURE | Fail after third emit and separately at one validator; target `S0`; no close/ratify/attestation record; receipt names attempt, failure, staged paths/hashes and one safe continuation. |
| T5 RESUME | Repair and resume same attempt/plan; skip valid steps, retry failed once, no duplicate/overwrite; target exactly `S1`. |
| T6 ABANDON/ROLLBACK | Remove attempt-owned staging/backup only; target `S0`; pre-existing bytes hash-identical; terminal receipt cannot resume. |
| T7 INSTALL-INTERRUPTION | Target is exactly `S0` or `S1`, never mixed; journal gives one deterministic safe action. |
| T8 REPLAY | Reapply completed plan; typed already-complete/zero-write; target remains `S1`. |

## Exact attestation traces

| ID | Required result |
|---|---|
| A1 | Canonical Mint manifest over pinned repo/file set returns valid. |
| A2 | Semantic content mutation returns tampered. |
| A3 | Add/delete/rename/symlink-target/wrong-repository/unsupported-version each returns declared non-valid result. |
| A4 | Malformed artifact returns typed invalid, never traceback or cryptographic tampered. |
| A5 | Header/actor mutation without recomputation returns tampered. |
| A6 | Full attacker recomputation may return valid at unkeyed L1; this is the forgery ceiling. |
| A7 | Replay protection remains unproved until C15 selects freshness. |
| A8 | Body War has a separate predeclared valid/mutation pair outside frozen N=3. |

## Revised candidates

Impact/cost/risk/reversibility are `I/C/R/Rev`.

### Source, projection, dependencies

| ID/class | Witness | Positive and discriminating negative | Owner/prerequisite; I/C/R/Rev; ceiling |
|---|---|---|---|
| C01-D deferred decision | `CS-01–06,21`, S/I disagree. | Owner pins canonical digest and projection mechanism; missing/ambiguous digest blocks. | Mint lifecycle; exact projection owner. H/S/H/H. Source route only. |
| C01-F fix | `CS-02,21`, byte drift. | Generated package equals pinned source; one-byte mutation fails. | Existing generation owner + sigil-development; C01-D. H/M/M/H. Byte parity only. |
| C01-S fix | `CS-03–06,08,29`, status conflicts. | Typed status vocabulary; seeded stale status fails; frozen evidence unchanged. | Mint/surface owners; C01-D. M/S/L/H. Status consistency only. |
| C02 dependency reconciliation | `CS-12,18` missing named invocation versus source D observed. | Pinned dependency emits versioned no-write plan; unavailable emits typed pre-write block with unchanged target. | Scaffolder + Mint integration owners. H/M/M/H. One-checkout availability only. |

### Execution, validation, semantic closure

| ID/class | Witness | Positive and discriminating negative | Owner/prerequisite; I/C/R/Rev; ceiling |
|---|---|---|---|
| C03-I implementation | `CS-11,19,30`, no executable runtime. | T1/T2; negatives T3 and dependency block. | Mint sigil-development; C02/C04/C05/C06. H/L/H/M. Bounded orchestration only. |
| C03-H hardening | `CS-25,32,34`, no transaction contract. | T2; negatives T4/T7. | Mint composition + scaffolder L0; C03-I. H/M/H/M. Declared fault containment. |
| C03-R operator experience | `CS-25,34`, no recovery. | T5; negatives T6/T8. | Mint runtime; C03-I/H. H/M/M/H. Declared transitions only. |
| C04 integration fix | `CS-13,20`, triage/emission conflation. | One admissible result emits one named staged output; unknown/blocked/malformed/wrong-owner writes zero. | Mint + triage owners; stable result schema. H/S/M/H. Interface separation only. |
| C05-V validator implementation | `CS-15,23`, prose checks/leak miss. | Expanded positive passes 13 IDs; 13 single-fault negatives each fail exactly one ID. | Mint; C06-D. H/M/M/H. Fixture-bounded validation. |
| C05-E evidence hardening | `CS-07,22,44`, absent/stale fixtures. | Expanded fixture regenerates byte-identically; digest mismatch blocks evaluation. | Experiment harness; C05-V contract. H/M/L/H. Reproducibility only. |
| C06-D deferred decision | `CS-24,33`, defer contradiction. | Select one representation; current inconsistent fixture fails. | Mint contract/Invoke. H/S/H/H. Decision only. |
| C06-F contract fix | Same contradiction. | Skill/template/output agree; any mismatch fails reconciliation. | Surface owners; C06-D. H/S/M/H. Contract consistency only. |
| C06-V validator repair | Existing checks cannot enforce defer rule. | Selected fixture passes intended ID; opposite fails exact defer ID. | Mint validator; C06-D/F/C05-V. M/S/M/H. Encoded rule only. |
| C06-A deferred ratifier decision | cav2-owner versus domain-owner ambiguity. | Decision binds exact ratifier; missing/conflict blocks closure pre-write. | Decision-gate + Mint contract. H/S/H/H. Actor semantics only. |

### Attestation and integration

| ID/class | Witness | Positive and discriminating negative | Owner/prerequisite; I/C/R/Rev; ceiling |
|---|---|---|---|
| C07-A fix | `E-NEG-02`, malformed traceback. | A1/A2; A3/A4 typed results without traceback. | Attestation owner. H/S/L/H. Declared cases only, no authentication. |
| C07-B terminology fix | `E-NEG-03`, canon versus byte claim. | Canon-equivalent valid; semantic mutation tampered. | Attestation owner. M/S/L/H. Claim/test agreement only. |
| C09-M manifest implementation | `E-NEG-01`, no Mint manifest. | A1 over pinned paths/types/digests; A2/A3 negatives. | Mint; subject/repo schema and C09-S. H/M/H/H. Subject construction only. |
| C09-A dependency integration | L1 works but Mint invocation absent. | Existing attest consumes C09-M and returns A1; A4/A5 negatives. | Mint + attestation; C07/C09-M/S. H/M/H/M. L1 integration only. |
| C09-S deferred lifecycle decision | Subject/repo/sidecar/actors/install/failure unset. | Complete six-field decision; omission/ambiguity blocks C09-M/A/T. | Mint + attestation + C06-A owners. H/S/H/H. Contract selection only. |
| C09-T transaction integration | `CS-35`, no attestation stage/failure path. | Attest before T2 install and bind receipt; non-valid leaves S0/no close. | Mint runtime; C03/C09-M/A/S. H/M/H/M. Transactional L1 only. |

### Input, privacy, locking, observability

| ID/class | Witness | Positive and discriminating negative | Owner/prerequisite; I/C/R/Rev; ceiling |
|---|---|---|---|
| C08-P Mint path hardening | `E-NEG-08`, missing containment/slug rules. | Valid private sibling/slug; root/current/source/.git/overlap/symlink/newline/pipe/traversal block. | Mint preflight. H/M/M/H. Declared admission cases. |
| C08-A scaffolder dependency | `E-NEG-07,09`, attach/backup risk. | Pinned portable submodule/exact backup receipt; local locator/canary/symlink/restore negatives. | Scaffolder; C02. H/M/H/M. Fixture behavior only. |
| C08-V deferred visibility decision | Private policy but no classifier. | Owner-classified private admitted; unknown/public blocked. | Boundaries/decision-gate. H/S/H/H. Visibility selection only. |
| C08-L hardening | No concurrency rule. | Sole lock acquired; concurrent apply typed conflict. | Mint runtime; C03-I. M/S/M/H. Bounded exclusion. |
| C08-O observability dependency | `E-NEG-11`, no private receipt/sink. | Allowed IDs/digests/verdicts retained; secret/content/mechanism/key canaries absent. | Mint + exact observability owner still unbound. H/S/M/H. Redaction fixture only. |
| C10 operator experience | Sparse input/no full preview. | Plan set equals expected path/operation/ownership/digest set; incomplete/omitted blocks. | Invoke then Mint; C02/C04. H/M/L/H. Plan completeness only. |
| C11-S state implementation | No run/stage state. | Fixed C03 trace projects exact state; impossible/missing transition fails. | Mint UI/contract; C03-I/R. M/M/M/H. Projection only. |
| C11-T telemetry hardening | No receipt/exact sink. | Failed receipt yields exact stage/action/owner; missing binding/unknown sink blocks. | Mint + exact observability owner unbound. H/S/M/H. Receipt contract only. |
| C11-P scrub validation | No scrub evidence. | Allowed fields retained; secret/mechanism/key canaries rejected/masked. | Mint + observability validator; C08-O. H/S/L/H. Canary handling only. |
| C11-D documentation | Novice/expert recovery gap. | Fixed failed receipt yields exact stage/action/owner; ambiguous answer fails doc test. | Mint docs; C03/C10/C11-S/T. M/S/L/H. Supplied-fixture usability only. |

### Upgrade and evidence

| ID/class | Witness | Positive and discriminating negative | Owner/prerequisite; I/C/R/Rev; ceiling |
|---|---|---|---|
| C12 lifecycle hardening | `CS-26`, no version/upgrade posture. | v1→v2 updates unchanged generated; local/authority edits remain identical with distinct conflicts. | Mint lifecycle + minted repo owners. H/L/H/M. Owner-authorized plan only; Copier precedent, no continuing cav2 authority. |
| C13-E evidence package | `CS-07,22`, missing/stale output. | Pinned fixture regenerates identically; missing/mismatched digest blocks. | Mint + experiment harness; executable generator. H/M/L/H. One fixture only. |
| C13-X prospective experiment | Corrected F reused artifacts. | New preregistered current-byte positive; hollow-restamp/runtime-leak/hidden-symlink/D49 negatives fail. | Mint + experiment harness; C13-E/C03/C05. H/M/M/H. New sample/criterion only; frozen N=3 unchanged. |
| C14 adjacent experiment | Body War lacks attestation specimen. | Pinned artifact valid; one predeclared meaningful mutation non-valid. | Body War + attestation experiment owners. M/S/M/H. One adjacent witness; never fourth spine. |
| C15 deferred decision/dependency | `E-NEG-04–06`, unchecked actor/no freshness. | Complete trust/identity/custody/rotation/revocation/distribution/freshness/errors/secrets schema; any omission blocks key work. | Decision-gate + attestation. H/M/H/L after adoption. Decision completeness only. |

## Boundary/non-goal invariants, not ranked improvements

- C16-B: public-attached Mint remains blocked under `P:41–55`; unknown/public routes to decision-gate; private fixtures do not prove public safety.
- C16-N: hosted portals, centralized policy, permanent cav2 controllers, arbitrary template tasks, public OIDC, and transparency logs are not selected current dependencies. They are outside current scope, not permanently forbidden.

## Owner-routed sequence

- 0–30: C01-D, pinned C02 reconciliation, C06-D/A, C09-S, C08-V, C15; repair C07-A/B; define C05-E, C10, C11-P/D fixtures.
- 31–60 only if admitted: C01-F/S, C03-I/H/R, C04, C05-V, C06-F/V, C08-P/A/L/O, C11-S/T; run T1–T8.
- 61–90 only after prior acceptance: C09-M/A/T with A1–A7; C12; C13-E/X; optional C14/A8. C16-B/N remain boundaries.

## Proof ceilings

- Source/projection reconciliation is neither Mint L3 adopt-back nor implementation.
- One pinned checkout does not prove dependency portability.
- T1–T8 cover only declared transaction/failure traces.
- A1–A6 retain the unkeyed L1 forgery ceiling; A7 remains unresolved pending C15.
- C13-X does not alter/extend frozen N=3; C14 remains adjacent only.
- Plans, fixtures, receipts, provenance, and experiments are evidence, not authority or production/release proof.
