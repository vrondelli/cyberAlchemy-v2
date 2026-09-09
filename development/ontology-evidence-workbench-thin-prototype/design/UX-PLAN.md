---
template_id: invoke.ux-plan
template_type: ux-plan
status: invoke-local
updated_at: 2026-07-29
---

# UX Plan: Poker-Team Evidence Journey

## Selection contract

Selected because a natural person navigates a changed browser semantic contract
and uses visible evidence to understand a claim. This is not selected merely
because a UI file exists.

## User goals and actors

| Goal | Actor | Success signal |
| --- | --- | --- |
| Understand why Poker-Team O13 is flagged | evidence reviewer | F1, R1, D1, and D2 meanings are visible |
| Verify where each label came from | evidence reviewer | inspector exposes source path and digest |
| Know what the run does not authorize | evidence reviewer | trust rail and receipt show `authority_effect: none` |
| Recover from a stale/unknown deep link | evidence reviewer | visible recovery to F1 without hidden state |

The reviewer may use keyboard or assistive operation. They do not edit, accept,
promote, publish, or deploy.

## Journey

| Journey | Start | Success | Failure and recovery | Correction/reversibility |
| --- | --- | --- | --- | --- |
| Walk Poker O13 evidence | authenticated `/?oew=1&token=…` bootstrap | trust rail visible; F1 → R1 → D1 traced; D2 residue visible; view parity; inspector and receipt evidenced | missing/bad bootstrap token returns HTTP 401/403; after valid bootstrap, bundle identity/digest/schema error replaces graph with fail-closed alert; unknown selection visibly recovers to F1 | dismiss recovery notice, change view, close drawers/tour; no durable mutation exists |

## Surfaces and states

| Surface | Purpose | Entry/exit |
| --- | --- | --- |
| trust rail | bind current evidence to receipt and authority ceiling | always visible; opens receipt drawer |
| navigator | search/filter/start tour | tokenized URL; selection changes are URL-local |
| graph/outline/table workspace | inspect equivalent evidence projections | view controls; selection remains stable |
| inspector | expose source identity and evidence meaning | selected source ref; closable |
| receipt drawer | expose commit, digests, adapter, protected-source and authority fields | trust rail or tour; closable |
| fail-closed alert | prevent partial/unknown evidence display | validation failure; requires a fresh corrected run |

| State | Meaning | Allowed transitions | Error behavior |
| --- | --- | --- | --- |
| loading | exact evidence is being verified | ready or blocked | no graph is shown |
| ready | admitted evidence can be inspected | views, selection, tour, receipts | unknown selection recovers visibly |
| blocked | evidence cannot be trusted | fresh corrected run only | no partial graph |

## Visible evidence meaning

| Visible evidence | Meaning | Allowed action | Uncertainty cue | Owner |
| --- | --- | --- | --- | --- |
| `Exact evidence ready` | bundle identity and mappings passed UI validation | inspect | receipt drawer contains exact digests | adapter/UI contract owner |
| `authority_effect: none` | run has no promotion effect | inspect only | constant in sidecar and receipt | authority owner |
| D2 conflict residue | backend instrument type conflicts with declaration | compare source evidence | visibly marked as residue, not resolved | Poker-Team source owner |
| browser acceptance pass | one automated local journey passed | review receipt | fixed claim ceiling | prototype validation owner |

## Interaction and recovery

| Flow | Steps | Risk | Recovery |
| --- | --- | --- | --- |
| Grounding trace | select F1 → activate trace → inspect R1 → inspect D1 | decorative traversal mistaken for proof | inspector shows exact source path/digest and receipt binding |
| Conflict inspection | select D2 from view/tour | residue mistaken as accepted correction | label it conflict/indeterminate; no accept action |
| View parity | switch graph → outline → table | selection/meaning drifts | same source ref and semantic row are asserted |
| Receipt inspection | open drawer from trust rail/tour | digest fields read as product approval | explicit claim ceiling and authority effect |

## Accessibility and responsive semantics

| Consideration | Required response | Acceptance owner |
| --- | --- | --- |
| focus order and visible focus | logical trust rail → navigator → workspace → inspector/drawer; visible focus | UI contract owner |
| reflow order | evidence meaning and controls preserve reading/operation order at the chosen prototype viewport | UI contract owner |
| contrast/non-color | trust, failure, conflict, and selection have text/semantic cues | UI contract owner |
| accessible names/relationships | landmarks, buttons, alert/status, drawer and selected evidence are named | UI contract owner |
| keyboard operation | open search, switch views, inspect, dismiss, and complete the journey without pointer-only actions | browser witness owner |

The first browser witness uses one declared desktop viewport. A full responsive
matrix and accessibility conformance audit are deferred, not silently claimed.

## Content bounds

| Content | May claim | Must not claim |
| --- | --- | --- |
| trust rail | source/run identity passed declared checks | ontology truth or promotion |
| finding and grounding labels | exact Poker-Team evidence relationships in this adapter run | canonical ontology |
| browser receipt | one local automated journey passed | human acceptance, release, production |

## Acceptance signals

| Signal | Polarity | Evidence selector | Owner |
| --- | --- | --- | --- |
| trust rail names run and authority effect | positive | browser assertion | prototype validation owner |
| F1 → R1 → D1 and D2 residue visible | positive | browser assertion plus sidecar identity | prototype validation owner |
| selection survives outline/table switch | positive | browser assertion | UI contract owner |
| inspector path/digest matches Poker-Team source | positive | browser assertion | evidence owner |
| invalid bootstrap token returns HTTP 401/403; invalid post-bootstrap bundle renders alert and no graph | negative | gateway/browser negative fixture | security/validation owners |
| no edit/promote/publish controls | negative | DOM assertion | authority owner |

## Handoff

- Architecture: complete in [ARCHITECTURE.md](ARCHITECTURE.md)
- Plan: required for atomic SWUs and exact browser receipt
- Research: not required; approved findings are sufficient
- Gate: pass for Design authoring, with runtime evidence pending
