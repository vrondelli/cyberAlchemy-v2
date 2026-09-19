---
task_id: TASK-FPR-04-SPEC-PROJECTION
owner_node: FPR-04
layer: L3
status: blocked
---

# TASK-FPR-04-SPEC-PROJECTION

## Objective

Build the smallest authoritative semantic walking skeleton: one exact required Spec source, two authoritative nodes, one admitted edge, an explicit local quotient, and a separately implemented `Sg -> G -> Sg_canonical` comparator.

## Dependency

Verified FPR-03 direction and B-to-Spec mapping receipt.

## SWU-FPR04-001: Exact Source Contract

- Source anchors: FPR-01 source dispositions; FPR-02 profile; FPR-03 map; required-document proposal in the expected manifest; `EGI-002/008`.
- Write scope:
  - `registries/required-documents.yml`
  - `manifests/spec-source-manifest.json`
  - `schemas/spec-graph.schema.json`, `compiler-ir.schema.json`, `semantic-manifest.schema.json`
  - source/input fixtures and receipt
- Done criteria: exactly one required authoritative Spec source resolves by normalized path and digest; profile IDs and admitted edge signature are named; missing, empty, legacy, unknown, and formation-deferred inputs fail before compilation.
- Acceptance evidence: source-manifest report and killed input mutants.
- Validation: source path/digest check; schema validation; missing/empty inputs return nonzero.
- Owner: semantic and validation owners.
- Handoff: immutable input digest set to FPR04-002.

## SWU-FPR04-002: Compile Tiny Sg

- Dependencies: FPR04-001.
- Source anchors: exact source manifest and profile; authority relationship registry; `EGI-009`.
- Write scope:
  - `projects/domainspec-v2/impl/test-derivation-engine/src/spec-graph/compile.ts`
  - task-local tests under the same module
  - `development/first-production-release/graphs/spec-graph.json`
  - `development/first-production-release/graphs/semantic-manifest.json`
- Done criteria: compiler emits schema-valid Sg with exactly two authoritative nodes and one admitted directed edge; every in-profile source element is mapped; empty output is an error.
- Acceptance evidence: compiler tests, graph digest, totality report, field/type/edge/document mutants.
- Validation: focused engine tests, typecheck, schema validation, exact cardinality and endpoint assertions.
- Owner: engine owner; semantic owner reviews mapping fidelity.
- Handoff: Sg and compiler receipt to FPR04-003.

## SWU-FPR04-003: Explicit Quotient and Local G

- Dependencies: FPR04-002.
- Source anchors: Sg; authority relationship registry; current local IR collisions from `EGI-010`.
- Write scope:
  - `registries/quotient-registry.yml`
  - `graphs/compiler-ir.json`
  - task-local quotient code/tests in `impl/test-derivation-engine/src/spec-graph/`
- Done criteria: every Sg-to-G rename, representation change, or permitted loss is enumerated and reversible under the bounded contract; local `consumes/enforces` collisions cannot masquerade as authority relations; unapproved quotient and reversed direction fail.
- Acceptance evidence: quotient report plus incompatible-label, unapproved-quotient, and direction mutants.
- Validation: quotient schema/check; local G conforms to exact admitted entries; no implicit fallback mapping.
- Owner: semantic and engine owners jointly.
- Handoff: Sg, G, quotient registry, and compiler receipt to an independent validation owner.

## SWU-FPR04-004: Independent Retraction Proof

- Dependencies: FPR04-003.
- Source anchors: Sg, G, quotient registry, semantic manifest; `EGI-011`; FPR-04 proof contract.
- Write scope:
  - `development/first-production-release/tools/verify-spec-projection.cjs`
  - `development/first-production-release/fixtures/spec-projection/`
  - FPR-04 evidence and Task Session receipt
- Done criteria: comparator is separately implemented and does not invoke the compiler's projection/retraction as oracle; `Sg_canonical` equals authoritative Sg under enumerated quotients; missing source, empty graph, formation-deferred type, mutated node/field/edge direction, and unapproved quotient each fail distinctly.
- Acceptance evidence: independence review, positive totality/retraction report, mutant matrix, and receipt binding all input/output digests.
- Validation: planned `verify-spec-projection.cjs` command; static import review proving comparator/compiler separation; two-run deterministic replay.
- Owner: independent validation owner, not the compiler author/owner for acceptance.
- Handoff: FPR-04 receipt may open read-only interactive ontology dogfood and later FPR-05/07 routes; it does not authorize them automatically.

## Completion Evidence

FPR-04 closes only for the declared two-node/one-edge profile. Broader graph support, architecture, formal, obligation generation, implementation analysis, and release conformance remain FPR-05 onward.

