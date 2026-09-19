# Query result cardinality

Status: implemented construction candidate, 2026-09-17. Authority effect: none.
This is an additive result contract, not a change to the pinned list-query
profiles or a claim that the complete application path is finished.

## Authoring and lowering

Alch `output list<Order>` continues to lower to `domainspec.typed-query/v1`.
`output optional<Order>` lowers to `domainspec.typed-query/v2` with explicit
`result_cardinality: "optional"`. Both retain the exact Rule-derived predicate,
declared inputs, source Entity and full projected fields. An optional result
is not permission to choose the first matching row.

The backend v2 contract also supports explicit `result_cardinality: "list"`.
Version 1 has no new field or changed default. Missing/unknown cardinality,
unknown fields and a non-null limit on optional queries reject during decode.
This prevents truncation from concealing multiple matches.

## Result behavior

| Selected rows after filtering | TypeScript | Python | Rust |
| --- | --- | --- | --- |
| Zero | `null` | `None` | `Ok(None)` |
| One | Frozen projection | Immutable read projection | `Ok(Some(projection))` |
| More than one, including duplicate rows | Error code `QUERY_CARDINALITY` | Runtime error `QUERY_CARDINALITY` | `Err(QueryError { code: "QUERY_CARDINALITY" })` |

TypeScript/Python validate supplied rows and parameters before filtering;
Rust consumes its declared typed Reader result. Reader failure propagates and
is not converted into absence. Cardinality is checked before producing a
projection. A read projection is not an Entity factory result and does not
implicitly run invariants. No storage provider, retry or external effect is
introduced.

## Contract and profile separation

Implementation sources are under `impl/cli/src/`:

- `typed-backend/contracts.ts`: closed v1/v2 decode and optional-limit guard.
- `input/project-model.ts`: v2 source/field and exact canonical reads-edge checks.
- `authoring/add-operation.ts`: existing typed Query authoring recognizes v2.
- `generation/query-cardinality-extension.ts`: the exact additive candidate
  contract, included with its digest in v2 module metadata.
- Configured TypeScript, Python and Rust Query generators: native return types
  and cardinality checks. v2 modules identify themselves as
  `<language>.bound-query/v2-candidate`; base v1 profiles are unchanged.
- `generation/generators.ts`: legacy realization rejects v2 with
  `MTCLI_QUERY_PROFILE_REQUIRED` rather than emitting a list or unchecked stub.

The original generation-contract source hashes remain unchanged. Their common
input/filter/projection mechanics are reused; the separate extension explicitly
owns the v2 result behavior. Registration, admission, release and complete
profile unification are not inferred from this local candidate.

## Evidence and remaining scope

`test/generation/query-cardinality-contract.test.ts` checks closed schemas,
explicit cardinality, forbidden limits, extension identity and legacy rejection.
Configured Python and Rust Query suites execute optional behavior alongside
their existing list regressions. Rust also checks reader-error propagation.
The Alch `test/application-query.test.ts` compiles through public DomainSpec
APIs and executes both list and optional forms, including exact UInt64 values,
malformed inputs, immutable output and duplicate matching rows.

These checks prove the bounded cardinality extension. They do not discharge the
combined I00 commerce fixture, persistence-provider binding, whole-application
verification observers, complete C05 language/integration parity, installed
qualification or product approval. Runtime/verification consumers must select
the explicit v2 protocol; unsupported consumers must not claim v1 conformance.
