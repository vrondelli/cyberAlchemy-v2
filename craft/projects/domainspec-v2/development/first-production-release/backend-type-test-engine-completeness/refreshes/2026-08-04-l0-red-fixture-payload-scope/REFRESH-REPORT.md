---
artifact: bte-l0-red-fixture-payload-scope-refresh-report
status: pass-owner-gated
updatedAt: 2026-08-04
semanticAuthority: none
---

# Invoke Refresh Report — L0 RED Fixture Payload Scope

## Result

- Mode: `refresh --apply-approved`
- Phase status: `pass`
- Material handoff: `ready`, nine exact paths
- Current L0A publication proof: `green`
- Selected SWU: `none`
- Candidate SWU: `none`
- Successor: `SWU-BTE-L0B-001`, still unselected and owner-gated
- Admission: not granted
- Production: not authorized

The refresh resolves the ceremonial-freeze contradiction: each RED manifest
entry must now bind real package-local bytes authored before the manifest.
Fixture payloads, no-follow topology inputs, the stable owner identity, package
root, digest convention, and all 25 diagnostics are explicit.

## Evidence and validation

- strict Context Pack: 6/6 obligations covered;
- Inventory lookup readiness: pass, 141 uncontrolled-tag warnings;
- Dispatch Spec: pass, 4 steps, no flags or blocks;
- material package: pass, digest
  `eb3a55a9315bbbbaa80fb5836004d9ab09d297f3f02d490b6f2df693f950daad`;
- material handoff: `mutationReady=true`;
- live/staged parity: 9/9;
- L0A publication verification: pass with unchanged receipt and output-manifest
  digests;
- transport JSON and scoped whitespace: pass.

Distill was skipped because the approved repair is one narrow owner-boundary
correction and changes no layer or SWU boundary.

## Next owner

The independent validation owner may now write only:

- `validation-inputs/l0/fixtures/*.json`;
- `validation-inputs/l0/topology/*`;
- `validation-inputs/l0/red-fixture-manifest.v1.json`;
- `validation-inputs/l0/red-fixture-freeze-receipt.json`.

A later Invoke Refresh must validate the returned bytes and freeze before it
may expose L0B. This report does not select or execute implementation.
