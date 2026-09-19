# N35 Architecture Bundle

Decision: `BMC-REL-NONNUMERIC-35-EMITS-ORDERING`

Selection: `null`. Recommendation: A. `authority_effect: none`.

## 1. Context View

Canonical `Entity --[emits]--> Event` is an authored concept relationship. N34 A
keeps occurrence semantics at that concept-fact level. No exact source gives the fact
an authored order identity or imports runtime Event order.

## 2. High-Level Structure View

An authored canonical fact enters the ordering boundary. A makes ordering not
applicable. B leaves the boundary unresolved. C terminates the route. Incidental
source and runtime observations never enter the semantic boundary.

## 3. Low-Level Components View

The considered unit is one canonical `(emits, Entity concept ID, Event concept ID,
admitted authority/feature context)` fact. Sequence fields, positions, predecessors,
timestamps, delivery attempts, replay positions, payload order, and stream offsets
are absent because no exact source binds them to ordering.

## 4. Workflow Process View

1. Bind the exact N35 sequencing receipt and seven supporting sources.
2. Test each ordering candidate for an emits-specific authored substrate.
3. Reject ordered, spurious unordered, and incidental-order shapes.
4. Present A, B defer, and C stop with Explain standing.
5. Stop at the relationship decision owner.

## 5. Decision Flow View

- A: mark ordering not applicable to authored emits facts.
- B: preserve the unresolved facet and defer.
- C: terminate this route.

Recommendation A follows the smallest source-backed meaning. `Unordered` is rejected
because it adds no distinct current validator or generator consequence and its only
concrete precedent is the D27-specific `creates` set relation.

## 6. Dependency Interface View

Inputs are the sequencing receipt, N34 A, D01/D08, canonical emits, packet emits, and
the schema/validator boundary. Outputs are Design-only evidence. No route creates an
order-bearing declaration, infers runtime order, couples produces, mutates canonical
sources, implements behavior, or authorizes promotion/publication.
