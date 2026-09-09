# UX2 — readable type, contrast and semantic markup

2026-09-08 · owner-directed private construction candidate · authority effect: none.

## Plan and scope

Implement A1–A3 from [UX-AUDIT.md](UX-AUDIT.md) in the existing sibling
orchestrator frontend and Workspace brand. Preserve the graph presentation rule,
Overview default, runtime identity and task budget.

1. Replace tiny typography with shared rem tokens and darken failing muted text.
2. Repair run-list, persona-table, worker-table and brand semantics.
3. Verify rendered contrast, keyboard controls, text resize and narrow layouts.
4. Refresh the existing loopback candidate and record evidence.

The owner authorization is “plan and implement it”, following the recommendation
to start with readability, contrast and semantic markup. D65 construction remains
governed by the [parent plan](PLAN.md); no ontology record is a dependency of this
CSS/markup repair. VPS and MCP work remain deferred in the parent DAG.

## Implementation

The sibling stylesheet defines .75rem metadata, .875rem controls and 1rem body
tokens. Existing 6–11px product labels now use metadata or control tokens.
Body copy in the run introduction, strategy goal, concepts and result uses 1rem.
Serif display headings and the cream/dark/lime identity are retained.

Muted text changes from #6f766f to #555e55; the amber unavailable-state label changes from #b46f21 to #8a5314; run-filter text uses the same token.
This fixes the reported contrast failures against page, filter and notice
backgrounds. Controls can grow with text, and relevant flex/grid children wrap.
The previously clipped native run breadcrumb and runtime notice now fit at 320px.

Runs are native links inside list items. The empty-state controls and loading/end
status remain outside the list while the sentinel stays in its scroll container.
Persona details are a native button-controlled disclosure inside a table cell,
with expanded state, a named region, and Enter/Space/Escape operation. The help
text is outside the table. Mobile persona rows use the full available width to
prevent the larger disclosure text from being squeezed into a narrow column.
Worker observations expose table, row, column-header and cell relationships.
The Workspace brand has an image role supporting its accessible name.

Product rendering remains in the sibling repository. Workspace only changes its
brand markup and integration checks; there is no duplicate frontend.

## Verification

Evidence is recorded in [UX2-EVIDENCE.json](UX2-EVIDENCE.json) and ux2-evidence/.

- Twenty sibling tests pass; sibling TypeScript/Vite and the Workspace bounded
  TypeScript/Vite candidate build pass.
- Six embedded sections and all seven run tabs have zero reported axe-core
  violations with the audit's A/AA rules. Incomplete checks remain recorded;
  this is not a WCAG conformance claim.
- The full embedded browser flow passes: native identity/result, first/default
  Overview, single-step summary, search/filter, links/history, offline recovery
  and stylesheet isolation. Native history/budget remain unchanged.
- The six-node strategy fixture retains graph selection and dependency lists.
- The rendered regression check verifies native run links, status outside the
  list, persona disclosure keys and a 14px tab that grows to 28px when root text
  size is doubled.
- Layout inspection covers 1440, 720, 390 and 320 CSS-pixel viewports. No product
  leaf text below 12px was measured except the third-party graph attribution.
  These measurements do not account for visual scaling inside a zoomed canvas.

The local browser harness uses the existing Playwright installation:
[test-readability.mjs](test-readability.mjs). Supply a candidate origin and existing
output directory; it only navigates and manipulates UI, without dispatching tasks.
The audit harness and axe dependency remain local test tools.

The standard Workspace build's pre-existing catalog snapshot drift is unchanged.
The bounded build uses the already-bundled snapshots. Canvas contrast/semantics
marked incomplete, actual screen-reader use, browser zoom and cross-browser
acceptance remain UX6 work.

## Next frontier and operational residue

UX2 is complete. UX3 focus, route announcements and task-review recovery is next;
UX4 Overview hierarchy/state vocabulary is independently runnable. UX5 and UX6
retain their DAG dependencies. No new credentials or operational decisions were
needed. VPS activation remains T8; MCP remains last.

## Open Questions

- UX3 still owns focus lost after a failed review and raw transport error copy.
- UX4 owns technical identity disclosure and consistent execution labels.
- UX5/UX6 own actual browser zoom, canvas target sizes, screen-reader validation
  and the remaining incomplete automated findings.
- The parent audit owns wider product and frontend-host contract questions.
