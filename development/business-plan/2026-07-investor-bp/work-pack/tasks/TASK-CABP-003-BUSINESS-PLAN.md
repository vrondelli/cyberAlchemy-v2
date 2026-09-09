# TASK-CABP-003: Canonical Business Plan Rewrite

## Objective

Rewrite `business-plan.md` as the canonical outward narrative using the
accepted evidence, economics, and operating contract.

- Slice: S-003
- Layer: L2
- Wave: W2
- Dependencies: SWU-CABP-001 through SWU-CABP-004.
- Write scope: `business-plan.md` only.

## Source Contracts

- Approved findings, especially Sections 1, 3-14.
- Accepted registry, source trace, financial assumptions, and operating plan.
- Whisper business-plan preset as composition guidance only.

## SWU-CABP-005

- Goal: complete the long-form rewrite without preserving stale section order
  merely because it exists.
- Narrative algorithm:
  1. state the commercial experiment and missing validation;
  2. name the lead buyer/payor hypothesis and qualifying release;
  3. describe the competent current process and measured burden;
  4. explain the fixed-scope sprint and versioned release review;
  5. show before/intervention/after with added customer burden;
  6. state possible money mechanisms and proof requirements;
  7. compare internal review, CI/CD, ITSM, governance, and consulting;
  8. state the candidate difference as a test, never uniqueness;
  9. place full live-premises/confidential routes in diligence transfer hypotheses;
  10. explain underlying technology only after the transaction;
  11. present GTM through the two commercial gates;
  12. present team and financing gaps honestly;
  13. close on the next real transaction witness.
- Required plain-language deliverables:
  - exact release under review;
  - customer-confirmed requirements;
  - checks, results, and limits;
  - unresolved items;
  - authorized exceptions;
  - approved deployment boundary;
  - stop/rollback triggers;
  - versioned release review.
- Edge cases:
  - internal terms may appear in technical diligence but not as unexplained value;
  - transfer hypotheses must not look like traction;
  - no financing ask may be implied while inputs are missing;
  - no amount may lose its status;
  - no generated vivid example may be mistaken for a customer event.
- Done criteria:
  - one coherent customer transaction anchors the plan;
  - customer work change and money-proof routes are explicit;
  - all sections agree with supporting controls;
  - missing evidence remains visible;
  - no unsupported present-tense promotion.
- Acceptance evidence: section-by-section mapping to approved findings and source
  trace.
- Verification:
  - `git diff --check -- business-plan.md`
  - review headings and first-use definitions;
  - inspect every monetary statement against financial assumptions;
  - inspect retired terms against the jargon map and allow only explained
    diligence uses.
- Execution owner: `task-session` with bounded `whisper` composition; local
  fallback permitted.
- Handoff note: load the approved findings, shared context, and four accepted
  supporting artifacts. Do not mutate HTML or claim audit.

## Synchronization

A pass receipt unlocks SWU-CABP-006. A flag routes back to this task before
claim-audit work starts.

## Expected Result Shape

```yaml
swu_id: <id>
result: pass | flag | block | interrupted
capability_ref: task-session | whisper | local-fallback
receipt_kind: native-stage | subagent | local-fallback | blocked
receipt_artifact: <path or none>
files_touched: [<path>]
validation: [<check and result>]
blockers: [<blocker or none>]
residue: [<residue or none>]
reroute: <owner or none>
handoff_note: <next coordinator action>
```
