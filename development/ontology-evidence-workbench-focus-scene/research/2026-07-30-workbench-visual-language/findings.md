# Findings — OEW workbench visual language

Dispatch: `2026-07-30-oew-workbench-visual-language`  
Run: `20260731T014120Z`  
Status: candidate research recommendation; not implemented or accepted

## Selected concept

Select a **bounded business-context home with explicit complete-current-filter graph access**.

On a fresh load, the candidate home would present one source-backed Body War context containing 3–6 named nodes, a one-sentence purpose, and labeled portals. A separate control would open:

`Overview — all {current-filter node count} nodes`

`Overview` means the complete current-filter projection, not a persona and not an unfiltered ontology. The frozen fixture expectation is 237 nodes and 231 edges, but the visible count must be derived dynamically from the current filtered graph.

This concept is the smallest recommendation that addresses the five observations:

1. **Initial all-node black box:** the current no-tour/no-focus path displays all 237 nodes and 231 edges. A bounded, reversible home supplies an orienting context while retaining an intentional complete-graph escape.
2. **Controls do not reveal their effects:** scope, persona, filters, utilities, and evidence tools are currently interleaved. Outcome-bearing labels and grouping make each proposed effect testable; false distinctions are removed.
3. **Cards lack ontology-grounded scanning cues:** `concept_role` supplies one closed, source-backed semantic key for a primary presentation icon while exact role text remains visible/programmatic. No artwork is selected by this research.
4. **Relations and direction are hard to recover:** graph edge identity, source relation identity, source predicate, presentation relation, provenance, evidence, and projected direction remain separate. A small presentation-relation style set may add redundant pattern/color cues, while exact predicate text and direction markers/text carry the recoverable meaning.
5. **Freshness language overstates what the gateway knows:** the candidate replaces checkout-oriented freshness prose with qualified prototype build/adapter provenance. It does not infer ontology validity, source authority, promotion authority, or graph freshness from unavailable commit evidence.

The executed evidence establishes only current mechanics: baseline 237/231/0, Learn alone 237/231, Start Tour 4/0/6, portal pivot 7/7/12, and Back 2/1/5. None of the candidate behavior below has been implemented or tested.

## Current control and state map

| Current control | Current purpose and effect | Exact current owner or selector | Candidate disposition; witness status |
|---|---|---|---|
| Overview | Calls `setPersona("non-technical")`; it changes persona, not graph scope | accepted archive `packages/dashboard/src/components/PersonaSelector.tsx:10-39`; `button[title="High-level architecture view"]` | Repair definition: make complete-current-filter access explicit, with a dynamic adjacent count. Changed accessible name, transition, counts, and focus are pending browser witness. |
| Learn | Selects the junior persona, exposes LearnPanel and Start Tour, but leaves 237/231 visible | `PersonaSelector.tsx:10-39`; `App.tsx:444-457`; `button[title="Full dashboard with guided learning"]` | Keep as `Learn — guided tour`; assert its persona/panel effect separately from Start Tour and graph scope. Pending witness. |
| Deep Dive | Selects the experienced, code-focused presentation | `PersonaSelector.tsx:10-39`; `button[title="Code-focused with chat"]` | Keep as `Deep Dive — code-focused view`; explicitly assert graph-scope invariance or change. Pending witness. |
| Diff OFF | Would toggle a diff overlay; disabled because the gateway serves an empty diff document | `App.tsx:545`; `DiffToggle.tsx`; `button[title="No diff data loaded"]` | Remove from the normal home or defer until diff data exists. No enabled capability may be implied. |
| All | Toggles the whole `knowledge` node-type filter | `App.tsx:592-624`; `store.ts#nodeTypeFilters`; `button[title="Hide All nodes"]` | Keep under Filter as `Knowledge nodes`; do not use it as Overview. Pending label/state/effect witness. |
| Filter | Opens node, complexity, layer, and edge filters; closes Export | `FilterPanel.tsx:6-106`; `store.ts:580-583`; `button[title="Filter graph (F)"]` | Keep in advanced tools as `Filter — narrow nodes`. Pending witness. |
| Export | Opens PNG/SVG/JSON export; closes Filter | `ExportMenu.tsx:218-276`; `store.ts:585-588`; `button[title="Export graph (E)"]` | Retain in advanced tools but defer from the learning home. Pending witness if exposed. |
| Path | Opens path-finding between graph nodes | `App.tsx:629-652,756-760`; `store.ts:590-593`; `button[title="Find path between nodes (P)"]` | Retain in advanced tools but defer from the learning home. Pending witness if exposed. |
| Theme | Opens appearance, accent, and heading-font controls | `ThemePicker.tsx:6-179`; `button[title="Change theme"]` | Keep in utilities. Its state effect, focus restoration, and semantic/count invariance remain pending witness. |
| Keyboard help | Opens shortcut help | `App.tsx:654-672,746-753`; `button[title="Show keyboard shortcuts"]` | Keep in utilities. Open/close and focus restoration remain pending witness. |
| Search | Searches name, summary, and tags; selection navigates to a node | `SearchBar.tsx:24-112`; `store.ts:533-545`; `[data-testid="search-input"]` | Keep. Exact fixture query, result count, and target transition remain pending witness. |
| Fuzzy | Selects fuzzy search | `SearchBar.tsx:113-133`; `store.ts:532-545` | Use as the implementation default rather than a prominent learning-home mode. |
| Semantic | Changes a mode flag, but currently runs the same fuzzy engine | `SearchBar.tsx:113-133`; `store.ts:540-543` | **KILL as a visible distinction** until its behavior differs and has its own evidence. |
| Freshness warning | Expands graph freshness/provenance details | `App.tsx:196-216,679-680`; `StalenessBanner.tsx:100-178` | Replace candidate copy with qualified prototype provenance only. Pending gateway and browser witness. |
| React Flow controls | Zoom, fit view, and canvas interactivity | `KnowledgeGraphView.tsx#ReactFlow.Controls` | Keep as canvas navigation; do not make them scope or semantic controls. Keyboard and focus behavior remain pending witness. |
| Info / Files | Switches sidebar content | `App.tsx:444-482` | Keep as evidence/details. State effect and focus restoration remain pending witness. |
| Start Tour | Sets tour state and enters the first bounded focus scene | `store.ts:617-630`; `knowledgeFocusScene.ts:103-185`; accepted focus patch | Keep under Learn. Current 4/0/6 result is observed; behavior after candidate changes must be re-witnessed. |

The proposed control groups are: **scope** (bounded Home, Overview), **learning/persona** (Learn, Deep Dive), **search**, **advanced graph tools** (Filter, Export, Path), **utilities** (Theme, keyboard help, React Flow controls), and **evidence/details** (Info, Files, provenance). This grouping is a candidate, not an observed interface.

## Home and provenance contracts

The bounded home must reuse `knowledgeFocusScene.ts` and the accepted focus patch rather than introduce another projection state machine. Its node IDs must be a frozen, source-backed 3–6-node Body War list. Fresh load must expose the purpose sentence and labeled portals. Overview must reverse that projection into the complete current-filter graph; it must not overload the persona transition or rely on Unfocus falling through to full mode.

The provenance row must keep six concepts distinct:

| Concept | Candidate meaning |
|---|---|
| Graph freshness | Whether a graph can be compared to a relevant source revision; unknown when that comparison is unavailable |
| Build provenance | Exact pinned upstream/build handle used for the candidate bytes |
| Adapter provenance | Exact adapter receipt/reference used to produce the projection |
| Ontology validity | A separate validation claim; not established by the banner |
| Source authority effect | A source-relation property; not inferred from projection output |
| Projection authority effect | The adapter/projection’s qualified authority effect, expected to be displayed with the full field name |
| Promotion authority | A lifecycle decision outside this candidate |

The candidate witness is `[data-testid="prototype-provenance"]`: exactly one element containing pinned build and adapter references plus qualified `projection_authority_effect`, with no checkout-freshness or ontology-validity assertion. The existing gateway/banner owners are `scripts/serve-oew-prototype.mjs#/staleness.json`, `App.tsx:196-216`, and `StalenessBanner.tsx:33-39,100-178`. Final payload and copy are pending. Suppressing the old warning is permitted only when this adjacent provenance remains visible.

## Card icon contract

`concept_role` is the sole primary icon semantic key. Current fixture counts are 135 authority, 32 evidence, 44 workflow, and 26 projection nodes. `business_kind` remains an exact visible text chip; candidate status, authority, lifecycle, and confidence must not be folded into the primary icon.

| Exact `concept_role` value | Semantic contract | Presentation-token contract before implementation |
|---|---|---|
| `authority` | Identifies an authority-role concept; does **not** mean ownership, validity, promotion, or UI authority | Existing `CustomNode.tsx` presentation owner must choose a stable token name and artwork. Record exact visual description, accessible label containing the role, visible text fallback, and forced-color behavior. |
| `evidence` | Identifies an evidence-role concept; does not assert evidence sufficiency or confidence | Same required fields; no document artwork is assumed by this finding. |
| `workflow` | Identifies a workflow-role concept; does not assert executable or completed status | Same required fields; no process artwork is assumed by this finding. |
| `projection` | Identifies a projection-role concept; does not confer source or promotion authority | Same required fields; no view artwork is assumed by this finding. |
| absent or unsupported | No inferred role | Use an explicit text fallback or no primary icon; do not guess a role or reuse artwork as semantics. |

Bindings are `projects/body-war/ontology/business/profile.json#classification_axes`, `nodes/*.json#/concept_role`, `presentation-graph.json#/nodes/*/tags` (`concept-role:*`), `src/body-war-adapter-writer.mjs#buildArtifacts`, the accepted focus patch node-construction mapping, and accepted archive `packages/dashboard/src/components/CustomNode.tsx:96-202`.

Exact token names and artwork remain **deferred**. Therefore no icon appearance, selector, or forced-color behavior is claimed. Candidate/authority/evidence badges are also **deferred** because their exact source fields, value maps, labels, tokens, and non-collapse definitions are not closed.

## Edge field model and presentation grammar

The following fields must remain separate:

| Field | Definition and candidate use |
|---|---|
| `graph_edge_id` | Identity of the edge instance in the rendered graph |
| `source_relation_id` | Identity of the source relation, if projected losslessly |
| source predicate | Exact relation name, currently available through edge `description` / sidecar `source_relation`; visible inline in bounded scenes and pointer/keyboard recoverable elsewhere |
| presentation relation | Coarse renderer category, currently edge `type` / sidecar `presentation_relation`; the only permitted key for a small presentation-style table |
| source/provenance reference | `source_ref` or structured source references; provenance, **not edge identity** |
| evidence reference | Evidence binding; not identity, confidence, or validity |
| `projected_direction` | Direction currently represented by graph/portal markers and text |
| `source_direction` | Source-semantic direction; no fidelity claim until projected losslessly |

The existing `KnowledgeGraphView.tsx#EDGE_STYLES` owner may define candidate rows for `builds_on` and `related`. Each row must specify a stable token name, color family, line pattern, system-color fallback, visible presentation-relation label, and matching legend entry. Those exact presentation tokens are **deferred**, so this finding does not guess colors or dash patterns. Color is subordinate redundancy only: it cannot identify an edge, predicate, authority state, or ontology meaning.

Every bounded-scene edge must expose:

- exact source predicate text;
- presentation-relation label;
- projected direction through marker(s) and textual `→` or `↔`;
- stable bindings for graph edge ID and source relation ID where available;
- separate source/provenance and evidence references.

Outside bounded scenes, exact predicate and projected direction may be available on pointer or keyboard focus, but never on hover alone. A `source_direction` sidecar field is required before any source-direction fidelity claim. Existing portal attributes—`data-presentation-relation`, `data-source-relation`, and `data-authority-effect`—are precedent, but `data-authority-effect` should be qualified as projection authority where that is what it represents.

### Scene-local legend contract

The legend belongs to the existing graph renderer/presentation owner and describes only the active scene. It must:

1. list each presentation relation actually present, with its exact token, line sample, color redundancy, system-color fallback, and visible label;
2. list each exact source predicate present as text, without treating predicates as style families;
3. define `→` and `↔` as projected direction only;
4. name any evidence or status cue by its exact source field and value;
5. state that presentation cues confer no ontology validity, source authority, promotion authority, or edge identity.

Legend component placement, copy, and tokens remain pending owner decisions and browser witnesses.

## Killed and deferred variants

| Variant | Disposition | Reason |
|---|---|---|
| Tour-first default | KILL as default; keep optional Learn path | Forces a workflow before orientation |
| Search-first home | DEFER | No novice query-formulation evidence |
| Implicit complete-graph home | KILL | Reproduces the 237-node initial black box |
| Persona-only Overview as graph access | KILL | Current Overview changes persona, not scope |
| Static `Overview — all 237 nodes` | KILL | Embeds a transient fixture count rather than current-filter scope |
| Visible Semantic mode | KILL until behavior differs | Currently aliases fuzzy search |
| Unique color per edge | KILL | No semantic owner, no scaling to 231 edges, and color cannot carry identity or predicate |
| Invented semantic relation groups | KILL | No canonical grouping axis |
| Icon-only or guessed role artwork | KILL | No closed presentation-token contract and no safe textual fallback |
| Candidate/authority/evidence badge slice | DEFER | Source/value/token/non-collapse contract is absent |
| Source-direction claim | DEFER | `source_direction` is not yet projected losslessly |
| Generalized visual-language layer | KILL | Existing renderer, focus, layout, and control seams own the bounded change |
| Bespoke graph accessibility state machine | KILL | Reuse React Flow focusable node/edge behavior and native controls |
| Hover-only relation name or animation-only direction | KILL | Not always recoverable and lacks non-color/static redundancy |

## Existing owners and exact source/test bindings

No new generalized owner is recommended.

| Candidate area | Existing owner | Test binding |
|---|---|---|
| Bounded home and Overview escape | `packages/dashboard/src/knowledgeFocusScene.ts:103-185` focus-scene derivation and full-mode return; accepted `0002-knowledge-focus-scene.patch` display/history hunk; `packages/dashboard/src/App.tsx:145-194` graph load/selection; `packages/dashboard/src/components/PersonaSelector.tsx:10-39` persona actions | `test/focus-scene.test.mjs`; Body War A/B browser runner; required candidate hooks `[data-testid="graph-scope"][data-scope="bounded-home|complete-current-filter"]`, `[data-testid="graph-counts"][data-node-count][data-edge-count]`, and `button[data-testid="open-complete-graph"]` with accessible name `Overview — all {current-filter node count} nodes` |
| Provenance | `scripts/serve-oew-prototype.mjs#/staleness.json` response construction; `packages/dashboard/src/App.tsx:196-216` staleness load; `packages/dashboard/src/components/StalenessBanner.tsx:33-39,100-178` status/copy rendering | Gateway response test plus required candidate hook `[data-testid="prototype-provenance"][data-projection-authority-effect]`; build and adapter references require individually addressable `[data-testid="prototype-build-ref"]` and `[data-testid="prototype-adapter-ref"]` |
| Role semantic key | `projects/body-war/ontology/business/profile.json#classification_axes`; `projects/body-war/ontology/business/nodes/*.json#/concept_role`; `src/body-war-adapter-writer.mjs#buildArtifacts` at lines 370–404; accepted `0002-knowledge-focus-scene.patch` node-construction hunk around lines 170–189 | Four-node role fixture; required candidate contract `[data-testid="node-role-icon"][data-concept-role="<exact-role>"][data-icon-token="<deferred-token>"]` adjacent to `[data-testid="node-role-label"]`; token values and artwork remain deferred |
| Node presentation | accepted archive `packages/dashboard/src/components/CustomNode.tsx:96-202` card renderer; accepted `0002-knowledge-focus-scene.patch` node-construction hunk around lines 170–189 | `CustomNode` component assertions plus required candidate node hook `[data-testid="knowledge-node"][data-node-id="<graph-node-id>"]`; exact visible and programmatic role text; forced-colors fixture |
| Relation rendering | accepted archive `packages/dashboard/src/components/KnowledgeGraphView.tsx:38-45` `EDGE_STYLES`; `KnowledgeGraphView.tsx:306-340` React Flow edge construction/rendering | One `builds_on` and one `related` fixture; required candidate edge hook `[data-testid="knowledge-edge"][data-graph-edge-id][data-source-relation-id][data-presentation-relation][data-source-predicate][data-projected-direction][data-style-token="<deferred-token>"]`; token values remain deferred |
| Portal relation details | `packages/dashboard/src/components/KnowledgeFocusPortals.tsx:24-101` portal rendering and activation | Existing `[data-testid="knowledge-focus-portals"]` and literal `button[data-source][data-target]` contract; require qualified `[data-projection-authority-effect]` where the value is projection authority; portal activation and Back sequence |
| Persona and graph controls | `packages/dashboard/src/components/PersonaSelector.tsx:10-39` Overview/Learn/Deep Dive persona actions; `packages/dashboard/src/App.tsx:444-457` LearnPanel render branch; `packages/dashboard/src/App.tsx:545` DiffToggle placement; `packages/dashboard/src/App.tsx:592-624` knowledge-type toggle; `packages/dashboard/src/store.ts:617-630` tour transition | Required candidate control/result hooks specified per row below; component/state tests assert accessible name, enabled state, transition, graph counts, and restoration target |
| Search and advanced tools | `packages/dashboard/src/components/SearchBar.tsx:24-133` query/results/mode UI; `packages/dashboard/src/store.ts:532-545` search transition; `packages/dashboard/src/components/FilterPanel.tsx:6-106` filter UI; `packages/dashboard/src/store.ts:580-593` Filter/Export/Path transitions; `packages/dashboard/src/components/ExportMenu.tsx:218-276` export UI; `packages/dashboard/src/App.tsx:629-652,756-760` Path placement/rendering | Required candidate Search/Filter/Knowledge nodes/Export/Path hooks specified below; false Semantic distinction absent; each exposed control has an enabled-state, result-state, count, and focus-restoration assertion |
| Utilities and details | `packages/dashboard/src/components/ThemePicker.tsx:6-179` theme UI; `packages/dashboard/src/App.tsx:654-672,746-753` keyboard-help placement/rendering; `packages/dashboard/src/App.tsx:444-482` Info/Files sidebar render branches; `packages/dashboard/src/components/KnowledgeGraphView.tsx#ReactFlow.Controls` canvas controls | Required candidate Theme/help/Info/Files hooks specified below; React Flow buttons selected by exact accessible names emitted by the owned control; state, count invariance, and restoration assertions |
| Panels and focus | `packages/dashboard/src/App.tsx:444-482` right-panel content; `packages/dashboard/src/components/KnowledgeFocusPortals.tsx:24-101` portal panel; accepted focus patch stylesheet hunk around lines 194–219 | Required candidate hooks `[data-testid="right-panel"][data-panel-state]`, `[data-testid="knowledge-focus-portals"]`, `[data-testid="panel-close"]`, and `[data-testid="focus-restoration-target"]`; fixed desktop/narrow viewport trace |
| Keyboard access | `packages/dashboard/src/components/KnowledgeGraphView.tsx#ReactFlow` focusable node/edge configuration; `packages/dashboard/src/components/KnowledgeGraphView.tsx#ReactFlow.Controls`; native buttons in `packages/dashboard/src/components/KnowledgeFocusPortals.tsx:24-101` | Required node/edge/portal hooks above; Tab, Enter/Space, Escape/Back, auto-pan, and visible-focus trace; no bespoke state machine |

The exact breakpoint and panel-priority policy remain implementation decisions. The candidate contract is zero entirely obscured focus at fixed desktop and narrow viewports, at most one focus-managed sheet at narrow width, and deterministic focus restoration when a panel closes.

## Executable browser witness matrix

These are required future observations, not completed tests. Every `data-testid` or candidate `data-*` hook named below is a deterministic required contract where absent today; naming it does not claim that it exists. Presentation-token **values** and artwork remain deferred even though their selector shape is fixed.

| Witness/control | Exact activation selector contract and enabled state | Exact result-state selector contract | Required transition, count, and focus observation |
|---|---|---|---|
| Provenance | Fresh load; no user control | `[data-testid="prototype-provenance"][data-projection-authority-effect]`, `[data-testid="prototype-build-ref"]`, `[data-testid="prototype-adapter-ref"]` | Exactly one banner; exact pinned build/adapter references; qualified projection authority; no checkout-freshness or ontology-validity assertion |
| Bounded home | Fresh load with frozen 3–6-node Body War ID list | `[data-testid="graph-scope"][data-scope="bounded-home"]`; `[data-testid="graph-purpose"][tabindex="-1"]`; `[data-testid="graph-counts"][data-node-count][data-edge-count]`; `[data-testid="knowledge-focus-portals"]` | Exact node IDs/count, one purpose sentence, and labeled portals; never 237 nodes for the frozen fixture; initial focus lands on `[data-testid="graph-purpose"]` |
| Overview | `button[data-testid="open-complete-graph"]` with accessible name `Overview — all {current-filter node count} nodes`; enabled on bounded home and disabled or `aria-current="true"` in complete-current-filter scope | `[data-testid="graph-scope"][data-scope="complete-current-filter"][tabindex="-1"]`; `[data-testid="graph-counts"][data-node-count="237"][data-edge-count="231"]` for the frozen fixture | 3–6 nodes before, 237/231 after; accessible-name count equals current-filter count before activation; focus moves to `[data-testid="graph-scope"][data-scope="complete-current-filter"]` |
| Learn | `button[data-testid="persona-learn"]` with accessible name `Learn — guided tour`; enabled unless already selected, then `aria-pressed="true"` or `aria-current="true"` | `[data-testid="persona-state"][data-persona="junior"]`; `[data-testid="learn-panel"][data-open="true"]`; `[data-testid="graph-counts"]` | Persona and panel transition match; graph count/scope effect is explicitly asserted rather than inferred; closing LearnPanel returns focus to `[data-testid="persona-learn"]` |
| Start Tour | `button[data-testid="start-tour"]` with accessible name `Start Tour`; enabled when tour admission conditions hold | `[data-testid="tour-state"][data-active="true"]`; `[data-testid="tour-scene-heading"][tabindex="-1"]`; `[data-testid="graph-counts"][data-node-count="4"][data-edge-count="0"]`; `[data-testid="knowledge-focus-portals"]` with six buttons | Replays 4/0/6; focus moves to `[data-testid="tour-scene-heading"]`; ending/canceling restores focus to `[data-testid="start-tour"]` |
| Deep Dive | `button[data-testid="persona-deep-dive"]` with accessible name `Deep Dive — code-focused view`; enabled unless selected, then `aria-pressed="true"` or `aria-current="true"` | `[data-testid="persona-state"][data-persona="experienced"]`; `[data-testid="deep-dive-panel"][data-open="true"]`; `[data-testid="graph-counts"]` | Exactly one code-focused state; graph scope/count effect explicitly equals the candidate contract; closing panel returns focus to `[data-testid="persona-deep-dive"]` |
| Search | Existing `[data-testid="search-input"]`; required candidate accessible name `Search concepts`; enabled when graph data is loaded | Required `[data-testid="search-results"][data-result-count]`; result `button[data-testid="search-result"][data-node-id="<fixture-id>"]`; target `[data-testid="knowledge-node"][data-node-id="<fixture-id>"]` | Unique fixture query returns exact asserted count; activation selects/navigates to exact target without unasserted count change; Escape closes results and restores focus to `[data-testid="search-input"]`; no visible control named Semantic |
| Filter | `button[data-testid="open-filter"]` with accessible name `Filter — narrow nodes`; enabled when graph data is loaded | `[data-testid="filter-panel"][data-open="true"]`; `[data-testid="graph-counts"]` | Opens Filter and closes Export per owned transition; applying the frozen filter produces its exact expected current-filter count; close/Escape restores focus to `[data-testid="open-filter"]` |
| Knowledge nodes | Within open Filter, `button[data-testid="filter-knowledge-nodes"]` with accessible name `Knowledge nodes`; enabled when Filter is open; `aria-pressed` reflects inclusion | `[data-testid="filter-state"][data-knowledge-nodes="included|excluded"]`; `[data-testid="graph-counts"]` | Toggle changes only the knowledge-node filter and produces the fixture’s asserted node/edge counts; focus remains on the toggle |
| Export, if exposed | `button[data-testid="open-export"]` with accessible name `Export — download current view`; enabled only when exportable graph data exists | `[data-testid="export-menu"][data-open="true"]`; separate option selectors `[data-testid="export-png"]`, `[data-testid="export-svg"]`, and `[data-testid="export-json"]` | Opens Export and closes Filter; opening does not change graph counts/semantics; close/Escape restores focus to `[data-testid="open-export"]`; no download is required by this visual-language witness |
| Path, if exposed | `button[data-testid="open-path"]` with accessible name `Path — trace a relation`; enabled when graph data supports path finding | `[data-testid="path-panel"][data-open="true"]` | Opens exactly one path state without unasserted scope/count change; close/Escape restores focus to `[data-testid="open-path"]` |
| Theme | `button[data-testid="open-theme"]` with accessible name `Theme`; enabled | `[data-testid="theme-picker"][data-open="true"]`; selected option `[data-testid="theme-option"][aria-checked="true"]` | Opens one picker; changing theme preserves graph counts and semantic attributes; close/Escape restores focus to `[data-testid="open-theme"]` |
| Keyboard help | `button[data-testid="open-keyboard-help"]` with accessible name `Keyboard shortcuts`; enabled | `[data-testid="keyboard-help"][data-open="true"]` | Opens one help dialog/panel without count change; close/Escape restores focus to `[data-testid="open-keyboard-help"]` |
| React Flow controls | Owned React Flow buttons selected by exact accessible names `Zoom in`, `Zoom out`, and `Fit view`; enabled while the canvas is interactive | `[data-testid="graph-counts"]` plus viewport transform observed through the owned React Flow container | Each button changes only the viewport transform; graph IDs, counts, predicate, and direction attributes remain unchanged; focus stays on the activated button |
| Info | `button[data-testid="sidebar-info"]` with accessible name `Info`; enabled when node/details context exists; selected state via `aria-selected="true"` | `[data-testid="right-panel"][data-panel-state="info"]` | Switches only sidebar content; graph counts/scope unchanged; panel close returns focus to `[data-testid="sidebar-info"]` |
| Files | `button[data-testid="sidebar-files"]` with accessible name `Files`; enabled when file details are available, otherwise disabled with an exposed reason; selected state via `aria-selected="true"` | `[data-testid="right-panel"][data-panel-state="files"]` | Switches only sidebar content; graph counts/scope unchanged; panel close returns focus to `[data-testid="sidebar-files"]` |
| Role icons | Node `[data-testid="knowledge-node"][data-node-id="<fixture-id>"]` for each exact role; node must be keyboard focusable | `[data-testid="node-role-icon"][data-concept-role="<authority|evidence|workflow|projection>"][data-icon-token="<deferred-token>"]` plus `[data-testid="node-role-label"]` | Four deterministic tokens only after token closure; exact visible/programmatic role text; unsupported/absent role has text fallback or no icon and never guesses; focus remains on node |
| Relations | Keyboard- or pointer-focus `[data-testid="knowledge-edge"][data-graph-edge-id]` for one `builds_on` and one `related` edge | Same edge carries `[data-source-relation-id][data-presentation-relation][data-source-predicate][data-projected-direction][data-style-token="<deferred-token>"]`; detail `[data-testid="edge-relation-detail"]` | Pattern differs with color removed after token closure; exact predicate and projected direction are recoverable; graph/source identities remain distinct; Escape closes detail and restores edge focus |
| Portal/Back | Existing literal portal selector `[data-testid="knowledge-focus-portals"] button[data-source="presentation:body-war.business.context.identity-consent"][data-target="presentation:body-war.business.capability.auth-consent"]`; enabled; required Back `button[data-testid="focus-back"]` with accessible name `Back` | Portal panel attributes include `data-presentation-relation="related"`, `data-source-relation="owns"`, `data-projected-direction="forward"`, and qualified `data-projection-authority-effect="none"`; restored source scene requires `[data-testid="focus-scene"][data-focus-node-id="presentation:body-war.business.context.identity-consent"][tabindex="-1"]` | Portal activation reaches the asserted 7/7/12 state; Back restores 2/1/5 and returns focus to the restored source-scene hook |
| Keyboard sequence | Shell controls above, `[data-testid="knowledge-node"]`, `[data-testid="knowledge-edge"]`, portal buttons, and panel controls in one frozen order; each enabled state asserted | `:focus-visible` plus the relevant result-state hooks above | Tab order matches fixture; Enter/Space activates; Escape/Back restores; no trap; focused item is never entirely obscured |
| Forced colors | Four-role/two-relation fixture with forced colors active; focus selectors above | Role labels/fallbacks, edge patterns, markers, predicates, projected-direction text, boundaries, and `:focus-visible` | All enumerated static cues remain observable; no pass depends on token color or artwork alone |
| Reduced motion | Same fixture with reduced motion active | Same semantic/count selectors as normal mode | Nonessential animation absent; node/edge IDs, counts, predicates, projected direction, and focus order unchanged |
| Panels | Fixed desktop and narrow viewports; open with the exact Learn/Deep Dive/Filter/Export/Path/Theme/help/Info/Files control selectors above | `[data-testid="right-panel"][data-panel-state]`, `[data-testid="knowledge-focus-portals"]`, `[data-testid="panel-close"]`, and the originating control | Zero entirely obscured focus; at most one narrow focus-managed panel; close/Escape returns focus to the exact originating control |

No row may pass on adjectives such as “clear,” “intuitive,” “truthful,” “visibly distinct,” or “accessible.” Each requires the stated selector, count/state transition, and observed result.

## Novice comparison protocol

Recruit at least eight participants unfamiliar with Body War and OEW. Counterbalance the current all-node home and the bounded candidate.

Tasks:

1. Explain the starting scene and name two concepts within 45 seconds.
2. Find Identity and Consent → Authentication and Consent and report the exact predicate and direction within 60 seconds without a color-only explanation.
3. Traverse one portal and return within 60 seconds.
4. Predict the scope change, then intentionally open the complete graph within 30 seconds.
5. Predict at least six of seven effects for Learn, Deep Dive, Filter, Export, Path, Theme, and Search.
6. Repeat relation navigation keyboard-only with visible focus and logical restoration.
7. Repeat relation identification in forced colors and reduced motion.

Record time, success, wrong controls, backtracks, direction errors, prompts, focus-occlusion events, and confidence. The candidate threshold is: median time improves by at least 20% on tasks 1–3; at least 7/8 participants complete every critical task; zero direction errors; zero entirely obscured focus events; and no increase in complete-graph escape failures.

Until this protocol runs, human comprehension remains untested. Automated browser checks can establish mechanics only. Screen-reader announcement quality also remains pending.

## Unresolved residue

- Exact source-backed home node IDs and purpose sentence.
- Final provenance payload, copy, build handle, adapter receipt reference, and qualified projection-authority field.
- Icon token names, artwork, visual descriptions, accessible labels, text fallbacks, selectors, and forced-color behavior.
- Exact `builds_on` and `related` presentation tokens: color families, line patterns, system-color fallbacks, and labels.
- Legend placement, copy, token samples, and browser selectors.
- Lossless `source_relation_id`, `source_direction`, `source_authority_effect`, node source selectors, confidence fields, and other sidecar semantics where absent.
- Exact accessible names and expected transitions for every changed or regrouped control.
- Full-graph keyboard traversal practicality.
- Responsive breakpoints and panel-priority policy.
- Executed graph-level keyboard, forced-colors, reduced-motion, and focus-occlusion witnesses.
- Novice comparison and screen-reader results.

These findings do not authorize implementation and do not establish comprehension, accessibility conformance, ontology correctness, promotion, release, deployment, or production readiness.
