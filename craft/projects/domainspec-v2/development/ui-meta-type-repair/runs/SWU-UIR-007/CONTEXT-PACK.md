---
artifact_id: CONTEXT-UIR-007-v1
task: SWU-UIR-007
mode: standard
strict_coverage: pass
session_evidence: true
created: 2026-07-11
---

# SWU-UIR-007 Context Pack

## Summary

- Files selected: 9 controlling sources.
- Selector groups: 10.
- Obligation coverage: 100 percent.
- Runtime: local; blockers: none.
- Authority boundary: DS-D8 remains external and DEC-UIR-010 remains open.

## Obligations

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Pin exact current authority state and digest. | `definitions/relationships/relationships.yml`; task contract | covered |
| O2 | State exact owner questions and affected signatures. | UIF-010 finding F06; replication matrix | covered |
| O3 | Supply finite options, positive/negative examples, and changed consequences. | `EVIDENCE-CONTRACTS.md#S6` | covered |
| O4 | Require a named owner and explicit closure evidence. | task contract | covered |
| O5 | Keep acknowledgement distinct from an owner decision. | `SPEC.md#Prohibited-Inferences` | covered |
| O6 | Reject endpoint-only evidence as relationship authority. | accepted research S6; DS-D8 boundary | covered |
| O7 | Detect superseded authority digests. | task negative fixtures | covered |
| O8 | Resolve no relationship and mutate no DS-D8 source. | AC-06; DEC-UIR-010 | covered |

## Pinned Authority

- Machine authority: `projects/domainspec-v2/definitions/relationships/relationships.yml`.
- Authority digest: `sha256:567fda214dbf3d2cdfe8f360020d2497cccc611bbcfd05f2fd885e8ad308ab41`.
- Authority state: version 1, active, 30 signatures.
- Relevant active signatures: `Form --[submits]--> Action`,
  `Component --[consumes]--> Hook`, `Guard --[protects]--> Page`,
  `Guard --[mirrors]--> Rule`, `Binding --[fetches]--> Query`, and
  `Binding --[mutates]--> Operation`.

## Open Owner Questions

1. Action-source: does an Action remain only the target of `submits`, or does a
   distinct authored source signature have a finite non-collapse witness?
2. Hook-Binding: is any Hook-to-Binding relation distinct from Component
   consumption and Binding-to-backend edges?
3. Guard-target: are Page and Rule the complete finite Guard targets, or is
   another target justified by a changed validation/composition consequence?
4. Binding node/relation: does Binding remain a DS-D1 node required by active
   cross-layer signatures, or can its role be represented without collapsing
   those signatures?

## Decisions And Assumptions

- No owner decision is made in this SWU. Every packet state remains
  `pending-owner`.
- Alternatives are transport options, not recommendations or verdicts.
- Owner acknowledgement may be recorded but cannot satisfy closure evidence.
- A decision closes a packet only when it cites the same authority digest and
  explicitly selects one finite option.

## Write Scope And Validation

- Add packet schema, builder, finite packet fixture, immutable result, and
  focused tests under this repair package only.
- Test incomplete owner, empty alternatives, endpoint-only evidence,
  acknowledgement without decision, superseded authority digest, schema
  validity, and immutable replay.
- Do not mutate relationships definitions, DS-D1, candidate status, or UIF-010.
