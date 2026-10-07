# C04 application composition and entry manifest

Date: 2026-09-20. Status: C04 scoped construction complete. Authority effect:
none. This is local compiler evidence, not product approval, publication,
release, deployment or runtime operation.

## Implemented boundary

The additive `alchlang.application-file/v2-candidate` companion binds a small
identity-only `application-v1` root to:

- 2..32 exact `.alch` source partitions with stable dotted namespaces;
- 2..32 explicitly named entries;
- an ordered source-set selection for every entry;
- one exact inbound endpoint and runtime identity per entry;
- an optional declared runtime profile; and
- the existing binding, interpretation, execution, evidence, integration and
  observation reference roles.

Each selected partition repeats the same domain, title, owner and
`application-v1` profile. The loader joins declarations and sends the result
through the existing shared parser, application model, DomainSpec lowerer and
application build path. It does not compile independent applications and call
that composition.

`check`, `build` and `verify` require `--entry <id>` for v2. Missing or unknown
selection rejects; array order never chooses an entry. The v1 one-file contract
remains unchanged and rejects an irrelevant `--entry` option.

## Exact manifest evidence

The emitted `.alch/entry-manifest.json` records:

- the selected entry;
- every source namespace, path, SHA-256 and size;
- every entry namespace and runtime identity;
- ordered source namespaces;
- the declarations retained under each source namespace;
- the selected inbound endpoint, derived Operation and exact method/path; and
- the digest/size of the joined source bytes.

The build manifest binds the entry-manifest digest and selected entry. Verify
regenerates both from current inputs.

## Fail-closed behavior

Composition rejects before output when it observes:

- an implicit or unknown entry selection;
- a source path outside the application root, a symlink or changed bytes;
- duplicate source namespaces, entry namespaces, entry IDs or runtime IDs;
- an unreachable or repeated source namespace;
- mismatched domain/title/owner identity between partitions;
- declaration or normalized DomainSpec symbol collisions;
- an undeclared endpoint or runtime profile; or
- duplicate HTTP method/path pairs inside an entry.

All source and entry reference files are part of the currentness snapshot, not
only the selected entry's first source.

## Evidence

- `test/application-composition.test.ts`: 2/2 focused positive and hostile
  groups.
- Existing application-file, portable-module and `service-v1` regressions:
  17/17 with the focused C04 suite included.
- TypeScript strict typecheck: pass.
- Complete adjacent application regression: 105/105, zero skips.

## Claim ceiling

C04 proves bounded multi-file source joining, explicit application entry
selection, namespace/source traceability, route uniqueness and runtime identity
uniqueness through the existing TypeScript application path. It does not prove
C05 TypeScript/Python/Rust parity, arbitrary cross-domain package imports,
dynamic imports, remote modules, installed-package behavior, provider
operation, product approval or any operational effect.

## Open Questions

C05 owns native and semantic parity for all three target languages. C06 owns
the broader Unicode/case collision corpus and complete hostile-currentness
accounting. Cross-project package registries and remote module identity remain
outside this local source-root composition boundary.
