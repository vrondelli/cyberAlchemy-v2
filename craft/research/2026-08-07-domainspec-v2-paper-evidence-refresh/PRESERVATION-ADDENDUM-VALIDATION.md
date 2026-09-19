# Preserved Paper Plus Evidence Addendum Validation

## Result

PASS for the user-requested additive edit. Publication readiness remains
`evidence-blocked` because the preserved original prose contains claims the
2026-08-07 evidence addendum explicitly supersedes.

This receipt does not authorize or evidence commit, push, publication,
deployment, promotion, release, production use, accessibility conformance, or
independent reproduction.

## Preservation Proof

- Public Arcanum checkout commit:
  `a5c8bc5c010711721063e258ee92559f02dfc504`.
- Original `docs/paper.html` SHA-256:
  `cb430f8d5f15c917fef70fae5e0e7fc1ee3533cfb2d7f6bc044c26d473620e73`.
- The file was restored to that exact digest before additive mutation.
- Final additive-paper SHA-256:
  `0d7fc2cab52b4bfa52d249136ff59125d30a51c8c35d1096903269b79dbfb41d`.
- Final diff: 140 added lines and one replaced subnavigation line. The replaced
  line retains all original links and adds only the evidence-addendum link.
- No original paper prose, table row, reference, author line, footer, or script
  line was deleted.

## Additive Scope

- Four small CSS rules for the evidence notice/addendum presentation.
- One `Evidence addendum` subnavigation link.
- One evidence-status notice immediately after the original hero.
- One `§10 Evidence Addendum · 2026-08-07` before the original references.
- Approved public-safe thesis, origin matrix, corrected count table,
  action-local and fixture observations, historical-report observations,
  systems-theory ceilings, dated comparison, killed-claim list, and publication
  boundaries.
- No private path, internal research path, private selector, or implementation
  rule entered the public HTML.

## Static Validation

- Python 3 standard-library `HTMLParser`: PASS.
- Local file and fragment resolution: 26 references checked, 0 missing.
- Required original H1 and author line: present.
- Required evidence notice, addendum, thesis, 13/9/2 and 31 registry detail,
  and 29/240 action-local detail: present.
- `git -C arcanum diff --check -- docs/paper.html`: PASS.
- Private-path lint: PASS.

## Managed Preview

- Mode: `open`; server reused.
- Root policy: containing directory.
- Host: `127.0.0.1`.
- URL: `http://127.0.0.1:43015/paper.html`.
- HTTP status: 200.
- Content type: `text/html; charset=utf-8`.
- Served and target SHA-256:
  `0d7fc2cab52b4bfa52d249136ff59125d30a51c8c35d1096903269b79dbfb41d`.
- Exact served-byte equality: PASS.
- Server remains running until an explicit stop request.

## Browser Validation

- Playwright: `1.59.1`.
- Chromium executable:
  `/home/vrondelli/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome`.
- Desktop viewport: 1440 × 1000.
- Mobile viewport: 390 × 844.
- Expected original title and H1: PASS on both viewports.
- Evidence notice and `#evidence-addendum`: present on both viewports.
- Main sections: 15.
- Horizontal overflow: absent on both viewports.
- Page exceptions: 0; failed requests: 0.
- Existing desktop console issue: one implicit `/favicon.ico` 404. It predates
  this additive request and was preserved rather than repaired.
- Screenshots were inspected at both sizes; no acceptance-critical addendum
  layout defect was observed.

## Proof Boundary

The additive edit makes the current evidence visible and explicitly controlling
where it conflicts with inherited claims. It does not make the preserved paper
internally claim-consistent. Publication Research Pipeline phase 8 therefore
remains deferred until an owner either revises the conflicting original claims
or explicitly chooses a historical-paper-plus-addendum publication model.

