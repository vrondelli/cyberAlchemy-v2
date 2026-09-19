---
dispatch_id: 2026-07-10-ui11-metatype-review
dispatch_type: review
status: auditor-accepted
created: 2026-07-10
---

# UI11 Meta-Type Review - Findings

## Review Verdict

Choose `explicit-defer` now.

Run `SWU-DSD1-003` to record the owner decision, then route
`SWU-DSD1-006` to guard against canonical surfaces claiming that all 25 DS-D1
labels are currently formation-authoritative. Only if the owner later selects
`add-ui` should `SWU-DSD1-004/005` build the required UI schema/fixture package.

## Surviving Findings

| ID | Supports route | Evidence | Severity | Proposed fix |
| --- | --- | --- | --- | --- |
| UI11-F1 | explicit-defer | `TASK-DSD1-UI11.md:25-31`; `CANDIDATES.md:38-52`, `CANDIDATES.md:112-114` | High | In `SWU-DSD1-003`, record `explicit-defer` as the selected route. In `SWU-DSD1-006`, preserve the UI11 candidate trail without making the labels formation-authoritative. |
| UI11-F2 | explicit-defer | `TASK-DSD1-UI11.md:44-45`; `context.md:22-25`, `context.md:40-43`; `relationships.yml:292-513` | High | State that DS-D8 UI relationships can pressure DS-D1 but cannot promote UI labels into DS-D1 categories. |
| UI11-F3 | narrow-claim | `TASK-DSD1-UI11.md:53-55`; `TASK-DSD1-UI11.md:29-31` | High | Route `SWU-DSD1-006` to prevent canonical surfaces from claiming 25 authoritative DS-D1 types while UI11 remains deferred. Do not treat `CANDIDATES.md` itself as canonical authority. |
| UI11-F4 | conditional add-ui gate | `TASK-DSD1-UI11.md:46-47`; `TASK-DSD1-UI11.md:29-31` | High | If the owner later selects `add-ui`, route through `SWU-DSD1-004/005` and require each selected UI type to have a human card, machine schema, positive fixture, negative fixture, correction contract, and tests. |

## Dropped / Demoted Findings

| Former ID | Disposition | Reason |
| --- | --- | --- |
| UI11-F5 | Dropped as surviving finding | Collapse tests are useful future negative-fixture material, but not a verified standalone change request in this review. The supportable fixture requirement is covered by UI11-F4. |
| UI11-F6 | Demoted | Pilot ordering is non-authoritative and may smuggle selection pressure. The existing conditional add-ui slice in `TASK-DSD1-UI11.md:37-40` concerns Page/Layout/Component/View Model; do not present alternate per-type ordering as a finding without a new owner decision. |

## Per-UI-Type Coverage

All 11 UI labels are formation-deferred now. Candidate notes below are
non-authoritative attacker input only; they do not approve or reject future
promotion.

| UI label | Current verified status | Candidate note |
| --- | --- | --- |
| Page | Formation-deferred | Route pressure exists, but Page is not promoted. |
| Layout | Formation-deferred | Shell/wrap language remains candidate material. |
| Component | Formation-deferred | Broad/supertype concern remains candidate material. |
| View Model | Formation-deferred | Display-shape pressure remains candidate material. |
| Hook | Formation-deferred | Framework-specificity concern remains candidate material. |
| Form | Formation-deferred | Schema/input pressure remains candidate material. |
| Action | Formation-deferred | Trigger/outcome criteria remain candidate material. |
| Guard | Formation-deferred | Rule-projection concern remains candidate material. |
| Binding | Formation-deferred | Relationship-vs-noun concern remains candidate material. |
| Adapter | Formation-deferred | Mapping-boundary concern remains candidate material. |
| State Indicator | Formation-deferred | Enum/state-machine projection concern remains candidate material. |

## Change Requests

1. Record the UI11 decision in `SWU-DSD1-003`: select `explicit-defer`, reject
   immediate `add-ui`, and preserve the candidate trail.
2. Run `SWU-DSD1-006` to narrow canonical claims so no canonical surface implies
   all 25 DS-D1 types are currently authoritative.
3. In `SWU-DSD1-006`, add the boundary that DS-D8 UI relationships can pressure
   DS-D1 but cannot promote UI labels by themselves.
4. Keep all 11 UI labels formation-deferred until a later owner decision selects
   `add-ui`.
5. Conditional only: if `add-ui` is later selected, route through
   `SWU-DSD1-004/005` and require the full schema, fixture,
   correction-contract, and test package before promotion.

## Final Approval Input

Verifier status: PASS after one revision loop.

Auditor status: ACCEPT.

The final approver should accept these findings only if the audit confirms that
all 11 UI labels are covered, all surviving findings cite evidence, refuted
findings are dropped or demoted, and DS-D8 endpoint use is not treated as DS-D1
formation authority.
