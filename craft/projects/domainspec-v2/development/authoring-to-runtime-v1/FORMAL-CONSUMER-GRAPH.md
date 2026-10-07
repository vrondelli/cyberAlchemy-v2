# C03 formal-condition consumer graph

Date: 2026-09-20. Status: bounded construction evidence. Authority effect: none.

## Implemented graph

`application-v1` has one condition-authority chain and does not admit an inline
replacement expression in any consumer:

```text
FormalClaim ──condition-bound-to──> Rule
  ├─ Policy case ──typed exact arguments──> declared target
  ├─ State Machine transition guard ──typed exact arguments──> trigger Event
  ├─ Invariant ──declared claim or Rule──> constraint binding
  ├─ Operation ──requires/enforces──> runtime realization arguments
  ├─ Query ──typed exact arguments──> bounded filter projection
  └─ Workflow
       ├─ direct requires Rule ──typed exact arguments
       └─ ordered Operation steps ──their declared Rule guards
```

Workflow guard closure is represented through direct Workflow Rule bindings and
through the Rules guarding its ordered Operations. The current DomainSpec
`workflow-occurrences/v1` contract has no direct guard member, so the compiler
does not invent one. The exact source bindings remain in the formal-consumer
trace; executable Workflow realization stays a later backend concern.

## Consumer accounting

| Consumer | Source condition | Projection/lowering evidence | Non-collapse boundary |
| --- | --- | --- | --- |
| Policy | ordered `case Rule -> target` plus explicit Rule arguments | `domainspec.typed-policy/v2` | selection returns a target; it does not execute it |
| State Machine | named transition `guard Rule`, `on Event`, and explicit arguments | `domainspec.typed-state-machine/v1` | trigger Event and output intent Event remain distinct |
| Invariant | exactly one `claim` or `rule` | formal-consumer trace | constraint binding is not a fourteenth backend type or automatic execution |
| Operation | `requires Rule` or `Rule --enforces--> Operation` | Operation shape and `enforces` edge | one declared Rule may contain compound FormalClaim meaning; no inline guard language |
| Query | `where Rule` and explicit `bind` clauses | typed Query filter derived from the projected Rule | unsupported Rule expressions reject rather than narrow |
| Workflow | direct `requires Rule` bindings and guarded ordered Operations | formal-consumer trace plus Operation guard closure | no invented Workflow backend field or hidden proposition |

The projection trace records every consumer kind, qualified Rule identities,
binding posture, and Workflow step-guard closure. Policy and State Machine nodes
carry exact typed Rule arguments checked again by the bundled DomainSpec
compiler. Target State Machine projection also rewrites incoming `transitions`
edges to trigger Events only; output intents do not masquerade as triggers.

## Hostile evidence

The versioned 18-case syntax contract is fully assigned to the current profile.
Its C03 cases now accept declared Policy, State Machine, Invariant, and
enforcement forms and reject inline Policy/guard expressions and competing
Invariant conditions with their exact diagnostics. Focused tests additionally
reject missing Rule parameters, mismatched parameter types, and unbound
Workflow conditions.

## Claim ceiling

This closes C03 authoring, normalization, static lowering, bounded executable
projection, and consumer-identity evidence. It does not prove any FormalClaim,
make every sorted-FOL proposition executable, add a direct Workflow guard to a
backend contract that lacks one, complete C04 modules/entries, establish C05
three-language parity, or authorize approval, publication, release, deployment,
or operation.

## Open Questions

E02 still owns the formal-provider adapter and EVF connection. C05 owns native
Policy and State Machine parity across TypeScript, Python, and Rust. Any future
direct Workflow-guard backend field requires a separately selected DomainSpec
contract rather than an AlchLang-only invention.
