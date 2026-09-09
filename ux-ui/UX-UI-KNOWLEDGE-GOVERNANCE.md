# UX/UI Knowledge Governance

Status: candidate UX/UI interface
Owner: CyberAlchemy v2 UX/UI route
Authority model: [../authority/AUTHORITY-MODEL.md](../authority/AUTHORITY-MODEL.md)
Definitions:
[CAV2-D45 UX/UI knowledge governance](../authority/definitions/DEFINITIONS.md#cav2-d45-uxui-knowledge-governance),
[CAV2-D46 experience evidence lifecycle](../authority/definitions/DEFINITIONS.md#cav2-d46-experience-evidence-lifecycle),
[CAV2-D47 interface evidence boundary](../authority/definitions/DEFINITIONS.md#cav2-d47-interface-evidence-boundary)
Constitution:
[CAV2-C15 interface evidence boundary](../authority/constitutions/STABLE-REPOSITORY-CONSTITUTION.md#cav2-c15-interface-evidence-boundary)

## Purpose

This document defines how UX/UI knowledge moves from interface evidence into
reusable lessons, patterns, validator claims, studio handoffs, and promotion
requests without letting browser evidence or subjective preference become false
authority.

`ux-lessons` is the thin lesson and pattern producer. `ux-evidence-validator`
is the validator-safe evidence interface. `ui-prototyping-studio` is a governed
mutation and prototyping consumer. CyberAlchemy authority owners decide whether
any candidate becomes a UX/UI pattern, validator rule, interface constraint, or
constitution pressure.

## Core Guardrails

```text
browser evidence != human experience authority
pattern seed != hard gate
```

Browser evidence can show what happened on the page. It can support strong
claims about rendered state, accessibility-tree facts, keyboard paths, layout
measurements, interaction results, console failures, and calibrated validator
fixtures. It cannot by itself prove what a human understood, trusted, noticed,
preferred, or found delightful.

## UX/UI-View Role

UX/UI knowledge is one governed view over the wider ontology of project
knowledge. It asks:

- what happened in the interface;
- which user-facing state was visible, semantic, and interactive;
- which risk is browser-observable;
- which finding is only a proxy;
- which concern needs screenshot review, human study, or expert review;
- which lesson can become a reusable pattern candidate;
- which candidate may feed a validator, studio handoff, or promotion request.

UX/UI view does not answer:

- whether a term is a canonical definition;
- whether a pattern is an invariant;
- whether a subjective quality claim is proven;
- whether a studio mutation is approved;
- whether a browser test is sufficient for authority;
- whether a UX/UI candidate can constrain downstream work.

Those decisions route to the relevant owner.

## Experience Evidence Lifecycle

UX/UI knowledge should record this lifecycle explicitly:

```text
interface observation or UI hypothesis
  -> browser, user, or session evidence
  -> lesson
  -> ux-pattern candidate
  -> validator claim map or studio annotation intent
  -> fixture, browser, or cross-session exercise
  -> challenge and residue review
  -> owner promotion
  -> UX/UI pattern, validator rule, or interface constraint authority
```

Operations are therefore an experience evidence engine. A session, screenshot,
Playwright run, accessibility scan, market-practice note, expert review, or user
study can raise confidence in a UX/UI candidate, but it does not promote the
candidate by itself.

## Governance Interface Fields

Every load-bearing UX/UI artifact, tree, or view-bearing concept must declare:

| Field | Purpose |
| --- | --- |
| `owner_route` | Who can decide mutation, promotion, challenge resolution, or drift. |
| `source_or_session_refs` | The session, issue, review, screenshot, trace, study, or source paths behind the claim. |
| `lesson_or_pattern_role` | Whether the object is an observation, lesson, pattern seed, pattern candidate, rule candidate, or promoted rule. |
| `evidence_class` | Hard gate, soft flag, screenshot review, human study, or not automatable. |
| `consumer_handoff` | Validator claim map, studio annotation intent, implementation work, research task, or promotion request. |
| `validation_surface` | Browser fixture, accessibility check, keyboard path, layout measurement, screenshot review, human study, or owner review. |
| `challenge_contract` | How to contest the lesson, claim, pattern, validator rule, screenshot interpretation, or human-study conclusion. |
| `drift_route` | Who handles stale heuristics, changed UI context, broken fixtures, obsolete screenshots, or contradicted findings. |
| `allowed_use` | What downstream work may rely on before promotion. |
| `blocked_use` | What the artifact, validator, screenshot, pattern, or view must not decide. |

## UX/UI Candidate Shape

```yaml
ux_ui_candidate_id:
label:
interface_observation:
session_ref:
lesson_refs:
pattern_candidate:
claim_class:
browser_evidence:
accessibility_evidence:
layout_interaction_evidence:
screenshot_review:
human_study_residue:
consumer_handoff:
  validator_claim_map:
  studio_annotation_intent:
fixture_calibration:
challenge_contract:
owner_route:
promotion_request:
current_authority_posture:
allowed_use:
blocked_use:
residue:
```

This is an interface shape, not a live schema. A future schema amendment witness
is required before this becomes machine-enforced.

## Relationship To Ontology Views

Ontology is a set of governed views over knowledge. UX/UI contributes the
experience-facing view.

| View | Question | UX/UI relationship |
| --- | --- | --- |
| Meaning view | What does this mean? | UX/UI terms must cite definitions or carry definition residue. |
| UX/UI view | What happened in the interface and what can be learned? | This interface owns the experience evidence lifecycle. |
| Run view | What happened in operation? | Browser runs, sessions, studies, screenshots, traces, and validation reports feed evidence. |
| Residue/challenge view | What failed, contradicted, or remains open? | UX/UI candidates must carry proxy limits, false-positive risks, and challenge contracts. |
| Promotion view | What can become authority? | Owner routes decide promotions, not the UX/UI view. |

## Owner Routing

| Candidate movement | Owner route |
| --- | --- |
| Session or review evidence -> lesson | `ux-lessons` |
| Lesson -> UX/UI pattern candidate | `ux-lessons` |
| Pattern candidate -> validator claim map | `ux-lessons` emit-validator plus `ux-evidence-validator` |
| Validator claim -> fixture, calibration, or evidence report | `ux-evidence-validator` |
| Pattern candidate -> studio annotation intent | `ux-lessons` emit-studio plus `ui-prototyping-studio` |
| Pattern candidate -> UX/UI authority | CyberAlchemy authority model plus UX/UI owner |
| Pattern candidate -> definition | definitions-governance |
| Pattern candidate -> constitution or invariant pressure | constitution-governance |
| Pattern candidate -> implementation work | invoke/task-session after owner gates |
| Subjective or human-understanding claim | human-study or expert-review owner |
| Challenge or contradiction | owner route named by the challenge contract |

## Non-Authority Rules

The following do not promote UX/UI knowledge:

- a nice-looking screenshot;
- a single session note;
- a pattern seed produced by `ux-lessons`;
- a passing Playwright run;
- an accessibility scan by itself;
- a studio variant;
- a visual density heuristic before false-positive calibration;
- a market-practice note without local exercise;
- a human preference claim without study, expert review, or owner-bounded scope.

## Execution Guidance

When working UX/UI knowledge, use this sequence:

1. Capture the interface observation, session, screenshot, trace, review, or
   UI hypothesis.
2. Create or update the lesson and UX/UI pattern candidate.
3. Classify the claim through
   [CAV2-D47](../authority/definitions/DEFINITIONS.md#cav2-d47-interface-evidence-boundary).
4. Route validator-safe claims to `ux-evidence-validator`.
5. Route mutation or prototype intents to `ui-prototyping-studio`.
6. Attach source refs, browser evidence, screenshot evidence, human-study
   residue, and proxy limits.
7. Apply
   [CAV2-D38](../authority/definitions/DEFINITIONS.md#cav2-d38-claim-proof-bound):
   do not claim more than the evidence supports.
8. Add the
   [CAV2-D40](../authority/definitions/DEFINITIONS.md#cav2-d40-challenge-contract).
9. Route promotion through the relevant owner.

## Open Work

- Build the first CAV2 UX/UI governance package from a real interface session.
- Decide whether the UX/UI candidate shape should become a machine-checkable
  schema.
- Create a fixture-calibrated validator example showing hard-gate versus
  soft-flag separation.
- Run at least one cross-session UX/UI pattern promotion example before
  treating any UX/UI pattern as authority.
- Add inventory evidence cards for the first real UX/UI-view run.
