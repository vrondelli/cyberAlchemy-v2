# L02 successor result

**PASS for the selected migration implementation contract: 31 focused tests and
TypeScript checking pass.** All 139 selected dependency hashes remain unchanged.

The current key-and-door graph, provenance manifest and build receipt reproduce
byte-for-byte with the selected compiler. The historical EVF binding pins older
generated outputs. Its historical cause/time is not established. An explicit
`evf-s1-migration-002` profile selects a candidate differing only in those two refs.
Native derivation now equals the unchanged O_spec by full identity and payload.
Stale source, registry, graph and provenance refs reject from a passing baseline.
The whole-source guard also rejects changed inputs and candidate-binding tampering.

The old `evf-s1` binding still rejects. Neither it nor the earlier BLOCK receipt
was rewritten. Legacy Markdown and changed-file functions are reused unchanged.
Rollback was exercised through the actual public `deriveFeature` API with the
same sample binding; it is not an operational cutover claim.

From `projects/domainspec-v2/impl`:

```sh
node --import ./node_modules/tsx/dist/loader.mjs --test ../development/completion-dag/v1/evidence/l02-migration-v2/repair.test.ts ../development/completion-dag/v1/evidence/l02-migration-v1/migration.test.ts
node node_modules/typescript/bin/tsc -p ../development/completion-dag/v1/evidence/l02-migration-v2/tsconfig.json
node --import ./node_modules/tsx/dist/loader.mjs ../development/completion-dag/v1/evidence/l02-migration-v2/cli.ts machine /home/vrondelli/projects/domainspec-core evf-s1-migration-002
```

Product construction continues to L03 selected-row closure. Independent review
and product approval remain L04. UI, caller cutover, retirement and publication
remain deferred. No activation, admission or release authority is granted.
