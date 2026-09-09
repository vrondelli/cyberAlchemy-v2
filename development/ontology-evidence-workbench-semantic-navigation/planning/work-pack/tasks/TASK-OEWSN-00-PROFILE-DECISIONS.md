# TASK-OEWSN-00: Body War Profile Decisions

Status: complete; OD-01–OD-04 are frozen in
`../../decisions/BODY-WAR-PROFILE-APPROVED.json` and validated by
`../../decisions/DECISION-GATE-RESULT.json`.

## Objective

Close the four project-owned inputs without changing the reusable core or
inferring ontology membership.

## Source contracts

- `../../decisions/OWNER-DECISIONS.md`
- `../../../../ontology-evidence-workbench-focus-scene/reviews/2026-07-31-ux-ui-quality-loop/BODY-WAR-PROFILE.json`
- `../../../../ontology-evidence-workbench-focus-scene/reviews/2026-07-31-ux-ui-quality-loop/findings.md` CR-03, CR-04 and CR-11

## Smallest Working Units

### SWU-OEWSN-001 — Approve entry context profile

- Primary decision: exact ordered context IDs and evidence-backed mapping
- Independent acceptance: OD-01 row changes from owner-pending to a complete
  set that does not infer membership
- Split analysis: ordering and mapping evidence are inseparable from one
  executable home profile; Path and count choices are separate SWUs
- Dependencies: none
- Write scope: `planning/decisions/OWNER-DECISIONS.md`, future
  `planning/decisions/BODY-WAR-PROFILE-APPROVED.json`
- Done: exact IDs, order, purposes and evidence selectors recorded
- Validation: JSON parse, source ID existence and mapping review
- Execution owner: manual Body War profile owner
- Handoff: return selected IDs, rejected alternatives and rationale
- Outcome: complete — full 237-node/231-relation source with all 12 bounded
  contexts as label-ordered portal entrances

### SWU-OEWSN-002 — Select Path presentation

- Primary decision: comparator or route-local presentation
- Independent acceptance: one allowed literal with rationale and unchanged hop
  semantic/non-authority contract
- Split analysis: the choice is one indivisible policy field; Path derivation
  and UI are later SWUs
- Dependencies: none
- Write scope: same two decision/profile artifacts
- Done: OD-02 selected and rejected alternative recorded
- Validation: allowed-value and owner-signature review
- Execution owner: manual Body War profile owner
- Handoff: return selected value and rationale
- Outcome: complete — deterministic relation-bearing comparator

### SWU-OEWSN-021 — Approve relation-encoding profile

- Primary decision: one versioned record mapping every exact admitted
  `sourcePredicate` to a stable color token and every
  `presentationRelation` to a stable pattern token
- Independent acceptance: sidecar coverage, named fallbacks, non-color text and
  direction recovery, and authority effect none validate together
- Split analysis: the two mapping tables are one renderer admission contract;
  a half-profile cannot drive the relation record safely
- Dependencies: none
- Write scope: same two decision/profile artifacts
- Done: OD-04 jointly approved by the Body War profile and semantic-navigation
  owners, with exact token rows and profile digest
- Validation: JSON parse, sidecar mapping coverage, contrast preflight and
  owner-signature review
- Execution owner: manual joint owners
- Handoff: return mapping tables, rejected alternatives and rationale
- Outcome: complete — semantic-family v1 table confirmed for all admitted
  predicates and both presentation relations

### SWU-OEWSN-003 — Select zero-count behavior

- Primary decision: hide, disable or retain zero-count projection values
- Independent acceptance: one allowed literal plus non-color state requirement
- Split analysis: one policy field; copy/render behavior is SWU-020
- Dependencies: none
- Write scope: same two decision/profile artifacts
- Done: OD-03 selected and rationale recorded
- Validation: allowed-value and projection-count ceiling review
- Execution owner: manual Body War profile owner
- Handoff: return selected value and rationale
- Outcome: complete — zero-count values visible and disabled after positive
  current-projection values, with literal non-color cues

## Failure modes

Reject ambiguous labels, ontology-node inference without owner evidence,
multiple Path choices, missing rationale, a zero-count policy that relies on
color alone, or an incomplete relation-encoding table. Each rejection blocks
only the dependent wave; OD-04 specifically blocks the first L0 relation unit.
