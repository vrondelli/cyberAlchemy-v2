# TASK-APE-L1-ENUM-TYPESCRIPT — Establish the TypeScript trust lane

Layer: L1. Wave: W1. Status: planned.

## Objective

Prove that the Enum architecture properties can be projected from real
TypeScript source, evaluated with exact-cause negatives, and replayed
deterministically before the shared observation contract freezes.

## Implementation home

Use the existing `projects/domainspec-v2/impl` Node/TypeScript package. Candidate
source scope is `impl/architecture-conformance/typescript/`; fixtures are under
that subtree. Do not create a second package root.

## Algorithm

1. Obtain a profile-owner decision selecting the bounded TypeScript Enum forms.
2. Parse real source with the pinned TypeScript compiler API or an explicitly
   selected maintained AST surface.
3. Resolve the canonical binding from declared evidence, never filename alone.
4. Emit only ontology-defined properties with raw evidence and typed
   unsupported results.
5. Run positive, exact-cause negative, non-collapse, and unsupported fixtures.
6. Feed projections and immutable scenarios to the generic evaluator and
   BTE-compatible proof interface.
7. Freeze the common observation schema only after deterministic replay passes.

## Smallest Working Units

### SWU-APE-ENUM-TS-001 — TypeScript representation decision

- Primary behavior: record the exact admitted TypeScript Enum representation
  set and unsupported boundary.
- Dependencies: W0 receipts including ONT-006.
- Pre-execution inputs: current ontology, TypeScript profile, ONT-006 receipt,
  `work-pack/shared/schemas/typescript-representation-decision.schema.json`,
  `work-pack/shared/validators/validate-typescript-representation-decision.mjs`,
  and
  `instances/enum/decisions/typescript-representation.owner-authorization.json`.
- Write scope:
  `projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/decisions/typescript-representation.json`
  only.
- Done: the owned `typescript.owned-const-object-enum/v1` protocol is selected
  for materialization; native `enum`, standalone literal union, bare `as
  const`, and every analysis-indeterminate alternative receive one exact
  rejected or unsupported disposition with owner and rationale. Selection
  does not activate the profile.
- Split analysis: one decision has no independently useful child mutation.
- Acceptance evidence: profile-owner authorization; exact ontology, profile,
  ONT-006, schema, validator, and authorization digests; total alternative
  accounting; deterministic validator output; and the later Task Session
  terminal receipt.
- Verification:

  ```text
  node projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/validators/validate-typescript-representation-decision.mjs --self-test --schema projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/schemas/typescript-representation-decision.schema.json --owner-authorization projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/decisions/typescript-representation.owner-authorization.json --ontology projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json --profile projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json --dependency-receipt projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ONT-006.json
  node projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/validators/validate-typescript-representation-decision.mjs --decision projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/decisions/typescript-representation.json --schema projects/domainspec-v2/development/architecture-pattern-enforcement/work-pack/shared/schemas/typescript-representation-decision.schema.json --owner-authorization projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/decisions/typescript-representation.owner-authorization.json --ontology projects/domainspec-v2/development/implementation-conformance/ontology-experiment/ontology.json --profile projects/domainspec-v2/development/implementation-conformance/ontology-experiment/profiles/typescript-strict.profile.json --dependency-receipt projects/domainspec-v2/development/architecture-pattern-enforcement/instances/enum/receipts/SWU-APE-ONT-006.json
  ```

  Run each command twice and require byte-identical stdout.
- Owner: manual TypeScript architecture-profile owner for authorization; Task
  Session owns materialization and independent deterministic validation.

### SWU-APE-ENUM-TS-001A — Owned Enum runtime provider

- Primary behavior: implement the selected `defineEnum`, `composeEnum`, and
  `EnumValue` provider with runtime and type-level evidence.
- Dependencies: TS-001 decision.
- Write scope: `projects/domainspec-v2/impl/architecture-conformance/typescript/runtime/enum/**`
  and its focused tests.
- Done: exact exports exist; outputs are frozen; duplicate keys, duplicate
  values, prototype-sensitive keys, repeated components, and cycles block;
  string-only direct and named-component composition passes; provider source
  digest is emitted.
- Split analysis: the three exports form one public protocol and share runtime
  collision/freeze behavior; the adapter remains independent in TS-002.
- Acceptance evidence: runtime positives/negatives, compile-time type checks,
  and provider digest receipt.
- Verification: focused Vitest command plus parent package typecheck.
- Owner: TypeScript runtime owner through Task Session.

### SWU-APE-ENUM-TS-001B — Digest-bound profile activation

- Primary behavior: activate the selected TypeScript protocol only after
  binding the owner decision and exact runtime-provider path/digest.
- Dependencies: TS-001A provider receipt.
- Write scope: `profiles/typescript-strict.profile.json`, Enum profile
  fixtures, and the TS-001B receipt.
- Done: exactly one protocol is admitted; native `enum`, standalone union,
  bare `as const`, arbitrary factory/spread/computed forms, and helper
  impersonation are typed unsupported; missing or stale provider evidence
  blocks.
- Split analysis: profile activation is a separate owner boundary from both
  provider implementation and adapter observation.
- Acceptance evidence: decision/provider digest joins plus exact
  selected/unsupported/stale/missing fixtures.
- Verification: focused profile resolver twice with byte-identical output.
- Owner: TypeScript architecture-profile owner.

### SWU-APE-ENUM-TS-002 — Real-source TypeScript projection

- Primary behavior: convert one admitted TypeScript source form into a valid
  `ObservationProjection`.
- Dependencies: TS-001B profile-activation receipt.
- Write scope: `projects/domainspec-v2/impl/architecture-conformance/typescript/adapter/**` and its focused tests.
- Done: exact source/tool/config/adapter/profile digests and raw evidence refs
  are present; unknown forms are typed unsupported.
- Split analysis: parsing and projection cannot pass independently because the
  adapter contract is the observable output of parsing; fixtures are separate
  in TS-003.
- Acceptance evidence: focused adapter unit tests with real `.ts` files.
- Verification: focused Vitest command plus parent package typecheck.
- Owner: Task Session.

### SWU-APE-ENUM-TS-003 — Discriminating TypeScript fixture matrix

- Primary behavior: prove the TypeScript projection/evaluator distinguishes all
  required Enum cases one cause at a time.
- Dependencies: TS-002 receipt.
- Write scope: `impl/architecture-conformance/typescript/fixtures/enum/**` and
  focused fixture tests.
- Done: positive, missing/extra/duplicate/empty, Value Object-shape, State
  Machine-shape, profile-form, stale binding, and unsupported mutants match
  exact findings.
- Split analysis: fixtures are one matrix accepted by total denominator
  equality; each mutant is data, not an independent implementation behavior.
- Acceptance evidence: exact expected result manifest and zero unaccounted case.
- Verification: focused fixture command.
- Owner: Task Session.

### SWU-APE-ENUM-TS-004 — Trust proof and contract freeze

- Primary behavior: execute and replay one complete TypeScript
  ontology-to-finding proof, then freeze the shared observation digest.
- Dependencies: TS-003 receipt and BTE-compatible scenario/provider readiness.
- Write scope: TypeScript runner/normalizer, `instances/enum/receipts/typescript/**`,
  and `instances/enum/contracts/FROZEN-OBSERVATION.json`.
- Done: raw artifacts are reachable; mutants die for expected causes; normalized
  outputs repeat byte-identically; freeze record is immutable.
- Split analysis: proof execution without replay cannot establish trust, and a
  freeze without the passing proof is ceremonial; they share one acceptance
  boundary.
- Acceptance evidence: execution, mutation, replay, and freeze receipts.
- Verification: focused proof command twice plus digest comparison.
- Owner: Task Session with independent replay review.

## Failure modes

Unowned representation, filename-only identity, adapter-emitted unknown
properties, dynamic construct passed as absent, self-authored expectations,
noncausal mutant death, non-determinism, or premature contract freeze blocks.

## Closeout

All mutation-capable SWUs consume the shared closeout contract. Python and Rust
remain closed until TS-004 is joined and current.
