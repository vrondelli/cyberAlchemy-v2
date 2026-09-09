# Context Pack — OEW First Working Version Selection

- Context ID: `oew-first-working-version-selection-a-20260728`
- Mode: strict
- Decision: `G-OEW-L1-FIRST-WORKING-VERSION-SELECTION`
- Selected option: `OEW-L1-A-BUILD-FIRST-WORKING-VERSION`
- Initial selector: `SWU-OEW-008F`
- Authorized frontier: `SWU-OEW-008F -> SWU-OEW-013B -> SWU-OEW-014 -> SWU-OEW-014V`
- Strict coverage: pass

## Bound evidence

- The direct-user decision receipt authorizes the exact four-unit series and
  requires one fresh Task Session and closeout per unit.
- The predecessor Invoke Refresh receipt proves the four-unit planning graph
  was applied without changing the implementation package preimage.
- The frontier-readiness receipt proves one package root, exclusive targets,
  ten package-command bindings, and completed start dependencies.
- The staged Define update resolves the stale integration question through
  ADR-OEW-002 and ADR-OEW-007; it does not invent a new design choice.
- The six staged planning and continuity targets are the complete selection
  mutation inventory.

## Inventory lookup

`.arcanum/inventory/index.json` passed lookup-readiness validation. The closest
matching entry, `oew-plan-architecture-runtime-audit-result-synthesis`, is
excluded as authority because it is explicitly a non-authority read model of
the older rejected audit. Current decision and refresh receipts control this
selection.

## Execution boundary

This refresh selects only `SWU-OEW-008F` as the current executable candidate.
It does not admit implementation mutation. Mutation remains blocked until the
fresh 008F Task Session preflight, material receipt, and mutation-admission
receipt all pass. Each successor becomes selectable only after its predecessor
Task Session and owner closeout pass.

## Authority ceiling

The series may establish a private, browser-testable L1 prototype. It cannot
claim L2 evidence access, manual UX acceptance, ontology admission, promotion,
publication, release, deployment, production readiness, or any authority
effect beyond the private work-pack lifecycle.
