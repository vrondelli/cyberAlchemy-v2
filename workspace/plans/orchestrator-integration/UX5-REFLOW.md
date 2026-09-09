# UX5 — Reflow and graph accessibility

Candidate implementation, 2026-09-08. Authority effect: none.
Owner instruction: “next” under the accepted UX DAG and
[router D65 construction boundary](../../../agent-routing/ROUTER.md#d65-construction).

## Behavior

The existing sibling frontend wraps run tabs at narrow widths, keeping every tab
name and availability description visible. Mobile strategy dependencies wrap full
node IDs and dependency names. Each mobile step can select a persistent inspector
with the role, assigned persona, method lenses, attempt bound, web policy and exact
context packet when supplied. The desktop graph uses the same inspector instead
of hover-only cards. Native button activation supports keyboard and touch.

Research ontology includes a record list with search/filter support, source
references and directed relationships. Selecting a record updates the same portal
as the canvas. Spatial graph layouts remain available; the list supplies a path
that does not require dragging, panning or precision pointer use.

Workspace exports a bottom-obstruction CSS property. The host carries scroll
padding and control scroll margins inside each frontend's shadow root. Mobile
navigation retains minimum targets and can scroll when registered apps exceed its
width. The fixed rail remains visible; content can scroll clear of it.

## Verification

[Evidence](UX5-EVIDENCE.json) includes real Chrome tab zoom using a temporary local
test extension, with no persistent browser extension installation. A 1280-pixel
window yields 640 CSS pixels at 200% and 320 at 400%; devicePixelRatio increases,
while visualViewport.scale remains 1. This distinguishes browser zoom from pinch
zoom and viewport-only simulation.

The zoom matrix covers all seven run tabs, expanded technical details, Runs, New
run, Operations, Lab and the expanded ontology list. Focused controls are checked
against the mobile rail. The explicit six-node strategy fixture was separately
checked at 200/400%, with all six keyboard selections and all six touch list
selections. Native run history, output, routing, default Overview and editor
recovery are regression checked without consuming installed launch capacity.

Reproducible browser entry points:
[test-reflow.mjs](test-reflow.mjs) takes dashboard config, candidate dist and output
directory; [test-graph-accessibility.mjs](test-graph-accessibility.mjs) takes a
standalone preview origin and output directory. The latter uses the explicit
six-node development fixture. Source snapshots of supplementary scans are in
ux5-evidence.

Local candidate: http://127.0.0.1:4187/#/apps/orchestrator/runs .
Rollback assets: ~/.local/share/are-workspace/dashboard-01/frontend-before-ux5 .
No native launch, paid model call, VPS activation or budget reset.

## Open Questions

UX6 owns cross-browser coverage, real screen-reader testing and measured
performance. Automated scans retain incomplete checks on the spatial ontology
canvas; a passing list alternative does not establish full canvas accessibility.
The zoom/layout findings apply to the sampled native records and explicit
branching fixture, not every possible future projection. Full-page Playwright
screenshots miscapture browser-zoom coordinates; actual zoom uses DOM metrics and
direct CDP viewport captures, while full-page layout images use unzoomed 320 CSS px.

The normal Workspace build still reports unrelated catalog snapshot drift.
The bounded candidate build uses the existing bundled snapshots.
[Parent plan questions](PLAN.md#open-questions) retain operational and VPS gates;
MCP remains last.
