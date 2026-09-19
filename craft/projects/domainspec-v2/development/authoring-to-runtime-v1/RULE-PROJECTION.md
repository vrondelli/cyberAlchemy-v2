# Ground Rule projection — S06 implementation increment

Status: tested bounded Rule projection; S06 operation realization is documented
in `EXECUTABLE-LOWERING.md`.
Authority effect: none.

The Alch API `lowerApplicationRuleProjections(source, bindings, sources,
interpretation)` re-forms the current domain/formal source, verifies an exact
interpretation binding, and emits DomainSpec `typed-rule/v2` contracts. It does
not change FormalClaim identity, generate a second proposition, or execute an
operation. `assertApplicationRuleProjectionCurrent` recomputes the projection
and rejects changed output even when output hashes have been refreshed.

## Explicit interpretation

`alchlang.ground-rule-interpretation/v1-candidate` contains:

- `formation_sha256`: SHA-256 of the exact JSON formation;
- `rules`: exactly one interpretation per authored Rule;
- each Rule binding: exact `claim_identity_inputs_digest`, `context_id`,
  `ceiling`, and total `sorts`, `constants`, and `predicates` maps.

For a ground proposition `Eligible(current) and not Blocked(current)`:

```json
{
  "sorts": {"Order": "Order"},
  "constants": {"current": "order"},
  "predicates": {"Eligible": "accepted", "Blocked": "blocked"}
}
```

The sort explicitly selects an authored Entity or String/Bool/UInt64. The constant becomes a typed
parameter. Unary predicates select declared Bool properties of that Entity,
lowered through the existing ontology-property identity. Bindings are neither
inferred from names nor accepted as proof of business meaning.

The selected context is caller-supplied interpretation evidence; this module
does not authenticate, approve or admit it. Changing it changes the projection
trace, not the underlying FormalClaim identity.

## Supported boundary

Ground unary Bool-property predicates, equality of explicitly interpreted
scalar constants, and `not`, `and`, `or`, `implies`, `iff`
lower structurally to the existing DomainSpec Rule expression contract.
Missing/extra symbol mappings, stale formation/claim identities, wrong sort
targets, non-Bool properties and duplicate parameter names reject.
Expansion is bounded to 1024 visited projection nodes.

Quantifiers, functions, non-scalar equality and non-unary predicates are explicitly
unsupported by this projection. In particular, a universal proposition is not
reinterpreted as a per-record check, and no finite universe is invented.
The broader authoring parser continues to represent those formal constructs;
accepting syntax is distinct from supporting an executable interpretation.

## Evidence

`test/application-rule-projection.test.ts` exercises exact repeatability,
identity/context separation, rehashed semantic mutation rejection, unsupported
quantifier rejection, and bounded expansion. It also uses the actual DomainSpec
structured Rule generator to emit TypeScript, compiles with the repository
toolchain and executes all four Boolean inputs for each of four connectives
(16 outcome comparisons), plus malformed input rejection.

Backend source imports in this native test are test-only. The product's public
application CLI path remains I07; clean installed evidence remains P02. These
tests prove the selected ground interpretation outcomes, not universal logic,
formal-provider proof, operation execution or product approval.

## Operation and later work

The implemented operation bridge binds authored input/output, explicit action
bindings, data factory validators and guard arguments to the existing compiler.
Native allowed/rejected/uncertain paths, a compilable semantic mutant and
cross-process repeatability are covered in `test/application-executable.test.ts`.
No validators are invented to satisfy generator preconditions.
Full formal-consumer breadth remains C03; the v4-to-v2 formal provider adapter
remains E02. These are tracked obligations, not completed by this increment.
