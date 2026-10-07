# Auth command-boundary v2 definitions — pending owner decision

Status: pending owner answer. This is a decision-gate record, not a
BusinessAcceptanceDecision, definition acceptance, FormalClaim admission, or
implementation guarantee.

## Exact question

Does the product owner accept the ten inline definitions in
`auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/BUSINESS-MEANING.v2-definitions-candidate.json`
at SHA-256 `aae4a6a007b1cb61c70da6244bbbbcaa146ad27006125b09ef791a562df5c49a`
as the intended pure READY/DENY elaboration of the already accepted clarified
v1 rule?

This decision is **only** about the exact v2 definition meaning. It does not
accept the separately draft occurrence InterpretationModel, prove the accepted
no-downstream-authorization-call fact over every native decision entrypoint,
check source/runtime preservation, admit a current FormalClaim, derive TDE
cases, satisfy F5/EVF, or establish `runtime_guarantees_observed`.

## Options

1. Accept these exact definitions. Benefit: the v2 pure-decision meaning can
   proceed to a separately checked current FormalClaim construction. Cost:
   independent interpretation, no-call, and claim-admission work remains.
2. Request revisions. Benefit: correct any domain-language or definition
   concern before it becomes normative. Cost: the revised bytes require a new
   semantic review and exact owner decision.
3. Defer. Benefit: independent V4b and tooling work can continue. Cost: no
   current Auth v4 claim, TDE neutral set, or F5 qualification may be asserted.

Recommendation: option 1 only if the owner agrees with the exact meanings;
the independent read-only inspection found no contradiction in the pure
READY/DENY logic, but it did not establish proof of all runtime effects.

## Evidence and boundary

- The accepted predecessor is
  `auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/BUSINESS-MEANING.v1-clarified-accepted.json`.
- The candidate v2 remains `draft` with `acceptance.status: not-requested`;
  the adjacent occurrence model remains draft.
- The six-clause FOL translation is parsed and has fixed finite witnesses,
  but is a separate non-current candidate. The ten inline v2 expressions are
  currently text, with snapshot and regex controls, not a machine-checked
  expression-to-theory bridge.
- Current focused checks: v2 draft/schema tests 5/5; FOL translation tests
  6/6 when run with the AlchLang TS loader.
- The broad no-call endpoint scope is fixed separately by
  `auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/AUTH-DOWNSTREAM-ENDPOINT-SCOPE.v1-owner-decision.md`.

## Decision state

Selected option: none. Source of decision: pending answer to the one-question
owner prompt in the active task. No acceptance artifact may be issued from
silence or from this candidate record. Timestamp of gate preparation:
2026-10-06.

## Open Questions

- Will the owner accept, request revision, or defer the exact v2 definitions?
- How will the ten inline formal expressions be machine-bound to the checked
  FOL translation before a preservation or admission claim uses them?
