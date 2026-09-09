# Explorer returns (verbatim)

This file is the strategist-owned transcript of the four explorer returns for
dispatch `2026-09-01-game-ontology-examples`. It is evidence input, not an
adopted design.

## Agent 0 — Abramsky, Samson

Diegetic investigation lane — candidate research only  
Accessed: 2026-09-01

### Verified precedent evidence

| Label | Source and selector | Observed mechanic | Rights posture |
|---|---|---|---|
| observed | [Her Story — official site](https://www.herstorygame.com/about/), `How does it work?` | The player inhabits a fictional police terminal, chooses search terms, receives matching interview fragments, and constructs an account from non-linear evidence. The computer is both interface and fictional object. | Commercial/proprietary game. Mechanics may inform synthesis; do not reuse footage, text, UI art, names, or distinctive presentation. |
| observed | [Lucas Pope’s Obra Dinn devlog, post #734](https://dukope.com/devlogs/obra-dinn/tig-30/), `The Book`, `Corpse Hunting`, `Fate Validation`, `SVO Fates` | A diegetic book organizes discoveries encountered out of chronological order. Hypotheses use structured subject–verb–object entries. Correctness is confirmed in groups of three, reducing brute-force value. The devlog also reports that unexplained progression caused playtesters to ignore hints and get stuck. | Copyrighted developer account and proprietary game. Use abstract design findings only; no art, prose, characters, or puzzle reproduction. |
| observed | [Lucas Pope’s Obra Dinn devlog, post #848](https://dukope.com/devlogs/obra-dinn/tig-37/), `Animating the Book` | The in-world book collects a large evidence volume, establishes chronology, exposes identity clues, and uses a familiar document metaphor instead of a generic timeline UI. It can jump directly to any page despite its physical-page presentation. | Same proprietary boundary. |
| observed | [Alex Nisnevich and Greg Shuflin, Untrusted](https://github.com/AlexNisnevich/untrusted), `README.md` sections `Overview`, `The .jsx file format`, `License` | The level begins impossible; the player edits only explicitly permitted portions of the JavaScript that generates the world, reruns it, and thereby changes the traversable state. The diegetic console is an actual causal control surface, not decoration. | Game and soundtrack are CC-BY-NC-SA-3.0. Code without soundtrack has separate commercial terms requiring contact. Do not copy code or assets into a potentially commercial project without clearance. |
| observed | [Stefan Kober, detective-board](https://github.com/stefankober/detective-board), `README.md` sections `Creating Objects`, `Autobackup`, `Why use it?`, `License` | Browser-local notes, images, pins, threads, arrows, repositioning, save/load, and versioned IndexedDB backups let a user externalize relationships among events and evidence. The author explicitly names incident analysis as a use. | MIT repository. Dependency `html2canvas` and any imported player material retain separate rights. This is a thinking tool, not evidence that the interaction is fun as a game. |
| observed | [Rein Velt, CyberQuest](https://github.com/ReinVelt/CyberQuest), `README.md` sections `Features`, `Gameplay`, `Controls`, `Technology Stack`, `License` | A browser adventure combines rooms, point-and-click inspection, collected documents, ciphers, an investigation board, autosave, touch controls, optional narration, and no punitive fail states. It uses Pointer Events and localStorage. | CC-BY-SA-4.0. Any adaptation triggers attribution/share-alike obligations. “Production ready” is the repository author’s claim, not independently established here. |

### Candidate ontology synthesis

`ontology_id`: `ONT-GAME-DIEGETIC-TRACE-RECONSTRUCTION`

`design_thesis`: The player should reconstruct why BUG-4821 occurred by operating fictional warehouse machines, earning access to records, and proposing a source-bound event sequence. Discovery changes what the player may inspect; it does not silently declare an interpretation true.

`entities`:

- `Place`, `Machine`, `MachineComponent`, `CredentialFragment`
- `Interface`, `InterfaceMode`, `QueryTerm`, `WordRainToken`
- `SourceSystem`, `EventRecord`, `EventOccurrence`, `StateObservation`
- `EvidenceItem`, `TimelineSlot`, `AdjacencyClaim`, `Contradiction`
- `Hypothesis`, `ValidationBatch`, `AcceptedFinding`, `ResidueQuestion`

`relations`:

- `Machine located_in Place`
- `MachineComponent yields CredentialFragment`
- `CredentialFragment contributes_to InterfaceUnlock`
- `Interface exposes EventRecord`
- `EventRecord emitted_by SourceSystem`
- `EventRecord claims EventOccurrence`
- `EventOccurrence precedes EventOccurrence`
- `EventRecord observes StateObservation`
- `EvidenceItem supports|conflicts_with Hypothesis`
- `AdjacencyClaim places EventOccurrence before EventOccurrence`
- `ValidationBatch contains AdjacencyClaim`
- `AcceptedFinding bounded_by EvidenceItem`
- `ResidueQuestion blocks Conclusion`

`player_verbs`:

- move, inspect, open, power, disassemble, record identifier
- enter code, query, pause word rain, isolate token
- collect record, compare states, pin evidence, connect records
- order events, propose adjacency, revise, submit a batch
- preserve an unresolved question

`state_machine`:

```text
Machine:
sealed -> inspected -> accessible -> identifier_recovered

Terminal:
locked -> code_partial -> unlocked -> query_ready -> word_rain_active

Record:
hidden -> surfaced -> collected -> source_bound -> timeline_placed

Timeline:
empty -> partial -> contradictory -> coherent_candidate
      -> batch_submitted -> supported | revision_required

Investigation:
reproduction_known -> execution_reconstructed
-> semantic_gap_identified -> bounded_finding
-> unresolved_residue_preserved
```

`synthesis — puzzle_loop`:

1. Explore one of three places and physically operate a machine.
2. Recover a genuine identifier fragment from the machine state, not from a detached hint.
3. Combine fragments to unlock the terminal interface.
4. Enter a discovered term or identifier to start the word rain.
5. Isolate authentic event names from semantically similar noise.
6. Pin records with their source systems and state observations.
7. Arrange events and submit several adjacency claims as a batch.
8. A supported batch exposes the cross-service contradiction and opens the next investigation layer.

For BUG-4821, the authentic event set can be:

```text
ReturnReceived
UnitScannedAtWarehouse
InventoryPositionUpdated
AvailabilityProjectionUpdated
StorefrontCacheInvalidated
```

Noise should include plausible domain terms, not random garbage. The intellectual action is distinguishing an emitted event from a state, policy statement, inference, or customer promise.

`synthesis — validation`: Adapt the anti-brute-force principle, not Obra Dinn’s exact rule. Validate a batch containing three independently sourced adjacency claims. A failed batch reports “unsupported sequence” without identifying the wrong edge. Everything remains editable; repeated guessing does not erase progress or impose a timer.

`synthesis — evidence and authority boundary`:

- Collecting an event proves only that the record exists in the fictional trace.
- Correct chronology proves pipeline reconstruction, not the business rule.
- Contradictory local states support a semantic-gap hypothesis.
- The player may construct the candidate relation `QualityState constrains Sellability`.
- Only the represented policy-owner decision may promote that relation inside the fiction.
- `RESIDUE-TRANSFER-INSPECTION-VALIDITY` must remain unresolved; finding every record must not produce a false-green “complete truth” ending.

`synthesis — browser/accessibility implications`:

- Keep every token, record, connection, and validation result in a semantic DOM control plane even if Phaser renders the room.
- Word rain needs pause, reduced-motion, adjustable speed, high contrast, and an equivalent sortable text stream. This alternative must preserve the same noise and selection difficulty.
- Support keyboard, pointer, and touch; drag-and-drop timeline placement needs move-left/move-right controls.
- Hotspots need focus indicators and inspect labels; progression cannot depend on pixel hunting.
- Codes should accept paste and an on-screen keypad. Audio must have captions/transcripts.
- Save versioned investigation state locally and allow rollback after accidental changes.
- Do not use color alone for source, confidence, conflict, or validation status.

### Failure and residue

- A wrong sequence becomes an editable negative witness, not a destructive reset.
- A collected record without provenance cannot satisfy a validation batch.
- A chronologically correct trace with the wrong semantic conclusion remains incomplete.
- Exhausting the word rain without selecting an event reopens it with the same deterministic seed.
- The unresolved warehouse-transfer question survives the ending and visibly blocks claims about transferred returns.

### Open questions

- Should the word rain start from any valid machine identifier, or only after assembling fragments from all three rooms?
- Does batch validation cover chronology only, or chronology plus source binding? Combining both may make failure feedback too opaque.
- How many decoy event names can players discriminate before the rain becomes a visual-search test instead of semantic reasoning?
- Should players freely type Her Story-like search terms, or use identifiers actually recovered from machines? Free search offers agency but greatly enlarges content and localization cost.
- Is the evidence board required for solving, or an optional cognitive aid? Making it mandatory risks turning play into clerical graph editing.
- Does the current game’s art and text have a commercial destination? That decision affects whether CC-BY-SA and CC-BY-NC-SA precedents can be adapted or only studied.

## Agent 1 — Baez, John

Spatial-systems explorer return for dispatch `2026-09-01-game-ontology-examples`.

Accessed 2026-09-01. All findings remain precedent evidence, not product authority.

## Source matrix

| Source | Selector / immutable snapshot | Observed mechanic | License / rights posture | Confidence |
|---|---|---|---|---|
| Madrona Escape Room, `shacklettbp` | [`README.md`, environment/action/observation](https://github.com/shacklettbp/madrona_escape_room/blob/21f674951c68888045c824b5b981e158975f9e90/README.md#the-environment-and-learning-task) | Three serial rooms; players move, rotate, grab, press buttons, push blocks, and open doors. The observation model includes room-relative object direction, door state, grab state, and remaining steps. | MIT at [`LICENSE`](https://github.com/shacklettbp/madrona_escape_room/blob/21f674951c68888045c824b5b981e158975f9e90/LICENSE). | High |
| Madrona interaction systems | [`src/sim.cpp` L161-L224](https://github.com/shacklettbp/madrona_escape_room/blob/21f674951c68888045c824b5b981e158975f9e90/src/sim.cpp#L161-L224), [`L226-L293`](https://github.com/shacklettbp/madrona_escape_room/blob/21f674951c68888045c824b5b981e158975f9e90/src/sim.cpp#L226-L293), [`L622-L642`](https://github.com/shacklettbp/madrona_escape_room/blob/21f674951c68888045c824b5b981e158975f9e90/src/sim.cpp#L622-L642) | Grab uses a short forward ray and rejects no-hit, static, and agent targets without mutating state. Buttons derive `isPressed` from occupancy. A door opens only if all linked buttons are pressed; non-persistent doors close when that conjunction stops holding. Physics, button evaluation, door evaluation, and reward execute in declared order. | MIT; implementation ideas may be reused under its terms. | High |
| Madrona room variants | [`src/level_gen.cpp` L382-L448](https://github.com/shacklettbp/madrona_escape_room/blob/21f674951c68888045c824b5b981e158975f9e90/src/level_gen.cpp#L382-L448), [`L451-L505`](https://github.com/shacklettbp/madrona_escape_room/blob/21f674951c68888045c824b5b981e158975f9e90/src/level_gen.cpp#L451-L505), [`L508-L563`](https://github.com/shacklettbp/madrona_escape_room/blob/21f674951c68888045c824b5b981e158975f9e90/src/level_gen.cpp#L508-L563) | Demonstrates single-condition, simultaneous-condition, obstacle-plus-actuator, and sustained-condition rooms. Some layouts permit more than one valid physical strategy. | MIT. | High |
| EvscapeRoom, Griatch | [`README.md` “Playing the game”, “Technical”, “Design Philosophy”](https://github.com/Griatch/evscaperoom/blob/f50d911c97d2b828da256269327900d3197f3687/README.md#playing-the-game) | `examine` focuses an object and reveals available actions. Focusing does not monopolize an object. Room progression is decomposed into state modules. Critical items cannot be removed into personal inventory, preventing another player or disconnect from soft-locking progress. Fresh room instances provide recovery. | BSD-3-Clause at [`LICENSE`](https://github.com/Griatch/evscaperoom/blob/f50d911c97d2b828da256269327900d3197f3687/LICENSE). | High |
| EvscapeRoom state handler | [`evscaperoom/state.py` L38-L107](https://github.com/Griatch/evscaperoom/blob/f50d911c97d2b828da256269327900d3197f3687/evscaperoom/state.py#L38-L107), [`L142-L184`](https://github.com/Griatch/evscaperoom/blob/f50d911c97d2b828da256269327900d3197f3687/evscaperoom/state.py#L142-L184), [`L246-L277`](https://github.com/Griatch/evscaperoom/blob/f50d911c97d2b828da256269327900d3197f3687/evscaperoom/state.py#L246-L277) | Transition sequence is explicit: validate next state, load it, clean prior state, initialize successor, then persist names. Load errors are surfaced and do not silently advance. Hints escalate by state and are counted. Branching is supported. | BSD-3-Clause. | High |
| Farama MiniWorld | [`docs/content/design.md` L8-L65](https://github.com/Farama-Foundation/Miniworld/blob/c660156dd73994e55ad81a4e2925582399446aba/docs/content/design.md#L8-L65) | Separates static rooms/hallways from dynamic entities; portals connect rooms. The action vocabulary is deliberately small: turn, move, pick up, drop, toggle. It also exposes a top-down view alongside first-person observations. | Apache-2.0 at [`license`](https://github.com/Farama-Foundation/Miniworld/blob/c660156dd73994e55ad81a4e2925582399446aba/license). | High |
| MiniWorld ThreeRooms | [`miniworld/envs/threerooms.py` L9-L80](https://github.com/Farama-Foundation/Miniworld/blob/c660156dd73994e55ad81a4e2925582399446aba/miniworld/envs/threerooms.py#L9-L80) | Three separately positioned rooms are joined by explicit portals; object placement and agent placement are independent operations. The example is an exploration substrate, not evidence of a satisfying puzzle. | Apache-2.0. | High for structure; low for fun/gameability |
| Three.js | [`PointerLockControls.js` L37-L60](https://github.com/mrdoob/three.js/blob/20bd26f2d1f2797602c084975b793591b3472558/examples/jsm/controls/PointerLockControls.js#L37-L60), [`L120-L134`](https://github.com/mrdoob/three.js/blob/20bd26f2d1f2797602c084975b793591b3472558/examples/jsm/controls/PointerLockControls.js#L120-L134), [`Raycaster.js` L8-L21](https://github.com/mrdoob/three.js/blob/20bd26f2d1f2797602c084975b793591b3472558/src/core/Raycaster.js#L8-L21), [`L58-L69`](https://github.com/mrdoob/three.js/blob/20bd26f2d1f2797602c084975b793591b3472558/src/core/Raycaster.js#L58-L69) | Provides a reproducible browser basis for first-person camera lock and bounded gaze/pointer selection. Raycaster layers can exclude decorative geometry; `near`/`far` bounds can enforce an approach distance. Lock/unlock/error are explicit states. | MIT at [`LICENSE`](https://github.com/mrdoob/three.js/blob/20bd26f2d1f2797602c084975b793591b3472558/LICENSE). | High |
| Enable3D | [`README.md` “3D for Web, Mobile and PC” and packages](https://github.com/enable3d/enable3d/blob/17cc02f9f79936a0b60c339650a8705970cd50a6/README.md#3d-for-web-mobile-and-pc) | Adds Three.js/Ammo physics and a Phaser 3 extension, making it a technically plausible bridge from the current Phaser candidate. | LGPL-3.0 at [`LICENSE`](https://github.com/enable3d/enable3d/blob/17cc02f9f79936a0b60c339650a8705970cd50a6/LICENSE). Integration needs packaging/compliance review before selection. | High for capability; unresolved suitability |
| Tom Pugh, Game Developer, 2018 | [“Level Design Tips and Tricks”](https://www.gamedeveloper.com/design/level-design-tips-and-tricks), headings “clear and consistent affordances”, “leading lines”, “teach mechanics”, “denial and reward” | Treats consistent affordances as a trust contract; recommends architecture, lighting, sight lines, and safe introductory challenges to teach interaction rules. | Reference prose only; no code or asset reuse rights inferred. | Medium-high; professional guidance, not a universal rule |
| Ubisoft Montpellier / Rémi Boutin, 2024 | [Accessibility Spotlight](https://www.ubisoft.com/en-gb/game/prince-of-persia/the-lost-crown/news-updates/5nGZiBSFtcEzFd93QlTotS/prince-of-persia-the-lost-crown-accessibility-spotlight), questions on exploration | Optional guided mode distinguishes blocked and available paths. “Eye of the Wanderer” records a screenshot at an unresolved location so players need not rely entirely on memory. Accessibility was treated as an early design concern and evaluated with players. | Product/design reference only. | High for the reported feature |
| Microsoft Game Dev XAG 103 | [Additional channels for visual and audio cues](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/103), “Goal” and “Implementation guidelines” | Critical interaction cues should cross sensory channels; color alone is insufficient. Interactable-location feedback can combine visual, audio, text, and narration. | Guidance reference only. | High |
| Microsoft Game Dev XAG 107 | [Input](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/107), “Overview” and “Implementation guidelines” | Mouse/analog interaction should have equivalent digital input. Avoid required rapid sequences, long holds, or simultaneous chords; remap actions rather than only physical buttons. | Guidance reference only. | High |
| W3C Pointer Lock 2.0 Working Draft, 2026-02-25 | [§8 Requirements](https://www.w3.org/TR/pointerlock-2/#requirements), [§9.1 first-person use case](https://www.w3.org/TR/pointerlock-2/#relative-view-port-rotation-of-free-moving-virtual-actors), [§10 Security](https://www.w3.org/TR/pointerlock-2/#security) | Pointer lock enables unrestricted relative camera motion, but a default unlock gesture must exist; Escape is recommended. It exits on target removal or loss of tab/window focus. The document warns about interaction capture and recommends persistent escape instructions. It is explicitly a Working Draft. | W3C document license; reference, not implementation authority. | High for current draft requirements; status may change |
| W3C WAI WCAG 2.2 | [Understanding 2.1.2: No Keyboard Trap](https://www.w3.org/WAI/WCAG22/Understanding/no-keyboard-trap.html), “Intent” and “Examples” | A puzzle component may capture keyboard interaction only if the player can leave it through a standard method or is told the exit method. | Standards guidance. | High |

## Observed mechanics

- An approach rule is stronger than “click any glowing object”: Madrona combines a bounded forward ray, physical response type, and entity type before allowing grab.
- Door state is derived from declared conditions, not from animation completion. Animation follows `OpenState`.
- Puzzle conditions can be persistent or sustained. Those are distinct semantics and should not share one boolean.
- EvscapeRoom’s focus model makes available verbs explicit after inspection and avoids monopolizing shared targets.
- Critical progress can be represented as shared room state rather than a removable inventory object, preventing soft-locks.
- Room topology, entity placement, action vocabulary, and rendering can be modeled independently.
- Pointer lock and object raycasting are enough for a browser first-person interaction layer, but pointer lock is a fallible and escapable browser state.
- Guided navigation and persistent visual notes can reduce spatial-memory burden without automatically solving the puzzle.

## Synthesis: candidate BUG-4821 spatial ontology

`ontology_id`: `GAME-ONTOLOGY-SPATIAL-SYSTEMS-CANDIDATE-01`

`design_thesis`: The player learns the semantic gap by moving through three causally connected places. Spatial progress occurs only when the player has physically inspected and operated the relevant machines; no clue is obtainable through hidden-pixel hunting or automatic room entry.

### Entities

- `GameWorld`
- `Room`
- `Portal`
- `Door`
- `PlayerPose`
- `TraversalMode`
- `InteractionTarget`
- `InspectableSurface`
- `Machine`
- `ApproachEnvelope`
- `LineOfSight`
- `Affordance`
- `PlayerVerb`
- `MovableProp`
- `Actuator`
- `PuzzleCondition`
- `WorldState`
- `Observation`
- `EvidenceToken`
- `MachineIdentifier`
- `WordRainInterface`
- `AccessibilityCue`
- `SemanticDOMMirror`
- `HintTier`
- `FailureRecord`
- `ResetPoint`
- `Residue`

### Relations

```text
Room --connected_by--> Portal
Portal --controlled_by--> Door
InteractionTarget --located_in--> Room
InteractionTarget --offers--> Affordance
Affordance --invoked_by--> PlayerVerb
PlayerPose --within--> ApproachEnvelope
PlayerPose --has_clear--> LineOfSight
Machine --exposes_after_inspection--> MachineIdentifier
Observation --supports--> EvidenceToken
EvidenceToken --is_copied_to--> PlayerNotebook
EvidenceToken --contributes_to--> PuzzleCondition
PuzzleCondition --governs--> Door
PuzzleCondition --governs--> WordRainInterface
AccessibilityCue --redundantly_represents--> Affordance
SemanticDOMMirror --represents--> InteractionTarget
FailureRecord --preserves--> PriorAcceptedWorldState
Residue --blocks--> UnsafeSuccessTransition
```

### Player verbs

`move`, `turn`, `approach`, `cycle_target`, `focus`, `inspect`, `operate`, `record`, `place`, `release`, `enter_code`, `review_notebook`, `request_hint`, `leave_pointer_lock`, `restore_checkpoint`.

Movement and looking must be separately configurable. `cycle_target`, `inspect`, and `operate` provide keyboard/switch equivalents to mouse gaze.

### State transitions

```text
room:
  unvisited -> entered -> surveyed

target:
  unnoticed -> detected -> focused -> inspected
  focused + outside_approach_envelope -> blocked_no_mutation
  focused + occluded -> blocked_no_mutation

machine:
  sealed
    -> mechanically_opened
    -> powered
    -> identifier_exposed
    -> interface_unlocked
    -> word_rain_active

evidence:
  unknown -> observed -> recorded
  recorded evidence is persistent and non-consumable

door:
  closed -> opening -> open
  sustained-condition door: open -> closing -> closed
  accepted critical-progress door: open remains open

pointer:
  unlocked -> lock_requested -> locked
  lock_requested -> rejected -> fallback_navigation
  locked -> unlocked on Escape, focus loss, or explicit exit

puzzle:
  incomplete -> candidate_solution
  candidate_solution -> rejected_retryable
  candidate_solution -> spatial_chapter_complete
```

### Three-place mapping

1. `Warehouse Intake`

   The player inspects the returned laptop, intake scanner, and event-ledger machine. The room teaches approach/focus/inspect safely and yields the unit identifier plus evidence that physical presence is true.

2. `Quality Lab`

   The player must operate the inspection machine rather than merely enter the room. Its state exposes `AWAITING_INSPECTION`; manipulation reveals that quality state changes independently of warehouse presence. A copied notebook token prevents loss.

3. `Availability Control`

   The console remains physically sealed until machine identifiers from the other rooms are entered. Unlocking it starts the word rain. The player reconstructs the event sequence and discovers that the availability rule lacks a quality-state input.

The exit should open when the player has formed a supported candidate relation, not because the game silently treats the ticket expectation as authoritative. Owner acceptance remains an explicit non-player gate or epilogue state.

### Puzzle loop

```text
notice spatial anomaly
  -> approach target
  -> inspect to reveal valid verbs
  -> operate and observe state
  -> copy machine identifier/evidence
  -> traverse through changed portal
  -> combine bounded evidence at console
  -> activate word rain
  -> reconstruct event chain
  -> submit candidate semantic gap
  -> receive retryable rejection or chapter completion
```

### Accessibility and browser constraints

- Keep a semantic DOM target list and evidence notebook beside the canvas. Canvas visibility is not the only control plane.
- Every critical target needs at least two cues: geometry/outline plus text, audio, or narration. Never encode warehouse/quality/availability state through color alone.
- Pointer lock must start from a deliberate player action, display Escape instructions, handle rejection, and expose an unlocked keyboard/touch navigation mode.
- Provide digital turn steps, target cycling, single-press interaction, remapping, sensitivity controls, and optional click-to-move. No required rapid input, chords, or long holds.
- Preserve camera orientation and focus when opening/closing machines or notebook overlays.
- Provide an optional room map with visited rooms, blocked portals, and player-recorded evidence positions.
- Mobile must use an explicit inspect button or target cycle; pointer lock cannot be the only route.

### Failure and residue

- `no ray hit`, `too far`, `occluded`, and `wrong target type` produce feedback but do not mutate puzzle state.
- Incorrect codes increment an attempt record but never consume identifiers or destroy prior valid progress.
- Critical props either return to a home socket or have a reset action; they cannot fall irretrievably outside collision bounds.
- Reload restores accepted world transitions and the evidence notebook from a deterministic checkpoint.
- Renderer/WebGL loss reveals a recoverable message and retains semantic controls where possible.
- The word-rain puzzle retains unresolved residue when the player has insufficient evidence; it must not fabricate the missing relation.
- A player solution is game progression evidence only, not acceptance of the real business rule.

### Implementation consequences

- Author a renderer-independent `roomGraph`, `interactionTargets`, and transition reducer before adding new 3D assets.
- Store every target’s room, transform, approach radius, line-of-sight rule, affordance set, semantic label, cues, and persistent-state key.
- Drive door animation from the accepted state reducer; animation callbacks must not own domain progress.
- Three.js supplies an MIT-licensed route for pointer lock and raycasting. Enable3D could preserve Phaser integration, but its LGPL-3.0 obligations require an explicit licensing decision.
- Test the state reducer without WebGL: distance, occlusion, invalid actions, code rejection, reload, and alternate input must produce deterministic results.
- Treat `Warehouse`, `Quality`, and `Availability` as separated spatial containers with portals, not assets stacked in one coordinate area.
- Start with one training interaction in Intake before requiring compound inspection in later rooms.

## Open questions

- Is actual free-look 3D essential, or would fixed-camera room nodes give clearer control and lower accessibility cost?
- Should the Phaser candidate adopt Enable3D, host a separate Three.js scene, or remain 2.5D? License and bundle consequences are unresolved.
- Which exact machine identifiers must be collected, and are they stable authored data or generated per run?
- Are room doors persistent progression gates or sustained physical puzzles? This must be typed per door.
- Can movable props contribute to critical progress, or should all critical evidence be copied into a persistent notebook?
- Is the word rain playable through a static transcript and keyboard-only selection with equivalent challenge?
- Which browser/mobile baseline is required, especially where Pointer Lock is unavailable?
- What checkpoint granularity preserves discovery without making repeated traversal tedious?
- Does `quality_state` act only as evidence in the mystery, or also as a physical machine condition?
- How will generated art and 3D assets carry source, creator, license, and derivative-use provenance?

## Agent 2 — Capucci, Matteo

## Explorer 2 report — Meta-interface ontology

Date accessed: 2026-09-01  
Status: candidate research only; no adoption or implementation authority.

### Source-grounded precedents

1. **Metal Gear Solid / Psycho Mantis — physical input boundary becomes game logic**

   - Source: [Austin Anderson, “Extended Fiction in Game Design: Metal Gear Solid and Emily Is Away,” Game Developer, 2019](https://www.gamedeveloper.com/design/extended-fiction-in-game-design-metal-gear-solid-and-emily-is-away)
   - Selectors: article metadata lines 14–20; mechanic discussion lines 41–49.
   - **Observed:** The antagonist appears to know input and save information; changing from controller port one to port two defeats the apparent prediction mechanism. The article interprets this as the player acting on the physical system beyond the antagonist’s controllable game logic.
   - Rights posture: copyrighted game and article. Reuse only the abstract design relation—“change the input channel the antagonist observes.” Do not reproduce characters, audiovisual presentation, dialogue, or puzzle wording.
   - Confidence: high for the documented mechanic; medium for the author’s interpretive claim.

2. **OneShot — save/reload, window state, and host-computer affordances become fiction**

   - Source: [Erica Kleinman, “Game Narrative Review: OneShot,” GDC 2019 submission](https://media.gdcvault.com/gdc2019/GameNarrativeReview/Kleinman_Erica-Paper.pdf)
   - Selectors:
     - metadata: page 0, lines 0–13;
     - closing/reopening to progress: page 3, lines 128–140;
     - player and computer included in diegetic scope: page 5, lines 193–216;
     - quitting/reopening and system-message interference: pages 5–6, lines 217–233.
   - **Observed:** The review documents puzzles using closing/reopening, state retained across play, and computer-interface affordances. It argues that the fiction expands to include the player and host system.
   - Rights posture: proprietary game; copyrighted paper. Learn from the boundary pattern only. Do not write outside the game’s origin, inspect actual files, imitate its characters, or reproduce puzzle sequences.
   - Confidence: high for the documented examples.

3. **Tearaway — the player and device are collaborators inside the fiction**

   - Source: [Rex Crowle / Media Molecule, “Believable Make-Believe: Putting the Player at the Heart of Tearaway,” GDC Vault 2014](https://gdcvault.com/play/1020646/Believable-Make-Believe-Putting-the)
   - Selectors: session overview lines 28–43; metadata lines 52–56.
   - **Observed:** The design session explicitly frames the gamer and device-external interaction as part of the adventure and emphasizes customization as authorship.
   - Rights posture: proprietary game and talk. Design inspiration only.
   - Confidence: high for the stated design thesis; the accessible abstract does not substantiate every individual mechanic.

4. **Hungry Fridge — browser game changes mode when a controller appears**

   - Source: [MDN, “Implementing controls using the Gamepad API”](https://developer.mozilla.org/en-US/docs/Games/Techniques/Controls_Gamepad_API)
   - Selectors: API capability lines 172–186; hidden controller-transformed mode lines 191–199; privacy/security and layout caveats lines 232–239.
   - **Observed:** Connecting a controller changes the game into another mode; MDN also documents a keyboard-accessible way to launch that mode. Browser policy requires user interaction before gamepad exposure to reduce fingerprinting risk.
   - **Synthesis:** This is the strongest direct browser analogue to the controller-port precedent: an optional physical controller can produce the surprise, while an equivalent in-game input reroute preserves completion for everyone.
   - Confidence: high.

5. **Decrypted — simulated desktop, terminal, and persisted fictional filesystem**

   - Source: [hasderhi/Escape-Room](https://github.com/hasderhi/Escape-Room)
   - Selectors: README lines 166–173 for simulated desktop; lines 174–204 for fictional terminal and LocalStorage commands.
   - License: [raw license lines 0–10](https://raw.githubusercontent.com/hasderhi/Escape-Room/main/license), GPL-3.0-or-later; taskbar icons have separately identified provenance.
   - **Observed:** The browser game places terminal commands, a browser, communication app, and fictional filesystem inside a simulated OS. It persists and restores the simulated filesystem through LocalStorage.
   - Rights posture: useful architectural precedent, but copying covered code into a differently licensed project would require GPL analysis. The icon set must be assessed separately.
   - Confidence: high.

6. **Caesar Cipher Escape Room — progressive decoding with browser accessibility affordances**

   - Source: [CyberSnackCat/caesar-escape-room](https://github.com/CyberSnackCat/caesar-escape-room)
   - Selectors: README lines 175–205 for offline browser implementation, progressive puzzle structure, keyboard controls, and high-contrast mode.
   - License: [LICENSE lines 230–258](https://github.com/CyberSnackCat/caesar-escape-room/blob/main/LICENSE), MIT.
   - **Observed:** Pure HTML/CSS/JS, progressive decode/extract loops, keyboard operation, high contrast, and built-in learning tools.
   - **Synthesis:** It supports making the collected identifier and word-rain phases progressively legible rather than treating obscurity as difficulty.
   - Confidence: high.

7. **xterm.js — terminal presentation without granting real shell authority**

   - Source: [xtermjs/xterm.js](https://github.com/xtermjs/xterm.js/)
   - Selectors: README lines 210–235 states that xterm.js is a frontend, not Bash; lines 283–293 document browser support and experimental API caution.
   - License: [raw MIT license](https://raw.githubusercontent.com/xtermjs/xterm.js/master/LICENSE), lines 0–17.
   - **Observed:** It provides browser terminal presentation, input/output, Unicode and accessibility features, but does not itself provide a shell.
   - **Synthesis:** If used, connect it only to a deterministic fictional command parser. No real process, filesystem, network terminal, or arbitrary command execution is needed.
   - Confidence: high.

8. **Phaser — bridge between canvas scene and semantic HTML**

   - Sources:
     - [Phaser DOM Element documentation](https://docs.phaser.io/phaser/concepts/gameobjects/dom-element), lines 58–85;
     - [Phaser input documentation](https://docs.phaser.io/phaser/concepts/input), lines 1040–1092;
     - [Phaser package metadata](https://github.com/phaserjs/phaser/blob/master/package.json), lines 367–414.
   - License: MIT according to package metadata lines 381–383. This does not automatically license third-party art.
   - **Observed:** Phaser can position HTML elements over the canvas and receive keyboard, pointer, and gamepad input. The documentation identifies DOM layering, camera, and native-listener constraints.
   - **Synthesis:** Use Phaser for room/world rendering and real HTML for the terminal, code entry, event transcript, and accessible alternatives.
   - Confidence: high.

9. **Browser persistence, visibility, and accessibility constraints**

   - [MDN LocalStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage), lines 172–212: persistence is origin-scoped, can be blocked, and is unreliable for direct `file:` URLs.
   - [MDN Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API), lines 172–208: hidden-tab events are widely available, while animation/timers may be throttled.
   - [W3C WCAG 2.2 keyboard guidance](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html), lines 48–57 and 81–103: provide comparable keyboard functionality and avoid pointer-only mechanisms.
   - **Observed:** These APIs can support persistence and optional tab-boundary reactions, but they are not dependable as the sole completion path.
   - Confidence: high.

---

### Candidate ontology

`ontology_id`: `ONT-GAME-META-INTERFACE-CANDIDATE-01`

`design_thesis`:

> The interface is a fictional machine. Progress comes from discovering which input channel an observer can see, preserving evidence across a controlled reboot, and rerouting interaction—not from guessing an undocumented browser trick.

### Entities

- `Player`
- `PlayerAvatar`
- `RoomMachine`
- `MachineIdentifierFragment`
- `UnitIdentifier`
- `EvidenceConsole`
- `CredentialInput`
- `InterfaceSurface`
- `InputChannel`
- `InputBinding`
- `ObservedChannel`
- `MaintenanceChannel`
- `ObserverModel`
- `WordRain`
- `EventToken`
- `CandidateEventSequence`
- `PersistentEvidence`
- `VolatileInterference`
- `ControlledReboot`
- `AvailabilityProjection`
- `Contradiction`
- `FaultClassification`
- `AccessibilityEquivalent`
- `PuzzleResidue`

### Relations

```text
RoomMachine --emits--> MachineIdentifierFragment
MachineIdentifierFragment --contributes_to--> UnitIdentifier
UnitIdentifier --unlocks--> EvidenceConsole
EvidenceConsole --activates--> WordRain
InputBinding --routes--> InputChannel
ObserverModel --observes--> ObservedChannel
MaintenanceChannel --bypasses--> ObserverModel
Player --selects--> EventToken
EventToken --contributes_to--> CandidateEventSequence
CandidateEventSequence --contradicts--> AvailabilityProjection
ControlledReboot --preserves--> PersistentEvidence
ControlledReboot --clears--> VolatileInterference
CandidateEventSequence --supports--> FaultClassification
AccessibilityEquivalent --realizes_same_verb_as--> InputChannelChange
FaultClassification --does_not_authorize--> BusinessRule
```

### Player verbs

```text
inspect
collect
assemble_identifier
enter_code
activate_console
observe_rain
select_event
review_log
reroute_input
connect_optional_gamepad
reboot_machine
compare_persisted_and_volatile_state
construct_timeline
classify_fault
preserve_residue
```

### Candidate state machine

```text
EXPLORING_ROOMS
  -- three machine fragments collected -->
IDENTIFIER_COMPLETE
  -- exact identifier entered -->
CONSOLE_UNLOCKED
  -- console activated -->
WORD_RAIN_OBSERVED_CHANNEL

WORD_RAIN_OBSERVED_CHANNEL
  -- event selected -->
SELECTION_PREDICTED_OR_CORRUPTED
  -- input channel rerouted -->
WORD_RAIN_MAINTENANCE_CHANNEL

WORD_RAIN_MAINTENANCE_CHANNEL
  -- correct event sequence assembled -->
TRACE_CONSTRUCTED
  -- controlled reboot -->
EVIDENCE_PERSISTS_INTERFERENCE_RESETS
  -- persisted trace compared with projection -->
SEMANTIC_CONTRADICTION_VISIBLE
  -- candidate fault recorded -->
PUZZLE_COMPLETE_WITH_RESIDUE
```

### Concrete BUG-4821 puzzle loop

1. The player moves through the warehouse, quality area, and storefront room.
2. Each room’s machine exposes one identifier fragment. Together they form the exact unit identifier, such as `LP-2041`.
3. The evidence console initially accepts no other interaction. Entering the unit identifier unlocks it and starts the word rain.
4. Event names and misleading business-state words fall together. On the default `P1 / PROJECTION` channel, the observer predicts or alters the player’s selection, making a clean timeline impossible.
5. A console log exposes the structural fact that `P1` is being observed. It does not directly give the solution.
6. The player reroutes input to `P2 / MAINTENANCE`:
   - optional surprise path: connect or use a gamepad;
   - universal path: keyboard/pointer-operable patch-panel control;
   - terminal path: a fictional command such as `route input maintenance`.
7. The player captures the ordered event sequence from the rain.
8. A controlled in-game reboot preserves collected evidence but clears the observer’s volatile interference.
9. The console now places the reconstructed event trace beside the storefront projection, revealing that execution was deterministic while meaning was incomplete.
10. Completion records a candidate semantic-rule gap and leaves the transfer-inspection question as explicit unresolved residue. It never allows the player to “approve policy” merely by solving the puzzle.

### Safe boundary-breaking rules

- Do not inspect real save files, filesystem contents, browser history, clipboard, controller identity, or unrelated LocalStorage.
- Do not mimic a genuine browser, operating-system, security, data-loss, or crash alert closely enough to deceive.
- Do not auto-close the page or force a real reload.
- `ControlledReboot` should be an explicit in-game action. A browser reload may reproduce it, but must not be required.
- Page visibility can pause the rain or produce an optional “observer lost visibility” log, but tab switching must not be the only solution.
- The gamepad is an enhancement, never a required possession.
- Store only bounded game state under a namespaced origin key and provide visible reset/delete controls.
- Keep proprietary precedents at the level of abstract relations; use original terminology, art, story, audiovisual language, and puzzle construction.

### Accessibility and browser constraints

- Every gamepad, pointer, drag, and patch-cable action needs a discoverable keyboard equivalent.
- No timed multi-key chord should be required.
- Provide a reduced-motion mode where word rain becomes an ordered/filterable event ledger.
- Keep the semantic event list in DOM alongside the canvas presentation.
- Announce phase changes and selected-event count, not every falling word, to avoid live-region flooding.
- Preserve focus when the terminal opens and return it predictably when it closes.
- Pause animation when the document is hidden; do not infer failure from background throttling.
- Serve through HTTP rather than relying on `file:` behavior if persistence matters.
- Provide high contrast, scalable text, input remapping, and a “show interaction equivalents” help surface.

### Implementation consequences

- Keep `GameState`, `EvidenceState`, `InputRouter`, `ObserverModel`, and rendering separate.
- Phaser owns rooms, machines, motion, and visual rain.
- Semantic HTML owns code entry, terminal commands, ordered evidence, help, and accessibility.
- `InputRouter` maps keyboard, pointer, touch, and optional gamepad actions to logical channels; puzzle state never depends directly on a device index.
- Persist only evidence and puzzle milestones. Keep interference state session-local so the reboot relation is testable.
- If xterm.js is used, connect it to a whitelist command parser only.
- Tests should cover:
  - identifier fragments cannot be skipped;
  - wrong code does not start rain;
  - observed channel corrupts predictably rather than randomly;
  - all input modalities can reroute;
  - controlled reboot preserves evidence and clears interference;
  - reduced-motion path reaches the same state;
  - the final state remains `candidate`, never `policy_accepted`.

### Failure and residue

- `IDENTIFIER_INCOMPLETE`: console stays locked and indicates missing provenance, not the answer.
- `CHANNEL_UNAVAILABLE`: equivalent patch-panel and command routes remain usable.
- `PERSISTENCE_BLOCKED`: fall back to in-memory controlled reboot and explain reduced persistence.
- `EVENT_SEQUENCE_WRONG`: show the first causal inconsistency without resetting collected evidence.
- `FALSE_GREEN`: a superficially repaired projection can appear, but completion remains blocked until the trace/meaning contradiction is recorded.
- `UNRESOLVED_POLICY`: warehouse-transfer inspection validity remains explicit residue rather than being inferred.

### Open questions

- Should the three room fragments form `LP-2041`, a console-specific access token, or both?
- How much failed interaction is enough to teach that `P1` is observed without creating frustration?
- Is the optional real-gamepad surprise worth its testing and discoverability cost?
- Should the controlled reboot be required once, or remain an optional shortcut for revealing persistent-versus-volatile state?
- Can the word rain remain legible at mobile sizes without reducing the ontology puzzle to a text list?
- Which exact event subset makes the contradiction inferable without merely reproducing the essay?
- Should the observer corrupt selections, predict them visibly, or silently omit one event? This needs playtesting; “clever” is not yet evidence of fun.

The strongest synthesis is a hybrid of the MGS input-channel relation, OneShot’s persisted/volatile boundary, Hungry Fridge’s optional-controller/browser fallback, and a simulated terminal with no real-system authority. This is a candidate design ontology only.

## Agent 3 — Brandenburg, Martin

## Explorer 3 return — social authority and stateful consequence

Accessed 2026-09-01. Inventory was used only for discovery, not as evidence.

### Observed precedents

1. [Papers, Please — official presskit](https://papersplea.se/presskit/)  
   Author/publisher: Lucas Pope / 3909 LLC. Rights: proprietary commercial game; mechanics may inspire abstractions, but do not copy art, interface, names, text, or code.

   Source-local anchors:

   - `A Dystopian Document Thriller`, lines 15–18: the player uses supplied documents plus inspection, search, and fingerprint systems to decide admission, refusal, or arrest.
   - `Information`, lines 20–38: identifies developer/publisher and twenty story endings.
   - [Lucas Pope development log, `The Overwatcher`](https://dukope.com/devlogs/papers-please/tig-10/), lines 102–116: a proposed visible enforcement schedule was removed because players could game the light rather than engage the discrepancy system; destabilizing the right/wrong judgment also broke the core discrepancy hunt.
   - Same devlog, `One of my mantras`, lines 241–250: scattered instruction was centralized in the rulebook after players found the mechanics too opaque.
   - Same devlog, `31st Day`, lines 251–267: decisions either carry into a later ending variation or terminate early with an ending.
   - [Phone-port postmortem, `Step 2: Phoneterface`](https://dukope.com/devlogs/papers-please/mobile/), lines 45–103: three information regions remained visible; the phone target required no squinting, zooming, or precision; drag-and-drop was replaced with a carousel and rack for legibility.

   Observed mechanic:

   - Evidence comparison produces a judgment.
   - A formal rule, human story, personal survival pressure, and later ending can conflict.
   - Correctness feedback must be legible, but enforcement should not become a trivial timing exploit.
   - Prior decisions may persist or terminate the run.

   Confidence: high.

2. [Orwell: Keeping an Eye on You — official Osmotic Studios page](https://www.osmoticstudios.com/orwell-keeping-an-eye-on-you/)  
   Author/publisher: Osmotic Studios; commercial title. Rights: proprietary; copy no art, story, interface, text, or character material.

   Source-local anchors:

   - `# Orwell: Keeping an Eye on You`, lines 15–18.
   - Line 16 distinguishes machine-accessible data from the human researcher’s decision about which information is supplied to security forces and which is rejected.
   - Lines 15 and 18 explicitly make supplied information consequential and question whether subjects are actually guilty and what revealed data means.

   Observed mechanic:

   - Discovery and submission are different verbs.
   - A player’s selected evidence changes institutional action.
   - The system does not interpret evidence neutrally; the player becomes part of the authority chain.

   Confidence: high.

3. [The Evolution of Trust — GitHub repository](https://github.com/ncase/trust)  
   Author: Nicky Case. Rights: repository original work is CC0; [LICENSE](https://github.com/ncase/trust/blob/gh-pages/LICENSE) is CC0-1.0. The README separately credits third-party audio and libraries, including differently licensed material, so asset reuse still requires an asset-by-asset audit.

   Source-local anchors:

   - [`words.html`](https://raw.githubusercontent.com/ncase/trust/gh-pages/words.html):
     - `oneoff_0_top`: cooperate or cheat produces paired outcomes.
     - `iterated_intro_top`: the same opponent is encountered repeatedly for an unknown number of rounds.
     - `character_tft`, `character_grudge`, `character_prober`: strategies remember prior behavior differently.
     - `tournament_intro` and `evolution_intro`: accumulated outcomes alter later populations.
   - [`js/sims/PD.js`](https://raw.githubusercontent.com/ncase/trust/gh-pages/js/sims/PD.js):
     - `PD.PAYOFFS_DEFAULT`, `PD.getPayoffs`, `PD.playOneGame`
     - `Logic_tft`, `Logic_tf2t`, `Logic_grudge`
     - The transition depends on both agents’ acts; strategies retain different histories.
   - [`js/slides/6_Slides_Noise.js`](https://raw.githubusercontent.com/ncase/trust/gh-pages/js/slides/6_Slides_Noise.js):
     - `SLIDES.push({ id: "noise" })`, `STAGES`, `_foreverWar`
     - Lines 25–92 turn one mistaken action into a continuing retaliatory sequence.
     - Lines 148–166 set `PD.NOISE = 0.05`, making interpretation error an explicit system variable.

   Observed mechanic:

   - Trust is not a decorative meter; it emerges from remembered interaction.
   - A mistaken signal can create self-sustaining conflict.
   - Different memory policies create different later behavior.
   - The consequence model is inspectable and deterministic except where noise is explicitly introduced.

   Confidence: high.

4. [Coming Out Simulator 2014 — GitHub repository](https://github.com/ncase/coming-out-simulator-2014) and [developer account](https://blog.ncase.me/coming-out-simulator-2014/)  
   Author: Nicky Case. Rights: repository declares CC0/Unlicense for code and art; the [UNLICENSE](https://github.com/ncase/coming-out-simulator-2014/blob/gh-pages/UNLICENSE) permits copying and modification. Use only its state-memory pattern; its autobiographical subject matter should not be imitated.

   Source-local anchors:

   - Repository README, lines 171–188: characters remember dialogue choices, and choices drive the story.
   - Developer account, `Make every character remember everything`, lines 66–69: minor choices are echoed later without exponentially branching every scene.
   - `First Prototype`, lines 78–88: choice framing was revised to avoid a linear obvious gradient; honesty and lying create different immediate and sustained pressures.
   - `Second Prototype`, lines 97–115: earlier decisions flavor later scenes; three endings express different relations between truth and protection.
   - [`js/game/dinner_1.js`](https://raw.githubusercontent.com/ncase/coming-out-simulator-2014/gh-pages/js/game/dinner_1.js): `$.what_you_called_out` and `$.waiting_action` persist minor actions.
   - [`js/game/dinner_2.js`](https://raw.githubusercontent.com/ncase/coming-out-simulator-2014/gh-pages/js/game/dinner_2.js): `$.studying_subject`, `$.relationship`, `$.lying_about_relationship`, and `Grades_Start_1` turn earlier statements into later contradiction checks.
   - [`js/game/outro.js`](https://raw.githubusercontent.com/ncase/coming-out-simulator-2014/gh-pages/js/game/outro.js): `$.order_of_stories`, `Finale_1`, and `Finale_4` reflect both selected content and selection order.

   Observed mechanic:

   - Small remembered choices can produce convincing continuity without building a fully branching tree.
   - Contradiction is detected by comparing current statements with retained state.
   - A later echo can be more meaningful than an immediate score change.

   Confidence: high.

### Synthesis — BUG-4821 consequence ontology candidate

`ontology_id`: `BUG4821-SOCIAL-AUTHORITY-CONSEQUENCE-CANDIDATE`

`design_thesis`: The player does not win by finding a plausible filter. They win by distinguishing evidence, interpretation, owner commitment, implementation, and runtime consequence. A local green result can become a false-green state when a required authority or scope gate is missing.

Entities:

- `PlayerInvestigator`
- `EvidenceFragment`
- `EvidenceBundle`
- `EventTrace`
- `PolicyStatement`
- `Claim`
- `Interpretation`
- `Scope`
- `RuleCandidate`
- `MeaningOwner`
- `OwnerDecision`
- `AcceptedRule`
- `SystemContract`
- `RuntimeProjection`
- `AvailabilitySignal`
- `PurchaseCommitment`
- `CustomerConsequence`
- `TrustState`
- `FalseGreenSignal`
- `ResidueQuestion`
- `ContainmentDecision`
- `ReplayEvidence`

Relations:

- `PlayerInvestigator --collects--> EvidenceFragment`
- `EvidenceFragment --supports_or_contradicts--> Claim`
- `EvidenceBundle --grounds--> Interpretation`
- `Interpretation --is_bounded_by--> Scope`
- `RuleCandidate --is_submitted_to--> MeaningOwner`
- `MeaningOwner --records--> OwnerDecision`
- `OwnerDecision --may_promote--> AcceptedRule`
- `AcceptedRule --constrains--> SystemContract`
- `RuntimeProjection --claims_to_represent--> AcceptedRule`
- `AvailabilitySignal --invites--> PurchaseCommitment`
- `PurchaseCommitment --creates--> CustomerConsequence`
- `PrematurePromotion --produces--> FalseGreenSignal`
- `Consequence --changes--> TrustState`
- `UnansweredQuestion --is_preserved_as--> ResidueQuestion`
- `ResidueQuestion --requires--> ContainmentDecision`

Candidate state machine:

```text
UNEXAMINED
  --inspect records-->
EVIDENCE_PARTIAL
  --reconstruct event sequence-->
EXPLANATION_CANDIDATE
  --bind source + scope-->
RULE_CANDIDATE
  --submit-->
DECISION_PENDING

DECISION_PENDING
  --owner requests evidence-->
EVIDENCE_PARTIAL
  --owner rejects interpretation-->
EXPLANATION_CANDIDATE
  --owner accepts bounded rule-->
CONTRACT_READY

CONTRACT_READY
  --change projection-->
IMPLEMENTED_UNVERIFIED
  --replay fixture-->
RUNTIME_VERIFIED
  --observe honest storefront signal-->
RESOLVED_WITH_RESIDUE
```

Failure branches:

```text
RULE_CANDIDATE
  --patch before decision-->
LOCAL_TEST_GREEN
  --publish signal-->
FALSE_GREEN
  --customer orders unavailable unit-->
CUSTOMER_HARM
  --rollback + disclose-->
RECOVERED_WITH_TRUST_DEBT

DECISION_PENDING
  --invent answer to transfer-policy question-->
FALSE_CLOSURE
  --transferred unit projected sellable-->
LATENT_HARM

DECISION_PENDING
  --record unresolved residue + containment-->
HONEST_INCOMPLETENESS
```

Player verbs:

- inspect
- compare
- reconstruct
- annotate contradiction
- bind source
- set scope
- submit
- withhold
- challenge
- commit
- replay
- observe consequence
- record residue
- contain uncertain state

Puzzle loop:

1. Collect event identifiers from machines in the three rooms.
2. Enter the assembled identifier into the locked investigation terminal.
3. Word rain begins; the player captures only events that form the deterministic execution chain.
4. The player constructs a claim from trace, implemented rule, and policy text.
5. The terminal offers an attractive `PATCH NOW` action that makes the local test turn green but lacks an owner-decision token.
6. If selected, the storefront later accepts an order: the earlier green indicator is reclassified as `false_green`.
7. If the player submits a source-bound, scoped candidate, the fictional owner can accept, reject, or request evidence.
8. Runtime replay tests implementation separately.
9. The warehouse-transfer question has no discoverable answer. The successful act is to record residue and contain transferred returns, not guess.

Three-room mapping:

- Warehouse room: physical presence, event ledger, intake machine, unit identity.
- Policy/authority room: policy source, scope fragments, owner terminal, accepted/candidate distinction.
- Storefront room: availability signal, customer commitment, delayed consequences, replay monitor.
- The rooms should remain revisitable; later consequences alter machines and dialogue in earlier rooms.

False-green presentation:

- Give immediate positive audiovisual feedback when the local test passes.
- Preserve a visible gate ledger showing that owner decision and runtime evidence are still absent.
- Later customer action changes the green state to amber/red and reveals why.
- The consequence must be causally legible, not an arbitrary gotcha.

Trust semantics:

- Avoid a single morality score.
- Track at least:
  - `customer_trust`
  - `policy_owner_confidence`
  - `operations_confidence`
  - `evidence_integrity`
- Trust changes should cite the triggering committed action.
- A rejected candidate should not reduce trust when the player honestly presents bounded evidence.
- Concealing uncertainty or presenting a candidate as accepted should reduce evidence integrity.

Failure and residue:

- Wrong hypotheses remain recoverable.
- Submission is reviewable until an explicit commit.
- Customer-facing publication is irreversible inside that run, but the player may later repair and disclose it.
- Residue is not a failed puzzle. Correctly naming the unanswered transfer question is a legitimate completion state.
- An ending should explain what was established, what was merely accepted, what was verified, and what remains unresolved.

### Browser and accessibility implications

These are synthesis, informed partly by Pope’s phone-port account:

- Keep critical policy, evidence, and commit status in semantic DOM controls beside the Phaser/canvas world.
- Support keyboard navigation and an inspection list as alternatives to pointer dragging.
- Use labels/icons/text, not color alone, for `candidate`, `accepted`, `verified`, and `false green`.
- Before irreversible publication, present a review screen showing evidence, scope, missing gates, and consequence.
- Do not make the authority token a hidden-pixel object; it should be earned through reasoning.
- Word rain needs pause, speed control, reduced-motion mode, and a static searchable transcript.
- Persist a consequence ledger so players with memory or attention limitations can review why state changed.
- All audio signals need text equivalents; ambient sound cannot carry a required clue.
- Mobile layout should avoid simultaneous tiny documents; use a readable carousel plus a compact evidence rack.
- Replay should create an alternate timeline rather than silently erase the first run, preserving consequence without denying experimentation.
- Localize event tokens independently from canonical identifiers so translations do not break puzzle validation.

### Open questions

- Should the fictional owner decision be deterministic from evidence, or should it expose legitimate policy ambiguity?
- How much consequence delay remains understandable before players experience it as arbitrary punishment?
- Should `PATCH NOW` be a viable emergency-containment path when it blocks sales rather than silently changing the business rule?
- Can players repair trust after false-green publication, or is trust debt intentionally permanent for that run?
- How are save/reload and alternate timelines explained without weakening irreversible commitment?
- Should the game expose all trust dimensions, or reveal only the evidence ledger and let social reactions communicate trust?
- How will the experience distinguish “owner accepted this bounded rule” from “the rule is physically true”?
- Does the transfer residue block only transferred returns or all returned inventory until clarified?
- Which exact art/audio assets, if any, may be reused? Recommendation: create original assets even for CC0 precedents; reuse only abstract state patterns.
- Playtesting must determine whether the false-green branch feels like a reasoned consequence rather than a designer trap.

This is a research candidate only. It does not adopt an ontology, authorize DomainSpec authoring, or prove the game implementation.
