# TASK-OEWSN-04: Path Explanation

## Objective

Provide complete, named route explanations under the approved Body War Path
policy without turning a route into a cluster, branch or authority claim.

## Algorithm

Capture graph/profile/filter fingerprints; validate distinct endpoints and
policy; compute deterministic route alternatives over admitted records; map
each edge through `RelationPresentationRecord`; attach traversal orientation;
sort ties by canonical edge-ID sequence; reject stale results before display.

## Smallest Working Units

### SWU-OEWSN-010 — Derive complete Path results

- Primary behavior: Path query -> deterministic alternatives with complete hops
- Independent acceptance: forward/reverse/not-found/stale pure fixture bank
- Split analysis: search and hop projection must close together for a usable
  result; UI, focus and restoration are separate SWU-011
- Dependencies: SWU-002, SWU-004
- Source anchors: CR-04; Define ReadPathExplanation; Design Path flow
- Write scope: new `pathExplanation.ts`, `pathExplanation.test.ts` and patch 0003
- Done: every hop retains source/projected/traversal directions and ceilings
- Evidence/validation: algorithm fixtures, canonical tie ordering and stale rejection
- Owner/handoff: Task Session subagent/local fallback; return derivation receipt

### SWU-OEWSN-011 — Render Path surface and recovery

- Primary behavior: named From/To/result surface operates and restores invoker
- Independent acceptance: activation, result, cancel, dismissal and restoration
  pass independently in desktop/narrow keyboard runs
- Split analysis: surface state and focus recovery are one interaction cycle;
  algorithm truth already passes in SWU-010
- Dependencies: SWU-010, SWU-006
- Source anchors: CR-04; UX Plan Path; state machine
- Write scope: `PathSheet.tsx`, `PathSheet.test.tsx`, `OewApp.tsx`, `store.ts`,
  `oew.css` and patch 0003; the browser matrix is read-only validation over
  the resulting build in this SWU
- Done: exact hop list and canvas selection agree; non-authority copy is visible
- Evidence/validation: component tests and forward/reverse Chromium matrix
- Owner/handoff: Task Session subagent/local fallback; return Path receipt

## Failure modes

Unnamed endpoints/results, mixed direction concepts, locally re-derived raw
semantics, stale route display, ambiguous tie order, missing non-authority copy
or incomplete recovery blocks Path.
