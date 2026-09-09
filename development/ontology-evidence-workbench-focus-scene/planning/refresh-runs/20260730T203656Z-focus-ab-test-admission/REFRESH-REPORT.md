# Invoke Refresh — OEW Focus A/B Test Admission

Phase status: `pass`  
Mutation mode: `apply-approved`  
Handoff: `ready`  
Next route: `task-session:execute SWU-OEW-FOCUS-TEST-001`

The direct-user refresh applied exactly three validated material targets:

- `planning/WORK-PACK.md`;
- `planning/work-pack/swu-manifest.json`;
- `implementation/ontology-evidence-workbench/scripts/validate-body-war-focus-ab.mjs`.

The material package
`oew-focus-ab-test-admission-20260730T203656Z` passed schema, dependency,
owner, publication, path, and digest validation. Its canonical package digest
is `61a0a8ac1e4ed813077621580c98b0dece265053ed538783bcd26983caaf745e`.
All three live targets equal the validated staged outputs.

`SWU-OEW-FOCUS-TEST-001` is the sole selected SWU. Its browser run is
execution-output-only; it may write only the four declared A/B artifacts and
the exact Task Session evidence files.

The novice comparison remains an audit-scoped deferred item. This refresh does
not prove comprehension, accessibility, ontology promotion, release,
deployment, or production readiness, and it has no authority effect.
