---
artifact_id: UIF-010-REPLICATION-FINDINGS-v0.2
dispatch_id: 2026-07-11-uif-010-replication-review
status: accepted
writer: Mac Lane, Saunders
revision_loop: 1-of-1
authority_boundary: review findings only; no DS-D1 or DS-D8 mutation
promotion_eligible: false
---

# UIF-010 Verified Finding Synthesis

## Review State

All three verifier lenses are incorporated. Coverage audit and final approval
by Vlachopulos, Ioannis returned ACCEPT. The prior frozen E0 corpus is
synthetic/adapted; this separate review covers only Body War static
DOM/JavaScript and Savvy Next/React.

## Verifier Dispositions

| Finding | Reconciled disposition |
| --- | --- |
| UIF-F01 | UPHELD, CRITICAL; unanimous defect, 2/3 CRITICAL and 1/3 MAJOR |
| UIF-F02 | UPHELD, MAJOR |
| UIF-F03 | UPHELD, MAJOR |
| UIF-F04 | UPHELD, MAJOR, narrowed scope |
| UIF-F05 | UPHELD, MAJOR |
| UIF-F06 | DOWNGRADED, MINOR |
| UIF-F07 | REFUTED; DROPPED |
| UIF-F08 | DOWNGRADED, MINOR |
| UIF-F09 | DOWNGRADED, MINOR |

## Proposed Findings

### UIF-F01 - Presence-Only Criteria Accept Blank Values

**Severity:** CRITICAL. **Disposition:** upheld.

All nine schemas use `attribute-present`; Turing reproduced acceptance when
those keys contain blank values. Two verifiers retain CRITICAL and one assigns
MAJOR because the schemas are experimental. Add a nonempty-value rule and rerun
all suites.

### UIF-F02 - Existing Evidence Does Not Establish Independent Replication

**Severity:** MAJOR. **Disposition:** upheld.

The prior frozen E0 corpus had zero real/owner specimens. This review found source
counterparts but lacks complete normalized empirical receipts. Persist source,
normalization, omitted fields, result, corpus, and style; bound claims to Body
War and Savvy.

### UIF-F03 - Mutation Evidence Is Useful But Incomplete

**Severity:** MAJOR. **Disposition:** upheld.

The attacker reports that all 52 single-field deletions reject, but stored
evidence covers 9/52 criteria and omits empty, whitespace, wrong fixed-value,
and conflict cases. Persist the complete criterion-by-mutation matrix.

### UIF-F04 - Neighbor Destination Evidence Is Incomplete

**Severity:** MAJOR. **Disposition:** upheld, narrowed.

Neighbor fixtures reject under every candidate label and the positive matrix is
diagonal, but destination outcomes are not consistently persisted and mapped
per neighbor. Some records are destination-incomplete, and external destinations
cannot be covered by the nine-label matrix. Persist source rejection, declared
reroute, and destination acceptance where testable; route external destinations.

### UIF-F05 - Candidate Validation Proves Authored Shape, Not Type Identity

**Severity:** MAJOR. **Disposition:** upheld.

The validator validates authored candidate shape, not semantic identity. Require empirical
separating witnesses plus vacuity, collapse, framework, and operational review
before any candidate leaves experimental status.

### UIF-F06 - Relationship Questions Remain Externally Owned

**Severity:** MINOR. **Disposition:** downgraded.

Action-source, Hook-Binding, Guard-target, and Binding node/relation questions
remain externally owned. They do not independently establish the promotion
block. Prepare a bounded owner packet; do not resolve or mutate DS-D8 in UIF-010.

### UIF-F07 - W1 Interpretation Requires Correction

**Disposition:** refuted; dropped.

`VERDICT-MATRIX.md` already states that `candidate-schema-ready` permits
hardening only and grants no authority, activation, promotion, or canonical
mutation. No corrective finding survives.

### UIF-F08 - Form And Action Are Disputed Experimental Routes

**Severity:** MINOR. **Disposition:** downgraded.

Body War supplies behavior corresponding to portions of the Form and Action
laws, not complete normalized identity. Turing and Ashby permit narrow+fix;
Simon defers all nine. Keep both `deferred` until repair and receipts close.

### UIF-F09 - Seven Candidates Require Distinct Follow-Up

**Severity:** MINOR. **Disposition:** downgraded.

Page/Layout have separate evidence gaps; View Model is absent from the bounded
specimens; Component/Hook face distinct framework-scope questions; Guard lacks
a verified projection; Binding has a node/relation question. Preserve distinct
corpus-bounded routes without a shared category conclusion or universal kill.

## Artifact Decisions

| Artifact | Decision | Required action |
| --- | --- | --- |
| `replication/protocol.yml` | KEEP | Preserve hashes, vocabulary, boundary, and gate. |
| `candidate-meta-types/ui/candidates.json` | FIX | Version nonempty criteria; retain experimental status. |
| Nine candidate cards/schemas | FIX | Apply candidate-specific evidence and correction requirements. |
| `adjudication/VERDICT-MATRIX.md` | KEEP | Its existing hardening-only and no-promotion boundary is sufficient. |
| `adjudication/GAP-LEDGER.md` | KEEP | Retain open corpus, relationship, framework, and disagreement gaps. |
| `experiments/corpus.yml` | KEEP | Preserve E0 provenance; never relabel as replication evidence. |
| Body War and Savvy source | KEEP | Evidence only; do not mutate or invent candidate metadata. |
| Dispatch proposal | KEEP | Preserve gate and runtime provenance. |

## Severity-Ordered Change Requests

1. **CRITICAL CR-01:** reject empty and whitespace-only presence values; preserve the minority MAJOR severity view.
2. **MAJOR CR-02:** persist all 52 criterion mutations and additional value classes.
3. **MAJOR CR-03:** persist mapped neighbor destination evidence and route external destinations separately.
4. **MAJOR CR-04:** retain the 9x9 matrix and document overlap/collapse.
5. **MAJOR CR-05:** produce source-backed empirical normalization receipts.
6. **MAJOR CR-06:** bound review language to Body War and Savvy; do not claim external replication.
7. **MINOR CR-07:** route relationship questions externally without treating them as an independent promotion block.
8. **MINOR CR-08:** give the seven non-Form/Action candidates distinct corpus-bounded follow-up.
9. **MINOR CR-09:** preserve Form/Action dissent while both remain deferred.

## Zero-Survivor Review Conclusion

Zero of nine candidates reaches `replicated`, `narrowed`, or `demoted`; all nine
remain `deferred`. This does not erase candidate-specific evidence and is not a
universal kill. No candidate may be described as independently replicated,
authoritative, active, or promotion-ready. Final approval is ACCEPT.
