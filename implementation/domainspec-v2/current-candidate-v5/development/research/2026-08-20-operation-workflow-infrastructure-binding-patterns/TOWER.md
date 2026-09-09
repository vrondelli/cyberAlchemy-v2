# Research Tower

## Target

How should DomainSpec v2 express and enforce implementation properties for
Operations and Workflows, and how should those obligations connect to
dependency-specific infrastructure bindings without a DI library or a generic
code-level `Port` abstraction?

## One-sentence model

A semantic subject determines what must remain true; an APE property and
selected implementation profile state what must be observed; a
dependency-specific contract shapes the code seam; and a concern-specific
infrastructure binding connects that seam to exact adapter, provider, runtime,
and evidence without turning the adapter into domain meaning.

## Compositional spine

```text
DomainSpec subject and relation
  -> subject-applicable APE ImplementationProperty
  -> selected language/project profile obligation
  -> dependency-specific code contract
  -> APE ImplementationBinding at the exact source/symbol seam
  -> concern-specific infrastructure binding when a guarantee is claimed
  -> concrete adapter/provider at the composition root
  -> static observation plus separate runtime observation when required
  -> finding and bounded receipt
  -> separate owner decision
```

The word `binding` has two different metadata roles in this spine:

1. `APE.ImplementationBinding` binds a semantic or application subject to exact
   source, callable, profile, provider, and evidence selectors.
2. `PersistenceBinding`, `TransportBinding`, and related records bind a logical
   concern to a physical realization and its guarantee/evidence boundary.

Neither role requires a universal code interface named `Port`.

## Minimal notation bridge

| Symbol | Meaning | Does not mean |
| --- | --- | --- |
| `S` | DomainSpec subject such as Operation or Workflow | source file or class |
| `P(S)` | properties applicable to subject `S` | universally portable style rules |
| `C` | dependency-specific code contract | one generic dependency abstraction |
| `B` | concern-specific infrastructure-binding record | adapter implementation |
| `A` | concrete adapter or runtime provider | semantic authority |
| `O` | source or runtime observation | proof beyond its exact envelope |
| `F/R` | finding and receipt | admission or promotion |

The intended relation is `S -> P(S) -> C -> B? -> A -> O -> F/R`, where `B?`
is optional. A pure helper, `Clock`, or local codec can be implementation-bound
without creating a portable system-integration record.

## Non-collapse rules

1. Operation and Workflow share an evaluation mechanism, not one property set.
2. Canonical/current source, candidate property, selected profile convention,
   and runtime evidence are separate authority classes.
3. Higher-order functions are an injection mechanism. Dependency inversion is
   the direction from executable subject to consumer-owned contract; neither
   implies a container.
4. A domain `Event`, an in-process `EventHandler`, an outbox record, a transport
   message, and broker/application delivery are distinct things.
5. A local `UnitOfWork` can make one Operation's declared change set atomic. A
   multi-step Workflow is not thereby one transaction.
6. A `Repository` code contract and a `PersistenceBinding` metadata record have
   different responsibilities.
7. Workflow retries and compensations do not move business rules into the
   Workflow. They route typed outcomes of Operations or nested Workflows.
8. Static import or syntax evidence cannot prove database atomicity, message
   delivery, compensation completion, replay safety, or algorithmic cost.
9. `reduce`, `for`, `for...of`, iterator chains, and multiple passes are
   profile-level implementation forms. Preservation of result, effects,
   ordering, termination, failure, consumption, and declared cost is the
   evidence-bearing concern.
10. A runtime-specific rule, such as deterministic replay, is portable only if
    a semantic owner admits it. Until then it is a selected durable-workflow
    profile obligation.

## Research boundaries

- Local source is primary for DomainSpec status and ownership.
- Primary external specifications are used only to demonstrate non-collapse
  boundaries and implementation-profile possibilities.
- Poker Team is an observed TypeScript project precedent, not a normative
  DomainSpec implementation profile.
- The current APE Work Pack is Enum-only and remains unchanged.
- The system-integration Revision 2 seed is blocked before Stage 1 and its
  proposed package is absent.
- The previous Operation-internal research remains unaccepted because its final
  audit is blocked on exact source bindings.

## Closure target

The tower closes when it provides:

- an exact source ledger;
- separate Operation and Workflow property/obligation matrices;
- dependency-form to infrastructure-binding mappings;
- explicit borrow/block decisions;
- hostile counterexamples;
- a bounded Work Pack recommendation;
- named residue and an honest local-only claim ceiling;
- a closed helper lane.
