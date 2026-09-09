# Validation Strategy

## Validation Pyramid

1. **Schema and unit:** exact contracts, mappings, state reducers, path rules.
2. **Property/determinism:** stable ordering, total mappings, double-run bytes.
3. **Integration:** existing terminal verifier, upstream lock/build, adapter
   run, local server.
4. **Parity:** source ↔ sidecar ↔ graph/outline/table exact-state oracle.
5. **Browser:** Firefox and Chromium critical journeys, token/path/network
   assertions, console errors, responsive modes.
6. **Accessibility:** axe/keyboard/reduced motion automated; manual screen reader
   and usability separately owned.
7. **Isolation:** exact protected-path digest set before/after.
8. **Receipt:** independent adapter/browser/package receipt verification.
9. **L1 materialization:** early exact Node/pnpm/effective-lock and
   fixture-patch proof; after feature source, a separate clean workroot,
   complete overlay pre/postimages, typed test/build, cleanup, and residue.
10. **Lifecycle:** owned browser binaries, minimal environment, child
    PID/port ledger, outbound observation, `finally` teardown, port release,
    and a verifier distinct from the producer.
11. **Frontier readiness:** before selection, resolve every active package
    command to an existing entrypoint or a target owned by that same SWU;
    require one package root and closed dependency order.

## Mandatory Positive and Negative Fixtures

| Domain | Positive | Negative |
| --- | --- | --- |
| source admission | current SWU-OCGP-008 bundle | tampered result, missing receipt, authority-effecting fixture |
| mapping | Poker node/relation set | unknown relation, missing sidecar ref, duplicate source ref |
| adapter writer | new run ID | overwrite/existing target, partial receipt |
| upstream | exact commit/license/file hashes | floating ref, wrong commit/hash/license |
| HTTP boundary | tokenized loopback GET/HEAD | missing token, POST, traversal, symlink escape, non-loopback |
| UI parity | F1/R1/D1, D2 conflict, indeterminate edge | disagreement across surfaces |
| code context | explicit scope/map | implicit cross-namespace edge or evidence digest change |
| accessibility | keyboard/axe/reduced motion | graph-only fact, focus loss, color-only status |
| L1 provisioner | fresh workroot, exact tools/lock, self-owned fixture patch-once, cleanup | ambient workspace/cache fallback, wrong tool, patch drift/reapply, failed cleanup |
| L1 UI frontier | completed 007 store plus complete 008F vertical slice and six owned runners | missing runner, cross-SWU ownership, unsupported direct TSX execution, second package root |
| L1 final build | complete 007 + 008F overlay, fresh workroot, patch-once, Vitest + typed build, independent verifier | pre-feature handle, final-source drift, producer-only acceptance, failed cleanup |
| browser lifecycle | admitted build handle, pinned browsers, owned PIDs/ports, clean teardown | reused server, inherited broad environment, orphan PID, occupied port, producer self-verification |

## Exact Poker Oracle

- grounding selection: exactly `F1`, `R1`, `D1`;
- visible non-composing conflict: `D2 contradicts D1`;
- candidate `specializes(D2,D1)`: `policy-indeterminate`,
  `POLICY_OWNER_UNBOUND`, `authority_effect:none`;
- all presented objects resolve to source IDs and digests.

## Protected Scope

The isolation manifest includes:

- `validation/poker-team/**`;
- `cyberAlchemy-v2/development/interactive-ontology-learning-map/**`;
- `cyberAlchemy-v2/.craft/**`, `.craft/ledger.yml`, `CRAFT.md`;
- `cyberAlchemy-v2/authority/**`, `cyberAlchemy-v2/ontology/**`;
- `arcanum/**`;
- existing candidate implementation inputs and generated SWU-OCGP-008 bundle.

Only the active SWU's exact OEW target inventory may differ.

## Browser Evidence Ceiling

Automated browser pass proves only scripted browsers, viewport contracts,
network/console assertions, and automated accessibility. Manual screen-reader
and usability states remain `NOT_RUN` until named human results exist. Neither
browser state grants product/authority/release readiness.

The browser producer cannot close G-OEW-L1. It must consume the verified
`SWU-OEW-013B` build handle. `SWU-OEW-014V` must independently recompute that
build-handle binding, browser results, protected equality,
outbound assertions, owned-child teardown, port release, residue, and
`authority_effect:none`.

## Commands

Concrete commands are defined per task. The expected family is:

```text
npm test
npm run verify:adapter
npm run verify:upstream
npm run build:l1
npm run verify:l1-build
npm run verify:isolation
npm run test:browser
npm run verify:browser-acceptance
npm run verify:package
```

These are planned command contracts, not evidence that scripts exist.

## Open Questions

See [../define/SPEC.md](../define/SPEC.md#open-questions).
