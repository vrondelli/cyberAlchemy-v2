# DomainSpec Ontology Form Decision Campaign

This candidate-local package decides the architecture and language realization
forms for every stable DomainSpec meta-type before implementation begins.

Start with [PROCESS.md](PROCESS.md), inspect the current
[FORM-DECISION-MATRIX.json](FORM-DECISION-MATRIX.json), then work through the
family waves in order. `IMPLEMENTATION-QUEUE.json` is the only implementation
handoff projection. It stays empty until a decision card reaches
`implementation-ready` and the validator passes.

## Current frontier

- W0 is accepted as the strict digest-bound campaign kernel.
- 25 meta-types inventoried.
- 13 active types have implementation outcomes but remain decision-blocked.
- 9 candidate UI types wait for definition admission.
- 2 types are deferred.
- 1 type is superseded.
- Enum now has an accepted nominal-boundary target: the existing TypeScript
  owned const-object provider, Python `Enum`, and Rust native enum with explicit
  wire adapters. Python/Rust profile and provider materialization remain blocked.
- Entity now has an accepted validated extensible factory target, retained in
  [`decisions/W1-ENTITY-001.json`](decisions/W1-ENTITY-001.json). Candidate
  ontology/profile materialization and providers remain blocked.
- Value Object now has an accepted owned value protocol target, retained in
  [`decisions/W1-VALUE-OBJECT-001.json`](decisions/W1-VALUE-OBJECT-001.json).
  It binds complete-tuple equality and hashing, factory-definition validation,
  immutable nested values, and validation-only factory extension. Exact
  per-language component-domain admission remains blocked.
- W1 target-form decisions are complete.
- W2 behavioral architecture is accepted as descriptor-bound native callables.
  Calculation is pure value computation, Rule is an effect-free boolean guard,
  Query is fully observed read-only behavior, and Policy is an effect-free
  strategy selector over explicit inputs. The four exact records live under
  [`decisions/`](decisions/), and their cards are `tension-reviewed`.
- W2 selection does not materialize ontology properties, strategy relations,
  language-profile protocols, providers, descriptors, kits, or implementation.
  All 13 active cards remain blocked and the ready queue remains empty.
- W3-A is selected as descriptor-bound typed effects and connections.
  Mapping binds exact directional correspondence; Interface binds exact
  versioned Operation/Query exposure; Event binds one durable past-fact
  checkpoint and separate publication attempts; Operation binds ordered effects,
  Rule decision use, Event emission, atomicity, and continuation closure.
- The four W3 decisions are retained under [`decisions/`](decisions/) and their
  cards are `tension-reviewed`. This selection does not materialize ontology,
  profiles, providers, fixtures, descriptors, factory kits, or proof evidence.
- Interface also retains its separate deferred-admission gate. It may be
  inspected structurally but cannot become ready until that gate is resolved.
- All 13 active cards remain blocked and the ready queue remains empty. W4 is
  the next decision wave; W3 implementation requires its own exact Work Pack.

The exact W0 choice is in
[`decisions/W0-KERNEL-POLICY-001.json`](decisions/W0-KERNEL-POLICY-001.json).
W0 acceptance closes campaign mechanics only; it does not make any meta-type
implementation-ready.

## Validate

```sh
node projects/domainspec-v2/development/ontology-form-decisions/validate-form-decisions.mjs \
  --write-receipt receipts/current-validation.json

node projects/domainspec-v2/development/ontology-form-decisions/validate-form-decisions-self-test.mjs
```

The receipt proves internal campaign consistency and source-digest freshness.
It does not approve a decision, mutate the ontology, admit implementation,
authenticate an owner, or prove code.

Run the two commands independently and require both exit statuses. The
self-test deliberately corrupts temporary copies to prove the validator blocks
missing decision bytes, digest drift, illegal state histories, missing relation
proof, reordered canonical inputs, and incomplete ready-queue entries.

## Authority boundary

The campaign is a candidate decision read-model with `authority_effect: none`.
Canonical meaning remains in the DomainSpec definitions owner. Architecture and
language profile owners must issue exact decisions. Proof evidence cannot make
those decisions or promote ontology/profile status.
