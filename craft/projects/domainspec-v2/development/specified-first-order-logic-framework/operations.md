---
module: specified-first-order-logic-framework
version: 0.2.0
status: approved-for-design
updatedAt: 2026-07-23
docType: operations
---

# Operations

## CompileLogicModule

Validate and normalize structured logic projected from canonical nodes.

### Input

- proof-context envelope over graph, source manifest, build receipt, profile,
  and source-set digests;
- exact canonical node and logic-module handles;
- admitted DS-SFOL profile;
- explicit type and concept declarations.

### Rules

1. Accept only `NodeLogicEnvelope`s projected by the canonical node adapter.
2. Preserve stable node, module, clause, graph, manifest, build, profile, and
   source-set identities and digests.
3. Reject duplicate IDs, unknown versions, missing declarations, incompatible
   proof contexts, and noncanonical source forms.
4. Validate the structured AST before typechecking; never recover by parsing
   prose or guessing.
5. Emit typed residue for unsupported but structurally contained clauses.

## Language Processing

The deterministic order is:

```text
canonical build
  -> node logic envelope
  -> validated structured module
  -> normalized AST
  -> type judgment
  -> evaluation eligibility
  -> case derivation eligibility
```

Failure precedence is syntax, identity/version, type, finite-domain binding,
evaluation, then resource ceiling.

## Independent Denominator

`BuildClauseDenominator` enumerates node-owned clauses and their derived
obligation roles using an independently authored admission manifest plus exact
node/build handles. It cannot import generator code or generated outputs.

The denominator records:

- exact clause and coverage-key membership;
- node/module/clause IDs and compatible proof-context digests;
- required execution roles;
- admitted clause/harness profile;
- explicit unsupported residue policy.

Empty input, missing clauses, duplicates, stale digests, or an unknown clause
kind fail.

## DerivePureCases

For each typed pure clause:

1. load declared fixture/boundary inputs;
2. expand explicit branches, boundaries, and finite quantifier members;
3. evaluate DS-SFOL for the expected value or predicate;
4. emit a pre-run TestCase only when evaluation is determinate;
5. preserve typed residue otherwise.

## DeriveEffectCases

For each typed transition, postcondition, or effect clause:

1. load declared initial state and finite dependencies;
2. derive an input plus required observation projection;
3. bind one harness adapter;
4. record raw `pre`, `post`, `effects`, return, and error observations;
5. evaluate the relation independently over that trace.

The case deriver never executes the implementation and the harness never
decides expected truth.

## EvaluateClause

Evaluation is pure, deterministic, total, and resource-bounded:

- value result for a term;
- Boolean result for a predicate;
- typed `indeterminate` for unsupported, unresolved, partial, or over-budget
  evaluation.

Exact rational arithmetic is retained. Quantifiers range only over finite
declared universes. No recursive proof search is permitted.
