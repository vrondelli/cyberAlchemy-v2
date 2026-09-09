# Bug Ticket Ontology Game Specification

Generated human view. Canonical semantics live in the project-local machine sources.
Graph digest: `ffc7830bb4974a3f04f7efe92a6ce348446562f82fe75c02e842622361399218`.

## Nodes

| Node | Kind | Intent |
| --- | --- | --- |
| `bug-ticket-ontology-game.AuthorityBoundary` | Rule | Prevent evidence, candidate relations, tests, or the game graph from impersonating an owner decision. |
| `bug-ticket-ontology-game.CaseAdapter` | Mapping | Represent the Adapter vocabulary as a UI-boundary Mapping specialization. |
| `bug-ticket-ontology-game.CaseApi` | Interface | Expose case loading and bounded investigation transitions to the browser adapter. |
| `bug-ticket-ontology-game.CaseLayout` | Layout | Own the current-place header, illustrated scene, place navigation, case log, inventory tray, puzzle overlay, and integrity footer slots. |
| `bug-ticket-ontology-game.CasePage` | Page | Own the terminal local route and primary point-and-click room for the BUG-4821 investigation. |
| `bug-ticket-ontology-game.CaseStageChanged` | Event | Record that a supported player decision advanced the investigation lifecycle. |
| `bug-ticket-ontology-game.CaseViewModel` | View Model | Shape room hotspots, machine witnesses, deterministic word rain, carried artifacts, station puzzles, case-log entries, hints, and integrity indicators for display without owning domain meaning. |
| `bug-ticket-ontology-game.ChooseConclusionAction` | Action | Own the player's room-interaction intent and its accepted or rejected observable outcome. |
| `bug-ticket-ontology-game.ConclusionForm` | Form | Own the interaction-and-puzzle submission contract for one investigation station. |
| `bug-ticket-ontology-game.DeterministicWordRain` | Component | Render one seeded event-word rain and expose bounded capture interactions without deciding whether the resulting trace is authoritative. |
| `bug-ticket-ontology-game.GameBinding` | Binding | Persist a durable local endpoint and mapping contract for place reads, movement, inspection, puzzle transitions, and autosave restoration. |
| `bug-ticket-ontology-game.GameGuard` | Guard | Project evidence and authority boundaries into place transitions, inspection access, artifact combinations, and the deployment lock without becoming the source of those rules. |
| `bug-ticket-ontology-game.GameHook` | Hook | Own framework-neutral reactive behavior for place movement, environmental inspection, artifact use, puzzle submission, autosave, and feedback. |
| `bug-ticket-ontology-game.InvestigateCase` | Operation | Apply one local room interaction, machine operation, Replay Address attempt, deterministic event capture, artifact combination, puzzle submission, or escape attempt while preserving evidence and authority gates. |
| `bug-ticket-ontology-game.InvestigationBoard` | Component | Compose three connected spatial places, environmental inspection points, carried artifacts, puzzle workspaces, feedback, and the current authority boundary without owning domain truth. |
| `bug-ticket-ontology-game.InvestigationCase` | Entity | Represent the identity-bearing BUG-4821 escape-room case, machine witnesses, deterministic replay captures, carried artifacts, solved stations, and bounded outcome. |
| `bug-ticket-ontology-game.InvestigationLifecycle` | State Machine | Track free exploration, machine-witness collection, Replay Address assembly, deterministic word-rain confirmation, semantic reconstruction, bounded owner review, residue preservation, runtime replay, and escape. |
| `bug-ticket-ontology-game.LoadCase` | Query | Load the immutable BUG-4821 case facts and current local game state. |
| `bug-ticket-ontology-game.MachineWitness` | Entity | Represent one partial replay locator emitted by an in-world subsystem machine without allowing it to identify an execution alone. |
| `bug-ticket-ontology-game.ReplayAddress` | Entity | Represent the subject, time window, and checksum assembled from all required machine witnesses to select one bounded execution replay. |
| `bug-ticket-ontology-game.SpatialInvestigationWorld` | Component | Project each exploration place as a navigable three-dimensional room with authored architecture, uniquely identifiable evidence machines, bounded movement, sightline, proximity interaction, physical state feedback, and doors, while delegating evidence meaning and puzzle transitions to the game hook. |

## Edges

| Edge | From | Type | To |
| --- | --- | --- | --- |
| `bug-ticket-ontology-game.edge.authority-boundary-enforces-investigation` | `bug-ticket-ontology-game.AuthorityBoundary` | `enforces` | `bug-ticket-ontology-game.InvestigateCase` |
| `bug-ticket-ontology-game.edge.binding-fetches-case` | `bug-ticket-ontology-game.GameBinding` | `fetches` | `bug-ticket-ontology-game.LoadCase` |
| `bug-ticket-ontology-game.edge.binding-mutates-investigation` | `bug-ticket-ontology-game.GameBinding` | `mutates` | `bug-ticket-ontology-game.InvestigateCase` |
| `bug-ticket-ontology-game.edge.board-consumes-hook` | `bug-ticket-ontology-game.InvestigationBoard` | `consumes` | `bug-ticket-ontology-game.GameHook` |
| `bug-ticket-ontology-game.edge.board-displays-view-model` | `bug-ticket-ontology-game.InvestigationBoard` | `displays` | `bug-ticket-ontology-game.CaseViewModel` |
| `bug-ticket-ontology-game.edge.case-adapter-maps-api` | `bug-ticket-ontology-game.CaseAdapter` | `maps` | `bug-ticket-ontology-game.CaseApi` |
| `bug-ticket-ontology-game.edge.case-api-exposes-investigate` | `bug-ticket-ontology-game.CaseApi` | `exposes` | `bug-ticket-ontology-game.InvestigateCase` |
| `bug-ticket-ontology-game.edge.case-api-exposes-load` | `bug-ticket-ontology-game.CaseApi` | `exposes` | `bug-ticket-ontology-game.LoadCase` |
| `bug-ticket-ontology-game.edge.case-layout-wraps-case-page` | `bug-ticket-ontology-game.CaseLayout` | `wraps` | `bug-ticket-ontology-game.CasePage` |
| `bug-ticket-ontology-game.edge.case-page-renders-board` | `bug-ticket-ontology-game.CasePage` | `renders` | `bug-ticket-ontology-game.InvestigationBoard` |
| `bug-ticket-ontology-game.edge.case-performs-investigation` | `bug-ticket-ontology-game.InvestigationCase` | `performs` | `bug-ticket-ontology-game.InvestigateCase` |
| `bug-ticket-ontology-game.edge.form-contracts-case-api` | `bug-ticket-ontology-game.ConclusionForm` | `contracts` | `bug-ticket-ontology-game.CaseApi` |
| `bug-ticket-ontology-game.edge.form-submits-choice` | `bug-ticket-ontology-game.ConclusionForm` | `submits` | `bug-ticket-ontology-game.ChooseConclusionAction` |
| `bug-ticket-ontology-game.edge.guard-mirrors-rule` | `bug-ticket-ontology-game.GameGuard` | `mirrors` | `bug-ticket-ontology-game.AuthorityBoundary` |
| `bug-ticket-ontology-game.edge.guard-protects-page` | `bug-ticket-ontology-game.GameGuard` | `protects` | `bug-ticket-ontology-game.CasePage` |
| `bug-ticket-ontology-game.edge.investigate-produces-stage-changed` | `bug-ticket-ontology-game.InvestigateCase` | `produces` | `bug-ticket-ontology-game.CaseStageChanged` |
| `bug-ticket-ontology-game.edge.load-case-reads-case` | `bug-ticket-ontology-game.LoadCase` | `reads` | `bug-ticket-ontology-game.InvestigationCase` |
| `bug-ticket-ontology-game.edge.spatial-world-consumes-hook` | `bug-ticket-ontology-game.SpatialInvestigationWorld` | `consumes` | `bug-ticket-ontology-game.GameHook` |
| `bug-ticket-ontology-game.edge.spatial-world-displays-view-model` | `bug-ticket-ontology-game.SpatialInvestigationWorld` | `displays` | `bug-ticket-ontology-game.CaseViewModel` |
| `bug-ticket-ontology-game.edge.stage-changed-transitions-lifecycle` | `bug-ticket-ontology-game.CaseStageChanged` | `transitions` | `bug-ticket-ontology-game.InvestigationLifecycle` |
| `bug-ticket-ontology-game.edge.view-model-derives-case` | `bug-ticket-ontology-game.CaseViewModel` | `derives` | `bug-ticket-ontology-game.InvestigationCase` |

This file is generated; edit machine sources and rebuild.
