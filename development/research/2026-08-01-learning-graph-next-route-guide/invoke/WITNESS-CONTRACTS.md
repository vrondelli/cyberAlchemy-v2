# Planned Witness Contracts

Status: authored Design contracts; `plan-evidence-pending`. Nothing here is an
executed implementation or acceptance result.

## Fixture Matrix

| ID | Claim | Polarity | Input / mutation | Expected result |
| --- | --- | --- | --- | --- |
| LGP-FIX-001 | positive fixture ceiling | positive | frozen `MaxAmountRule` inputs | `FIXTURE_HAS_NO_REPORTED_FINDING`; all stronger claims false |
| LGP-FIX-002 | required abstention | positive | frozen `LegacyLimitRule` inputs | `ABSTAIN`, exact gap, exact v2 question, display-only suggestion |
| LGP-FIX-003 | digest drift | negative | mutate any bound source byte | `STALE_INPUT`; no current derived display |
| LGP-FIX-004 | missing selector | negative | remove required pointer/selector | block; exact diagnostic |
| LGP-FIX-005 | killed vocabulary | negative | add canonical `QuestionNode`, `UnknownNode`, `understands`, or generic `routes_to` | schema/validator block |
| LGP-FIX-006 | authority collapse | negative | suggestion has action/admission/dispatch/execution field or authority effect other than none | block |
| LGP-FIX-007 | deterministic replay | positive | compile twice from same bytes | byte-identical snapshot and equal receipt material |
| LGP-FIX-008 | relation endpoint integrity | negative | unknown endpoint or record class | block |
| LGP-FIX-009 | view parity | positive | Graph/Outline/Table over one snapshot | identical record IDs/classes/proof tiers/validity |
| LGP-FIX-010 | side-effect boundary | negative | monitor browser network/events | zero unexpected outbound requests and zero workflow-like events |
| LGP-FIX-011 | keyboard mechanics | positive | search -> focus -> inspect -> guide -> suggestion | reachable, visible, no trap, focus state consistent |
| LGP-FIX-012 | no comprehension inference | negative | click/focus/search interaction | no persisted or emitted `understands`/confusion/comprehension state |
| LGP-FIX-013 | host regression | positive | existing five lenses and guide behavior | pre-existing mechanics remain available |
| LGP-FIX-014 | mutation admission cannot close semantic gap | negative | valid learner-view mutation-admission receipt present while native-adapter and owner-resolved semantic-admission receipts remain absent | `LegacyLimitRule` still returns `ABSTAIN`, the exact four-premise v2 question, and the display-only suggestion package |

## Validator Contracts

| ID | Target | Binding rule | Verdicts | Stale/self-issue rule | Owner |
| --- | --- | --- | --- | --- | --- |
| LGP-VAL-001 | projection input manifest | exact repository path, digest, and selector set | pass/block | reject drift and self-authored source claims | projection implementation owner |
| LGP-VAL-002 | projection snapshot | versioned schema, allowed classes/relations, endpoint closure | pass/block | reject unknown or killed vocabulary | fixture/evaluator owner |
| LGP-VAL-003 | derivation receipt | canonical input/output digests and exact decisions | pass/block | reject stale receipt | projection implementation owner |
| LGP-VAL-004 | host integration | snapshot/DOM/view parity contract | pass/block | reject unsupported version and stale snapshot | learner-view owner |
| LGP-VAL-005 | browser mechanics | pinned browser/runtime/input hashes and observed events | pass/block | receipt cannot self-assert comprehension/accessibility | browser evidence owner |

## Learner-View Mutation Admission Gate

Before any write to the existing ontology-view host, a separately owned record
must identify the learner-view owner, admitted write scope, accepted fixture
ceiling, required validation, and invalidation/supersession policy. An authored
Plan or user request to plan does not satisfy this gate. This permission is not
owner-resolved semantic-admission evidence and does not establish the displayed
destination owner's identity or admission. LGP-FIX-014 must fail closed if an
implementation attempts either substitution.
