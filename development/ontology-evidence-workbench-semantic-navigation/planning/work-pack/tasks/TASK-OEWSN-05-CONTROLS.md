# TASK-OEWSN-05: Modal, Modes, Disclosures, Contrast, and Copy

## Objective

Repair independent control-state, focus, contrast and literal-description
defects without changing graph semantics.

## Smallest Working Units

### SWU-OEWSN-012 — Correct startup modal focus

- Behavior/acceptance: initial focus enters declared target; every dismissal
  returns graph entry with visible focus
- Split: entry and dismissal are one modal lifecycle; other controls independent
- Dependencies: SWU-006; write scope: startup/tour modal, OewApp, navigation
  tests and CSS; validation: focus ledger in pointer/keyboard desktop/narrow
- Owner/handoff: Task Session; return modal receipt

### SWU-OEWSN-013 — Expose one selected mode and owned result

- Behavior/acceptance: Overview/Learn/Deep Dive announce exactly one selected
  mode and a distinctly named owned result region
- Split: selection and ownership must close together; content preference remains human study
- Dependencies: SWU-008; write scope: mode controls/result region, store,
  tests/CSS; validation: selected-state and named-region assertions
- Owner/handoff: Task Session; return mode receipt

### SWU-OEWSN-014 — Give Filter owned state and restoration

- Behavior/acceptance: Filter chooses its declared pattern, exposes appropriate
  state/relationship, labels its owned surface and restores its trigger
- Split: Filter has an independently acceptable result and trigger lifecycle;
  Export is SWU-OEWSN-019
- Dependencies: SWU-006; write scope: Filter control and disclosure
  component/store/`EvidenceFilters.test.tsx`/CSS; validation: Filter
  activation/result/dismiss/restore matrix
- Owner/handoff: Task Session; return Filter disclosure receipt

### SWU-OEWSN-019 — Give Export owned state and restoration

- Behavior/acceptance: Export chooses its declared pattern, labels and owns its
  result/error surface and restores its trigger on Close/Escape
- Split: Export has an independent result/error and trigger lifecycle; Filter
  is already closed by SWU-OEWSN-014
- Dependencies: SWU-006; write scope: `ExportPanel.tsx`,
  `ExportPanel.test.tsx`, OewApp, navigation tests and CSS
- Validation: Export activation/result/error/dismiss/restore matrix
- Owner/handoff: Task Session; return Export disclosure receipt

### SWU-OEWSN-015 — Repair named contrast tokens

- Behavior/acceptance: named enabled text 4.5:1 and required boundary/focus/edge
  3:1 in every declared state; receipt records colors, role, state and runtime
- Split: token changes and measurement form one independently reviewable visual contract
- Dependencies: SWU-005, SWU-012–014 and SWU-019; write scope: `oew.css`, token/contrast
  fixture and browser measurement script; validation: exact ratio ledger plus forced colors
- Owner/handoff: Task Session; return measurement receipt

### SWU-OEWSN-016 — Correct trust, provenance and artifact copy

- Behavior/acceptance: unavailable `/understand` action absent; candidate-local
  artifact, qualified provenance and authority ceiling are present
- Split: these strings form one explanatory trust boundary; projection count
  behavior is independently acceptable in SWU-OEWSN-020
- Dependencies: none; write scope: trust/onboarding copy,
  `TrustRail.test.tsx` and `presentationCopy.test.tsx`
- Validation: literal trust/onboarding DOM assertions
- Owner/handoff: Task Session; return trust/artifact-copy receipt

### SWU-OEWSN-020 — Apply projection-count and zero-value policy

- Behavior/acceptance: counts explicitly describe the current projection and
  OD-03 hide/disable/retain behavior is non-color-dependent
- Split: count scope and zero-value handling form one Filter data-state
  contract; trust and artifact identity are already closed by SWU-OEWSN-016
- Dependencies: SWU-003, SWU-009, SWU-014; write scope: Filter/profile adapter,
  `EvidenceFilters.test.tsx` and `semanticNavigationProfile.test.ts`
- Validation: projection-count and zero-policy fixture/browser assertions
- Owner/handoff: Task Session; return projection-count receipt

## Implementation rule

Each SWU receives a fresh baseline over shared OewApp/store/CSS/patch bytes and
runs sequentially. A passing sibling does not waive its own browser evidence.

## Failure modes

Focus on body, multiple/no selected mode, unnamed result, inappropriate
`aria-controls`, color-only state, unmeasured token, freshness claim, dead
instruction, source-ontology count implication or missing restoration blocks.
