# C0 Provider-Neutral Graph-Law Contract Sketch

Status: proposal-only, nonselected, blocked from execution

Authority effect: none

Release admission: not granted

## Boundary

This sketch narrows the accepted direction in `DEC-GCP-003` into a provider-neutral
contract surface. It does not select option 3 in `DEC-GCP-004`, reorder L1 and L2,
admit a graph property, approve a provider, install a runtime, or execute Datalog or
Alloy.

An executable `GraphLawRequest/v1` remains blocked until all of these are exact and
admitted:

- a terminal L1 prerequisite receipt;
- an owner-governed property definition;
- a provider-result comparison contract;
- the graph, graph schema, source manifest, registries, extractor, and extractor
  configuration;
- the Datalog and Alloy runtimes, adapters, query/model bytes, invocation contracts,
  and Alloy scope contract;
- clean formal-provider dependency status and current target baselines.

## Four-envelope flow

1. `GraphFactManifest/v1` deterministically projects one generated semantic graph
   into a closed fact set. It is a derived, non-authoritative read model.
2. `GraphLawRequest/v1` binds that fact digest, one external property definition, one
   external comparison contract, and exactly two ordered provider roles: Datalog,
   then Alloy.
3. `GraphLawProviderReceipt/v1` preserves each provider's native result and records a
   provider-neutral result without erasing the evaluation domain.
4. `GraphLawJoinReceipt/v1` checks exact join keys and reports consistency,
   complementarity, unresolved evidence, or a block. It never votes and has no
   `pass` state.

The current S1/key-door receipt schema is deliberately not reused: it binds
`SWU-GCP-001`, fixture-specific observations, its mutation denominator, and its own
claim ceiling.

A completed provider receipt requires `exit_code: 0`, `timed_out: false`, and its
provider-specific native result. A timeout or nonzero exit is an evaluation error,
normalizes to `unresolved`, and carries `no-property-claim`. A
blocked, failed, or stale receipt records `native_result: null`, normalizes to
`unresolved`, and carries `no-property-claim`; it must not manufacture an empty
relation or an Alloy outcome to fill the field.

## Projection and canonicalization

`evf-canonical-json/v1` is a repository-owned profile, not a claim of RFC 8785
conformance.

- Inputs are JSON values only. Numeric contract fields are integers in the inclusive
  JavaScript-safe range `[-9007199254740991, 9007199254740991]`. NaN, Infinity,
  undefined, a UTF-8 BOM, absolute paths, `..` path segments, backslash paths, and
  out-of-range integers are rejected.
- Strings remain byte-exact. There is no trimming, case folding, or Unicode
  normalization.
- Object keys are ordered by JavaScript/Unicode UTF-16 code units. Semantically
  ordered arrays retain their order.
- Before the fact payload is hashed, nodes are sorted by
  `(node_id, feature_id, kind)` and edges by
  `(edge_id, predicate, from, to)`. Every tuple component uses the same UTF-16
  code-unit comparator as object keys. Duplicate node and edge IDs are rejected
  before sorting. The regression pair `U+E000` / `U+10000` fixes the cross-language
  order explicitly.
- The graph edge field `type` maps mechanically to fact field `predicate`; bodies are
  omitted and no facts, inverses, or semantics are inferred.
- `facts_digest` is lowercase SHA-256 over canonical UTF-8 bytes of only
  `{nodes, edges}`. It is not a self-hash of the manifest.
- Exact file hashes bind request and receipt envelopes externally. Provider semantic
  digests exclude volatile timestamps and log locations; the complete receipt file
  hash still binds those bytes.
- Every provider translation must bind the same `facts_digest` and prove zero
  omitted and zero invented tuples.
- A Datalog receipt binds its exact rows artifact, the canonical rows-array digest,
  and the row count; all three must agree. An Alloy receipt recomputes
  `scope_digest` from the embedded canonical scope. SAT requires an exact instance
  or counterexample reference, and normalized and joined evidence must retain each
  provider evidence reference.

Any changed graph, schema, source manifest, registry, extractor, configuration,
property, mapping, runtime, adapter, invocation contract, query/model, or scope byte
requires a new request and new receipts.

## External admission boundary

The four schemas deliberately keep L1, property, and comparison content external.
An `exactRef` proves bytes only; schema validation alone does not prove that the
referenced artifact is a terminal admitted L1 receipt. Before an execution-ready
request is accepted, a resolver must load the exact referenced bytes and verify the
generic receipt kind, L1 layer, terminal pass, admitted prerequisite state, authority
ceiling, and release ceiling. The proposal validator exercises that boundary with a
synthetic generic L1 receipt containing no feature identity or feature predicate.
Property definitions and comparison contracts require their own owner resolvers and
remain outside this synthetic validation.

## Provider-result mapping

| Provider result | Normalized result |
| --- | --- |
| Complete Datalog violation relation with rows | `counterexample` on the exact fact set |
| Complete Datalog violation relation with zero rows | `no-counterexample` on the exact fact set |
| Datalog execution, parse, or completeness failure | `unresolved` |
| Alloy `check` SAT | `counterexample` within the recorded scope |
| Alloy `check` UNSAT | `no-counterexample` within the recorded scope |
| Alloy `check` unknown | `unresolved` |
| Alloy `run` SAT | `witness` within the recorded scope |
| Alloy `run` UNSAT | `no-witness` within the recorded scope |

An Alloy `run` result is not comparable to a universal violation query unless a
separately admitted mapping contract establishes the existential semantics.

For the same comparable closed-world domain, two counterexamples are consistent and
two no-counterexample results are consistent only under the declared bounds.
Opposite outcomes remain unresolved. A clean exact Datalog snapshot together with an
Alloy counterexample from a bounded extension is complementary, not disagreement and
not pass. A missing, invalid, stale, or unresolved provider result cannot be promoted
by the join.

## Stable error vocabulary

Admission or block, exit class 2:

`L1_PREREQUISITE_MISSING`, `L1_PREREQUISITE_UNADMITTED`,
`PROPERTY_DEFINITION_UNADMITTED`, `COMPARISON_CONTRACT_UNADMITTED`,
`PROVIDER_RUNTIME_UNAVAILABLE`, `PROVIDER_RUNTIME_UNAPPROVED`,
`FORMAL_PROVIDER_DEPENDENCY_UNCLEAN`, `TARGET_BASELINE_DRIFT`.

Validation or evaluation, exit class 1:

`GRAPH_REQUEST_SCHEMA_INVALID`, `GRAPH_SCHEMA_INVALID`,
`GRAPH_AUTHORITY_MISMATCH`, `SOURCE_MANIFEST_MISSING`, `SOURCE_DIGEST_STALE`,
`REGISTRY_DIGEST_STALE`, `EXTRACTOR_UNPINNED`, `EXTRACTOR_DIGEST_STALE`,
`CANONICALIZATION_UNSUPPORTED`, `FACT_NODE_ID_DUPLICATE`,
`FACT_EDGE_ID_DUPLICATE`, `FACT_ENDPOINT_MISSING`, `FACT_PROJECTION_DRIFT`,
`FACT_DIGEST_MISMATCH`, `PROVIDER_VERSION_MISMATCH`,
`PROVIDER_ADAPTER_STALE`, `PROVIDER_INPUT_DIGEST_MISMATCH`,
`PROVIDER_SCOPE_INVALID`, `PROVIDER_TIMEOUT`, `PROVIDER_EXECUTION_FAILED`,
`PROVIDER_OUTPUT_INVALID`, `PROVIDER_RESULT_UNMAPPED`,
`PROVIDER_RECEIPT_TAMPERED`, `JOIN_RECEIPT_MISSING`,
`JOIN_REQUEST_MISMATCH`, `JOIN_FACT_DIGEST_MISMATCH`,
`JOIN_PROPERTY_MISMATCH`, `JOIN_MAPPING_MISMATCH`,
`JOIN_DOMAIN_INCOMPARABLE`, `JOIN_RESULT_DISAGREEMENT`,
`JOIN_CLAIM_INFLATION`, `JOIN_RECEIPT_TAMPERED`.

Structured residue classes are `bounded-scope-only`,
`counterexample-not-minimal`, `witness-projection-incomplete`,
`provider-disagreement`, `domain-not-comparable`, `property-owner-open`,
`l1-prerequisite-open`, `datalog-runtime-acquisition-open`,
`formal-tower-claim-surface-drift`, `unsupported-property`, `stale-input`, and
`coverage-gap`. Each residue records its ID, class, severity, message, exact source
references, and claim effect.

## L1 non-binding audit

The schemas contain no `SWU-GCP-002`, Financial Settlement, key-door, relationship
label, rule predicate, `O_spec`, implementation path, expected Boolean, or expected
provider outcome. L1 appears only as an exact prerequisite-receipt slot. Property
formulae and provider-result mappings are external exact references, preventing an
unresolved feature meaning or self-fulfilling expected result from entering C0.

The companion validator therefore uses only a synthetic two-node cycle plus generic
external L1 and provider-evidence artifacts. Passing it proves only the declared
schema, resolver, canonicalization, cross-document, and mutation checks for this
proposal. It is not evidence for a live graph property, an owner-approved property or
comparison contract, either provider runtime, L2 admission, or EVF release.
