# Invoke Refresh — SWU-APE-ONT-003 contract decision

- Mode: `refresh`
- Activation: direct user
- Mutation mode: `apply-approved`
- Phase status: `pass`
- Handoff status: `ready`
- Decision: `PROFILE-MECHANISM-FIRST`
- Exact applied scope: two Work Pack contract files
- Authority effect: none

The refresh removes the circular requirement to select concrete language forms
inside W0. SWU-003 now owns executable profile inheritance, applicability,
conflict, owner-unselected, and typed-unsupported mechanics. Concrete
TypeScript, Python, and Rust representation selections remain with their
declared language-owner lanes.

Validation passed: material package, exact staged/live byte comparison,
manifest JSON parse, current ontology validator, and scoped whitespace check.

Next route: Task Session for `SWU-APE-ONT-003`.
