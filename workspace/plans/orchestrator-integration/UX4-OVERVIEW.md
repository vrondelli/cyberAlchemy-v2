# UX4 — Overview hierarchy and state vocabulary

Candidate implementation completed 2026-09-08. Authority effect: none.
Construction boundary: [router D65 chain](../../../agent-routing/ROUTER.md#d65-construction).
Owner authorization: user “next”, continuing the accepted UX DAG.

The existing sibling frontend now puts the outcome, fixture disclosure and actionable
View result button before strategy and expandable technical coordinates. Opening a
result explicitly selects and focuses its tab. Overview remains the first/default
tab on run entry and reload. The previous synthetic phase sequence derived from
aggregate counts is removed; actual declared strategy dependencies retain the graph
and list, while a single step remains compact.

Dashboard and run details use the sibling domain's shared execution vocabulary.
Completed, Cancelled, Failed, Unknown and Needs reconciliation remain distinct.
List filters say Needs attention and Finished to describe their aggregate groups;
Finished does not mean success. Run links include a short identity in their
accessible names to distinguish equal titles; full IDs remain searchable and visible.

Every detail tab exposes its availability in visible text and an accessible
description while retaining its stable name and keyboard behavior. Absent worker
and lifecycle records say Not reported, rather than claiming zero decisions or
workers. Result availability depends on a supplied displayable result. Empty
blocker lists say No blockers reported. Research ontology navigation and explanatory
copy distinguish the research map from Workspace ontology.

## Evidence

[Machine evidence](UX4-EVIDENCE.json) links browser navigation, mocked recovery,
accessibility scans and screenshots. All 28 sibling tests and TypeScript checks
passed. Workspace bounded TypeScript/Vite candidate build passed. Twelve installed
steady-state axe scans found zero violations; incomplete canvas/contrast checks
remain manual work. Browser checks verified the new result button, focus, unchanged
recorded output, filters, history navigation, Overview default and compact strategy.

Updated local candidate: http://127.0.0.1:4187/#/apps/orchestrator/runs .
Rollback assets: ~/.local/share/are-workspace/dashboard-01/frontend-before-ux4 .
Both existing runs and three remaining fixture launches are preserved.
No real launch, paid model call or VPS activation was performed.

## Open Questions

UX5 owns actual browser zoom, mobile fixed navigation overlap, tab overflow and
graph keyboard/touch reflow; a narrow screenshot alone is not zoom acceptance.
UX6 owns manual assistive technology, cross-browser and measured performance.
Standard Workspace build still has unrelated catalog snapshot drift; this candidate
build uses the existing bundled snapshots. See [audit questions](UX-AUDIT.md#open-questions)
and [parent plan](PLAN.md#open-questions).
