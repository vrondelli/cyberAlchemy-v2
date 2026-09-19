# Invoke Refresh Report: SWU-SFOL-001

## Result

- Phase status: pass.
- Mutation mode: `apply-approved` from the direct user request.
- Handoff status: ready.
- Mutation ready: true.
- Next route: `task-session --swu SWU-SFOL-001`.

## Resolved Blocker

`B-SFOL-001-MATERIAL` is resolved. The historical Task Session correctly
blocked because its request omitted the producer material package, material
receipt, and producer receipt schema. The rematerialized package is bound to
the current node-corrected v0.2 work pack, current denominator task, and a
strict current context pack.

## Exact Material

- Package: `material/MATERIAL-PACKAGE.json`
- Package ID: `dsv2-sfol-swu-001-20260724T015403Z`
- Canonical package digest:
  `5eda56e3b4b4ec405418cc4e8d36d9acd71d98cc268b415250c2846cf7e9e733`
- Producer receipt: `material/MATERIAL-RECEIPT.json`
- Handoff result: `material/REFRESH-HANDOFF-RESULT.json`
- Task Session probe: `ADMISSION-PROBE-RECEIPT.json`

The exact Task Session write set is:

1. `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/denominator/index.ts`
2. `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/denominator.test.ts`

Both post-images remain staged. Invoke did not write implementation targets.

## Applied Refresh Deltas

- `WORK-PACK.md`: resolved the material blocker, narrowed the write scope to
  two exact files, marked SWU-SFOL-001 selected/mutation-ready, and changed the
  route to Task Session.
- `INVOKE-EVIDENCE.json`: recorded the package, receipt, producer schema,
  admission probe, Refresh execution evidence, and three-axis capability
  result.

## Validation

- Staged denominator corpus: pass, 11 tests.
- Staged denominator scoped TypeScript compile: pass.
- Broader engine workspace typecheck: known pre-existing minted-project
  `rootDir`, extension, and strictness failures outside this exact write set;
  the scoped compile is the accepted SWU equivalent.
- Producer material validator: pass.
- Refresh handoff resolver: pass, `mutationReady=true`.
- Task Session admission probe: `admit`, `mutationReady=true`, no reasons.
- DS-SFOL plan validator: pass, 34 required files, 12 mutation SWUs, one
  closure exemption.
- Capability resolver: artifact authored pass; mutation runtime ready true;
  registry released false.

## Claim Boundary

This proves implementation material readiness only. SWU-SFOL-001 is not
implemented or complete until Task Session applies the post-images and runs the
declared live validation surface. G-SFOL-06, adopters, registry release,
promotion, release, and production remain outside this Refresh.
