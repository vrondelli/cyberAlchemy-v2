# Validation Strategy

## Evidence Classes

| Class | Scope | Does not prove |
| --- | --- | --- |
| structural | JSON/schema/endpoint/forbidden-field validation | derivation correctness or UI behavior |
| deterministic fixture | exact bindings, replay, positive/abstention decisions | real-source behavior or semantic identity |
| DOM/unit | host reader and rendered semantic contract | browser mechanics or accessibility |
| browser mechanics | navigation, focus, parity, console/network/event observations | comprehension or full accessibility conformance |
| human research | question quality and boundary recognition | ontology authority or real adapter behavior |
| owner receipt | admitted scope and lifecycle disposition | publication, release, deployment, production |

## Slice Validation

| Slice | Required checks |
| --- | --- |
| S-001 structural contract | schema positive/negative fixtures; killed vocabulary; authority effect; endpoint closure |
| S-002 binding/replay | current digest/pointer resolution; stale/missing mutants; byte-identical outputs |
| S-003 positive ceiling | exact `MaxAmountRule` no-reported-finding result; explicit ceiling; stronger-claim mutants |
| S-004 gap response | `LegacyLimitRule` `ABSTAIN`; exact four-premise v2 text; display-only package; LGP-FIX-014 admission-substitution mutant |
| S-005 host reader | supported-version/currentness read; stale/invalid suppression; no rederivation |
| S-006 semantic rail | DOM roles/headings/text labels; exact record classes/proof tiers; no action control |
| S-007 presentation | narrow/wide layout, non-color meaning, overflow and diagnostic visibility |
| S-008 parity | focus/inspector/Graph/Outline/Table IDs, classes, proof tiers, validity; no keyboard behavior |
| S-009 keyboard | search-to-suggestion traversal, visible focus, announcement, no trap or side-effect state |
| S-010 browser evidence | pinned Playwright/runtime hashes, zero unexpected errors/outbound/workflow events, regression, teardown |

## Acceptance Rules

- Any stale-source acceptance, identity inference, killed vocabulary,
  authority-like field/control/event, divergent view truth, or outbound request
  blocks its SWU.
- Browser tests must use the shared runtime; no package root may be added only
  for Playwright.
- All receipts bind current source/product/runtime hashes. Task Session and
  lifecycle-owner receipts have disjoint producers and write scopes. Neither
  can self-issue mutation admission, semantic admission, destination-owner
  admission, comprehension, accessibility, promotion, or release claims.
