# Workspace layout prototype: interaction Definition Pack

Private candidate. Route: `CA2-ROUTE-DEFINE`. Owner: CyberAlchemy v2 product owner.

This is the readable projection of [DEFINITION-PACK.candidate.json](DEFINITION-PACK.candidate.json). It specializes six existing candidate ontology concepts for one active layout-prototype session. Parent definitions remain unchanged. All six have disposition **specialize** and decision owner **CyberAlchemy v2 product owner**.

## Goal and context

Define observable interaction contracts for the first continuous-work layout prototype.

Preserve continuity across one chat, delegated work, and adaptable artifact surfaces.

One active Workspace/Tauri prototype session; fixture-backed artifact and assignment views; existing thesis and candidate business ontology.

The explicit-apply policy and session-only preservation scope are agent-proposed candidates for review. They are not user-decided resolutions of the ontology's open questions. Existing performance budgets remain unchanged.

## IC-TARGET: Chat targeting

Parent: `B-TARGET` in [ontology nodes](../control-center-ontology/nodes.json), bound to SHA-256 `d0add9be8f09add7e1e4c71b1ca4819cc5390447f0935415b917d537ea036498`.

**Normative:** A request must display one primary target before submission. Selecting another surface must not silently retarget an existing draft or an already submitted request.

**Formal:** submit(request) => target(request) = displayed_target_at_submit; target(submitted_request) is immutable. unresolved(target) => clarification, not dispatch.

**Plain meaning:** The composer makes clear what you are talking about, and keeps that choice while you draft.

**Domain context:** Within one active prototype workspace, targets distinguish task, assignment, and artifact. Additional selected material is supporting context, not a second implicit target.

**Example:** While drafting a revision to Essay A, opening Ontology B leaves the composer targeting Essay A. The person can explicitly choose Ontology B instead.

**Inputs**

- Target kind, identity, label, and source revision when available
- Explicit target selection
- Draft and selected supporting references

**Observable outcomes**

- Target is visible beside the composer
- Submission captures target and supporting-context identities
- Target changes are explicit and preserve draft text

**Failure behavior:** If the selected target disappears or its revision becomes invalid, preserve the draft, mark the target unresolved, and ask for a new selection before a targeted action.

**Prototype acceptance scenarios — specified, not executed**

- Given a draft targeting an essay, opening an ontology does not change the target.
- Given a submitted assignment request, later selection changes do not change that request.
- Given an unresolved target, submission requests clarification and dispatches no targeted work.

**Boundary:** Target selection conveys context, not execution permission.

## IC-SURFACE: Surface context

Parent: `B-SURFACE` in [ontology nodes](../control-center-ontology/nodes.json), bound to SHA-256 `d0add9be8f09add7e1e4c71b1ca4819cc5390447f0935415b917d537ea036498`.

**Normative:** A surface must identify the work it presents, its selected context, its readable space needs, and its availability. Changing presentation must preserve the underlying work identity.

**Formal:** surface_identity != work_identity; context_reference = (work_identity, revision_or_unknown, selection); unavailable(surface) does not imply absent(work).

**Plain meaning:** A window tells the Workspace what it shows and what space it needs; opening another view does not create another artifact.

**Domain context:** The layout prototype uses declared fixture identities, a primary work reference, optional selection references, minimum readable space, supported presentation modes, and fresh/stale/unavailable state.

**Example:** An essay editor and an essay preview can present the same essay. Selecting a paragraph makes that paragraph available as supporting context.

**Inputs**

- Surface identity and presented work reference
- Selection references and known source revision
- Minimum readable space and supported presentation modes
- Availability and freshness

**Observable outcomes**

- Workspace can arrange surfaces using their declared needs
- Selection is available to the composer without changing its target
- Missing data is visibly distinguished from empty content

**Failure behavior:** Show unavailable or stale state when context cannot be resolved. If space is insufficient, keep the active surface readable and make others reachable through compact entries.

**Prototype acceptance scenarios — specified, not executed**

- Two surfaces presenting one essay retain the same work identity.
- A stale surface marks its context stale instead of presenting it as current.
- At a narrow viewport, the active surface remains usable and other work remains reachable.

**Boundary:** This is an interaction contract, not an addon API, canonical addon definition, or live adapter guarantee.

## IC-LAYOUT: Layout proposal

Parent: `B-PROPOSAL` in [ontology nodes](../control-center-ontology/nodes.json), bound to SHA-256 `d0add9be8f09add7e1e4c71b1ca4819cc5390447f0935415b917d537ea036498`.

**Normative:** A proposed layout must show its reason and preview before explicit application. Applying it must preserve working state and retain a way to restore the preceding arrangement.

**Formal:** proposed -> previewed -> applied | dismissed; changed_base_layout => proposal_stale; apply requires current_base and satisfied_pins.

**Plain meaning:** The Workspace can suggest a better arrangement; you can inspect it, apply it, dismiss it, or return to the prior arrangement.

**Domain context:** For the first prototype, automatic adaptation is limited to fitting space within the selected arrangement. Moving surfaces between roles or replacing the layout requires explicit application.

**Example:** The system proposes a large ontology canvas with compact bottom chat. Applying it expands the graph; Restore returns to the prior essay-and-sources arrangement.

**Inputs**

- Current arrangement identity and revision
- Proposed arrangement, reason, and affected surfaces
- Pinned choices and surface space needs

**Observable outcomes**

- Preview leaves the current arrangement intact
- Explicit Apply selects a valid current proposal
- Restore changes arrangement without undoing artifact edits

**Failure behavior:** Reject stale proposals and explain which layout changed. A pin conflict must not silently unpin a surface. Viewport constraints can produce a temporary fit fallback without overwriting the preferred arrangement.

**Prototype acceptance scenarios — specified, not executed**

- Receiving a proposal while typing does not rearrange the workspace.
- A proposal based on an older layout cannot overwrite a newer user layout.
- Applying and restoring a layout preserves draft text and reading position.
- Streaming output never triggers repeated layout replacement.

**Boundary:** The explicit-apply rule is a proposed prototype policy, not a resolution of the long-term automation question.

## IC-PIN: Pinned arrangement

Parent: `B-PIN` in [ontology nodes](../control-center-ontology/nodes.json), bound to SHA-256 `d0add9be8f09add7e1e4c71b1ca4819cc5390447f0935415b917d537ea036498`.

**Normative:** A pinned choice must retain its declared role or placement against layout proposals until the user explicitly changes or removes that pin.

**Formal:** pinned(choice) and not explicit_user_change(choice) => proposal_preserves(choice); fit_fallback does not erase(preferred_choice).

**Plain meaning:** Pinning protects the arrangement you chose, while still allowing the interface to fit a smaller window.

**Domain context:** Prototype pins protect surface role and relative placement, not impossible fixed pixel dimensions. Direct user moves may update a pin visibly; automatic suggestions cannot.

**Example:** An essay pinned as the primary surface remains primary when an orchestration layout is suggested. A smaller window can compact its neighbors without erasing the pin.

**Inputs**

- Pinned surface identity
- Protected role or placement
- Explicit user move, unpin, or viewport change

**Observable outcomes**

- Pin state is visible and reversible
- Proposals respect pinned roles and positions
- Temporary fit fallback preserves the preferred arrangement

**Failure behavior:** When constraints cannot all fit, explain the fallback and preserve the stored preference. Do not silently remove a pin or make the composer unreachable.

**Prototype acceptance scenarios — specified, not executed**

- A proposal conflicting with a pin is marked incompatible until the user changes the pin.
- Unpinning permits a previously incompatible proposal to be reconsidered.
- Shrinking and restoring the window retains the user's preferred pin.

**Boundary:** A layout pin does not freeze artifact content or affect task authority.

## IC-STATE: Working-state preservation

Parent: `B-STATE` in [ontology nodes](../control-center-ontology/nodes.json), bound to SHA-256 `d0add9be8f09add7e1e4c71b1ca4819cc5390447f0935415b917d537ea036498`.

**Normative:** Layout changes, chat expansion, and surface switching must preserve draft text, selected target, artifact selection, and reading position within the active prototype session.

**Formal:** layout_transition(s) => retained(draft, target, selection, reading_anchor); restore(layout) does not rollback(artifact_content).

**Plain meaning:** Rearranging the desk keeps your work and your place.

**Domain context:** The first prototype guarantees continuity within an active session, including named layout choices saved for that session. Cross-restart and cross-host persistence remain open.

**Example:** Write an essay paragraph, inspect a graph, expand chat, then restore writing mode: the paragraph and chat draft remain, and reading resumes at the previous location.

**Inputs**

- Draft text and explicit target
- Surface selection and reading anchor
- Chat expansion state
- Current and preferred layout identities

**Observable outcomes**

- One conversation remains available at bottom center
- Chat expands upward or contracts without losing draft or target
- Returning to a surface restores its working position

**Failure behavior:** If a source revision removes the selected location, preserve draft text, report the missing anchor, and show a stable fallback. Do not claim an exact restored position when it no longer exists.

**Prototype acceptance scenarios — specified, not executed**

- Expanding and contracting chat preserves its draft and target.
- Layout Restore does not undo edits made after the layout was applied.
- A removed reading anchor is reported and falls back predictably.
- Session reset does not claim recovery that has not been implemented.

**Boundary:** Session continuity is not a durable conversation-storage or crash-recovery guarantee.

## IC-ATTENTION: Attention request

Parent: `B-ATTENTION` in [ontology nodes](../control-center-ontology/nodes.json), bound to SHA-256 `d0add9be8f09add7e1e4c71b1ca4819cc5390447f0935415b917d537ea036498`.

**Normative:** A request for attention must identify its associated work, reason, and current state. It must become noticeable without replacing the active task or stealing keyboard focus.

**Formal:** attention = (identity, work_reference, reason, state); acknowledge != resolve; navigate_to_attention requires user_action.

**Plain meaning:** The Workspace tells you what needs you while letting you finish the action in front of you.

**Domain context:** The prototype distinguishes routine progress from a block, failure, or decision request. Repeated signals for one condition update the same request; resolution follows the source condition.

**Example:** A research assignment becomes blocked while the person writes an essay. A compact notice identifies the assignment; opening it shows the relevant detail without discarding the essay.

**Inputs**

- Attention identity, associated work, and source revision
- Reason and available next action
- Active, acknowledged, resolved, or stale state

**Observable outcomes**

- Blocking conditions are visible near their work and in the compact attention overview
- Routine receipts remain inspectable on demand
- Acknowledging a notice leaves unresolved work visibly unresolved

**Failure behavior:** If the source disconnects, mark the attention state stale. Dismissing or acknowledging a notice must not imply that the task succeeded or the underlying decision was approved.

**Prototype acceptance scenarios — specified, not executed**

- A blocked assignment does not steal focus from the essay editor.
- Repeated updates to one condition do not create a notification flood.
- Acknowledging a blocked condition does not resolve it.
- Opening attention details preserves current work and provides a return path.

**Boundary:** Notice acknowledgement is not approval, task completion, or authority.

## Source bindings

- SRC-THESIS: [source](../PRODUCT-THESIS.md), SHA-256 `1215e8d4cf51eda71689e4c551588fd72efe453634b01fa31d59cd2ad487575f`. Selectors: `## One conversation, multiple work surfaces`, `## Space follows the task`, `## Attention is part of the product`, `## Open Questions`.
- SRC-CONCEPTS: [source](../control-center-ontology/nodes.json), SHA-256 `d0add9be8f09add7e1e4c71b1ca4819cc5390447f0935415b917d537ea036498`. Selectors: `B-TARGET`, `B-SURFACE`, `B-PROPOSAL`, `B-PIN`, `B-STATE`, `B-ATTENTION`.
- SRC-QUESTIONS: [source](../control-center-ontology/residue.json), SHA-256 `9c2733d7338cea170a7dac4fb015724fb618f9153d5023c9d2f316ac08890326`. Selectors: `CC-OPEN-AUTOMATION`, `CC-OPEN-TARGET`, `CC-OPEN-PERSISTENCE`, `CC-OPEN-ADDON-CONTRACT`, `CC-OPEN-ADAPTER`, `CC-OPEN-USABILITY`, `CC-OPEN-BASELINE`, `CC-OPEN-LAB-VOCABULARY`.
- SRC-PACK-CONTRACT: [source](../../define/docs/DEFINITION-PACK.md), SHA-256 `d52378ceb47691a2a854ef23a32f319e1536c82113861fac9e32b1c3f1bcd609`. Selectors: `## Required Content`, `## Concept Dispositions`, `## Result Presentation`.

## Open Questions

- **O-AUTOMATION:** Should future versions automatically apply some proposed arrangements? Owner: CyberAlchemy v2 product owner. Blocks claiming a final automation policy; does not block testing explicit Apply. Next: Evaluate the explicit-apply prototype before selecting broader automation.
- **O-PERSISTENCE:** What state persists across restarts or embedding hosts? Owner: CyberAlchemy v2 product owner. Blocks durable recovery claims, not session-continuity experiments. Next: Define storage, recovery, and host boundaries before durable implementation.
- **O-INTEGRATION:** Which live orchestrator adapter, Lab addon definitions, and capability evolution records govern integration? Owner: CyberAlchemy v2 product owner. Blocks live integration conformance claims. Next: Bind current adapter and Lab vocabulary before integration.
- **O-USABILITY:** Which usability thresholds qualify the integrated experience? Owner: CyberAlchemy v2 product owner. Blocks product approval claims. Next: Set thresholds before the product-test campaign; keep existing performance budgets.
- **O-DEFINE-CONTEXT:** Where are the saved Define Session and context-sufficiency evaluator receipt? Owner: CyberAlchemy v2 Define runtime owner. Blocks a claim of complete saved-session Definition Pack conformance. Next: Attach actual lifecycle and context-evaluator evidence when that runtime is available.

The saved Define Session and formal context-evaluator receipt are absent. Their checks are `not_evaluable`; local source and reference checks do not fill those gaps. No ontology residue is closed by this pack.

## Construction and use

Product construction is at candidate interaction definition. The current runnable work is definition and scenario review. Runtime implementation follows a separate route. Operational support for Lab reconciliation, merging, and publication remains deferred to the repository owners at later integration and delivery stages.

Allowed uses: review, challenge, and input to separately scoped prototype design. This pack does not promote definitions, establish implementation behavior, authorize execution, or grant product approval. Refresh through `CA2-ROUTE-DEFINE` when the bound meaning, context, sources, owners, or intended use changes.
