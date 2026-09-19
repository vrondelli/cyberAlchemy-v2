# R06 — Standalone Calculation source-admission decision

Date: 2026-09-09. Status: option A selected by owner. Authority effect: none.
Internal construction record, not user-facing product documentation.

## Exact question

May the new versioned Calculation source be admitted without an Operation
consumer, while old source versions retain their existing required `calculates`
edge and real consuming Operations continue using that canonical relationship?

Selected: A, an explicit additive successor. Source: the user's subsequent
“yes” approving the standalone Calculation version. This selects product
behavior, not product approval, source-profile admission or default cutover.

## Why this is a decision now

R01–R05 are complete bounded candidates. R06 requires supported-input closure,
including full-width authored Calculation literals and standalone admission.
The current source checker in `impl/cli/src/input/project-model.ts`,
`validateSelectedNodeRelationships`, rejects every Calculation with zero outgoing
`calculates` edges. Existing `configured-calculations.test.ts` explicitly verifies
that removing that edge rejects, and the previous generator report deliberately
preserved this rule without deciding standalone admission.

This is not a request to change Calculation purity, add implicit reads, invent
an Operation or introduce a Calculation-to-Mapping edge. Those distinctions are
already settled and remain intact. The unresolved question is whether the new
source version admits a reusable pure Calculation before it has a graph-level
Operation consumer. That changes which authored products the compiler accepts.

Relevant source selectors:

- [Remaining plan R06](REMAINING-WORK-PLAN.md): account for promised inputs;
  unsupported-input rejection is not permission to waive them.
- [Calculation generation compatibility](CALCULATION-GENERATION.md#preserved-meanings-and-compatibility):
  old required edge remains; standalone admission deferred to DSR-013.
- [DSR-013](../PLAN.md#dsr-013): remove fabricated support Operations, provide
  truthful pure Calculation support and explicit migration.
- [DEC-06](../DECISIONS.md#dec-06): exact composition/lowering choice is not
  selected there and gates source-contract changes. Other completed bounded
  composition work did not select this particular admission change.
- `definitions/DEFINITIONS.md`: Calculation consumes explicit values and remains
  pure; the `reads` relation excludes Calculation. This purity decision does not
  itself choose a new versioned source-admission rule.

No later standalone-admission selection was found in the current reconciliation
reports, live ledgers or decision records. Historical states were not rewritten.

## Considered options

### A — Additive standalone Calculation version (recommended)

Allow zero Operation consumers for a new explicitly selected typed Calculation
version. Keep explicit typed inputs, pure checked arithmetic and full-width
literal representation. A real Operation consumer may still be linked with
`calculates`; existing edge endpoint, scope and multiplicity validation remains.
Mapping receives computed values explicitly, without a new semantic edge or
automatic calculation invocation. Old versions retain their required edge and
current diagnostics. No default migration.

Benefit: meets the promised reusable-pure-calculation model without artificial
business behavior. Cost: a versioned decoder/admission/generator path, explicit
legacy rejection, source-selection successor and migration/compatibility tests.
Choose this to complete the current R06 promise. Downstream: R07–R18 consume and
package the explicit new form; no canonical relationship signature is changed.

### B — Retain mandatory Operation consumption in every version

Keep rejecting a Calculation until a real consuming Operation is declared.
Do not manufacture an Operation simply to satisfy validation. Full-width literals
could still be implemented independently.

Benefit: preserves the present admission rule. Cost: standalone/mapper-only
Calculation support remains unavailable and the explicit R06/DSR-013 promise
cannot be marked complete. Choose this only if the owner changes or defers that
product requirement. Downstream: plan/qualification/docs must show that changed
scope; it is not an implementation shortcut or a silently accepted waiver.

## Decision Gate Result

- Target: R06 standalone Calculation source admission, bounded DSR-013 scope.
- Result: PASS for this product choice; overall CLI goal stays active.
- Decisions resolved: one; earlier product decisions preserved.
- Remaining blockers: zero for this choice.
- Selected option: A, explicitly approved by the user on 2026-09-09.
- Validation: read-only comparison of current checker, negative test, generator
  report, remaining plan, parent DSR-013 and DEC-06. R05 evidence is 82/82 shared
  native checks plus the final observer check; no R06 implementation is claimed.
- Mutation boundary: R06 definition, exact versioned source/generator and tests;
  old source versions, canonical edge signatures and defaults remain unchanged.
- Next step: continue R06 definition,
  full-width literal/admission implementation, native controls and all-13 input
  accounting. Do not restart completed R01–R05 or reopen their decisions.

ARE R06 route receipt:
`a3fe487f75d3fd2ff8ea5a34a7bf52cc8e29aa495d072e9e360b7eac3f705120`.
Context result:
`17e49cf9a51d11c5014fda9762fd4677b70850bdc84e3d21af9977942a59ae2e`.
The Task Session / Decision Gate skills require a recorded explicit choice before
changing this selected product boundary. The initial pause changed no compiler
or profile; this approval resumes construction, with implementation evidence
recorded separately in CALCULATION-V2.md.
