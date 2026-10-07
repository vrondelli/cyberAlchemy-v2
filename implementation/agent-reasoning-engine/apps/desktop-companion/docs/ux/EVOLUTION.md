# Evolution UX brief

Status: candidate design. Question: **Is ARE improving, and what changed?**
This page concerns the research Evolution Engine, not per-thread Reasoning
State evolution shown in Threads.

## User journey

1. Open Evolution. First see whether an evolution runtime is configured and
   whether its cycle definitions are admitted/enabled.
2. If cycles exist, choose an objective and see its cycle stage, evidence,
   latest verified outcome, and any owner decision still required.
3. Open one cycle as a compact progression: observation → hypothesis/work →
   comparison → decision. Follow exact evidence only when needed.
4. Return to the objective summary knowing what was observed, tested,
   recommended, admitted, or activated—without those verbs being conflated.

## Minimum effective screen

- One top-line posture: “Research candidate; cycles not enabled,” “observing
  configured cycles,” or an exact unavailable state.
- Objective list with one meaningful outcome per row, not a wall of counters.
- Cycle detail with stage, evidence status, negative/inconclusive outcomes, and
  claim ceiling. Show a linked thread only when provenance explicitly binds it.
- No run, admit, activate, rollback, or arbitrary command button.

The [cycle registry](../../../../packages/evolution-runtime/registry/cycle-definitions.v1.json)
currently lists five candidate definitions with `admitted: false` and
`enabled: false`. The optional [MCP adapter](../../../../packages/are-mcp-server/README.md)
offers read-only `evolution_status`; Companion does not currently use it.
Runtime presence alone must not be displayed as an active learning process.
For an explicit root with a verified ledger, the Companion now reads the
disposable operational-index digest separately. It labels a matching index,
an index that requires rebuilding, or one that cannot be safely read, while
keeping durable-ledger verification as its own claim. The index read uses an
immutable read-only SQLite connection only when no uncheckpointed WAL is
present; it never invokes recovery. Registry-only and unverified-ledger states
show no index posture. If the reading expires, a previously shown posture is
explicitly last seen, not current. The Evidence page qualifies its verified
ledger explanation with the index posture without turning it into an aggregate
health claim. The live configured root returned 33 verified commits and five
cycles with `rebuild-required` on 2026-10-04; this is a diagnostic, not a
recovery authorization or proof of an executing worker.
In the narrow Evolution view the index posture is a collapsed disclosure above
the first recorded cycle. Expanding it reveals the ledger/worker and recovery
qualifications; the compact default keeps the first cycle's summary visible
without suppressing an index warning. This is a read-only presentation change;
the [extracted Linux native check](../EVOLUTION-INDEX-DISCLOSURE-NATIVE-2026-10-04.md)
covers matching, rebuild-required, and registry-only states at 340 × 740.
The bounded phase rows now emphasize the most consequential recorded work
state in each phase: blocked, then ready, leased, planned, or completed.
The underlying five counts remain visible, so this visual cue cannot hide a
mixed phase. A lease is expressly described as a recorded claim with unknown
worker status. The cue is derived from the verified ledger projection only;
it is not a live progress indicator, and retained rows stay behind the dated
historical warning when an observation expires. Historical rows also lose
their fresh-state accent, while retaining the recorded counts and labels.
The current Companion can read the bundled candidate-definition registry
without a configured runtime root. That registry-only posture shows the five
candidate definitions while cycle and commit counts remain unavailable; it
does not probe or create storage, infer a worker, or enable a definition.
For a verified configured ledger, the coordination section also shows up to
eight admitted phases in canonical order, with per-phase planned, ready,
leased, completed, and blocked work counts plus the number of recorded phase
events. A phase links to a cycle only when that cycle is already inside the
bounded visible cycle projection; task IDs, worker IDs, plan text, and lease
payloads remain hidden. An omitted-phase marker is explicit. These are
ledger-derived states, never proof that a leased worker is alive now.
At narrow desktop widths, the verified coordination rows stack their labels
above the details so short labels and phase names remain readable. The
[native layout evidence](../EVOLUTION-PHASE-ROW-LAYOUT-2026-10-03.md) separates
the earlier Windows phase-data pass from the repaired Linux and Windows
extracted-package layout checks; installed lifecycle is still open.
When an explicit local root is configured, Companion can separately read a
bounded verified durable-ledger projection without writing to that root. An extracted Windows
UI probe showed one fixture cycle and one commit alongside five disabled
candidate definitions. Its derived “active” cycle disposition is recorded
evidence, not proof of a currently executing worker. Objective drill-down and
full cycle chronology in the journey above remain design work. The read-only
observer now projects at most eight recent verified event types per cycle,
with the total event count and an omission marker. Companion renders these as
an expandable progression beside the derived disposition. No event payload,
objective text, artifact path, or worker-liveness claim crosses this
projection; richer evidence and objective drill-down still need a separate
privacy and source-binding decision.

A later [staged Windows package probe](../WINDOWS-SQLITE-EVOLUTION-TEST-2026-09-27.md)
passed the same bounded view from a ledger created directly on Windows. It did
not install the package or prove a live Evolution worker. Its first UI run
timed out on the independent product diagnostic; the isolated rerun passed.
The later dashboard retries only that timeout once while retaining a
non-current Reading posture; its rebuilt staged Windows UI again showed the
native-created ledger. A separate isolated 36-check Windows WebView2 journey
forced the first native diagnostic to time out and verified that the dashboard
remained Reading until exactly one retry recovered. The original cold-start
cause and budget remain open.

The page also has an independent gateway Improvement Signal candidate view.
When `ARE_COMPANION_EVOLUTION_SIGNAL_LOG` names an absolute private inbox, a
bounded observer verifies its checkpointed Reasoning State log and shows only
the candidate count, signal kind and abbreviated digest. It does not read the
cycle root or turn a signal into a cycle. When the inbox is absent, invalid or
unconfigured, that view shows its own status without hiding cycle evidence.
The gateway and Companion must be configured with the same private log path;
operator custody and retention remain open before live use.
Cycle-ledger and gateway-candidate observations have independent freshness.
An expired read is marked stale and ceases to supply current counts or a
current list; opening the page or using Refresh performs a bounded new read.
The [last-seen UI follow-up](../EVOLUTION-LAST-SEEN-UI-2026-09-28.md) keeps a
previously verified bounded ledger projection inspectable after expiry or an
unavailable read, with a dated historical warning before its counts and events.
It hides incompatible or never-verified projections and does not infer a live
worker from retained evidence.

The [2026-10-01 evidence-priority check](../EVOLUTION-EVIDENCE-PRIORITY-2026-10-01.md)
puts a recorded cycle before the candidate registry only when a verified
ledger has cycles; registry-only views remain definition-first. The current
source and extracted Windows package passed both orders, and the cycle row
qualifies `active` as a recorded disposition rather than worker liveness.
The current UI also offers a compact **recorded-definition filter** when the
bounded verified cycle projection contains more than one definition. Selection
filters only the rows already read by Companion; it does not query the full
ledger, imply an objective binding, or infer a live worker. The selected
definition survives a fresh read and remains inspectable under the explicit
historical warning after source loss. It resets when the new verified
projection no longer contains that definition. A Chromium browser journey
covers those transitions; native WebView and screen-reader checks remain open.
The current-source cycle detail now stays open, with keyboard focus on its
summary, across a verified refresh of the same cycle revision and projected
event content. An amended or missing record starts closed and moves focus to
the Evolution heading if the old summary was focused. The evidence-first card
reorder no longer moves already ordered DOM nodes, which had blurred focus
despite preserving the open state. The 60-test dashboard suite and isolated
Chromium journey pass these cases. A failed read still leaves prior verified
events visibly historical; these checks do not prove native accessibility or
an executing worker.
The collapsed cycle summary now names the latest verified event type alongside
the recorded disposition and count. This is a deterministic presentation check
over the existing bounded observer field, not a claim that a worker is running
or that the event is a user-facing improvement. The source fixture checks the
initial and amended event types; a rendered Chromium fixture also checks the
collapsed summary at 320 and 340 px without horizontal overflow. Native
layout and human comprehension remain review items.
An opt-in two-definition durable fixture later exercised this existing filter
and detail behavior in the retained [native Windows WebView2 candidate](../WINDOWS-NAVCLEAN-GATEWAY-2026-10-03.md):
selection reduced two verified cycles to one and survived a verified refresh
alongside the expanded detail and keyboard focus. The one-definition native
journey still passes. This is native DOM/keyboard evidence, not a human
screen-reader traversal or worker-liveness proof.
The matching [native Linux WebKitGTK check](../LINUX-EVOLUTION-FILTER-NATIVE-2026-10-03.md)
now passes the same two-definition selection and verified-refresh continuity
at an actual 340 × 740 dashboard window in an extracted, uninstalled package.
It also keeps the cycle-first narrow reading order. This closes development
renderer parity for that interaction, not physical or assistive-technology
acceptance.

The definition list now gives each of the five known cycle kinds a short
purpose explanation beside its source-owned admission and enablement status,
with the exact registry reference kept visible. An unknown future kind shows
its reference and an explicit explanation gap rather than a guessed purpose.
This makes the registry-only page useful without suggesting that a candidate
is running. The source unit suite, fixture-backed Chromium journey, and
[new staged Windows registry-only and verified-cycle journeys](../EVOLUTION-DEFINITION-CLARITY-2026-10-02.md)
pass. The installer remains uninstalled, and screen-reader checks remain open.
The subsequent [registry-only first-view slice](../EVOLUTION-REGISTRY-FIRST-VIEW-2026-10-02.md)
hides unavailable ledger metric cards in favor of one compact explanation,
moving the definition list up. Verified ledgers retain the metrics. Source and
Chromium fixture tests pass. A newer staged Windows build also passes the
registry-only and verified-ledger WebView2 journeys; its unsigned installer
remains uninstalled. An extracted, unsigned Linux package passes WebKitGTK
registry-only and verified-ledger DOM checks without installation. Linux
pixel/physical-pointer, narrow-window, and screen-reader checks remain open.
The [semantic-navigation follow-up](../EVOLUTION-SEMANTIC-NAVIGATION-2026-10-02.md)
exposes the source registry, recorded cycles, coordination and gateway
candidate inbox as level-two headings, with each definition as a level-three
heading. Edge accessibility-role queries and staged native WebView2 DOM checks
pass in both registry-only and verified-ledger orders at 340 px. A human
screen-reader traversal remains open. The subsequent
[native narrow Linux check](../LINUX-NARROW-EVOLUTION-2026-10-02.md) lowers the
real dashboard minimum width to 320 px and verifies both source states at an
actual 340 × 740 WebKitGTK/X11 window, including native pixels. It does not
establish the same actual-width behavior in the earlier Windows candidate.
The [later Windows actual-window check](../WINDOWS-ACTUAL-NARROW-EVOLUTION-2026-10-02.md)
rebuilt this source and verified the native minimum tracking width, actual
340 × 740 WebView2 viewport, and both first-view Evolution states; the prior
build failed the new tracking-width guard. Matching X11 minimum-size hints
also pass in the extracted Linux package. Manual pointer and screen-reader
traversal remain untested.

## State contract

| State | User-facing meaning |
| --- | --- |
| Observed | Name the configured source without exposing its filesystem path, latest read, admission posture, and exact cycle outcome. |
| No records | A configured readable runtime has no cycles in this scope. |
| Stale | Keep prior results visibly dated; do not claim ongoing progress. |
| Registry only | Bundled candidate definitions are visible; no runtime root, cycle ledger, or worker state was observed. |
| Not configured | The bundled registry could not be read or the selected runtime-root connection is not configured on an older package. |
| Disabled/candidate | The feature exists but is not admitted/enabled; this is not a runtime error. |
| Unavailable | Read or verification failed; link to safe diagnostics. |

## Experience checks

- Readers can distinguish a supported hypothesis from a deployed improvement.
- A disabled registry produces an honest, useful page rather than a fake
  progress chart or an alarming generic failure.
- Negative and inconclusive outcomes remain visible in a cycle's history.

## Open Questions

- What privacy boundary should govern future objective and evidence links?
- Which outcome vocabulary should be shared with Threads without merging the
  two kinds of evolution?
