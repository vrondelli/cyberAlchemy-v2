# Process for creating a new AlchLang architecture pattern

A pattern normally does **not** require a new meta-type. It composes existing
meta-types and infrastructure responsibilities.

## Pattern definition

1. Name the product capability and user-visible promise.
2. Add capability-local business ontology terms and typed edges.
3. Identify host DomainSpec meta-types and exact relationship signatures.
4. Declare the pattern intent, generated artifact roles, failure modes, and
   claim ceiling.

For example, transactional Outbox is hosted primarily by Operation and Event,
with persistence, UnitOfWork, transaction-guarantee, failure-outcome, and
observability bindings. `Outbox` need not become a meta-type.

## Dependency registration

5. Register provider-neutral integration bindings first.
6. Register concrete provider bindings separately; never imply provider
   selection from the pattern name.
7. Register generators by stable ID, full source tree digest, supported profile
   IDs, host meta-types, output roles, and toolchain identity.
8. Register conformance against the exact generator, binding, profile, and
   baseline digests.

## Derived states

The registry should derive three independent surfaces:

| Surface | Closure required |
|---|---|
| `describable` | semantic terms, host meta-types, and relationships close |
| `generatable` | describable + binding formation + generator + static conformance close |
| `runtime-capable` | generatable + provider selected + runtime guarantees observed + authority policy present |

Candidate/stable is an orthogonal owner decision. A stable pattern can be
blocked in a profile; an available candidate can remain non-stable.

## Stability decision

9. Compile the candidate catalog deterministically and emit blockers for every
   open dependency.
10. Run hostile, replay, stale-digest, missing-provider, and partial-runtime
    tests.
11. Ask the owner to bind `stable` to one immutable pattern-definition digest.
12. Publish a new catalog/profile version; never change an accepted digest in
    place.

## Language exposure

13. Expose explicit `pattern`, `effect`, and `performs` constructs only through
    a profile that contains the pattern.
14. Lower them to semantic bindings, not arbitrary generator switches.
15. Reject a build if the requested surface is above the derived closure.

## Required registry generalization

The current Operation registry should become a profile-scoped pattern catalog:

- multiple host meta-types and required typed edges;
- exact baseline and construction-profile refs;
- separate formation binding and concrete provider binding;
- separate static conformance and runtime observation;
- `describable`, `generatable`, and `runtime-capable` states;
- independent owner stability record;
- collect-all blockers with exact dependency pointers.

