# Popper Counterexample Verification

Date: 2026-07-13  
Dispatch: `2026-07-13-definitions-refactor-review`  
Role: Karl Popper — skeptic / counterexample verifier  
Mutation posture: verifier report only; no target, `attacks.md`, or `findings.md` mutation

## Verification Method

This pass attempted to falsify the synthesized verdicts against literal repository
instances. It gave special attention to D11, D31, D38, D51, D56, the two
`RETIRE` actions, the meaning of `LOCALIZE`, and the claimed 56/56 coverage.

A verdict survives only when the cited evidence supports the proposed action,
not merely the existence of the referent. A refuted finding must be changed or
dropped; it must not be preserved by weakening its wording after the fact.

## Independent Verification

### Coverage — SURVIVES

The active `DEFINITIONS.md` contains 56 unique `## CAV2-D*` headings, exactly
D1 through D56. The decision matrix contains 56 unique rows, also exactly D1
through D56. Its aggregate is one `KEEP` and 55 `FIX` verdicts.

This verifies row coverage only. It does not independently prove the quality of
every classification.

### D38 Claim-Proof Bound — SURVIVES

The prose rule is used across research, architecture, UX, decisions, and
validation-oriented artifacts. No repository-wide order or measure gives
`claim <= proof` a single mathematical interpretation. The current card itself
delegates `strength(P(c))` to the relevant domain.

`KEEP` therefore survives with an editorial constraint: retain the prose norm;
treat the inequality as mnemonic or explicitly domain-relative unless an owner
defines a support order.

### D51 Canonical Artifact — SURVIVES

The artifact-kind referent is real, but the current identity is not complete or
truth-evaluable:

- `CANONICAL-KINDS.md` is candidate and not closed;
- the corpus carries no `canonical_kind:` instance declarations;
- producers may be missing, composite, or alternative;
- `process_origin` has no settled referent or attestation rule;
- Arcanum already uses `canonical artifact` for an authoritative source artifact.

The concept survives; the current card does not. `REWRITE/RENAME` survives, with
the final name, membership test, conformance requirement, and provenance rule
remaining owner-gated.

### D56 Schema — PARTIALLY REFUTED

The factual findings survive: schemas have abundant real referents and machine
enforcement, Arcanum owns the generic definition, `(K,C,R,N)` is not a universal
schema essence, and D56 ID reuse is an independent integrity defect.

The categorical matrix action `SPECIALIZE` does not survive. The synthesis
itself states that whether CAV2 needs a specialization is owner-gated, and F-11
makes that specialization conditional. The current action must be `REFERENCE`
to `DEF-ARC-SCHEMA`. A separately named, new-ID specialization remains `DEFER`
until approved.

### Canonical-posture and registry findings — SURVIVE

F-01 and F-02 survived literal checks. The 56-card active source conflicts with
the six-card index/audit posture, and `DEFINITION-SCHEMAS.md` assigns obsolete
meanings to D34 through D37 while tracking only D23 and D51. The registry cannot
witness the current cards.

### Other prioritized factual findings — SURVIVE

The factual cores of F-03 through F-15 survived, subject to the D56 action
correction above. In particular:

- D5 and D37 use inconsistent verdict ownership;
- D34's tuple and required-field rule do not agree;
- D40 consumers have divergent shapes;
- D49 is review-enacted rather than deterministically closed;
- D53 and D54 contain the wrong D34/Constitution dependency;
- absence of a validator does not erase a referent or normative rule.

## Initial Counterexamples to the RETIRE Actions

The independent pass initially refuted both retirements:

1. D11 is named in `CRAFT.md` and `DEFINITION-TOWERS.md`, which identifies a
   tower-map owner and local documentary use.
2. D31 is named in `CRAFT.md`, `DEFINITION-TOWERS.md`, and
   `source-clusters/primordial.md`, where it is described as promoted-local and
   used to organize the primordial basis.

On that evidence alone, the initial correction was D11 `LOCALIZE` and D31
`REWRITE` or `LOCALIZE`, rather than `RETIRE`.

## Robot-Talks Confrontation With Quine

Quine challenged the inference from a self-referential or candidate consumer to
a spine-level definition need. The literal status headers changed the verdict:

- `DEFINITION-TOWERS.md` is a candidate tower map and explicitly not canonical;
- `source-clusters/primordial.md` is a candidate source cluster and explicitly
  not definition authority;
- their promotion language records the former 56-card posture now contradicted
  by the index and drift audit;
- neither term demonstrates an independent cross-surface classification or
  decision consequence outside definitions-tower organization.

### Position Change: D11 — RETIRE SURVIVES

The initial refutation is withdrawn. `Tower space` has an intelligible local
referent, but its `own, supply, consume, or route` boundary classifies almost
every relevant area. It may remain ordinary or tower-map-local vocabulary
without a canonical definition card.

The findings must not imply that the phrase has no referent. They must record
its candidate/local use and disposition.

### Position Change: D31 — RETIRE SURVIVES WITH CORRECTION

The initial refutation is withdrawn. `Primitive type` currently organizes the
candidate primordial tower but has no independently demonstrated consequence.
The protection against silent redefinition is a general definitions-governance
rule and is not shown to require this genus.

The action `RETIRE` survives, but the row's claims `none proven`, enforcement
`N`, and conformance `none` are misleading because candidate/self-organizing use
does exist. The evidence must instead state: candidate tower use exists; no
independent shared rule need or conformance consequence is demonstrated.

## Quine Counterexamples Accepted

### `LOCALIZE` is not a completed action

A destination label such as “architecture owner” or “UX owner” is insufficient.
`LOCALIZE` is valid only when the change request declares:

- `target_path`;
- `target_owner`;
- intended normative status;
- migration or removal of incoming references;
- evidence that localization leaves no authority gap.

Without that contract, the supported action is `DEFER`, not completed
localization.

### D41 Authority Model — LOCALIZE REFUTED

`AUTHORITY-MODEL.md` is an active local authority model and explicitly names D41
as its canonical definition. The drift audit calls the model load-bearing.
Simple localization would break its declared authority relationship.

Required action: `REWRITE`, derived from `AUTHORITY-MODEL.md`, unless an explicit
owner-approved migration changes the model itself.

### D42 Governed Artifact Tree — LOCALIZE REFUTED

D42 is consumed across architecture governance, C14/C18 constitutions, artifact
admission records, validation documentation, and the validator work-pack. It is
not merely architecture-local.

Required action: `REWRITE` a shared minimum; owner surfaces may specialize it.

### D22 Orthogonal Classification — bare LOCALIZE REFUTED

`VAULT-CONCEPT-ADOPTION-CONSTITUTION.md` uses D22 as a normative classifier
admission condition. A bare localization creates an unresolved dependency.

Required action: `REWRITE` the shared distinction or owner-gated `ABSORB` into a
named constitution with complete reference migration.

### D24 Provenance-First Navigation — conditional localization only

D24 is procedural and the Vault adoption constitution is a plausible owner. It
may be localized only through a concrete relocation contract naming
`VAULT-CONCEPT-ADOPTION-CONSTITUTION.md` and migrating/removing the D24 links.
Until then the action is `DEFER`.

### D43 through D47 — localization not yet established

- D43 may move to `architecture/ARCHITECTURE-KNOWLEDGE-GOVERNANCE.md` only if
  that surface explicitly assumes the normative rule and its consumers migrate.
- D44 remains `DEFER` because its view-admission threshold is unsettled.
- D45 and D46 may move to `ux-ui/UX-UI-KNOWLEDGE-GOVERNANCE.md` only if that
  surface assumes local normative ownership.
- D47 also requires alignment and migration of C15, which currently consumes
  the definition while carrying its own mixed evidence-class rule.

Until those transitions are evidenced, D43 and D45-D47 must be `DEFER`, not
completed `LOCALIZE` actions.

## Mandatory Changes to `findings.md`

1. Add the complete localization contract described above to classification
   semantics. A missing contract forces `DEFER`.
2. Keep D11 `RETIRE`, but record candidate/local use and the disposition of the
   phrase instead of implying nonexistence.
3. Keep D31 `RETIRE`, but replace `none proven` / `N` / `none` with the accurate
   candidate/self-organizing posture and lack of independent consequence.
4. Change D41 from `LOCALIZE` to `REWRITE`, derived from the authority model.
5. Change D42 from `LOCALIZE` to `REWRITE` as a shared minimum.
6. Change D22 from bare `LOCALIZE` to `REWRITE`, or preserve an explicit
   owner-gated `ABSORB` alternative.
7. Change D24 from bare `LOCALIZE` to `DEFER` unless the Vault-constitution
   relocation contract is completed in the finding.
8. Change D43 and D45-D47 from `LOCALIZE` to `DEFER` until normative targets and
   consumer migration are established. Keep D44 `DEFER`.
9. Change D56 from `SPECIALIZE` to `REFERENCE`; record possible new-ID
   specialization as owner-gated `DEFER`.
10. Recalculate the action summary after these changes. The one `KEEP` / 55
    `FIX` aggregate does not change.

## Preserved Dissents

These choices remain legitimate owner or synthesizer gates:

- D22: central `REWRITE` versus explicit absorption into the Vault adoption
  constitution.
- D43 and D45-D47: promote the named owner documents to normative local
  surfaces now, or retain `DEFER` until a later migration.

D11 and D31 no longer need to remain dissents if their evidence posture and
local-vocabulary disposition are corrected as required above.

## Final Verification Position

The review's core correction survives: real referents must not be deleted merely
because the current model lacks implementation, but real use does not preserve a
bad definition or prove central ownership. The synthesis requires the action
corrections above before it can serve as a safe basis for the new definitions
refactor.
