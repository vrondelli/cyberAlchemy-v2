# Desktop canvas: keyboard-accessibility research addendum

Date: 2026-09-06. Status: candidate research and test-plan amendment.
Route: CA2-ROUTE-RESEARCH. Authority effect: none.
Parent: conversation's desktop-canvas draft DAG, nodes 00–23; that DAG is not a registered executable work pack.
Scope: Linux desktop, fitted/free/guided variants. Mobile deferred.
No worker dispatched, implementation changed, browser test run, or ontology admission claimed.

## Evidence cards

- S1 — [W3C APG keyboard interface](https://www.w3.org/WAI/ARIA/apg/practices/keyboard-interface/): Tab navigates components; arrows navigate appropriate composite widgets. Shortcuts supplement discoverable keyboard access; avoid host and assistive-technology conflicts. Informative guidance, not a conformance certificate.
- S2 — [W3C APG window splitter](https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/): focusable separator, directional resize and exposed size values. The page explicitly notes unfinished pattern review/example work; use as a candidate pattern requiring testing, not a proven implementation.
- S3 — [Mozilla shortcuts](https://support.mozilla.org/en-US/kb/keyboard-shortcuts-perform-firefox-tasks-quickly): Alt+Left/Right already serve browser navigation. Native versus browser behavior needs explicit separation.
- S4 — [VS Code accessibility](https://code.visualstudio.com/docs/configure/accessibility/accessibility): F6/Shift+F6 region navigation, configurable shortcuts, and an explicit way to make Tab leave editors. Product precedent, not a requirement to copy all bindings.
- S5 — [WCAG character shortcuts](https://www.w3.org/WAI/WCAG22/Understanding/character-key-shortcuts.html): character-only shortcuts need an off/remap/focus-scoped mechanism. Preserve typing, dictation and composition.
- S6 — [WCAG focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html): author content must not entirely hide the focused control. Our proposed fully-visible-focus rule is intentionally stronger than that minimum.
- S7 — [WCAG dragging movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html): non-drag single-pointer alternatives are distinct from keyboard access; supply both.
- S8 — [WCAG on focus](https://www.w3.org/WAI/WCAG22/Understanding/on-focus.html): focus alone must not trigger a change of context. Do not equate every visual resize with a standards failure; evaluate its actual focus/context effects.

Sources retrieved online this turn. Claims above are paraphrases; proposed product choices below are hypotheses.

## Hypothesis K-H1

A discoverable, consistent keyboard model lets a user complete the same desktop scenarios without a pointer, without losing focus, artifact identity or unsent chat text. Navigation effort and preference require observation; no automated universal usability score.

Use the same keyboard contract in A/B/C to avoid confounding canvas layout with shortcut availability. A later within-variant comparison may test shortcut assistance versus ordinary keyboard controls; never remove basic keyboard access as a control condition.

## Candidate commands

| Action | Candidate interaction | Boundary |
| --- | --- | --- |
| Traverse controls | Tab / Shift+Tab | No global Tab-to-expand interception; logical stable reading order, no positive tabindex |
| Expand chat | Reach labelled Expand chat button; Enter/Space | Preserve draft, caret and prior size; expose expanded state; optional remappable accelerator after conflict audit |
| Resize chat | Tab to labelled horizontal separator, Up/Down; Home/End for allowed bounds | Expose current/min/max size; do not obscure active controls; visible resize buttons also work without dragging |
| Change region | F6 / Shift+F6 in native host, if conflict testing passes | Chat, canvas navigator, active capability, worker region; visible equivalent commands; preserve browser chrome navigation in web host |
| Visit history | Alt+Left / Alt+Right in native host, if available | Back/Forward commands always visible; in web host integrate with actual router history or leave browser shortcut untouched |
| Add/find capability | Searchable command palette; candidate Ctrl+Shift+P in native host | Binding not globally enabled until browser/desktop conflicts checked; searchable visible menu remains usable |
| Navigate loaded views | Keyboard-accessible named element navigator | Lists offscreen elements; activation reveals/focuses a view without duplicating runtime; do not apply grid semantics to arbitrary document content |
| Move/resize a view | Context menu then explicit Move or Resize mode; arrows, Enter commit, Escape cancel | No arrow interception inside editors; named numeric position/size controls provide another path |
| Open element actions | Shift+F10 on focused view handle | Standard context-menu behavior; all commands remain reachable without shortcut |
| Fit all / focus / return | Visible commands and palette entries | Shortcut selection deferred; do not steal browser zoom keys |
| Undo layout | Ctrl+Z only in layout context | Editor undo stays editor undo; separate labelled Undo layout command |
| Exit transient UI | Escape handles innermost popup or move/resize operation | Restore opener focus; never cancel a running worker, clear a draft or approve an effect |

History tracks explicit capability visits, not Tab stops, incoming worker updates or every pan. A history entry binds view/artifact identity, viewport and restoration target. A new visit after Back truncates the forward branch. Missing targets show an explicit unavailable state; history restoration never launches a runtime. Resolve dirty-editor navigation policy before implementation.

Command dispatch precedence: focused widget/composition handling -> innermost transient mode -> scoped capability commands -> eligible shell command. Respect already-handled events. Do not intercept IME/AltGraph input, text editing, browser/OS-reserved commands or key repeats for destructive actions. Collision detection and remapping must not make a function unreachable.

## DAG insertion and bounded Luna roles

K00 depends on 00/01: source/conflict researcher creates keyboard sources, command candidates and Linux/browser conflict matrix. Current addendum supplies initial research; host conflict measurements remain pending.
K01 depends on K00: parent freezes focus, history, chat-size and shortcut contracts; feeds parent nodes 02, 03 and 05 before dispatch sheet freezing.
K02 depends on K01/06: harness owner creates known-good, known-bad and false-positive keyboard fixtures before reusable gate promotion.
K03a depends on K01/08/09: Luna focus implementer adds named-region navigation and focus restoration.
K03b depends on K03a: Luna chat implementer adds explicit expansion and keyboard resizing as separate units.
K03c depends on K03a/13: Luna navigation implementer adds identity-bound visit history.
K03d depends on K03a/12: Luna canvas implementer adds separate keyboard move and resize modes.
K03e depends on K03a: Luna command implementer adds discovery/remapping with host scoping.
K04 depends on K02 and all K03 units and variants 10A/14B/14C: independent keyboard reviewer runs functional/browser checks; joins parent node 15. Reviewer writes evidence only, not implementation.
K05 depends on K04: original owner gets at most one explicitly bounded repair per affected variant, sharing parent node 16's repair allowance rather than adding another loop.
K06 depends on K05/17: Linux/Tauri keyboard-only and Orca manual checks plus comparative desktop tasks; joins nodes 18/19.
K07 depends on K06: parent synthesizes candidate research records and differential evidence; joins node 20. No acceptance by status editing.

No fan-out sheet, tension verdict, confirmation or registration is asserted. K03 units sharing files execute sequentially. Parent owns route selection, exact scopes, evidence joins and claims. The researcher/reviewer are proposed roles, not invented live agent identities.

## Luna handoff requirements

One unit per handoff: exact source and fixture hashes, allowed files, forbidden scope, dependencies, command preconditions, focus before/after, expected state transition, failure behavior and verification commands. Worker receipts include task/model/thread/turn IDs, artifact hashes, test commands/results, unsupported hosts, findings and repair ancestry. Do not change benchmark budgets or declare general accessibility conformance.

Proposed output scopes for later exact binding: keyboard/contracts/, keyboard/fixtures/, keyboard/implementation/, keyboard/reviews/, keyboard/evidence/ under the isolated desktop-canvas experiment. These are planned scopes, not authorized writes from this research turn. Canonical research ontology IDs/selectors and the current keyboard source modules must be resolved before their consuming implementation handoffs.

## Test plan

1. Tab/Shift+Tab reaches every required operation, escapes each nonmodal region and never unexpectedly expands chat. Test reverse traversal and focus restored after removal.
2. Expand/resize/collapse chat retains draft and caret; focus remains visible at 1280x800, 1440x900 and 1920x1080, including browser zoom. No offscreen trap.
3. Visit Essay -> Ontology -> Worker; Back twice and Forward once restores correct identities and focus. Test new branch, missing view, empty history and unsaved edits.
4. Find an offscreen view without panning by pointer; reveal it, move/resize through controls, cancel, commit and undo. Text cursor arrows must never move a canvas object.
5. Open/close palette and context menu; Escape restores opener. Overlay priority is deterministic. Key repetition never triggers repeated effects.
6. Type with IME, AltGraph and a non-US layout; preserve text-editing shortcuts and composition. Remap and disable optional shortcuts; reject collisions and offer reset.
7. Live worker updates do not steal focus or reorder navigation. Announce meaningful status transitions politely, not every streamed token.
8. Verify real Firefox, Chromium and Linux Tauri host behavior separately. Synthetic DOM events cannot prove OS/browser shortcut delivery. Test Orca manually and record unavailable combinations as not_evaluable.
9. Include accessibility names/roles/states, focus screenshots, keyboard traces, console/network evidence and exact candidate IDs. Automated scans do not establish full accessibility.

Fixture classes: good (ordinary traversal, scoped commands, restored focus); bad (Tab hijack, trap, obscured focus, lost draft, global arrows, fake history); false-positive (modal containment with working escape, legitimate editor indentation with documented exit, arrows within an actual tree).

Hard-gate candidates: deterministic loss/trap/incorrect transition and selected standards-backed failures, calibrated against fixtures. Screenshot review: focus visibility/occlusion. Human study: effort, discoverability, disorientation and preference. Manual assistive-technology evidence: announcement usefulness and actual command interoperability. All currently untested.

## Frontier and residue

Product construction frontier: freeze K01 and add it to the desktop contract before variant implementation. Keyboard access is shared foundational behavior, not end-of-project polish. Existing budgets unchanged; mobile remains deferred.
Operational support: parent owns Linux/Orca/browser availability and host shortcut inventory; unavailable combinations block only their evidence claims. Publication and unrelated setup do not block contract work. No new operational effect is authorized.
Ontology proposal: link candidate Hypothesis -> KeyboardCommand -> FocusTransition -> Scenario -> Run -> Observation -> Finding. No canonical ontology records changed; registered IDs and source-selector binding remain prerequisites for later projection.

UX evidence skill result: research/spec candidate, not tested; browser evidence and fixture calibration not run; next step is contract freeze and fixture implementation under separately bounded execution.
