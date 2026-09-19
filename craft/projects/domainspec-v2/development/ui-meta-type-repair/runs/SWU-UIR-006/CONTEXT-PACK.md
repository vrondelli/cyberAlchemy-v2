---
artifact_id: CONTEXT-UIR-006-v1
task: SWU-UIR-006
mode: standard
strict_coverage: pass
session_evidence: true
created: 2026-07-11
---

# SWU-UIR-006 Context Pack

## Summary

- Files selected: 10 controlling sources plus four pinned corpus files.
- Selector groups: 9.
- Obligation coverage: 100 percent.
- Runtime: local; blockers: none.
- Open policy boundary: DEC-UIR-007 remains unresolved, so the only permitted
  missing-evidence observation is `not-observed`.

## Obligations

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| O1 | Preserve repository revision, relative path, file digest, selector, excerpt digest, and extractor version. | `EVIDENCE-CONTRACTS.md#S5-Corpus-Receipt` | covered |
| O2 | Keep literal source facts separate from reviewer projections. | `SPEC.md#AC-05`; accepted finding CR-05 | covered |
| O3 | Never add DomainSpec metadata to source facts. | task contract; accepted research S5 | covered |
| O4 | Represent unresolved or missing source evidence only as `not-observed`. | DEC-UIR-007; prohibited inference | covered |
| O5 | Test moved selectors, changed source digests, missing excerpts, and two implementation styles. | task contract | covered |
| O6 | Derive immutable identities and replay frozen evidence. | SWU-UIR-001 contract kernel | covered |
| O7 | Bound claims to Body War and Savvy; do not claim independent replication. | UIF-010 CR-06 | covered |

## Pinned Corpus Sources

| Corpus/style | Revision | Repository-relative files | Intended literal scope |
| --- | --- | --- | --- |
| Body War / static DOM and JavaScript | `996ac595815034043f5717f24db54e1cb70774d8` | `projects/body-war/app/static/index.html`; `projects/body-war/app/static/app.js` | form element, authored inputs, submit handler, request call |
| Savvy / Next and React | `b71fe693125283e627ccd1b1ba9e4ba886b149bd` | `frontend/savvy-legal-studio/app/page.tsx`; `frontend/savvy-legal-studio/app/layout.tsx` | exported page function, hook call, layout child slot |

## Decisions And Assumptions

- No blocker decision is required. DEC-UIR-007 is explicitly deferred.
- `not-observed` means only that the declared selector/excerpt could not be
  reproduced; it never means the fact is absent from the file or corpus.
- Literal facts may identify syntax and exact tokens in the pinned excerpt.
  Candidate correspondence belongs only in a separately identified reviewer
  projection with its own reviewer and status.
- Source files are read-only inputs. Generated receipts live only under this
  repair package.

## Write Scope And Validation

- Add corpus schema, extractor, manifest fixtures, generated receipt set, and
  focused tests under this repair package only.
- Verify file and excerpt digests, selector movement, source change, missing
  excerpts, two styles, literal/projection separation, and immutable replay.
- Do not mutate Body War, Savvy, UIF-010, candidate schemas, DS-D1, or DS-D8.
