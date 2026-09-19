# EVF Exact 34-Target Patch Proposal

## Selected decisions

- Semantic capsule: `DEC-GCP-001-R1:option-a`.
- Package topology:
  `EVF-PKG-TOPOLOGY-001 / EVF-PKG-B-EVIDENCE-ONLY`.
- Mutation mode for this run: `proposal-only`; canonical apply is forbidden.

## Proposed canonical patch

The proposal contains exactly 34 canonical outputs:

- 19 updates to existing Invoke-owned decision/Define/Design/Plan/Work-Pack,
  task, shared, wave, and dispatch files;
- four new Invoke-owned Work-Pack contracts: execution entry, closeout
  contract, corrected target inventory, and S1 validation contract;
- 11 new owner-selected semantic/input/binding/runtime/O_spec/receipt-schema
  files copied byte-exact from the reviewed Candidate A proposal.

The exact path, operation, baseline, staged locator, SHA-256, and size for every
output is in `STAGED-TARGET-INVENTORY.json`. That inventory is the review
surface; prose counts are not a substitute.

## Explicit exclusions

These are not canonical targets:

- `work-pack/MATERIAL-PACKAGE.candidate-a.json`;
- `work-pack/MATERIAL-PACKAGE.candidate-a.producer-receipt.json`;
- both run-local material evidence files;
- `reviews/one-shot-readiness/CURRENT-PLAN-AUDIT.json`.

The first two old targets are retired by the selected topology. The audit is
target 35 and remains independent of the 34 bytes it reviews.

## Future apply choreography

1. Rehash all live baselines and staged outputs.
2. Resolve acceptance-critical handoff-script provenance.
3. Present the exact 34 paths and current staged-inventory digest for explicit
   owner approval.
4. Treat any changed staged byte as a new candidate requiring a regenerated
   inventory and approval.
5. Only after exact approval, create a new schema-valid materialized package at
   `material/MATERIAL-PACKAGE.json` with 34 changes, inventory entries,
   approval paths, plan baselines, and validation bindings.
6. Generate `material/MATERIAL-RECEIPT.json` with the installed validator and
   require exact 34-path equality and a passing handoff resolver result.
7. Apply the 34 outputs atomically; stop and preserve the first failure.
8. Have an independent reviewer audit the exact applied bytes and create only
   target 35.

## Preserved boundaries

No canonical file, implementation byte, public Arcanum source, Git state,
authority, publication, release, deployment, or production state was changed.
