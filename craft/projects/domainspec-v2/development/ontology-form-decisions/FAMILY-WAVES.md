# Family decision waves

The campaign moves from forms with the smallest behavioral surface to forms
whose correctness depends on effects, composition, ordering, and lifecycle.

W0 is accepted as `W0-A-STRICT-DIGEST-BOUND`. W1 structural forms, W2
behavioral forms, and W3 effects-and-connections forms have accepted
architecture targets; none is implementation-ready. W4 is the next decision
frontier. W3 implementation requires a separate exact Work Pack and does not
follow from decision selection alone.

| Wave | Meta-types | Primary decisions | Exit condition |
| --- | --- | --- | --- |
| W0 | campaign kernel | record canonicalization, owner refs, claim ceiling, relation/property conventions | common decision contracts pass |
| W1 | Enum, Value Object, Entity | finite values, equality/immutability, identity/lifecycle | portable and three-language forms owner-decided |
| W2 | Calculation, Rule, Query, Policy | purity, boolean guard, read-only behavior, strategy selection | behavioral properties and mutants close |
| W3 | Mapping, Interface, Event, Operation | selected W3-A descriptor-bound typed transformation, boundary, past fact/publication, and ordered state-changing effect contracts | exited at four `tension-reviewed` cards; implementation remains blocked |
| W4 | Workflow, State Machine | ordered orchestration, failure, states and transitions | graph and lifecycle negatives close |
| W5 | Page–Binding, Adapter, State Indicator, Saga | definition admission/defer/supersede only | definitions owner outcomes recorded; no premature implementation |

Detailed cards and decision prompts live in `waves/`.
