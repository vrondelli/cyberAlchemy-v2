---
task_id: TASK-UIP-CONTRACT
feature_code: UIP
layer: L0
status: complete
---

# TASK-UIP-CONTRACT: Required Concept And Representation Contract

## SWU-UIP-001

- Goal: implement the machine-readable development registry that keeps concept
  availability, graph representation, confidence, and authority status
  independent.
- Dependencies: none.
- Source anchors: `UI-PROFILE-DESIGN.json`; UI adjudication verdicts; current
  DS-D1 maturity block; current DS-D8 UI signatures.
- Write scope:
  - `projects/domainspec-v2/impl/spec/ui-profile/profile.yml`
  - `projects/domainspec-v2/impl/spec/ui-profile/profile.schema.json`
  - `projects/domainspec-v2/impl/tools/validate-ui-profile.ts`
  - focused validator tests/fixtures only
  - `runs/SWU-UIP-001/`
- Inputs: eleven design entries and the closed representation vocabulary.
- Outputs: validated registry, stable digest, positive fixture, and typed
  duplicate/missing/unknown-placement/invalid-target negatives.

## Algorithm

1. Parse the design registry and require exactly DS-D1.15 through DS-D1.25.
2. Validate each entry's availability, representation proposal, confidence, and
   target/branch fields.
3. Require node candidates to name a formation contract; require aliases to
   resolve to an existing active kind; require splits to have unique branches.
4. Reject an edge-only Binding presented as a node instance.
5. Canonicalize the registry and emit a stable content digest.
6. Prove two identical runs produce the same digest and any semantic mutation
   changes it.

## Edge Cases And Failure Modes

- Required concept omitted or duplicated: block.
- Alias cycle, missing canonical target, or split with duplicate branch: block.
- Confidence value used to change availability/representation: block.
- Canonical authority file mutation: block and return owner route.

## Done And Acceptance

- Exact 11/11 census and closed representation validation pass.
- Human design and machine registry agree.
- Stable digest and all focused negative codes are recorded.
- No DS-D1, DS-D8, or supported-profile authority file changes.

## Validation

```bash
cd projects/domainspec-v2/impl
node --import tsx --test tools/tests/validate-ui-profile.test.ts
tsx tools/validate-ui-profile.ts --profile spec/ui-profile/profile.yml
```

- Execution owner: local Task Session.
- Context Builder anchors: this SWU, `ARCHITECTURE.md#Representation-Decisions`,
  `UI-PROFILE-DESIGN.json`, DS-D1 maturity, and DS-D8 UI signatures.
- Expected receipt: registry/digest paths, exact commands, negative matrix,
  authority diff check, residue, and next-SWU handoff.
