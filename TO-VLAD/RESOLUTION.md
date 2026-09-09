# TO-VLAD Resolution

Status: resolved locally
Resolved date: 2026-06-22
Owner route: task-session + definitions-governance + constitution-governance

## Scope

This resolves the concrete TO-VLAD AX-ONT memo in this folder. It does not
close the broader primordial-basis session handoff, which still carries
definition clustering, public/private, and visible-space decisions.

## Inputs

- [TO-VLAD.md](TO-VLAD.md)
- [SESSION-HANDOFF-cav2-primordial-basis.md](SESSION-HANDOFF-cav2-primordial-basis.md)
- [../authority/definitions/DEFINITIONS.md](../authority/definitions/DEFINITIONS.md)
- [../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md](../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md)
- [../ontology/RELATION-MODEL.md](../ontology/RELATION-MODEL.md)

## Decisions

| Question | Resolution | Local effect |
| --- | --- | --- |
| Does Lean Hilbert/projector orthogonality transfer to CAV2 classification orthogonality? | No. Treat the bridge as killed. | [CAV2-D22](../authority/definitions/DEFINITIONS.md#cav2-d22-orthogonal-classification) now states that orthogonal classification is admission/compression discipline, not contextuality machinery or a consistency theorem. |
| What survives from the memo? | The edge-layer tripwire. | [CAV2-D28](../authority/definitions/DEFINITIONS.md#cav2-d28-value-cycle-edge-guard) promotes the value-cycle edge guard as a local invariant. |
| Should the guard be constitutional? | Yes, locally. | [CAV2-C13](../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md#cav2-c13-value-cycle-edge-guard) requires schema governance before any value-constraining cyclic edge can influence authority, ontology, validation, or implementation. |
| Should residue typing move to the edge layer? | Preserve as a route, not a finished ledger. | The guard points residue-typing attention at relation semantics. The residue ledger remains deferred until artifact-level residue type is resolved. |

## Closed Items

- The AX-ONT memo is no longer an open discussion draft for local v2 authority.
- The failed Lean-to-CAV2 bridge is recorded as a negative result, not as a
  theorem or tool.
- The practical invariant from the memo is now represented as both a definition
  and a constitution rule.

## Still Open

- [SESSION-HANDOFF-cav2-primordial-basis.md](SESSION-HANDOFF-cav2-primordial-basis.md)
  still routes the broader next thread: clustering of the 149 staged definition
  candidates and the two human-required decisions. Operational Ontology is
  demoted into D19/D23 language, and orthogonality/recursivity are promoted as
  [CAV2-D29](../authority/definitions/DEFINITIONS.md#cav2-d29-axis-orthogonality-invariant)
  and [CAV2-D30](../authority/definitions/DEFINITIONS.md#cav2-d30-bounded-recursive-self-application).
- `residue` subtyping and the future residue ledger remain blocked on the
  artifact-level residue-type question.
- Standalone extraction remains blocked by public/private and visible-space
  decisions.

## Validation Notes

- Local definition authority was changed only in
  [../authority/definitions/DEFINITIONS.md](../authority/definitions/DEFINITIONS.md)
  and synchronized to
  [../authority/definitions/DEFINITIONS-INDEX.md](../authority/definitions/DEFINITIONS-INDEX.md).
- Local constitution authority was changed only in
  [../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md](../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md).
- The candidate relation model now points edge proposals at the value-cycle
  guard before promotion.
- No private DomainSpec vault source or public Arcanum source was mutated.
