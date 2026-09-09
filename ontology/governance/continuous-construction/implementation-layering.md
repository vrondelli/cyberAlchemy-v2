---
title: Continuous Construction Governance Implementation Layering
status: candidate
updatedAt: 2026-09-01
owner: CyberAlchemy v2 governance-model owner
scope: active CAV2-D65 continuous-construction evaluation only
---

# Continuous Construction Governance Implementation Layering

## Layer decision

| Layer | Minimum working unit | Outcome | Claim ceiling |
| --- | --- | --- | --- |
| L0 | Validate exact active D65/D67 source bindings, one authorization envelope, one ordered product-construction stage set, and separate operational-support tasks. | Deterministic `CONTINUE` or `STOP` with full downstream and operational-residue state. | Candidate advisory evidence only. |
| L1 | Validate one immutable input packet against the complete attempt-basis digest, then validate any separate human-test observation against that exact packet ref and digest. | `READY_FOR_HUMAN_TEST` without an observation, or `REQUEST_TERMINAL_CONFIRMATION` from a passing observation. | A request classification, not a human decision or effect. |
| L2 | Bind an independently accepted evaluator to one route and exact effect mapping. | A separately authorized adapter may consume the decision. | Deferred; no activation exists in this package. |

L0 and L1 are implemented together because terminal-only confirmation cannot be
shown without the same fail-closed predecessor evaluation. L2 remains blocked.

## Non-regression guardrails

- The stage order is program-bound and duplicate, omitted, or reordered stages
  stop evaluation.
- Missing, stale, invalid, blocked, or not-evaluable predecessors stop and make
  all dependent applicable stages `not_evaluable`.
- A missing owner gate is an authority request, never routine confirmation.
- `routine_confirmation_required` is false except for
  `REQUEST_TERMINAL_CONFIRMATION`.
- Changed authorization, stage, gate, packet, or observation bytes and any
  attempt-basis mismatch stop; a later terminal response cannot approve them
  retroactively or replace the packet exercised by the human.
- Every result keeps `authority_effect: none` and `effect_authorized: false`.
