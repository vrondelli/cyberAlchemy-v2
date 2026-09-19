# TASK-R3C-VERIFY: Completion Verification

Layer: L3.
Slice: S-R3C-005.
Wave: [W3](../waves/W3.md).

## Objective

Verify the executed plan and produce the final closeout receipt.

## Smallest Working Unit Exemption

This is a closure-only verification task. It uses one verification SWU.

### SWU-R3C-011

- Goal: final R3 closeout verification.
- Dependencies: all non-deferred SWUs.
- Write scope: result artifact only, plus Craft/observability if final status changes.
- Done criteria: final report distinguishes complete, active, deferred, and blocked work.
- Acceptance evidence: validation commands pass and unresolved items have owner routes.
- Validation:
  - `npm --prefix projects/domainspec-v2/impl run validate`
  - `npm --prefix projects/domainspec-v2/impl run engine:test`
  - `npm --prefix projects/domainspec-v2/impl run typecheck`
  - Craft YAML parse
  - Observability JSONL parse
  - `git diff --check -- projects/domainspec-v2 .arcanum/observability`
- Execution owner: local-fallback.
- Handoff note: final answer should say whether remaining items are blockers or future routes.
