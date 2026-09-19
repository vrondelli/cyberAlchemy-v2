---
task_id: TASK-DSD1-UI11
feature_code: DSD1
layer: L1
status: not-started
gate_status: blocked-on-ui-decision-after-swu-003
updatedAt: 2026-07-03
---

# TASK-DSD1-UI11: Decide And Execute UI-11 Formation Path

## Objective

Decide whether DS-D1 should add first-class UI meta-types now, narrow the
current 25-type claim, or keep the UI labels explicitly deferred.

## Source Anchors

- `projects/domainspec-v2/development/r3-research/ds-d1-metatype-category-boundary/findings.md`
- `projects/domainspec-v2/development/meta-type-definitions/CANDIDATES.md`
- `projects/domainspec-v2/development/meta-type-formalization/WORK-PACK.md`
- `projects/domainspec-v2/definitions/relationships/relationships.yml`
- `projects/domainspec-v2/definitions/meta-types/meta-types.yml`

## Decision Options

| Option | Meaning | Follow-up |
| --- | --- | --- |
| add-ui | DS-D1 will formalize UI labels as first-class categories. | Run SWU-DSD1-004, then SWU-DSD1-005. |
| narrow-claim | DS-D1 will claim only currently formalized/promotable backend types. | Run SWU-DSD1-006. |
| explicit-defer | UI labels remain visible but not formation-authoritative. | Run SWU-DSD1-006. |

## SWUs

| SWU | Purpose | Write Scope | Gate |
| --- | --- | --- | --- |
| SWU-DSD1-003 | Record the UI-11 owner decision. | Decision record only. | owner decision |
| SWU-DSD1-004 | Add first UI slice if `add-ui` is chosen. | Page, Layout, Component, View Model cards/schemas/fixtures/tests. | conditional |
| SWU-DSD1-005 | Add remaining UI types if selected. | Hook, Form, Action, Guard, Binding, Adapter, State Indicator. | conditional |
| SWU-DSD1-006 | Narrow/defer authority if UI is not formalized now. | Definitions/projection docs. | conditional |

## Implementation Notes

- DS-D8 can use UI endpoint labels, but that does not make them DS-D1
  categories.
- If `add-ui` is chosen, every selected UI type needs a human card, machine
  schema, positive fixture, negative fixture, correction contract, and tests.
- If UI is deferred, the plan must still preserve the candidate trail so the
  work can continue later.

## Acceptance Evidence

- Decision record names the selected route and rejected routes.
- If UI schemas are added, generated instances validate and bad fixtures fail.
- If UI is not added, no canonical surface claims full 25-type authority.
