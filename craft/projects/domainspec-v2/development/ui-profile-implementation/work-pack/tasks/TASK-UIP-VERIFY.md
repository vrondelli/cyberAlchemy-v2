---
task_id: TASK-UIP-VERIFY
feature_code: UIP
layer: L3
status: complete-with-external-residue
---

# TASK-UIP-VERIFY: Integrated Development Profile Audit

## SWU-UIP-007

- Goal: verify that SWU-UIP-001..006 recompose into the approved design without
  authority leakage or empirical overclaim.
- Dependencies: SWU-UIP-001..006.
- Write scope: `runs/SWU-UIP-007/`, work-pack status synchronization, and
  observability receipt only.
- Acceptance evidence:
  - exact concept/fixture/graph/packet census;
  - focused receipt verification for every predecessor;
  - full DomainSpec validation and typecheck;
  - two-run graph/profile digest equality;
  - canonical authority diff limited to pre-existing user changes, with no UIP
    task writes;
  - explicit `required-by-design`, `mechanically-validated`, and
    `empirically-provisional` closeout.

## Audit Algorithm

1. Verify receipt identity, dependency order, declared write scopes, and source
   digests for SWU-UIP-001..006.
2. Re-run focused profile, schema, synthetic, graph, compiler, and packet checks.
3. Run aggregate validation and typecheck.
4. Recompose registry -> formations -> fixtures -> graph -> traversal -> packet.
5. Fail any claim of canonical activation, release admission, independent
   evidence, or empirical universality.
6. Synchronize the work-pack only after all checks pass.

## Validation

```bash
cd projects/domainspec-v2/impl
npm run tools:test
npm run engine:test
npm run validate
npm run typecheck
```

- Execution owner: independent local Task Session audit.
- Context Builder anchors: all task receipts, `ARCHITECTURE.md`,
  `IMPLEMENTATION-LAYERING.md`, `WORK-PACK.md`, and authority packet.
- Expected receipt: pass/flag/block, exact commands, files, digests, authority
  boundary result, confidence residue, and next-owner route.
