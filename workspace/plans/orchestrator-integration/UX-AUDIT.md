# Orchestrator accessibility, UX and UI audit

2026-09-08 · private construction candidate · authority effect: none.

**Keep the existing orchestrator frontend and its Workspace host. Change the
presentation according to the data, then repair readability, semantics and
recovery before adding more UI.** The one-step graph correction is implemented.
The wider findings below are recommendations with explicit acceptance criteria.

## Scope and method

Priority paths: Dashboard → run → Overview → Result; Runs → search/filter → run;
New run → task editor → failed review → retry; Operations; Lab; Ontologies.
The audit inspected the actual local Workspace at port 4187 and the sibling
frontend that it embeds. Two existing completed fixture tasks were observed.
No installed task was launched or cancelled; three fixture launches remain.

Browser: Chromium 153.0.8010.12 through Playwright. Layout samples: 1440, 720,
390 and 320 CSS pixels wide, 1000 high. Inspected desktop/mobile screenshots,
computed typography and bounds, keyboard tabs, route focus, a mocked review
failure, reduced motion and a forced-colors focus sample. Narrow widths are
reflow probes, **not proof of actual browser zoom at 200%/400%**.

axe-core 4.13.0 scanned six sections and all seven run tabs with WCAG A/AA tags.
Only the audit browser bypassed CSP to inject axe; application CSP was unchanged.
The review failure was fulfilled by the browser, not sent to the runtime.
Automated findings were checked against rendered elements/source. Counts repeat
shared elements across views; they are not a total of unique defects. Incomplete
checks remain unresolved, particularly the ontology canvas.

[Tastecheck](https://github.com/KyaniteLabs/tastecheck) was used as a reference:
[a11y-pass](https://github.com/KyaniteLabs/tastecheck/blob/main/skills/a11y-pass/SKILL.md),
[data-viz](https://github.com/KyaniteLabs/tastecheck/blob/main/skills/data-viz/SKILL.md),
and [improve-existing-website](https://github.com/KyaniteLabs/tastecheck/blob/main/skills/improve-existing-website/SKILL.md).
The method informs this audit; it is not repository authority or certification.
No plugin, production dependency or upstream script was installed in the project.

Evidence: [before measurements](ux-evidence/before.json),
[after measurements](ux-evidence/after.json),
[accessibility scan and recovery](ux-evidence/accessibility.json),
[additional bounds/focus measurements](ux-evidence/details.json),
[graph browser check](ux-evidence/graph-test.json).
Local reproduction harnesses are alongside those files; axe is installed only
under /tmp/orchestrator-ux and Playwright uses the existing browser-test toolchain.
They document a local environment, not a portable CI setup.

## Implemented: graph only when topology warrants it

| Recorded strategy | Presentation |
| --- | --- |
| Missing or empty nodes | Explicit strategy-unavailable state |
| One node, no dependencies | Compact execution step |
| Multiple nodes with no declared dependencies | Independent step list |
| Multiple nodes with a matching declared dependency | Existing graph and dependency list |

The graph predicate considers declared nodes and edges, never worker observations
or max_parallelism alone. One worker can execute a multi-step DAG; such a run still
has graph structure. Multiple independent workers do not require a dependency
canvas. The predicate is presentation logic; source validation remains upstream.

Overview remains the first/default tab. Both Overview and Strategy use the same
recorded strategy and presentation rule. The compact summary exposes role,
status, node identity and attempt limit, with no invented persona. A six-node
branch/join fixture still renders the graph, supports keyboard selection, and
provides all six nodes in the narrow-screen dependency list.

At 1440px the old graph/inspector/list region occupied **452px**. The replacement
step list occupies **99px**. These are the visualization regions, not whole-page
height or a performance claim. Compare [before](ux-evidence/before-desktop.png)
and [after](ux-evidence/after-desktop.png); see
[mobile](ux-evidence/after-mobile.png) and [multi-node graph](ux-evidence/multi-graph.png).

Source:
[sibling App.tsx](../../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/frontend/src/App.tsx),
[domain.ts](../../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/frontend/src/domain.ts),
[styles.css](../../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/frontend/src/styles.css),
[presentation tests](../../../../cya-orquestrator/cyberAlchemy-v2/work-orchestration-implementation/frontend/src/strategy-presentation.test.tsx).
No second renderer or Workspace-specific fork was introduced.

## Prioritized repair ledger

P1 means the next accessibility/usability repair batch; P2 means a subsequent
product refinement. “Confirmed” describes evidence, not full WCAG conformance
assessment. No task-blocking P0 was established within these tests.

| ID / priority | Observation and evidence | Recommended repair and acceptance |
| --- | --- | --- |
| A1 / P1, confirmed | Run filters have 3.95:1 contrast; muted text on the page background is 4.31:1. axe reports contrast failures in Runs, details, Operations, Lab and Ontologies. | Adjust shared muted/filter tokens and recheck every background/state. Normal text must meet 4.5:1. Do not merely enlarge a few labels to mask the color problem. |
| A2 / P1, confirmed usability concern | Original run tabs/metadata use roughly 8–10px type; the baseline overview had 43 visible leaf text elements below 12px. Lab had 104. New compact step text is 12–16px. | Establish a readable scale: proposed 16px body, 14px controls, 12–14px supporting metadata; use rem. Preserve serif headings and existing palette. Tiny size alone is not a WCAG failure. Verify text resize, long titles and all states. |
| A3 / P1, confirmed semantics | Runs list contains a direct role=status child; nine Lab role=row elements contain role=tooltip children. Workspace brand div has aria-label without a supported role. | Use native list/table structures where possible; place status outside the list and tooltip content in a cell or outside the row. Give brand an appropriate image role or make it decorative. Re-run axe and inspect accessibility trees. |
| A4 / P1, confirmed recovery | Keyboard activation of Review task followed by mocked 503 retains input and produces an alert, but focus ends on the document body. Message is “Error: runtime_unavailable”. | Keep/restore a purposeful focus target after busy state; translate transport codes into an explanation and retry action. Associate field errors with inputs. Verify failed review, expiry, offline launch and retry without losing text or submitting twice. |
| A5 / P1, confirmed navigation behavior | Embedded Runs navigation changes the content but leaves focus on the navigation link. The standalone app has an announcement mechanism that EmbeddedConsole does not carry over. | Define one host/frontend focus contract, including a reachable content start and route announcement. Do not move focus on background polling or tab selection. Test Dashboard → run and back with keyboard and a real screen reader. |
| A6 / P1, confirmed clipping | At 320px the run hero is 288px wide but scrollWidth is 385px; breadcrumb extends to x=400.875. Root overflow checks pass because content is clipped. | Allow flex children to shrink and wrap, abbreviate IDs with an accessible copy/details action, and make the runtime notice fit. Test element bounds as well as document overflow, actual 200%/400% zoom, and bottom-rail obstruction. |
| U1 / P1, confirmed information design | Overview prints the complete identity dictionary after repeating progress; “Inspect the recorded result” is plain text. The graph fix makes this more obvious. | Lead with task intent, outcome/result action, concise execution structure and attention. Move exact IDs/digests into Evidence or collapsed “Technical details”; retain copy access and provenance. Verify that a user can find the result without reading IDs. |
| U2 / P2, confirmed vocabulary drift | One successful run appears as Completed, Succeeded and closed; Runs filters say Closed while Dashboard says Completed. | Define user-facing labels from execution state. Keep execution, acceptance and promotion distinct; cancellation must not imply success. Test the same state matrix across cards, rows, metrics and result views. |
| U3 / P2, confirmed capability mismatch | Seven tabs are always present; native Workers, Trace and Lifecycle have unavailable/empty explanations. Planned text-worker node exists while observed worker records are absent. | Expose capability availability beside tab labels and explain “not reported” versus “none”. Keep Overview first. Do not infer worker leases or event traces from strategy nodes. Consider progressive disclosure for specialist tabs after product review. |
| U4 / P2, inferred discoverability risk | Workspace has Ontology; embedded navigation has Ontologies. Lab mixes static reference personas/concepts with current research runs, although explanatory text distinguishes them. | Use explicit scopes such as Workspace ontology and Research knowledge. Keep reference catalog provenance visible and link shared records through stable origins when T5 lands. Avoid merging records just because labels match. |
| A7 / P2, measured concern | Ontology search input is 12px high; narrow graph nodes/edges include targets smaller than 24px after fit-to-view. | Review actual target/label hit areas and spacing exceptions, rather than declaring every small target a violation. Prefer 44px primary touch controls and accessible list/search alternatives. Complete canvas keyboard, pan/zoom and text-equivalence testing. |
| U5 / P2, source-confirmed concern | Review expiry is checked against Date.now during render; errors are raw strings. New-run inputs default to the same fixture title, and both actual runs share it. | Add visible expiry/review-again feedback, meaningful disabled reasons and per-run date/short identity in the list. Show fixture intent before launch. Browser tests should cover expiry with a controlled clock. |
| U6 / P2, source-confirmed performance concern | Embedded orchestrator bundle is about 423kB before compression and imports the persona portrait asset; asset output includes a roughly 3.22MB image. | Measure cold route loading, then lazy-load Lab/Ontology code and portraits if beneficial. Do not infer actual download cost from output size alone. Avoid introducing another poller or rendering framework. |

Contrast acceptance follows [W3C contrast guidance](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html).
Target-size evaluation includes the spacing and other exceptions in
[W3C target-size guidance](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

A1–A7/U1–U6 are not silently fixed by the graph change.

## What to preserve

The cream/dark/lime identity, serif display headings, established icon system and
original orchestrator components remain recognizable. Existing strengths include
Overview default/reload behavior, arrow/Home/End tab handling, graph/list parity,
labeled task fields, alert semantics, explicit fixture messaging, shared
Dashboard/run identity, verified results, and offline retention.

The architectural boundary is sound for continued migration:
[FrontendHost](../../runtime/src/frontends/FrontendHost.tsx) owns mounting and CSS
isolation; [the adapter](../../runtime/src/frontends/orchestrator-projection.ts)
translates shared data; the sibling package owns product rendering. Reuse design
tokens through the host contract if needed, while keeping component fixes in the
sibling. Shadow DOM is CSS isolation, not a security boundary. Focus, announcements
and accessibility require an explicit contract across that boundary.

The native editor has no additional axe violation beyond the shared brand in the
sampled initial state. This is not evidence that review/launch/recovery is fully
accessible. Forced-colors Overview focus remained visible with a 3px outline;
reduced-motion graph transitions reduced to 0.00001s. Those are narrow checks.

## Recommended DAG and delivery sequence

[UX-DAG.json](UX-DAG.json) is a candidate refinement track linked to the existing
[DAG](DAG.json), not an admitted execution plan.

1. UX1 — conditional strategy presentation: complete.
2. UX2 — contrast, typography and native semantics: next runnable repair.
3. UX3 — route focus, announcements and review recovery: runnable independently.
4. UX4 — Overview hierarchy, state vocabulary and capability disclosure: after UX1.
5. UX5 — reflow, target sizing and canvas alternatives: after UX2 and UX4.
6. UX6 — acceptance matrix and assistive-technology verification: after UX3 and UX5;
   feed results into existing T7 Workspace acceptance.

Use one representative run/list/editor path to prove shared tokens before applying
them broadly. No second frontend migration is needed. T5 origins and T6 scheduler
integration remain separate work; VPS activation and MCP do not block these UI fixes.
MCP remains last. D65 construction, product review and operational activation remain
distinct as specified by the parent plan. Deferred VPS/operator work retains its
owners and gates in DAG.json; this audit grants no release or deployment authority.

## Verification and limits

Twenty sibling tests passed, including five new topology/presentation cases.
Sibling TypeScript and Vite build passed; Workspace TypeScript and the bounded
candidate build passed. The full embedded browser test passed on existing history,
including first/default Overview, compact step in both tabs, verified result,
navigation/search/filter, mobile CSS isolation, offline recovery and unchanged
task journal/budget. A separate explicit six-node fixture proved graph selection,
keyboard node selection and mobile dependency-list preservation.

The installed loopback frontend was refreshed, with frontend-before-ux-graph as its
backup. Standard Workspace snapshot validation remains blocked by the previously
recorded catalog drift; the bounded build uses existing bundled reference snapshots.
This audit does not claim that the standard build or WCAG conformance passes.

No real screen-reader session, actual 200%/400% browser zoom, Safari/Firefox,
touch-device session, user study or timed performance profile was performed.
The initial editor's simulated failure is current evidence; real launch/cancel,
expiry, budget exhaustion and runtime uncertainty rely on previous T4 evidence
until the proposed broader accessibility tests exercise them safely in isolation.

## Open Questions

- Which screen-reader/browser combinations should define acceptance?
- Should Overview include a short result preview or just a prominent Result action?
- Keep unavailable specialist tabs visible with explanations, or group them under Details?
- Confirm the proposed readable type scale and knowledge-scope labels before broad visual propagation.
- How should new shared frontend registrations declare focus, loading and announcement behavior?
- Remaining product/runtime and operational questions remain owned by PLAN.md and DAG.json.

## UX2 resolution — 2026-09-08

A1–A3 are addressed by [UX2-READABILITY.md](UX2-READABILITY.md), including shared readable type, contrast and semantic structures. The new scan reports zero automated violations across the sampled sections/tabs; incomplete canvas checks remain. A6 breadcrumb/notice wrapping improved as part of accommodating larger text, but full zoom/reflow acceptance remains UX5. Original measurements above are retained as the baseline. UX3 focus/recovery and UX4 information hierarchy remain pending.

## UX3 resolution — 2026-09-08

A4/A5 and U5 review recovery are addressed by [UX3-FOCUS-RECOVERY.md](UX3-FOCUS-RECOVERY.md). Browser checks measure route and control focus, associated errors, progress/expiry semantics, stale-response guards, offline draft retention and uncertain-launch handling. Actual screen-reader verification remains UX6; duplicate default titles and information hierarchy remain UX4.
