# Dependency Rules

## Allowed direction

```text
definitions/authority -> ontology/formalization -> baseline/registry
                     -> instantiation -> target implementation
                     -> independent conformance -> evidence -> owner decision
```

The arrow means “may consume a versioned contract from,” not “may rewrite.” Evidence may point back to
its source identity, but it may not become a definition or grant authority.

## Rules

1. Canonical definitions may reference admitted authority IDs; development proposals may not redefine them.
2. Ontology projections must cite their canonical sources and validate missing or ambiguous bindings.
3. A baseline must freeze exact canonical and executable identities before instantiation.
4. A realization selector must reject unknown, ambiguous, unsupported-profile, and baseline-mismatched input.
5. A generator may depend on contracts and ports, not ambient host discovery or a conformance provider's result.
6. A conformance provider must inspect locked target bytes and must not call the generator to recreate them.
7. Provider disagreement remains typed residue; no majority vote or implicit PASS is allowed.
8. Operation effects must remain inside the declared read/write/effect envelope.
9. Workflow recovery bindings must preserve Recovery Intent, Claim, Lease, replay protection, and explicit outcomes.
10. Development completion does not create a runtime dependency; only current canonical/runtime consumers do.
11. `.craft/` and generated inventory are navigation evidence, never owner authority.
12. Private DomainSpec content must not cross into public Arcanum during migration.

## Migration closure rule

For every selected successor file, include its semantic and executable dependencies or prove they are
provided by an admitted external boundary. A broken link, missing profile, unbound schema, or reference to
an excluded transient blocks materialization.
