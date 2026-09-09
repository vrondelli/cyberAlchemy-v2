# AlchLang Three-Vertical Compilation Campaign

Status: private owner-local planning candidate. Authority effect: none.

This campaign plans three complete reference examples from reviewed AlchLang
meaning to an exact, executable implementation and independent conformance
evidence. The machine-readable plan is
[CAMPAIGN.v1-candidate.json](CAMPAIGN.v1-candidate.json).

It does not authorize implementation. The current Goals package is blocked for
admission, the parent Language Project has concurrent user changes, and the
AlchLang semantic predecessors remain candidates.

## Outcome

The campaign succeeds only when the same declared compilation path produces
three semantically different verticals:

| Vertical | Main pressure | Reference implementation |
| --- | --- | --- |
| Customer credit release | State, risk rule, permission, human confirmation, denial | Generated TypeScript model, state machine, event and bounded tool using an in-memory credit adapter |
| Inventory reservation | Numeric invariant, concurrency, idempotency, compensation | Generated TypeScript contracts using a deterministic transactional in-memory adapter |
| Production rollback | Effect authority, revocation, uncertain outcome, evidence | Generated TypeScript contracts using a sandbox-only adapter that cannot reach deployment infrastructure |

Three similar CRUD demonstrations would not test the language. These verticals
instead pressure different AlchLang distinctions and failure modes.

## What “implemented” means

Implemented means that frozen inputs have an exact buildable reference target
whose generated validators, transitions, events, action wrappers, injected
adapters, and tests run successfully. It does not mean adopted, released,
deployed, production-ready, or authorized to cause a real-world effect.

The planning candidate proposes a small compiler library and CLI with a
TypeScript reference target. That proposal must cross a separate technology and
implementation decision; it does not redefine the AlchLang Product Capability.

## Two construction layers

The campaign has one shared compiler lane and three subject lanes:

```text
reviewed AlchLang semantics
        |
        v
shared compiler lane
  AlchLang -> DomainSpec authored source -> deterministic projections
        |
        +------------------+--------------------+
        |                  |                    |
        v                  v                    v
 credit release     inventory reservation   production rollback
        |                  |                    |
        v                  v                    v
 exact TypeScript    exact TypeScript      exact TypeScript
 implementation     implementation        sandbox implementation
        |                  |                    |
        +------------------+--------------------+
                           |
                           v
              independent conformance evidence
```

The compiler is itself implementation-bearing. It therefore needs its own
Product Capability, business ontology, DomainSpec construction identity,
binding, and evidence; it cannot appear as an ungoverned script between the
language and the examples.

## D65 campaign order

Each vertical must preserve this chain:

```text
canonical definitions
  -> Product Capability
  -> capability-local business ontology and reviewed AlchLang description
  -> DomainSpec v2 authored source
  -> deterministic compiled graph and generated system ontology
  -> exact TypeScript implementation binding
  -> independent conformance and runtime evidence
```

The campaign phases are:

1. **Freeze semantic predecessors.** Owners adopt or reject the exact AlchLang
   Definition Pack, Product Capability, and business-ontology bytes.
2. **Close the compilation contract.** Select the source carrier and grammar,
   define every AlchLang-to-DomainSpec mapping, diagnostics, the compiler
   capability, and an exact construction-handoff candidate.
3. **Author three business verticals.** Give each example its bounded capability,
   ontology, AlchLang description, owners, authority limits, and positive,
   negative, boundary, and missing-information examples.
4. **Author and compile DomainSpec.** Produce authored source, compiled graph,
   generated system ontology, traceability manifest, and two-run deterministic
   receipt for each vertical.
5. **Implement reference targets.** Only after separate exact authorization,
   build the compiler, CLI, generated TypeScript artifacts, and safe adapters.
6. **Prove conformance.** Independently bind rules and boundaries to exact code,
   tests, runtime replay, negative evidence, and remaining residue.
7. **Close the campaign.** Create three ConstructionBinding candidates and let
   owners separately decide next-use suitability.

## Generated surface

The proposed reference target emits, for each vertical:

```text
generated/
├── domain.types.ts
├── domain.schema.ts
├── domain.machine.ts
├── domain.events.ts
├── domain.tools.ts
├── domain.test.ts
├── domain.graph.json
├── system-ontology.json
└── traceability.json
```

Generated tools receive injected adapters. They have no ambient filesystem,
network, credential, deployment, or other effect authority.

## Cross-vertical proof matrix

| Evidence | Credit | Inventory | Rollback |
| --- | --- | --- | --- |
| Positive execution | Approved release | Available stock reserved | Authorized simulated rollback |
| Denial | Pending customer | Over-reservation | Missing or revoked authority |
| Boundary | Risk score exactly 472 | Exact remaining quantity | Target revision freshness |
| Missing information | Unknown risk provenance | Unknown quantity owner | Unknown effect outcome |
| Special safety property | Human confirmation | Idempotency and invariant preservation | Sandbox isolation and explicit uncertainty |
| Determinism | Two clean compilations | Two clean compilations | Two clean compilations |
| Traceability | Rule to tool and test | Invariant to transaction and test | Authority boundary to adapter and receipt |

## First real blocker

The first gate is not compiler code. The exact AlchLang Definition Pack,
Product Capability, and business-ontology bytes have not been adopted. The
source grammar, DomainSpec handoff, compiler identity, TypeScript target, and
implementation authority are also unresolved. Planning may continue; execution
must stop until the predecessor relevant to its next phase is decided.

## Claim ceiling

This package is planning evidence only. It does not adopt AlchLang meaning,
admit an ontology or DomainSpec profile, create DomainSpec source, generate a
system ontology, select or implement a compiler, register a ConstructionBinding,
prove conformance or product value, publish, release, deploy, or authorize an
external effect.
