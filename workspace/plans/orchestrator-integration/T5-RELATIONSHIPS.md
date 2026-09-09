# T5 — Cross-feature execution relationships

Candidate construction, 2026-09-08. Authority effect: none.
Owner authorization: user “next”, continuing the accepted integration DAG.
[D65 boundary](../../../agent-routing/ROUTER.md#d65-construction).

## Construction DAG

| Task | Dependency | State | Result |
| --- | --- | --- | --- |
| T5A | T4 | Complete | Verified run result → explicit Essays staging → observed saved draft |
| T5B | T4 | Complete | Source-origin envelope and exact revision/content binding at task review |
| T5C | T5B | Complete | Chat and project entry points, origin links on runs and return navigation |
| T5D | T5B | Complete | Knowledge-context inspection with explicit selection and no inferred effects |
| T5E | T5A, T5C, T5D | Complete | Integrated source → reviewed task → run → staged output acceptance |

T5 is complete within the local fixture candidate boundary, with
[T5E integrated acceptance](T5E-ACCEPTANCE.md). T6 is the next runnable task.
UX6 manual/browser acceptance gaps and T8 VPS gates are unchanged; MCP stays last.

## T5A implemented behavior

Open a recorded run, choose Result, then Open result in Essays. Workspace offers
this action only for succeeded runs with owner-verified content, an owner run key
and completion digest. The sibling console accepts a host-supplied result action;
it does not acquire an Essays dependency or own a second run store.

Essays shows a local handoff panel with captured content and source coordinates.
The result's runtime, run key, view identity, source revision (or explicit absence),
mode and completion digest are preserved. The panel is focused on entry. This
local record is candidate provenance, not a new owner-history verification.

Create/open the Essays studio and its composition plan if needed. Explicitly
select replacement of the current unsaved buffer, then choose Stage result in
editor. This uses EssaysStagedBuffer through the existing Essays component.
Neither staging nor opening the handoff saves or accepts an execution result.
The existing Essays Save accepted draft control owns saving the writing revision.

A later save in the selected workspace is compared with normalized captured
Markdown. Exact and edited saves remain distinct and retain the source reference.
Pre-stage, older and unrelated save observations are ignored. Reload restores the
handoff reference but never automatically overwrites the editor. Restaging requires
another explicit replacement choice.

One handoff is retained in this browser profile at a time, under
ca2.run-result-handoff.v1. Opening another result cannot overwrite it. A stale tab
cannot overwrite a changed or dismissed handoff. Dismiss removes this local
handoff reference, including its saved-revision association, and leaves Essays
text intact. Multi-handoff archives and native source-origin registration are
outside T5A; no origin references were invented in existing native histories.

## Verification and local candidate

[T5A evidence](T5A-EVIDENCE.json) includes eight targeted Workspace tests, 28 sibling
tests, TypeScript/build checks and real browser-local Essays operations. The browser
journey checks explicit replacement, unchanged saved workspace before Save,
exact/edited saves, reload, source navigation, occupied-handoff protection,
stale-tab protection, dismissal, mobile reflow and a passing handoff axe scan.
Native journal bytes and the three remaining fixture launches are unchanged.

Local candidate: http://127.0.0.1:4187/#/apps/orchestrator/runs .
Rollback assets: ~/.local/share/are-workspace/dashboard-01/frontend-before-t5a .
T5A performed no actual task launch, paid model call, ledger acceptance or VPS action.
T5E later executed three isolated fixtures, recorded in its separate evidence.

## Open Questions

[T5B](T5B-SOURCE-CONTEXT.md) binds declared source coordinates and selected text
to the native task digest without changing native schema or history ownership.
[T5C](T5C-SOURCE-ENTRY.md) selects one Chat message or project description
with explicit composer replacement and source return navigation.
[T5D](T5D-KNOWLEDGE-CONTEXT.md) adds source-reference inspection and explicit
concept context without granting effects. [T5E](T5E-ACCEPTANCE.md) passes the integrated local fixture journey; live Tauri
and whole Workspace acceptance remain T7.

Multiple persisted handoffs, discoverable historical output relationships after
dismissal and synchronization across devices remain future work. Local browser
records do not provide authenticated cross-runtime provenance.

The standard Workspace build retains catalog snapshot drift; the bounded
candidate build uses existing bundled snapshots. T7 still owns full product
acceptance, and [UX6](UX6-ACCEPTANCE.md#open-questions) retains its manual gaps.
