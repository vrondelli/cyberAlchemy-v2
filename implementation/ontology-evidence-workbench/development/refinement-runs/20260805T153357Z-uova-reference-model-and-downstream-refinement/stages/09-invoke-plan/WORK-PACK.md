# Work Pack — UOVA Relation Reference Repair

Status: non-executed candidate plan
Pack ID: UOVA-RR-20260805
Next owner route: invoke:refresh
Task Session readiness: **not admitted**

## Outcome

Repair the UOVA relation model before resuming the portal work. The completed
semantic core remains historical evidence; affected downstream contracts are
superseded only after an owner refresh materializes byte-current task contracts.

## Invariants

- SourceGraph is the sole relation-semantic owner.
- Every interactive surface uses RelationRef(source_relation_id, scene_digest).
- The runtime facet is an index role over admitted scene bindings, not a copied
  relation collection.
- Missing/stale identity fails closed; endpoint/predicate tuple fallback is forbidden.
- Derived copies carry and validate relation_digest.
- Detached output carries and validates RelationSnapshot.
- v1/v1.1 artifacts retain their original identity and claim ceiling.
- Body War and the reuse fixture use the generic compiler without project branches.

## Frontier

| Order | SWU | Outcome | Depends on |
| --- | --- | --- | --- |
| 1 | UOVARR-001 | v1.2 schema, digest, index, resolver | completed UOVA 001–003 evidence |
| 2 | UOVARR-002 | source-bound v1/v1.1 compatibility adapter | 001 |
| 3 | UOVARR-003 | reference-first portals and summary validation | 001 |
| 4 | UOVARR-004 | reference-first Path | 001 |
| 5 | UOVARR-005 | revision-safe selection, navigation, and view models | 003, 004 |
| 6 | UOVARR-006 | encoding, geometry, renderer, inspector, and Full Index joins | 005 |
| 7 | UOVARR-007 | static/no-JS/print snapshots and accessibility fallback | 006 |
| 8 | UOVARR-008 | Body War full adapter and authoritative denominator transition | 002, 007, owner denominator decision |
| 9 | UOVARR-009 | full regression, browser acceptance, determinism, reuse | 008 |

## Waves

- W1 Contract trust: 001–002.
- W2 Interaction identity: 003–005; 003 and 004 may run in parallel after 001.
- W3 Presentation and projection: 006–007.
- W4 Project and acceptance: 008–009.

## Validation commands to bind during refresh

Run from cyberAlchemy-v2/implementation/ontology-evidence-workbench:

    npm test
    node --experimental-strip-types --test test/relation-reference.test.mjs test/relation-migration.test.mjs
    node --experimental-strip-types --test test/portal-reference.test.mjs test/path-reference.test.mjs test/relation-consumer-sync.test.mjs
    node --experimental-strip-types --test test/relation-projection.test.mjs test/static-relation-snapshot.test.mjs
    node --experimental-strip-types --test test/body-war-adapter.test.mjs
    npm run test:browser

The refresh must verify that each named command exists after its producing SWU and
bind exact repository-relative working directory, tool versions, inputs, and output
receipt. Bare node --test is not the contract for TypeScript-importing tests.

## Admission contract

Before Task Session, invoke:refresh must:

1. select one immutable pack frontier and risk profile;
2. materialize exact target paths plus current byte baselines per SWU;
3. bind the current Node loader command and browser runtime;
4. bind validation and closeout commands per SWU;
5. resolve the Body War denominator decision from direct owner evidence;
6. issue Plan Semantic Manifest, selection/material/producer receipts, execution
   bindings, closeout bindings, and successor policy.

## Closeout contract

Every mutation SWU must return exact before/after hashes, changed-file inventory,
focused validation, full affected regression, scoped git diff --check, residue,
and successor state. A passing focused test cannot strengthen prior receipts or
authorize the next SWU until owner closeout synchronization is applied.

## Stop conditions

- semantic fields are copied without a digest law;
- a tuple lookup or project-specific relation branch appears;
- prior v1/v1.1 evidence is relabeled;
- the Body War denominator is guessed;
- acceptance-critical validation fails;
- credentials, network, dependency mutation, deployment, release, or promotion is
  required without separate authority.
