# Shared compilation boundary

Status: implemented candidate with passing bounded container and native evidence. Authority effect: none.
User scope: reconcile direct DomainSpec and AlchLang compilation, 2026-09-07.

## Product construction

The product frontier is one checked system model consumed by generation, with
direct JSON and AlchLang as authoring inputs. A composition ontology binds typed
contracts, meanings, identities and dependency evidence; it does not grant
ontology admission. Source provenance stays specific to each frontend.

1. Add `domainspec.composition-ontology/v1` and an explicit legacy AlchLang adapter.
   Preserve legacy input artifacts and certificates; new AlchLang projects use
   the shared contract. Unknown schemas and changed meanings/dependencies reject.
2. Select generation nodes and typed closures from the compiled graph snapshot.
   Keep the final source-currentness check; never re-read nodes to generate code.
3. Make ordinary AlchLang build/check use the DomainSpec backend, with
   `--backend local-compat` retaining the old local carrier compiler. Explicit
   specialized function/event/host profiles keep their existing dispatch.
   Unsupported lowering rejects; it cannot silently switch backend.
4. Test legacy/shared composition parity, direct/AlchLang lowering parity,
   source-independent snapshot generation, ontology mutations and backend choice.

All four construction steps are implemented. The new snapshot API rejects
fabricated or changed graph objects; direct JSON evidence must match its exact
declarative contract. Development CLI outputs were rebuilt and the order example
passed the default AlchLang-to-sibling-DomainSpec build/verify path.

Focused validation: 24 AlchLang tests and 11 DomainSpec tests pass. DomainSpec
source build, AlchLang source build and focused AlchLang source/test typechecking
pass. Catalog, relationship-authority and integration-profile projections pass.
Exact source inventory, commands and limits are in [evidence.json](evidence.json).
The earlier host results are retained as history. The container follow-up passed
47 DomainSpec tests and 24 AlchLang tests with zero skips, both source builds,
focused typechecking, and the default AlchLang build. See
[container evidence](validation/container/evidence.json) for exact source hashes,
commands, logs, image identities, and runtime additions. This is bounded test
evidence, not full product acceptance or product approval.

## D65 construction chain and selected dependencies

Prototype meaning is above. The existing capability/business predecessor is
`cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1/`;
the existing system-model vertical is its `extensions/unified-project-v1/`.
The shared ontology contract and explicit source format extend that scaffold.
The authored technical prototypes are `domainspec.project/v2`, typed core nodes
and `domainspec.project-composition/v1`. The compiled graph and certificate are
produced by `impl/cli/src/compilation/certificate.ts`; generation is owned by
`impl/cli/src/generation/project-build.ts`. The test fixture projects are exact
construction inputs, not admitted systems. The implementation and test evidence
will be bound in `evidence.json` after validation.

Selected ontology dependencies: composition node IDs, typed contracts, property
identities/meanings, exact dependency references, source hashes and source formats
in the tested project fixtures. No ambient ontology-runtime records are required.
No existing accepted archive or authority definition is changed.

## Operational support

- Agent: temporary host test dependencies, needed only for local product tests.
- Completed: Docker access and the pinned Node/TypeScript image are available.
  The exact image validator passes. The bounded native run uses a documented
  supporting image adding CA certificates and jsonschema 4.26.0.
- Completed for this corpus: GCC 12.2.0 and read-only Rust 1.98.1 enabled native
  tests. All 47 selected DomainSpec tests pass, including Rust integer execution
  and cross-language State Machine/L1 outcomes. The whole product suite and
  whole AlchLang test typecheck remain separate from this bounded result.
- Toolchain owner: decide whether the additional schema and CA dependencies
  belong in the shared base image. They are retained in the validation image;
  no shared toolchain definition was changed. This does not block the tested
  construction frontier.
- Product owner: exact candidate product review after tests. No product approval
  is inferred from this implementation.
- Release/deployment owner: publication, release and deployment are deferred and
  have no dependency on this local implementation frontier.

## Open Questions

- Which unsupported local-carrier constructs should receive the next DomainSpec
  lowering profile? Explicit compatibility execution remains available.
- When should the legacy AlchLang ontology schema and local backend be retired?
- Should the validation image's schema and CA dependencies be adopted by the shared toolchain owner?
- Which additional product/release corpus should define acceptance beyond these 71 passing tests?
