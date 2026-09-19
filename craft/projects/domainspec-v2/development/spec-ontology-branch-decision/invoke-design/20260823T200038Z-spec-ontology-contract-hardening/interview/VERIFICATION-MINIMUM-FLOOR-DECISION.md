# Verification Minimum Floor Decision

Status: selected Design policy; contract materialization and owner admission pending.

Decision ID: `DEC-DSV2-SPEC-ONTOLOGY-VERIFICATION-MINIMUM-FLOOR-001`

Selected option: `A-hazard-class-minimum-floors-owner-may-raise`

## Decision

Rondelli assigns the verification level required for each exact package and may
raise that level. Rondelli cannot lower a package beneath its hazard-class
minimum.

- Non-protected drafts: `V0`, with no admission effect.
- Ordinary protected slices (`OAR-02` through `OAR-06`, plus `OAR-10`): at
  least `V1`, verified by a checker under exact Victor-owned policy.
- High-impact boundaries (`OAR-01`, `OAR-07`, `OAR-08`, `OAR-09`, `OAR-11`):
  at least `V2`, directly verified by Victor Boscaro.
- `V3` remains unavailable unless a separate external L2 gate admits it.

Changing a frozen package's level creates a superseding package and restarts
verification. No earlier receipt follows the changed package.

This is an unaccepted Design policy. Exact schemas, checker contracts, owner
responses, and verifier receipts remain to be authored and admitted.
