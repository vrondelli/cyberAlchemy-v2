# Validation Strategy

## Validation levels

1. Contract: Draft 2020-12 schema checks plus semantic validators and exact
   positive/negative fixtures.
2. Identity: replay-stable SHA-256 identity over toolchain, project,
   dependencies, source set, import closure, environment, proposition, theorem
   declaration, and elaborated type; path-only and stale identities reject.
3. Provider: exact local build and theorem inspection; nonzero build becomes
   unresolved; `sorry`, unexpected axioms, unsafe declarations, mismatch, or
   incomplete source/import closure cannot yield a checked outcome.
4. EVF: source/obligation/binding/environment/currentness/ceiling join into a
   Lean-specific immutable handle; GraphLaw contracts remain unchanged.
5. Conformance: independent model-to-parser/serialization/adapter/runtime
   fixture evidence; absence preserves theorem-only ceiling.
6. Migration: dry-run target inventory, exact @2 preservation, @3 candidate
   classification, generated-inverse nonauthority, and rollback.
7. Integration: all 22 Design witnesses, positive existing theorem fixture,
   stale replay, and explicit theorem/runtime/business/discharge non-inflation.
8. Pre-merge: hardened C12 schema/validator/tests against complete repository
   diff inventory and exact head-bound passing validation evidence, followed by
   separate human authentication by the merge owner.

## Failure preservation

Every structured command is acceptance-critical. The first nonzero exit is the
session result. Cleanup, reporting, or a later success cannot replace it.
Failed attempts receive distinct immutable evidence roots.

## No-proof inflation

The positive Lean fixture may confirm that an existing declaration checks under
its exact lock. That does not make this Work Pack the author of the theorem and
does not enlarge the theorem's statement, model, axiom, or runtime boundary.
