# Context Pack — SWU-ARE-001

- Run: `20260806T141445Z-swu-are-001`
- Mode: lean, strict
- Coverage: 6/6 obligations covered
- Authority effect: none

The selected unit freezes the expected-red `ArchitectureRealizationSpec/v1`
denominator before projector implementation. The controlling sources are the
Work-Pack execution policy, manifest row `/swus/0`, the `SWU-ARE-001` task contract, Design's
`ArchitectureRealizationSpec/v1`, the current ontology concept types, and the
exact closeout row.

The four material files and one verifier-produced receipt are all absent at
capture. The projector target is also absent. No ontology, profile, product,
authority, publication, deployment, or release mutation is admitted.

Validation is exactly:

`node projects/domainspec-v2/development/architecture-realization-compiler/tools/verify-red-realization-spec.mjs`

The terminal receipt may be created only after that command passes and proves
the projector remains absent.
