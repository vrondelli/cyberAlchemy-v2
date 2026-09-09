# Static TypeScript arrow source profile

## Decision

Arrow functions can make AlchLang pleasant to author, but they must be syntax,
not build-time code execution. The compiler parses the TypeScript AST and
accepts a closed subset. It never imports, evaluates, transpiles-and-runs, or
calls the authored module.

## Illustrative source

```ts
import {
  defineDomain,
  entity,
  event,
  operation,
  rule,
  transactionalOutbox,
} from "@cyberalchemy/alchlang-profile";

export default defineDomain({
  id: "customer-approval",
  terms: [
    entity("Customer", {
      fields: {
        id: "uuid",
        status: ["pending", "approved", "rejected"],
        riskScore: "integer",
      },
    }),
    rule("HighRisk", ({ customer }) => customer.riskScore <= 472),
    event("CreditReleased", { customerId: "uuid" }),
    operation("ReleaseCredit", {
      reads: ["Customer"],
      writes: ["Customer"],
      guard: ({ customer }) => customer.status === "approved",
      performs: transactionalOutbox({
        provider: "sqlite",
        emits: "CreditReleased",
      }),
      failure: "return-error",
    }),
  ],
});
```

This example is research syntax, not accepted grammar.

## Closed AST subset

Allowed:

- imports only from the exact profile package selected by the construction
  profile;
- one default-exported `defineDomain({...})` call;
- whitelisted source-factory calls;
- object and array literals, string/number/boolean/null literals;
- arrow expressions used only in semantic-expression positions;
- property access, closed comparison/Boolean/arithmetic operators, and
  whitelisted pure expression operators;
- identifiers bound only by the arrow's destructured parameters;
- source comments and locations for traceability.

Rejected:

- dynamic import, `require`, `eval`, `new Function`, decorators, JSX;
- top-level statements other than the declared import and default export;
- loops, mutation, assignment, exceptions, `await`, promises, generators;
- computed properties, prototype access, global objects, environment, file,
  process, network, clock, randomness, or package calls;
- aliases or factory calls not present in the exact frontend profile;
- closures over module variables;
- arbitrary function calls inside semantic arrows.

## Two different arrow meanings

| Arrow | Meaning | Handling |
|---|---|---|
| authored semantic arrow | compact syntax for an expression AST | parsed and normalized, never executed |
| generated realization arrow | target-specific implementation form | emitted by a registered provider and evaluated only by its bounded proof/runtime harness |

Conflating these would let authoring syntax bypass the semantic carrier and
DomainSpec proof boundary.

## Deterministic lowering

The source factory name resolves through the pinned frontend profile:

```text
entity    -> DS-D1.1
operation -> DS-D1.4
rule      -> DS-D1.7
event     -> DS-D1.12
```

The mapping is written into Carrier v3; it is never inferred later from a node
name. Pattern factories such as `transactionalOutbox` resolve to pattern
catalog entries, not meta-type IDs.

One file then lowers to multiple isolated DomainSpec nodes and a factory
projection manifest. This is how ergonomic authoring remains compatible with
the canonical one-node instantiation and proof model.

