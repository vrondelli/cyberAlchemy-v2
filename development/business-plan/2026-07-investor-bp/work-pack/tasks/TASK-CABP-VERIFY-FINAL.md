# TASK-CABP-VERIFY: Final Package Validation

## Objective

Run final cross-artifact claim, browser, responsiveness, comprehension, and
private-boundary validation, then record the verdict in `claim-audit.md`.

- Slice: S-006
- Layer: L3
- Wave: W5
- Dependencies: SWU-CABP-007.
- Write scope: `claim-audit.md` only.

## Source Contracts

All seven target artifacts, approved findings, provisional claim audit, and
browser evidence generated during this task.

## SWU-CABP-008

- Goal: determine whether the package is safe for private first-investor use.
- Ordered validation:
  1. run `git diff --check` on all package artifacts;
  2. validate Markdown links and required sections;
  3. validate cross-file offer, buyer, scenario, monetary, gate, and financing
     parity;
  4. parse HTML and start a local server;
  5. inspect desktop and mobile screenshots;
  6. check console, navigation, overflow, overlap, clipping, and text fit;
  7. run the six-question 30-second comprehension test;
  8. scan retired/forbidden terms and adjudicate each occurrence;
  9. confirm no public `arcanum/` mutation;
  10. append evidence and final `pass | flag | block` verdict to
      `claim-audit.md`.
- Viewports:
  - desktop: 1440x900;
  - mobile: 390x844;
  - optional wide desktop: 1920x1080 when layout changes materially.
- Comprehension questions:
  - Who is the buyer hypothesis?
  - What event triggers purchase?
  - What does the customer receive?
  - Which customer measure could prove value?
  - What is commercially validated now?
  - Is there a completed financing ask?
- Pass:
  - all six are answerable without internal vocabulary;
  - no unsupported claim or cross-file contradiction;
  - no browser/console/link/overlap defect;
  - unresolved founder/customer facts remain visible.
- Flag: minor non-load-bearing issue with owner and repair route.
- Block: claim promotion, broken rendering, missing source authority, or
  contradiction in buyer/offer/money/financing status.
- Acceptance evidence:
  - command log;
  - screenshot paths or browser receipt;
  - comprehension answers;
  - final claim matrix status;
  - reroute for every flag/block.
- Verification:
  - final `git diff --check`;
  - JSON/HTML/Markdown checks used by the task;
  - reviewable browser evidence at both required viewports.
- Execution owner: `task-session` using `playwright` and
  `ux-evidence-validator` where available; local browser fallback permitted.
- Handoff note: verification does not fix owner files silently. Route defects
  back to SWU-CABP-001 through 007 as appropriate.

## Synchronization

Investor circulation is allowed only after a final `pass` verdict. This does
not promote commercial validation; it means the package honestly represents its
current evidence.

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
