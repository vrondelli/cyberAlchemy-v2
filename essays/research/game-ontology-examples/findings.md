# Four candidate game ontologies for BUG-4821

Status: research synthesis / candidate only  
Dispatch: `2026-09-01-game-ontology-examples`  
Evidence closure: `ready`  
Authority effect: none

## Concise answer

The BUG-4821 game should not be designed as one undifferentiated escape-room
graph. The strongest research-backed structure is four cooperating, non-overlapping
candidate ontologies:

1. a **diegetic trace ontology** for records, provenance, chronology, and bounded
   hypotheses;
2. a **spatial systems ontology** for rooms, traversal, inspection envelopes,
   physical affordances, and recoverable world state;
3. a **meta-interface ontology** for the locked console, word rain, logical input
   routing, and controlled persistence;
4. a **social authority ontology** that begins only after a bounded finding is
   submitted and governs review, commitment, containment, consequence, and
   residue.

This decomposition is a **synthesis**, not a product decision. It follows the
evidence-closure ownership partition and its repaired boundaries
([evidence closure](evidence-closure.json), rows `ONT-DIEGETIC` through
`ONT-SOCIAL`; [repair addenda](repair-addenda.md#narrowed-social-ontology-boundary)).
The precedents establish that these mechanics exist and can be implemented;
they do not establish that this particular combination is understandable or fun.

## Source matrix

All sources were accessed on 2026-09-01. “Observed” means the source supports the
stated precedent locally. It does not mean that the BUG-4821 synthesis has been
playtested or adopted.

| Lane | Source | Source-local selector or immutable binding | Observed contribution | Rights posture |
|---|---|---|---|---|
| Diegetic | [Her Story — official site](https://www.herstorygame.com/about/) | `How does it work?` | A fictional terminal returns non-linear records in response to player queries; the player constructs the account. | Proprietary; abstract mechanic only. |
| Diegetic | [Return of the Obra Dinn devlog #734](https://dukope.com/devlogs/obra-dinn/tig-30/) and [#848](https://dukope.com/devlogs/obra-dinn/tig-37/) | `The Book`, `Corpse Hunting`, `Fate Validation`, `SVO Fates`; `Animating the Book` | A diegetic evidence organizer supports non-linear discovery, structured hypotheses, and direct navigation through accumulated evidence. | Proprietary; no interface, prose, art, cadence, or puzzle sequence reuse. |
| Diegetic | [Untrusted](https://github.com/AlexNisnevich/untrusted/tree/ab4a8ed28058a3f4b53cc48972b756ef9c97e862) | commit `ab4a8ed28058a3f4b53cc48972b756ef9c97e862`; `README.md` sections `Overview`, `.jsx file format`, `License` | An explicitly bounded machine interface causally changes world state. | CC-BY-NC-SA-3.0 plus separate commercial-code terms; study only unless cleared. |
| Diegetic | [detective-board](https://github.com/stefankober/detective-board/tree/79ebc84796c7b984023c96c51982742fd3ce3d53) | commit `79ebc84796c7b984023c96c51982742fd3ce3d53`; release `v1.0.2` at `22b6551cc41b92e9def04b70f861324927069c42`; `Creating Objects`, `Autobackup`, `Why use it?`, `License` | Movable notes and typed links externalize relationships; versioned browser-local backups preserve revisions. | MIT code; dependencies and imported player material remain separate. |
| Diegetic | [CyberQuest](https://github.com/ReinVelt/CyberQuest/tree/b7630650b0910267bbac09d57ee9b13a1a507ba9) | commit `b7630650b0910267bbac09d57ee9b13a1a507ba9`; `v1.3` at `4db139241430b25502e24ade09593e5f7539afad`; README `Features`, `Gameplay`, `Controls`, `Technology Stack`, `License` | Browser rooms, inspectable documents, an investigation board, autosave, touch, narration, and non-punitive failure coexist. | CC-BY-SA-4.0; no adaptation planned. |
| Spatial | [Madrona Escape Room](https://github.com/shacklettbp/madrona_escape_room/tree/21f674951c68888045c824b5b981e158975f9e90) | commit `21f674951c68888045c824b5b981e158975f9e90`; `README.md`; `src/sim.cpp` lines 161–293 and 622–642; `src/level_gen.cpp` lines 382–563 | Serial rooms, short-range target tests, derived actuator/door state, and persistent versus sustained conditions provide explicit spatial-state structure. | MIT; an RL environment witnesses structure, not human fun. |
| Spatial | [EvscapeRoom](https://github.com/Griatch/evscaperoom/tree/f50d911c97d2b828da256269327900d3197f3687) | commit `f50d911c97d2b828da256269327900d3197f3687`; README `Playing`, `Technical`, `Design Philosophy`; `state.py` lines 38–107, 142–184, 246–277 | Inspecting reveals verbs; critical state cannot be removed into a soft lock; transitions validate before persistence. | BSD-3-Clause; transfer from text to visual 3D is unproven. |
| Spatial | [Farama MiniWorld](https://github.com/Farama-Foundation/Miniworld/tree/c660156dd73994e55ad81a4e2925582399446aba) | commit `c660156dd73994e55ad81a4e2925582399446aba`; `docs/content/design.md` lines 8–65; `threerooms.py` lines 9–80 | Room/portal topology, entity placement, and a small action vocabulary can be modeled separately. | Apache-2.0; topology witness only. |
| Spatial | [Three.js](https://github.com/mrdoob/three.js/tree/20bd26f2d1f2797602c084975b793591b3472558) | commit `20bd26f2d1f2797602c084975b793591b3472558`; `PointerLockControls.js` lines 37–60, 120–134; `Raycaster.js` lines 8–21, 58–69 | Explicit lock states and bounded ray selection can realize first-person targeting. | MIT; technical capability is not engine selection. |
| Spatial | [Enable3D](https://github.com/enable3d/enable3d/tree/17cc02f9f79936a0b60c339650a8705970cd50a6) | commit `17cc02f9f79936a0b60c339650a8705970cd50a6`; README packages section | A Three.js/physics/Phaser bridge exists. | LGPL-3.0; compatibility, packaging, bundle, maintenance, and accessibility review required before selection. |
| Spatial | [W3C Pointer Lock 2.0 Working Draft](https://www.w3.org/TR/2026/WD-pointerlock-2-20260225/) and [WCAG no-keyboard-trap source](https://github.com/w3c/wcag/blob/2cde22ec6cfa8d5a6ec00d2ffae91509a24295db/understanding/20/no-keyboard-trap.html#L37-L47) | dated draft 2026-02-25, sections 8–10; WCAG commit `2cde22ec6cfa8d5a6ec00d2ffae91509a24295db`, lines 37–47 and 70–73 | Captured navigation needs an explicit exit and an equivalent non-trapping route. | Standards/guidance; the Pointer Lock document remains a Working Draft. |
| Spatial | [Microsoft XAG 103](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/103) and [XAG 107](https://learn.microsoft.com/en-us/xbox/accessibility/xbox-accessibility-guidelines/107) | public pages disclose source SHA `fcf89d7c7ec0976ca008b7a9dfc232cfc44e2f68`, but source repository was not publicly dereferenceable; `Goal`, `Overview`, `Implementation guidelines` | Critical cues should cross sensory channels; pointer/analog actions need digital equivalents and should avoid required rapid/chorded inputs. | Public guidance; disclosed bytes not independently reproduced. |
| Meta | [Extended Fiction in Game Design](https://www.gamedeveloper.com/design/extended-fiction-in-game-design-metal-gear-solid-and-emily-is-away) | metadata lines 14–20; mechanic discussion lines 41–49 | A player can escape an observer’s predictive model by acting through a system boundary the observer does not see. | Proprietary precedent and copyrighted article; retain only the abstract observation relation. |
| Meta | [OneShot narrative review](https://media.gdcvault.com/gdc2019/GameNarrativeReview/Kleinman_Erica-Paper.pdf) | pages 3 and 5–6, lines 128–140 and 193–233 | Controlled close/reopen and retained state can extend fiction to the player’s host interface. | Proprietary game/copyrighted paper; no real-system manipulation or puzzle imitation. |
| Meta | [Tearaway GDC session](https://www.gdcvault.com/play/1021305/Believable-Make-Believe-Putting-the) | overview lines 28–35; speaker/track lines 36–43; metadata lines 52–56 | Game–player collaboration and fourth-wall awareness can be explicit design material. | Proprietary; abstract inspiration only. |
| Meta | [MDN Gamepad API controls](https://developer.mozilla.org/en-US/docs/Games/Techniques/Controls_Gamepad_API) | API lines 172–186; alternate mode lines 191–199; policy/layout caveats lines 232–239 | Hungry Fridge is one browser example where gamepad presence changes mode while a keyboard route remains available. | Documentation/example; optional device path only. |
| Meta | [Decrypted](https://github.com/hasderhi/Escape-Room/tree/99e0e7888053d1098f8f674185b4c1d82c1b3319) | commit `99e0e7888053d1098f8f674185b4c1d82c1b3319`; README lines 0–19, 22–57; license lines 0–10 | A browser can host a fictional desktop, terminal, and persisted fictional filesystem. | GPL-3.0-or-later; separate icon provenance; no covered code or presentation reuse. |
| Meta | [Caesar Cipher Escape Room](https://github.com/CyberSnackCat/caesar-escape-room/tree/cd68dbd0ca5f6592e169cd2a06968417f9418393) | commit `cd68dbd0ca5f6592e169cd2a06968417f9418393`; README lines 17–44, 71–76; LICENSE lines 0–18 | Progressive decoding can coexist with keyboard controls and high contrast. | MIT; evidence for affordances, not puzzle adoption. |
| Meta | [xterm.js](https://github.com/xtermjs/xterm.js/tree/c58ea3637f3968e0e6e79cd92cf9aace7ef89ee2) | commit `c58ea3637f3968e0e6e79cd92cf9aace7ef89ee2`; README lines 0–13; LICENSE lines 0–17 | A browser terminal component can expose accessible I/O without being a shell. | MIT; any use must connect only to a deterministic fictional parser. |
| Meta | [Phaser](https://github.com/phaserjs/phaser/tree/02d8931b626d9764c133cbb3fbf99966c03c757c) | commit `02d8931b626d9764c133cbb3fbf99966c03c757c`; `package.json` lines 0–13 | A browser game renderer can coexist with semantic HTML and multiple input sources. | MIT framework; no implication for third-party assets. |
| Social | [Papers, Please presskit](https://papersplea.se/presskit/) and [development log](https://dukope.com/devlogs/papers-please/tig-10/) | presskit `A Dystopian Document Thriller`, `Information`; devlog `The Overwatcher`, `One of my mantras`, `31st Day` | Evidence comparison produces judgment; remembered decisions can alter later outcomes; opaque rules and trivial feedback exploits damage the core loop. | Proprietary; abstract decision/consequence patterns only. |
| Social | [Orwell: Keeping an Eye on You](https://www.osmoticstudios.com/orwell-keeping-an-eye-on-you/) | title and page lines 15–18 | Discovery and submission are distinct, and submitted information changes institutional action. | Proprietary; abstract verb/authority distinction only. |
| Social | [The Evolution of Trust](https://github.com/ncase/trust/tree/6ec45d73befdb922bd40654dd1c1c903a953562f) | commit `6ec45d73befdb922bd40654dd1c1c903a953562f`; `words.html`; `PD.js`; `6_Slides_Noise.js` | Remembered interaction, explicit noise, and inspectable state transitions create delayed trust consequences. | Repository original work CC0; third-party assets have separate, sometimes restrictive terms. |
| Social | [Coming Out Simulator 2014](https://github.com/ncase/coming-out-simulator-2014/tree/69918f33e749117586ebd0fb57d9ec6ab047e7a3) | commit `69918f33e749117586ebd0fb57d9ec6ab047e7a3`; `dinner_1.js`, `dinner_2.js`, `outro.js`; [developer account](https://blog.ncase.me/coming-out-simulator-2014/) `Make every character remember everything` | Small remembered choices and retained statements can produce later echoes and contradiction checks without an exponential story tree. | Unlicense for repository code/art; autobiographical expression is not an imitation target. |

The source detail and confidence records above are preserved in the verbatim
[explorer returns](research.md); immutable-binding and imitation repairs are in
the [repair addenda](repair-addenda.md).

## Cross-ontology reference and handoff contract

The following **synthesis** closes the candidate boundaries established by the
evidence-closure ownership partition. A reference transports a typed projection
from its exclusive owner; it does not transfer ownership or authorize the
consumer to infer more than the payload states
([evidence closure](evidence-closure.json), `repair_summary.ownership_partition`;
[ownership repairs](repair-addenda.md#exclusive-ownership-boundary)).

| reference ID and type | exclusive owner | producer transition or relation | payload and invariant | consumer |
|---|---|---|---|---|
| `REF-SPATIAL-EVIDENCE-TOKEN` : `EvidenceTokenRef` | `ONT-GAME-SPATIAL-SYSTEMS-TRAVERSAL` | `Machine: powered -> identifier_observed` or `Machine --reports--> EvidenceTokenRef` | `{room_id, machine_id, observation_kind, observed_value, world_state_version, source_locator}`; `observation_kind` is exactly `identifier_observed` or `interface_reachable`; records acquisition context, not semantic meaning. | Diegetic lane creates or binds an `EvidenceItem`; meta lane may consume `interface_reachable` only to enable its console transition. |
| `REF-META-EVENT-TOKEN-SET` : `EventTokenSetRef` | `ONT-GAME-META-INTERFACE-INPUT-BOUNDARY` | `WordRain --emits--> EventToken`; `WordRain --projects_selection_as--> EventTokenSetRef`. | One or more `EventToken` instances with `{canonical_token_id, displayed_text, deterministic_seed, selection_index, interface_session_id}`; token emission/selection is proven, but event provenance or chronology is not. | Diegetic lane resolves selected tokens into `EventRecord` candidates and supplies source bindings. |
| `REF-META-INTERFACE-GATE` : `InterfaceGateRef` | `ONT-GAME-META-INTERFACE-INPUT-BOUNDARY` | `console: credential_complete -> unlocked`; `EvidenceConsole --projects_gate_as--> InterfaceGateRef`. | `{console_id, credential_binding, channel_state, gate_state}`; can report `locked`, `unlocked`, or `routed`, never trace correctness. | Spatial lane may render reachability/locked-state feedback without owning interface semantics. |
| `REF-DIEGETIC-TRACE` : `DiegeticTraceRef` | `ONT-GAME-DIEGETIC-TRACE-RECONSTRUCTION` | `CoverageGate --projects_trace_as--> DiegeticTraceRef`; attached at `semantic_gap_candidate -> submitted_bounded_finding`. | `{ordered_event_record_ids, adjacency_claim_ids, state_comparison_ids, coverage_result}`; every event appears once, is source-bound, and has supported adjacency. | Social lane through `SubmittedBoundedFinding`. |
| `REF-DIEGETIC-EVIDENCE-BUNDLE` : `EvidenceBundleRef` | `ONT-GAME-DIEGETIC-TRACE-RECONSTRUCTION` | `CoverageGate --projects_evidence_as--> EvidenceBundleRef`. | Immutable set of evidence IDs and their source-binding IDs; bundle membership does not imply policy acceptance. | Social lane through `SubmittedBoundedFinding`. |
| `REF-DIEGETIC-CLAIM` : `ClaimRef` | `ONT-GAME-DIEGETIC-TRACE-RECONSTRUCTION` | `Hypothesis --projects_as--> ClaimRef`. | `{claim_id, predicate, interpretation_status: candidate}`; status cannot be `accepted` or `verified`. | Social lane reviews or contains the candidate claim. |
| `REF-DIEGETIC-SOURCE-BINDING` : `SourceBindingRef` | `ONT-GAME-DIEGETIC-TRACE-RECONSTRUCTION` | `SourceBinding --projects_as--> SourceBindingRef`. | `{source_binding_id, source_system_id, record_id, source_locator}`; locator is required and immutable for the submission. | Social lane checks that review inputs remain source-bound. |
| `REF-DIEGETIC-SCOPE` : `ScopeRef` | `ONT-GAME-DIEGETIC-TRACE-RECONSTRUCTION` | `Hypothesis --is_bounded_by--> ScopeRef`; `SubmittedBoundedFinding --is_bounded_by--> ScopeRef`. | `{disposition, product_category, temporal_boundary, excluded_cases}`; omitted dimensions remain unresolved, not universal. | Social lane binds any fictional owner decision to the same scope. |
| `REF-SOCIAL-AUTHORITY-DECISION` : `AuthorityDecisionRef` | `ONT-GAME-SOCIAL-AUTHORITY-STATEFUL-CONSEQUENCE` | `AuthorityReview --produces--> OwnerDecision`; `OwnerDecision --projects_as--> AuthorityDecisionRef`. | `{decision_id, finding_id, scope_ref, decision_status, owner_role}`; decision status is `pending`, `accepted`, `rejected`, or `evidence_requested` and never asserts physical truth. | Spatial presentation may display the decision state through its imported reference but cannot reinterpret or promote it. |

`SubmittedBoundedFinding` is the Diegetic-owned envelope containing exactly one
`DiegeticTraceRef`, one `EvidenceBundleRef`, one candidate `ClaimRef`, one or more
`SourceBindingRef` values, and one `ScopeRef`. `EventToken` remains a Meta-owned
interface instance; only `EventTokenSetRef` crosses into Diegetic reconstruction.
`EvidenceTokenRef` remains a Spatial-owned acquisition witness. This reconciles
the formerly ambiguous token, trace, and Candidate 4 inputs without collapsing
their owners (**synthesis**, [Agent 3 boundary repair](repair-addenda.md#narrowed-social-ontology-boundary)).

## Candidate 1 — diegetic trace reconstruction

### `ontology_id`

`ONT-GAME-DIEGETIC-TRACE-RECONSTRUCTION`

### `design_thesis`

**Synthesis:** The player reconstructs why BUG-4821 occurred by collecting
source-bound records, comparing local states, ordering the complete trace, and
submitting a bounded semantic-gap hypothesis. Discovery authorizes inspection;
it does not turn an interpretation into organizational truth
([Agent 0 synthesis](research.md#candidate-ontology-synthesis),
[coverage repair](repair-addenda.md#1-replaced-validation-rule)).

### `precedent_set (GitHub + non-GitHub)`

- **Observed, non-GitHub:** Her Story supports a fictional query terminal;
  Pope’s devlogs support a diegetic organizer and the need for legible
  progression.
- **Observed, GitHub:** Untrusted witnesses a bounded causal machine interface;
  detective-board witnesses movable evidence relations and rollback; CyberQuest
  witnesses rooms, documents, an investigation board, touch, save, and
  non-punitive failure.
- **Synthesis:** Only the abstract relations are retained. The complete-trace
  coverage predicate is project-derived and is not copied from a precedent
  ([Agent 0 repair](repair-addenda.md#1-replaced-validation-rule)).

### `entities`

`SourceSystem`, `EventRecord`, `EventOccurrence`, `StateObservation`,
`EvidenceItem`, `SourceBinding`, `TimelineSlot`, `AdjacencyClaim`,
`Contradiction`, `Hypothesis`, `CoverageGate`, `SubmittedBoundedFinding`,
`ResidueQuestion`, `UnsupportedConclusion`.

Imported reference types: `EvidenceTokenRef`, `EventTokenSetRef`. Exported
reference types: `DiegeticTraceRef`, `EvidenceBundleRef`, `ClaimRef`,
`SourceBindingRef`, `ScopeRef`. `UnsupportedConclusion` is an owned
`BlockedInference` entity containing `{predicate, blocked_scope, blocker_id}`;
it is not a free text or undeclared literal.

These entities are **synthesis** from Agent 0’s candidate vocabulary, narrowed to
the repaired trace ownership boundary
([Agent 0 synthesis](research.md#candidate-ontology-synthesis),
[evidence closure](evidence-closure.json), `ONT-DIEGETIC`).

### `relations`

```text
EventRecord --emitted_by--> SourceSystem
EventRecord --claims--> EventOccurrence
EventRecord --observes--> StateObservation
EventOccurrence --precedes--> EventOccurrence
EvidenceItem --has--> SourceBinding
EvidenceItem --supports_or_conflicts_with--> Hypothesis
EvidenceItem --acquired_from--> EvidenceTokenRef
EventRecord --resolved_from--> EventTokenSetRef
AdjacencyClaim --places_before--> EventOccurrence
CoverageGate --requires_once--> EventRecord
CoverageGate --requires--> SourceBinding
CoverageGate --projects_trace_as--> DiegeticTraceRef
CoverageGate --projects_evidence_as--> EvidenceBundleRef
Hypothesis --projects_as--> ClaimRef
Hypothesis --is_bounded_by--> ScopeRef
SourceBinding --projects_as--> SourceBindingRef
SubmittedBoundedFinding --contains--> DiegeticTraceRef
SubmittedBoundedFinding --contains--> EvidenceBundleRef
SubmittedBoundedFinding --contains--> ClaimRef
SubmittedBoundedFinding --binds--> SourceBindingRef
SubmittedBoundedFinding --is_bounded_by--> ScopeRef
ResidueQuestion --blocks--> UnsupportedConclusion
```

**Synthesis:** These relations formalize the repaired ownership of records,
provenance, chronology, and evidence hypotheses
([evidence closure](evidence-closure.json), `ONT-DIEGETIC`).

### `player_verbs`

`collect_record`, `inspect_source`, `compare_states`, `pin_evidence`,
`order_event`, `bind_source`, `propose_adjacency`, `revise_trace`,
`submit_bounded_finding`, `preserve_residue`.

The verbs are **synthesis** from Agent 0’s investigation loop and repaired
coverage operation ([Agent 0](research.md#candidate-ontology-synthesis),
[repair](repair-addenda.md#1-replaced-validation-rule)).

### `state_machine`

```text
record: hidden -> surfaced -> collected -> source_bound -> timeline_placed
trace: empty -> partial -> contradictory -> coherent_candidate
trace: coherent_candidate -> coverage_submitted
coverage_submitted -> supported | revision_required
investigation: execution_reconstructed -> semantic_gap_candidate
semantic_gap_candidate -> submitted_bounded_finding
submitted_bounded_finding -> unresolved_residue_preserved
```

**Synthesis:** `supported` means the authored coverage predicate passed; it does
not mean the business rule was accepted
([Agent 0 repair](repair-addenda.md#1-replaced-validation-rule)).

### `puzzle_loop`

1. Receive Spatial-owned `EvidenceTokenRef` values and a Meta-owned
   `EventTokenSetRef` containing selected `EventToken` instances.
2. Distinguish emitted events from states, policy text, inferences, and customer
   promises.
3. Place each of the five required BUG-4821 events exactly once.
4. Bind every record to its source and support each adjacency with trace evidence.
5. Compare warehouse, quality, inventory, availability, and storefront states.
6. Identify the missing quality-to-availability dependency.
7. Submit the whole trace to the coverage gate; revise from a typed failure
   category without destructive reset.

The five required records and the whole-trace predicate are the repaired
project synthesis ([coverage repair](repair-addenda.md#1-replaced-validation-rule)).

### `evidence_and_authority_boundary`

**Synthesis:** A collected record proves only that the fictional record exists.
A supported chronology proves trace reconstruction. Contradictory local states
support a semantic-gap candidate. None of those states accepts a business rule;
the output is a `SubmittedBoundedFinding` for the social ontology
([Agent 0 evidence boundary](research.md#candidate-ontology-synthesis),
[Agent 3 boundary repair](repair-addenda.md#narrowed-social-ontology-boundary)).

### `failure_and_residue`

- `coverage_incomplete`, `unsupported_adjacency`, `unbound_record`, and
  `unsupported_semantic_jump` are editable negative witnesses.
- A chronologically correct trace with an unsupported semantic conclusion does
  not complete the lane.
- `RESIDUE-TRANSFER-INSPECTION-VALIDITY` survives completion and blocks claims
  about transferred returns.

These are **synthesis** from the repaired coverage gate and Agent 0 failure
model ([repair addendum](repair-addenda.md#1-replaced-validation-rule),
[explorer return](research.md#failure-and-residue)).

### `accessibility_and_browser_constraints`

Use a semantic DOM record list and sortable timeline; provide keyboard
move-left/move-right controls for every drag action; preserve focus; expose
source/conflict state through text and symbols as well as color; retain
versioned local rollback. These are **synthesis** from the Agent 0 browser
constraints and the observed detective-board/CyberQuest capabilities
([Agent 0](research.md#candidate-ontology-synthesis)).

### `BUG-4821 mapping`

The lane owns `ReturnReceived`, `UnitScannedAtWarehouse`,
`InventoryPositionUpdated`, `AvailabilityProjectionUpdated`, and
`StorefrontCacheInvalidated`; their source bindings; their chronology; the
cross-service state comparison; and the candidate relation
`QualityState --constrains--> Sellability`. It does not own room location,
word-rain routing, or owner acceptance (**synthesis**, [ownership partition](evidence-closure.json)).

### `implementation consequence`

Create a renderer-independent trace reducer with deterministic fixtures for the
five events, provenance requirements, typed rejection categories, DOM-accessible
ordering controls, and rollback. Do not encode owner acceptance in the trace
validator. This is a **candidate implementation consequence**, not authority to
build or adopt it ([Agent 0 browser synthesis](research.md#candidate-ontology-synthesis),
[coverage repair](repair-addenda.md#1-replaced-validation-rule)).

### `open questions`

- **Open question:** How much typed feedback makes whole-trace revision fair
  without exposing the exact bad edge?
- **Open question:** Is free-text query useful agency or unnecessary content and
  localization cost?
- **Open question:** Is the evidence board required play or an optional cognitive
  aid?

These remain explicitly unresolved in the Agent 0 return and repair
([open questions](research.md#open-questions), [repair](repair-addenda.md#3-explicit-reuse-matrix)).

## Candidate 2 — spatial systems traversal

### `ontology_id`

`ONT-GAME-SPATIAL-SYSTEMS-TRAVERSAL`

### `design_thesis`

**Synthesis:** The player learns the causal separation among warehouse intake,
quality, and availability by navigating distinct places and physically
inspecting machines. Spatial progression depends on explicit approach, focus,
and operation rules—not hidden-pixel hunting
([Agent 1 synthesis](research.md#synthesis-candidate-bug-4821-spatial-ontology)).

### `precedent_set (GitHub + non-GitHub)`

- **Observed, GitHub:** Madrona witnesses room/actuator/door state; EvscapeRoom
  witnesses inspect-to-reveal-verbs and soft-lock prevention; MiniWorld
  witnesses room/portal separation; Three.js and Enable3D witness technical
  rendering/control possibilities.
- **Observed, non-GitHub:** W3C and Microsoft guidance constrain captured input,
  keyboard escape, equivalent digital controls, and redundant cues; the Ubisoft
  account witnesses guided navigation and persistent visual reminders.
- **Synthesis:** None of these sources establishes that the BUG-4821 spatial loop
  is fun or that 3D is necessary
  ([Agent 1 structural caveats](repair-addenda.md#structural-not-fun-caveats)).

### `entities`

`Room`, `Portal`, `Door`, `PlayerPose`, `NavigationMode`, `ApproachEnvelope`,
`LineOfSight`, `InteractionTarget`, `FocusState`, `SpatialAffordance`, `Machine`,
`Actuator`, `PhysicalCondition`, `ResetPoint`, `AccessibilityCue`,
`RendererFallbackState`, `AcceptedPhysicalState`, `EvidenceTokenRef`,
`SpatialObservationKind`, `InterfaceGateRef`, `AuthorityDecisionRef`.

`SpatialObservationKind` is a closed value type with exactly
`identifier_observed | interface_reachable`. `AcceptedPhysicalState` is the
last checkpointed `PhysicalCondition` set accepted by the spatial reducer.
`EvidenceTokenRef` is Spatial-owned; `InterfaceGateRef` and
`AuthorityDecisionRef` are imported read-only references defined in the handoff
table.

These entities are **synthesis** from Agent 1’s candidate vocabulary and the
exclusive spatial ownership repair
([Agent 1 synthesis](research.md#synthesis-candidate-bug-4821-spatial-ontology),
[repair](repair-addenda.md#exclusive-ownership-boundary)).

### `relations`

```text
Room --connected_by--> Portal
Portal --controlled_by--> Door
InteractionTarget --located_in--> Room
PlayerPose --within--> ApproachEnvelope
PlayerPose --has_clear--> LineOfSight
InteractionTarget --offers--> SpatialAffordance
SpatialAffordance --changes--> PhysicalCondition
Machine --reports--> EvidenceTokenRef
AccessibilityCue --redundantly_represents--> SpatialAffordance
ResetPoint --restores--> AcceptedPhysicalState
```

**Synthesis:** The lane references but does not interpret
`EvidenceTokenRef`, `InterfaceGateRef`, or `AuthorityDecisionRef`
([exclusive ownership boundary](repair-addenda.md#exclusive-ownership-boundary)).

### `player_verbs`

`move`, `turn`, `approach`, `cycle_target`, `focus`, `inspect`, `operate`,
`place`, `release`, `leave_captured_navigation`, `restore_checkpoint`,
`request_spatial_hint`.

The verbs are **synthesis** grounded in the observed Madrona, EvscapeRoom,
MiniWorld, and browser-control surfaces
([Agent 1 source matrix](research.md#source-matrix)).

### `state_machine`

```text
room: unvisited -> entered -> surveyed
target: unnoticed -> detected -> focused -> inspected
focused + too_far_or_occluded -> blocked_no_mutation
machine: sealed -> mechanically_opened -> powered -> identifier_observed
door: closed -> opening -> open
sustained_door: open -> closing -> closed
accepted_progress_door: open -> persistently_open
navigation: unlocked -> capture_requested -> captured
capture_requested -> rejected -> fallback_navigation
captured -> unlocked_on_exit_or_focus_loss
```

The state separation is **synthesis** grounded in Madrona, EvscapeRoom, and
Three.js observations ([Agent 1 source matrix](research.md#source-matrix)).

### `puzzle_loop`

```text
notice spatial anomaly
-> approach target
-> inspect to reveal available verbs
-> operate and observe physical state
-> report identifier_observed or interface_reachable
-> traverse a changed portal
-> recover or restore from a physical failure
```

The lane stops at reporting references. Evidence meaning moves to Candidate 1;
console behavior moves to Candidate 3; authority moves to Candidate 4
(**synthesis**, [ownership repair](repair-addenda.md#exclusive-ownership-boundary)).

### `evidence_and_authority_boundary`

**Synthesis:** A spatial interaction can prove that a target was reachable,
inspected, and operated in the authored world state. It cannot infer an event
order, a business rule, an owner decision, or a successful ending
([Agent 1 ownership repair](repair-addenda.md#exclusive-ownership-boundary)).

### `failure_and_residue`

- `no_target`, `too_far`, `occluded`, and `wrong_target_type` do not mutate
  progress.
- Critical props return to a home socket or expose a reset action.
- Reload restores accepted transitions and physical checkpoint state.
- `RENDERER_UNAVAILABLE` falls back to semantic navigation where possible.
- Dimensionality remains unresolved rather than being inferred from the desire
  for “a proper game.”

These are **synthesis** from the spatial failure model and mandatory
dimensionality gate ([Agent 1](research.md#failure-and-residue),
[repair](repair-addenda.md#mandatory-dimensionality-gate)).

### `accessibility_and_browser_constraints`

Every target requires redundant cues and a semantic control. Captured camera
input must begin deliberately, explain its exit, handle rejection, and have an
unlocked keyboard/touch route. Provide digital turning, target cycling,
single-press interaction, remapping, sensitivity controls, optional
click-to-move, and a map of visited/blocked locations. These are **synthesis**
from W3C/Microsoft guidance and Agent 1’s proposed constraints
([Agent 1 accessibility section](research.md#accessibility-and-browser-constraints)).

### `BUG-4821 mapping`

`Warehouse Intake`, `Quality Lab`, and `Availability Control` are separate
rooms connected by explicit portals. Their machine identifier locations,
acquisition transitions, line-of-sight rules, and reset points belong here.
The meaning of the identifier and all trace/authority conclusions do not
(**synthesis**, [three-place mapping](research.md#three-place-mapping),
[ownership repair](repair-addenda.md#exclusive-ownership-boundary)).

### `implementation consequence`

Author a renderer-independent `roomGraph`, target registry, affordance reducer,
and checkpoint model before production art. Compare one identical room in 2.5D
and 3D before selecting Phaser-only, Three.js, or Enable3D. Engine and physics
selection remain `not_evaluable` until compatibility, licensing, browser cost,
accessibility parity, and playtest evidence exist
([implementation consequences](research.md#implementation-consequences),
[Enable3D non-selection](repair-addenda.md#enable3d-non-selection)).

### `open questions`

- **Open question:** Does any puzzle require continuous depth, free camera,
  occlusion reasoning, physical placement, or physics-based state?
- **Open question:** Which door conditions persist and which must be sustained?
- **Open question:** What checkpoint granularity avoids both soft locks and
  tedious repeated traversal?

The dimensionality question is a mandatory owner gate, not an engine preference
([dimensionality repair](repair-addenda.md#mandatory-dimensionality-gate)).

## Candidate 3 — meta-interface input boundary

### `ontology_id`

`ONT-GAME-META-INTERFACE-INPUT-BOUNDARY`

### `design_thesis`

**Synthesis:** The locked console and word rain are a fictional machine. The
player discovers which logical input channel its observer can see, reroutes the
same game verb through an unobserved maintenance channel, and uses a controlled
in-game reboot to compare persistent evidence with volatile interference. No
undocumented browser trick or exclusive physical device is required
([Agent 2 repair](repair-addenda.md#corrected-candidate-interaction-vocabulary)).

### `precedent_set (GitHub + non-GitHub)`

- **Observed, non-GitHub:** the extended-fiction article supports the abstract
  observed-boundary relation; OneShot supports persisted/volatile host-interface
  fiction; Tearaway supports game–player collaboration; MDN’s Hungry Fridge
  example supports an optional gamepad mode with keyboard access.
- **Observed, GitHub:** Decrypted witnesses a persisted fictional computer;
  Caesar Cipher Escape Room witnesses progressive accessible decoding; xterm.js
  witnesses a frontend terminal without shell authority; Phaser witnesses a
  canvas/DOM and multi-input bridge.
- **Synthesis:** The `projection-channel` / `maintenance-channel` vocabulary and
  device-independent routing puzzle are original project terms
  ([Agent 2 repair](repair-addenda.md#corrected-candidate-interaction-vocabulary)).

### `entities`

`EvidenceConsole`, `CredentialInput`, `InterfaceSurface`, `WordRain`,
`EventToken`, `InputChannel`, `InputBinding`, `ObserverModel`,
`InWorldRouteControl`, `KeyboardInput`, `PointerInput`, `TouchInput`,
`GamepadInput`, `RerouteInputVerb`, `VisualWordRainAction`,
`PersistentEvidence`, `VolatileInterference`, `ControlledReboot`,
`AccessibilityEquivalent`, `InterfaceResidue`, `EventTokenSetRef`,
`InterfaceGateRef`, `EvidenceTokenRef`.

`projection-channel` and `maintenance-channel` are the two named instances of
`InputChannel`. `KeyboardInput`, `PointerInput`, `TouchInput`, and
`GamepadInput` are input-source entities. `RerouteInputVerb` is the single
device-independent logical action they realize. `VisualWordRainAction` is the
animated selection realization against which `AccessibilityEquivalent` must
preserve intent and difficulty. `EventToken` is a Meta-owned emitted interface
instance; only `EventTokenSetRef` crosses the lane boundary. `EvidenceTokenRef`
is an imported Spatial-owned acquisition witness used only to bind console
credentials; Meta cannot reinterpret its observed value.

These entities are **repaired synthesis** from Agent 2’s candidate, with device
indices and proprietary visual metaphors removed
([Agent 2 candidate](research.md#candidate-ontology),
[repair](repair-addenda.md#corrected-candidate-interaction-vocabulary)).

### `relations`

```text
CredentialInput --unlocks--> EvidenceConsole
CredentialInput --binds--> EvidenceTokenRef
EvidenceConsole --activates--> WordRain
WordRain --emits--> EventToken
WordRain --projects_selection_as--> EventTokenSetRef
EvidenceConsole --projects_gate_as--> InterfaceGateRef
InputBinding --routes_actions_through--> InputChannel
ObserverModel --observes--> projection-channel
maintenance-channel --is_not_observed_by--> ObserverModel
InWorldRouteControl --reroutes--> InputBinding
KeyboardInput --realizes--> RerouteInputVerb
PointerInput --realizes--> RerouteInputVerb
TouchInput --realizes--> RerouteInputVerb
GamepadInput --optionally_realizes--> RerouteInputVerb
ControlledReboot --preserves--> PersistentEvidence
ControlledReboot --clears--> VolatileInterference
AccessibilityEquivalent --realizes_same_verb_as--> VisualWordRainAction
```

The channel relations are the **repaired synthesis**
([Agent 2 repair](repair-addenda.md#corrected-candidate-interaction-vocabulary)).

### `player_verbs`

`enter_code`, `activate_console`, `observe_rain`, `pause_rain`, `select_event`,
`review_log`, `inspect_observation_relation`, `reroute_input`,
`controlled_reboot`, `compare_persisted_state`, `reset_local_game_state`.

The verbs are **repaired synthesis** and all device-specific inputs realize the
same logical reroute action
([Agent 2 repair](repair-addenda.md#corrected-candidate-interaction-vocabulary)).

### `state_machine`

```text
console: locked -> credential_complete -> unlocked -> word_rain_active
word_rain: projection-channel
  -> observation_relation_discovered
  -> route_control_available
  -> maintenance-channel
interference: active -> controlled_reboot -> cleared
evidence: collected -> persisted -> restored
interface: active -> hidden_tab_paused -> active
persistence: available | blocked_with_in_memory_fallback
```

This is **synthesis** from Agent 2’s corrected transition and browser-state
observations ([repair](repair-addenda.md#corrected-candidate-interaction-vocabulary),
[explorer browser constraints](research.md#accessibility-and-browser-constraints-1)).

### `puzzle_loop`

1. Accept the exact credential assembled from machine interactions.
2. Start a deterministic word rain mixing event identifiers with plausible
   states, policies, and promises.
3. Make selection interference on `projection-channel` predictable enough to
   reveal an observation relation.
4. Let the player invoke `RerouteInputVerb` through an in-world terminal command
   or accessible control.
5. Route keyboard, pointer, touch, and optional gamepad through the same logical
   action to `maintenance-channel`.
6. Capture event tokens and perform an explicit controlled reboot.
7. Preserve collected evidence, clear volatile interference, and hand event
   tokens to Candidate 1.

The loop is **repaired synthesis**, not a reproduction of a proprietary puzzle
([Agent 2 repair](repair-addenda.md#corrected-candidate-interaction-vocabulary)).

### `evidence_and_authority_boundary`

**Synthesis:** The interface may establish that the player possessed a valid
credential, discovered an observation relation, rerouted a logical verb, and
preserved bounded game evidence. It has no real shell, filesystem, clipboard,
history, device identity, network-terminal, or policy authority. Event meaning
belongs to Candidate 1 and owner commitment to Candidate 4
([Agent 2 safe rules](research.md#safe-boundary-breaking-rules)).

### `failure_and_residue`

- `CREDENTIAL_INCOMPLETE`: console remains locked without revealing the answer.
- `CHANNEL_UNAVAILABLE`: command and accessible control remain equivalent.
- `PERSISTENCE_BLOCKED`: use an in-memory controlled reboot and disclose reduced
  persistence.
- `WORD_RAIN_UNREADABLE`: switch to an equivalent deterministic text ledger.
- `INTERFERENCE_RULE_UNCLEAR`: preserve progress and request a playability repair.

These are **synthesis** from Agent 2’s failure model and repaired input
equivalence ([Agent 2](research.md#failure-and-residue-1),
[repair](repair-addenda.md#corrected-candidate-interaction-vocabulary)).

### `accessibility_and_browser_constraints`

Every route action has keyboard, pointer, and touch access; optional gamepad
cannot be the sole solution. Reduced motion replaces falling animation with the
same seeded ledger and selection difficulty. Announce phase changes rather than
every token, preserve focus, pause on hidden tabs, serve through HTTP when
persistence matters, namespace stored state, and expose reset/delete controls.
These are **synthesis** grounded in MDN/WCAG observations and Agent 2’s browser
constraints ([Agent 2](research.md#accessibility-and-browser-constraints-1)).

### `BUG-4821 mapping`

The exact collected identifier unlocks the evidence console. The word rain
contains the five trace events plus semantically plausible non-event tokens.
`projection-channel` interference prevents reliable capture until the player
discovers and uses `maintenance-channel`. A controlled reboot demonstrates the
difference between persistent evidence and volatile distortion. The output is
event-token evidence for Candidate 1, not a completed trace or accepted rule
(**synthesis**, [Agent 2 repair](repair-addenda.md#corrected-candidate-interaction-vocabulary)).

### `implementation consequence`

Separate `InterfaceState`, `InputRouter`, `ObserverModel`, `PersistenceAdapter`,
and rendering. Phaser may render the room and rain; semantic HTML owns code
entry, commands, the text ledger, help, and equivalents. If xterm.js is used,
connect it only to a whitelist fictional parser. Test every logical verb across
modalities and test that final interface state never equals policy acceptance
([Agent 2 implementation consequences](research.md#implementation-consequences-1)).

### `open questions`

- **Open question:** How much predictable interference teaches the observation
  relation without becoming annoying?
- **Open question:** Is the controlled reboot required or optional?
- **Open question:** Can the same word-rain difficulty survive reduced-motion
  and mobile layouts?
- **Open question:** Is optional gamepad support worth its discovery and testing
  cost?

No cited source answers these project-specific playability questions
([Agent 2 open questions](research.md#open-questions-1)).

## Candidate 4 — social authority and stateful consequence

### `ontology_id`

`ONT-GAME-SOCIAL-AUTHORITY-STATEFUL-CONSEQUENCE`

### `design_thesis`

**Synthesis:** This lane begins only after Candidate 1 produces a
`SubmittedBoundedFinding`. It makes evidence review, owner decision, reversible
containment, explicit commitment, premature publication, delayed consequence,
trust debt, and unresolved residue playable without pretending that the player
personally establishes policy truth
([Agent 3 repair](repair-addenda.md#narrowed-social-ontology-boundary)).

### `precedent_set (GitHub + non-GitHub)`

- **Observed, non-GitHub:** Papers, Please supports evidence-dependent judgment,
  readable rules, remembered decisions, and later outcomes; Orwell supports the
  separation of discovery from consequential submission.
- **Observed, GitHub:** The Evolution of Trust supports remembered interaction,
  explicit noise, and inspectable consequence dynamics; Coming Out Simulator
  supports later echoes and contradiction checks from compact retained state.
- **Synthesis:** BUG-4821’s false-green branch and the three explicit actions
  below are project-derived, not claimed external mechanics
  ([Agent 3 fair-choice repair](repair-addenda.md#fair-bug-4821-choice-structure)).

### `entities`

`SubmittedBoundedFinding`, `DiegeticTraceRef`, `EvidenceBundleRef`, `ClaimRef`,
`SourceBindingRef`, `ScopeRef`, `AuthorityReview`, `OwnerDecision`,
`CommitmentState`, `ContainmentAction`, `PublicationAction`, `FalseGreen`,
`PrematurePublication`, `CustomerConsequence`, `ConsequenceRecord`, `TrustDebt`,
`UnansweredPolicyQuestion`, `ResidueDisposition`, `AuthorityDecisionRef`.

`SubmittedBoundedFinding` is an imported Diegetic-owned envelope.
`DiegeticTraceRef`, `EvidenceBundleRef`, `ClaimRef`, `SourceBindingRef`, and
`ScopeRef` are its imported read-only projections; their exact payloads are
fixed in the handoff table.
`PrematurePublication` is the subtype of `PublicationAction` whose required
`CommitmentState` is missing or non-accepted. `UnansweredPolicyQuestion` is an
owned unresolved-policy entity `{question_id, question, affected_scope}`.
`AuthorityDecisionRef` is the Social-owned output projection.

These entities are **repaired synthesis** from the narrowed post-submission
social boundary ([Agent 3 repair](repair-addenda.md#narrowed-social-ontology-boundary)).

### `relations`

```text
SubmittedBoundedFinding --references--> DiegeticTraceRef
SubmittedBoundedFinding --contains--> EvidenceBundleRef
SubmittedBoundedFinding --asserts_candidate--> ClaimRef
SubmittedBoundedFinding --binds--> SourceBindingRef
SubmittedBoundedFinding --is_bounded_by--> ScopeRef
SubmittedBoundedFinding --enters--> AuthorityReview
AuthorityReview --produces--> OwnerDecision
OwnerDecision --changes--> CommitmentState
OwnerDecision --projects_as--> AuthorityDecisionRef
ContainmentAction --preserves_uncertainty_without_promoting--> ClaimRef
PublicationAction --depends_on--> CommitmentState
PrematurePublication --produces--> FalseGreen
CustomerConsequence --creates--> TrustDebt
UnansweredPolicyQuestion --receives--> ResidueDisposition
```

These are the **repaired synthesis** and exclusive social ownership relation set
([Agent 3 repair](repair-addenda.md#narrowed-social-ontology-boundary)).

### `player_verbs`

`review_submitted_finding`, `request_evidence`, `accept_bounded_rule`,
`reject_with_reason`, `contain_returned_electronics`, `submit_bounded_finding`,
`publish_candidate_as_adopted`, `inspect_missing_gate`, `observe_consequence`,
`repair_and_disclose`, `assign_residue_disposition`.

The verbs are **repaired synthesis** from the explicit fair-choice structure;
safe containment and honest submission are not failure verbs
([Agent 3 repair](repair-addenda.md#fair-bug-4821-choice-structure)).

### `state_machine`

```text
SUBMITTED_BOUNDED_FINDING
  -> RETURN_TO_DIEGETIC_INVESTIGATION
  | REJECTED_WITH_REASON
  | COMMITTED_RULE
  | PENDING_WITH_CONTAINMENT

candidate + premature_publication -> LOCAL_TEST_GREEN
LOCAL_TEST_GREEN + owner_decision_missing -> FALSE_GREEN
FALSE_GREEN + customer_action -> CUSTOMER_CONSEQUENCE -> TRUST_DEBT
PENDING_WITH_CONTAINMENT -> HONEST_INCOMPLETENESS
COMMITTED_RULE -> implementation_ref_required -> runtime_evidence_required
runtime_evidence_present -> RESOLVED_WITH_RESIDUE
```

The entry state and fair branches are **repaired synthesis**
([narrowed boundary](repair-addenda.md#narrowed-social-ontology-boundary),
[fair choice](repair-addenda.md#fair-bug-4821-choice-structure)).

### `puzzle_loop`

1. Receive a source-bound and scoped `SubmittedBoundedFinding` from Candidate 1.
2. Review evidence and expose missing commitment/runtime gates.
3. Choose among three explicit, legible actions:
   `CONTAIN RETURNED ELECTRONICS`, `SUBMIT BOUNDED FINDING`, or
   `PUBLISH CANDIDATE AS ADOPTED RULE`.
4. Never punish safe containment or honest submission.
5. If the player deliberately misrepresents the candidate, allow the local test
   to turn green while displaying `OWNER DECISION: MISSING`.
6. Later customer or operational state reclassifies that signal as
   `FalseGreen`; the causal ledger explains the consequence.
7. Resolve the known bounded rule separately from the warehouse-transfer
   residue.

This is **project synthesis** from BUG-4821 and the repaired fair-choice
structure ([Agent 3 repair](repair-addenda.md#fair-bug-4821-choice-structure)).

### `evidence_and_authority_boundary`

**Synthesis:** External precedent supports consequential choice and remembered
state, not CyberAlchemy authority. Within the fiction, an `OwnerDecision` can
change `CommitmentState` for a bounded use; it does not determine physical
truth. A candidate, passing local test, implementation, replay, and customer
outcome remain separate evidence states. Outside the fiction, this document
does not accept an ontology or authorize implementation
([Agent 3 candidate boundary](research.md#synthesis-bug-4821-consequence-ontology-candidate),
[repair](repair-addenda.md#narrowed-social-ontology-boundary)).

### `failure_and_residue`

- Honest rejection returns a reason and does not destroy the finding.
- Safe containment costs availability but never reduces evidence integrity.
- Premature publication is foreseeable, deliberate, recoverable through repair
  and disclosure, and leaves `TrustDebt`.
- The transfer-inspection question receives `ResidueDisposition`; guessing it
  creates `FALSE_CLOSURE`.
- Consequence timing must remain causally legible.

These are **synthesis** from Agent 3’s failure branches and fair-choice repair
([Agent 3](research.md#synthesis-bug-4821-consequence-ontology-candidate),
[repair](repair-addenda.md#fair-bug-4821-choice-structure)).

### `accessibility_and_browser_constraints`

Keep evidence, scope, owner status, missing gates, commitment, and consequence
in semantic DOM controls. Use words/icons with color; show an explicit review
before consequential publication; make the gate ledger and consequence ledger
revisitable; caption audio; support keyboard inspection; provide word-rain
alternatives through Candidate 3; and preserve alternate timelines rather than
silently erasing the first run. These are **synthesis** from Agent 3’s browser
section ([Agent 3](research.md#browser-and-accessibility-implications)).

### `BUG-4821 mapping`

The social lane receives the candidate relation that returned electronics
require quality clearance before sellability. It owns fictional owner review,
bounded acceptance/rejection, reversible containment, premature publication,
the order consequence, trust debt, and transfer-question disposition. It owns
neither event reconstruction nor spatial/interface mechanics
(**synthesis**, [Agent 3 repair](repair-addenda.md#narrowed-social-ontology-boundary)).

### `implementation consequence`

Implement a consequence ledger and an explicit review/commit surface whose
state is separate from the trace, local test, and runtime replay. Store the
three choices as typed actions, make only deliberate misrepresentation enter
the false-green branch, and retain residue across endings. This is a **candidate
implementation consequence**, not authority to build it
([Agent 3 fair-choice repair](repair-addenda.md#fair-bug-4821-choice-structure),
[browser synthesis](research.md#browser-and-accessibility-implications)).

### `open questions`

- **Open question:** Is fictional owner review deterministic, or can legitimate
  scope ambiguity remain?
- **Open question:** How long can consequence be delayed while remaining
  understandable rather than punitive?
- **Open question:** Can trust debt be repaired, and how is repair shown without
  trivializing consequence?
- **Open question:** Does transfer uncertainty contain only transferred returns
  or all returns?

These questions remain unresolved in the Agent 3 return
([open questions](research.md#open-questions-2)).

## Verdict matrix

“Owner (precedent)” is a reuse posture, not a product owner or authority grant.
“Witnessed” asks whether at least one external source demonstrates the ontology’s
central mechanic. “Sound” asks whether the candidate’s entities, relations, and
state boundaries are internally defined without collapsing another lane.

| candidate | owner (precedent) | witnessed? (non-vacuity) | sound? (definitional) | verdict |
|---|---|---|---|---|
| `ONT-GAME-DIEGETIC-TRACE-RECONSTRUCTION` | `build-from-owned/novel-attempt` | Yes—searchable diegetic records, causal interfaces, evidence boards, and browser investigation state are observed; the repaired whole-trace rule is novel synthesis. | Yes as a candidate—every relation endpoint is declared; imported/exported token, trace, bundle, claim, binding, and scope references have typed handoffs; topology, routing, and authority remain excluded. | `CANDIDATE: PROTOTYPE`, with trace-feedback playtest residue. |
| `ONT-GAME-SPATIAL-SYSTEMS-TRAVERSAL` | `build-from-owned/novel-attempt` | Yes—room/portal graphs, bounded targeting, explicit affordances, recoverable state, and input fallbacks are observed. | Yes as a candidate—`SpatialObservationKind`, `AcceptedPhysicalState`, and all relation endpoints are declared; cross-lane references are read-only and typed. | `CANDIDATE: DIMENSIONALITY_GATE_REQUIRED`; engine/art selection not evaluable. |
| `ONT-GAME-META-INTERFACE-INPUT-BOUNDARY` | `build-from-owned/novel-attempt` | Yes—fictional host interfaces, retained state, optional controller mode, browser terminals, and canvas/DOM bridges are observed; channel terms and routing puzzle are novel synthesis. | Yes as a candidate—both channel instances, all input entities, both logical actions, token projections, and relation endpoints are declared. | `CANDIDATE: PROTOTYPE`, with interference-legibility and modality-parity residue. |
| `ONT-GAME-SOCIAL-AUTHORITY-STATEFUL-CONSEQUENCE` | `build-from-owned/novel-attempt` | Yes—consequential submission, remembered decisions, delayed echoes, and inspectable trust state are observed; BUG-4821’s fair false-green branch is novel synthesis. | Yes as a candidate—post-submission inputs, `PrematurePublication`, `UnansweredPolicyQuestion`, output decision reference, and every relation endpoint are declared. | `CANDIDATE: PROTOTYPE`, with consequence-fairness residue. |

No candidate is rejected merely because a precedent exists. The intended owner
posture is to build original expression and test the novel composition.

## Provenance, licensing, and original-art policy

The research corpus is evidence, not an asset library. Proprietary games and
articles contribute abstract mechanics only. MIT, BSD, Apache, CC0, Unlicense,
CC-BY-SA, CC-BY-NC-SA, GPL, and LGPL sources retain their distinct obligations;
one repository-level license never clears third-party art, audio, fonts,
dependencies, or imported materials. Enable3D and any GPL/share-alike/non-commercial
source require explicit review before code adaptation or distribution
([Agent 0 reuse matrix](repair-addenda.md#3-explicit-reuse-matrix),
[Agent 1 non-selection](repair-addenda.md#enable3d-non-selection),
[Agent 3 reuse boundary](repair-addenda.md#reuse-boundary)).

The project policy for these candidates is stricter than license permission:

- create original art, animation, audio, prose, characters, interface
  composition, names, terminology, puzzle sequence, and narrative reveal order;
- author implementation code independently unless a later, recorded dependency
  decision selects a compatible library;
- retain only abstract state patterns and general browser/accessibility lessons;
- attach creator, source, generation method, license, and derivative-use metadata
  to every eventual asset;
- do not imitate distinctive proprietary screens, documents, characters,
  audiovisual cues, or puzzle presentation.

This is a **synthesis policy** supported by all three repair reuse boundaries;
it is not a license opinion or a release approval.

## Typed unresolved playability and dimensionality residue

| residue_id | type | status | blocks | required evidence |
|---|---|---|---|---|
| `RES-GAME-TRACE-FEEDBACK-01` | `playability/diagnostic-opacity` | `unverified` | Final whole-trace failure feedback contract | Playtests measuring revision success, blind guessing, abandonment, and whether typed categories are sufficient. |
| `RES-GAME-WORD-RAIN-01` | `playability/legibility-equivalence` | `unverified` | Final token density, speed, decoy count, and reduced-motion design | Compare animated and static-seeded forms for event discrimination, error rate, cognitive load, keyboard/touch parity, and motion comfort. |
| `RES-GAME-CHANNEL-01` | `playability/causal-discoverability` | `unverified` | Final interference strength and hint sequence | Observe whether players infer the observation relation before frustration and whether every modality discovers the same logical action. |
| `RES-GAME-CONSEQUENCE-01` | `playability/fairness-and-delay` | `unverified` | Final false-green timing, trust-debt repair, and ending structure | Test whether missing-gate warnings are understood, safe choices remain attractive, and delayed effects are read as causal rather than arbitrary. |
| `RES-GAME-DIMENSIONALITY-01` | `architecture/2.5d-vs-3d` | `owner-decision-required` | Renderer, physics, production art, asset pipeline, and final control scheme | Implement the same room in 2.5D and 3D; compare completion, missed targets, navigation errors, time to first meaningful interaction, motion discomfort, keyboard/touch and screen-reader parity, frame time, and bundle cost. |
| `RES-GAME-LICENSE-01` | `provenance/dependency-selection` | `unresolved` | Any adaptation of Enable3D, GPL, share-alike, or non-commercial material | Dependency-level license and compatibility review plus an asset-by-asset provenance manifest. |

These residues are **open questions**, not negative verdicts. The dimensionality
gate is required by Agent 1’s repair; the remaining types bind the explicit
playability gaps from Agents 0, 2, and 3
([mandatory dimensionality gate](repair-addenda.md#mandatory-dimensionality-gate),
[evidence closure](evidence-closure.json), `PLAYABILITY-OPEN`).

## Research ceiling

The four ontologies are source-bound candidates for prototyping and later
DomainSpec authoring. This finding does not establish product adoption,
canonical definitions, an admitted ontology, an implementation binding,
conformance, release, deployment, or organizational authority. Those states
require their own owners and evidence.
