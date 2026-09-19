# BTE Machine Contract Plan

This folder documents the planned Backend Type Test Engine contract families.
It is not a machine source, catalogue instance, admission record, receipt, or
proof. Machine shapes belong under
`projects/domainspec-v2/impl/test-derivation-engine/src/bte/contracts/`;
validation-owned instances and freezes belong under `validation-inputs/`.

## Contract Families

| Family | Layer | Shape contract | Semantic validation beyond shape |
| --- | --- | --- | --- |
| artifact handle | L0 | allowlisted project-relative path, schema ID, logical ID, SHA-256, bytes, producer | containment, digest recomputation, producer compatibility, no path/symlink escape |
| logical identity | L0 | stable domain-separated ID and separate content digest | canonical tuple, version compatibility, stale-handle detection |
| authority class | L0 | closed class and owner handle | forbidden substitution between semantic, admission, evidence, aggregate, lifecycle roles |
| diagnostic | L0 | closed code, stage, subject, detail | unknown code rejection and deterministic precedence |
| exact set | L0 | catalogue/projection member envelope | nonempty, missing/extra/duplicate/stale/mismatch and exact recomposition |
| ValidationReceipt | L0 | raw case/write/output handles and bounded result | independent manifest/result join; explicitly not build/proof/replay/admission/core evidence |
| formation-v2 and retirement | L1 | 13 structure bundles, 16 criterion records, retirement/migration/compatibility records | exact predecessor bijection, supported keyword closure, reason-specific Entity rejection |
| successor sources | L2 | project, feature, node, edge, source set | root/scope/path/endpoint/order/provenance and no version fallback |
| graph build | L3 | graph v2, manifest v2, BuildReceipt, ProofContext | source/graph bijection, deterministic bytes, exact governing handles |
| proof catalogue and selections | L4 | six catalogue envelopes, freezes, node-pattern and relationship selections | owner independence, exact membership, admission/freeze compatibility |
| proof objects | L5 | Obligation, TestCase, Binding, evaluator registry, ExecutionResult, MutationDeclaration/Result, ProofReceipt, ReplayResult | exact joins, one-per-key projections, binding cardinality, evaluator isolation, mutation lineage, replay recomputation |
| aggregates | L6/L8 | required-check manifests and AggregateResult | exact successful ReplayResult-scope recomposition; no producer status trust |
| consumer handshake | L7 | core input, consumer contract, raw evidence, receipt, replay | freshness, same-core identity, IOLM parity, Body War redaction, consumer/BTE producer split |

## Six Catalogue Identities

- `formation-criterion@1`
- `formation-structure@1`
- `node-kind-causality@1`
- `node-instance-conformance@1`
- `relationship-family-causality@1`
- `edge-instance-conformance@1`

Every catalogue owns its own ID, version, owner, admission handle, freeze
handle, membership digest, expected-case catalogue, red matrix, proof scopes,
and ReplayResults. A green proof unit in one catalogue cannot substitute for
breadth in that or another catalogue.

## Cardinality And Recomposition

For each catalogue, exact equality is evaluated over
`coverage_key = catalogue_id + obligation_id`. Each required key occurs exactly
once in TestCase, ExecutionResult, and primary MutationResult projections.
ProofReceipt and ReplayResult scopes may partition only with explicit,
non-overlapping scopes whose exact union equals the catalogue required set.
Roles inside one TestCase bundle are not additional catalogue members.

## L0 Bootstrap Sequence

`SWU-BTE-L0A-001` first publishes these shapes:

- `artifact-handle.v1.schema.json`
- `logical-identity.v1.schema.json`
- `authority-class.v1.schema.json`
- `diagnostic.v1.schema.json`
- `exact-set.v1.schema.json`
- `red-fixture-manifest.v1.schema.json`
- `red-fixture-freeze-receipt.v1.schema.json`
- `validation-receipt.v1.schema.json`
- `contract-publication-receipt.v1.schema.json`

L0A also publishes the closed diagnostic registry and a deterministic
contract-publication receipt over the exact bytes and digests. It emits no
`ValidationReceipt` and consumes no red manifest.

Only after L0A passes may the validation owner author and freeze
`validation-inputs/l0/red-fixture-manifest.v1.json` against those published
digests. `SWU-BTE-L0B-001` then materializes the separate shape/semantic
validators, executes the frozen cases without rewriting contracts or
validation inputs, and emits the L0 `ValidationReceipt`. That receipt never
substitutes for a BuildReceipt, ProofReceipt, ReplayResult, admission record, or
aggregate.

## Current Evidence Boundary

The existing shared criterion kernel and minted-node body adapter remain valid
only for their completed SWU-BTE-001/003 receipt claims. No contract listed here
is currently implemented merely because this plan names it. Planned commands
remain non-runnable until package scripts, modules, tests, raw output, and
negative-control evidence exist.
