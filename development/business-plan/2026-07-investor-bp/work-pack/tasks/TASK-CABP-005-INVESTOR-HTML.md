# TASK-CABP-005: Investor HTML Rewrite

## Objective

Rewrite `investor-brief.html` as a polished, responsive compression of the
audited business plan.

- Slice: S-005
- Layer: L3
- Wave: W4
- Dependencies: SWU-CABP-006.
- Write scope: `investor-brief.html` only.

## Source Contracts

Rewritten `business-plan.md`, provisional `claim-audit.md`, approved
findings, and existing HTML/CSS/JS as the visual baseline.

## SWU-CABP-007

- Goal: replace all stale investor-facing language while preserving or improving
  the document's professional visual system.
- Content order:
  1. company status and concrete release-review experiment;
  2. buyer, trigger, and competent current process;
  3. fixed-scope sprint and eight deliverables;
  4. before/intervention/after and customer burden;
  5. money mechanisms and how pilots measure them;
  6. alternatives and candidate difference to test;
  7. commercial-entry and customer-value gates;
  8. restrained transfer-hypothesis note;
  9. technical capability as diligence support;
  10. team/financing gaps, risks, and next proof.
- UI rules:
  - maintain first-viewport product/company signal;
  - keep document-style density appropriate for investors;
  - use current icon system where present;
  - no nested cards, decorative blobs, or marketing filler;
  - stable responsive dimensions and no text overlap;
  - mobile and desktop content order must match;
  - remove visual signals that make three hypotheses look like traction.
- Claim rules:
  - HTML may compress but never expand the BP;
  - all amounts retain status;
  - no category, assurance, ROI, or reach promotion;
  - no hidden disclaimer contradicts a headline.
- Done criteria:
  - all visible copy follows the claim-audit contract;
  - primary scenario is release review;
  - transfer hypotheses are visibly subordinate;
  - financing status is accurate;
  - HTML parses and local navigation still works.
- Acceptance evidence: content-parity checklist plus desktop/mobile screenshot
  readiness.
- Verification:
  - `git diff --check -- investor-brief.html`
  - parse with Python `html.parser`;
  - extract headings and compare with claim-audit contract;
  - serve locally and check console/navigation before W5.
- Execution owner: `task-session` with bounded `whisper` composition; local
  fallback permitted.
- Handoff note: use the BP and claim audit as authority. Do not revise supporting
  Markdown from this SWU.

## Synchronization

A content or visual defect blocks W5 and routes back here. A BP/claim defect
routes to its owning SWU instead.

## Expected Result Shape

```yaml
swu_id: <id>
result: pass | flag | block | interrupted
capability_ref: <native capability>
receipt_kind: native-stage | subagent | local-fallback | blocked
receipt_artifact: <path or none>
files_touched: [<path>]
validation: [<check and result>]
blockers: [<blocker or none>]
residue: [<residue or none>]
reroute: <owner or none>
handoff_note: <next coordinator action>
```
