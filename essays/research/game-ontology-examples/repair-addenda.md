# Explorer repair addenda (verbatim)

These addenda are the single feedback traversal from the skeptic group to the
explorer group. They repair the candidate synthesis; they do not alter the
verbatim first-pass transcript in `research.md`.

## Agent 0 — Abramsky, Samson

## Repair addendum — diegetic investigation lane

### 1. Replaced validation rule

`synthesis — BUG-4821 coverage gate`

Remove the batch-of-three signature entirely. Validation becomes available only when the player’s candidate satisfies this project-derived closure predicate:

```text
trace_coverage_complete :=
    all_required_event_records_are_placed_once
    AND every_event_has_a_source_binding
    AND every_adjacency_has_supporting_trace_evidence
    AND warehouse_quality_inventory_and_storefront_states_are_compared
    AND the_missing_quality_to_availability_dependency_is_identified
```

The required records are the five events already present in BUG-4821:

```text
ReturnReceived
UnitScannedAtWarehouse
InventoryPositionUpdated
AvailabilityProjectionUpdated
StorefrontCacheInvalidated
```

The game evaluates the complete candidate trace, not arbitrary subsets. Failure returns only a typed category:

```text
coverage_incomplete
unsupported_adjacency
unbound_record
unsupported_semantic_jump
```

It does not reveal the exact faulty record or edge. This preserves revision and deduction without reproducing Obra Dinn’s three-fates validation sequence.

`observed — retained source distinction`: [Lucas Pope’s devlog, post #734](https://dukope.com/devlogs/obra-dinn/tig-30/), selectors `Fate Validation` and `SVO Fates`, remains evidence that delayed/grouped confirmation can discourage enumeration. It is no longer the candidate rule’s structure.

### 2. Immutable GitHub source bindings

`observed — revisions resolved with git ls-remote on 2026-09-01`

- **Untrusted**
  - Immutable commit: [`ab4a8ed28058a3f4b53cc48972b756ef9c97e862`](https://github.com/AlexNisnevich/untrusted/tree/ab4a8ed28058a3f4b53cc48972b756ef9c97e862)
  - Source selectors: `README.md` → `Overview`, `The .jsx file format`, `License`
  - Historical tag available: `hackathon` at `0d93379b4c3c3667391b7a7efd5898f55d505a31`

- **detective-board**
  - Immutable investigated HEAD: [`79ebc84796c7b984023c96c51982742fd3ce3d53`](https://github.com/stefankober/detective-board/tree/79ebc84796c7b984023c96c51982742fd3ce3d53)
  - Immutable release tag: [`v1.0.2`](https://github.com/stefankober/detective-board/tree/v1.0.2), commit `22b6551cc41b92e9def04b70f861324927069c42`
  - Source selectors: `README.md` → `Creating Objects`, `Autobackup`, `Why use it?`, `License`

- **CyberQuest**
  - Immutable investigated HEAD: [`b7630650b0910267bbac09d57ee9b13a1a507ba9`](https://github.com/ReinVelt/CyberQuest/tree/b7630650b0910267bbac09d57ee9b13a1a507ba9)
  - Immutable release tag: [`v1.3`](https://github.com/ReinVelt/CyberQuest/tree/v1.3), ref `4db139241430b25502e24ade09593e5f7539afad`
  - Source selectors: `README.md` → `Features`, `Gameplay`, `Controls`, `Technology Stack`, `License`

### 3. Explicit reuse matrix

`synthesis — project reuse boundary`

| Precedent | Original art required | Original prose required | UI reuse | Puzzle-sequencing reuse |
|---|---:|---:|---|---|
| Her Story | Yes | Yes | Abstract searchable-terminal principle only; no visual composition, labels, imitation desktop, or media treatment | No clip/query sequence, corpus structure, or discovery path copied |
| Return of the Obra Dinn | Yes | Yes | Abstract diegetic evidence-organizer principle only; no book presentation, iconography, fate-entry appearance, or animation copied | No corpse chain, fate structure, confirmation cadence, or reveal order copied |
| Untrusted | Yes | Yes | Abstract causal-machine-interface principle only; implementation authored from scratch | No level code, editable-code framing, solutions, progression, or sequencing copied |
| detective-board | Yes | Yes | Relations-as-movable-evidence pattern may inform an original accessible DOM implementation; current plan reuses no repository code | No authored game sequence exists to reuse; board remains an optional reasoning affordance |
| CyberQuest | Yes | Yes | General browser engineering observations—Pointer Events, local saves, optional narration—may inform independent implementation | No scenes, ciphers, quests, dialogue order, story flags, or puzzle progression copied |

Even where a license could permit adaptation, this candidate’s reuse posture is stricter: source repositories are studied as evidence; the BUG-4821 game receives original art, prose, interface expression, code, and puzzle sequence.

`open-question`: Whole-trace validation may make revision too opaque. Playtesting must determine whether typed failure categories are sufficient without exposing the failing edge.

## Agent 2 — Capucci, Matteo

## Meta-interface repair addendum

Status: candidate research correction only; no adoption or implementation authority.

### Corrected Tearaway source

Replace the previous GDC locator with:

- [Rex Crowle / Media Molecule, “Believable Make-Believe: Putting the Player at the Heart of Tearaway,” GDC 2014](https://www.gdcvault.com/play/1021305/Believable-Make-Believe-Putting-the)
- Selectors: session title and overview lines 28–35; speaker/company/track lines 36–43; event metadata lines 52–56.
- **Observed:** The session describes involving the gamer directly and establishing game–gamer collaboration through fourth-wall-aware fiction and customization.
- Rights posture remains proprietary precedent; abstract inspiration only.

### Corrected immutable GitHub references

The following are commit pins observed on 2026-09-01, not claims of stable releases:

- **Phaser:** commit [`02d8931b626d9764c133cbb3fbf99966c03c757c`](https://github.com/phaserjs/phaser/tree/02d8931b626d9764c133cbb3fbf99966c03c757c)
  - [Pinned `package.json`](https://raw.githubusercontent.com/phaserjs/phaser/02d8931b626d9764c133cbb3fbf99966c03c757c/package.json), lines 0–13.
  - **Observed:** version `4.2.1`, browser game framework, MIT license at lines 8–9.

- **xterm.js:** commit [`c58ea3637f3968e0e6e79cd92cf9aace7ef89ee2`](https://github.com/xtermjs/xterm.js/tree/c58ea3637f3968e0e6e79cd92cf9aace7ef89ee2)
  - [Pinned README](https://raw.githubusercontent.com/xtermjs/xterm.js/c58ea3637f3968e0e6e79cd92cf9aace7ef89ee2/README.md), lines 0–13: frontend terminal component with accessibility features; explicitly not Bash.
  - [Pinned license](https://raw.githubusercontent.com/xtermjs/xterm.js/c58ea3637f3968e0e6e79cd92cf9aace7ef89ee2/LICENSE), lines 0–17: MIT.

- **Caesar Cipher Escape Room:** commit [`cd68dbd0ca5f6592e169cd2a06968417f9418393`](https://github.com/CyberSnackCat/caesar-escape-room/tree/cd68dbd0ca5f6592e169cd2a06968417f9418393)
  - [Pinned README](https://raw.githubusercontent.com/CyberSnackCat/caesar-escape-room/cd68dbd0ca5f6592e169cd2a06968417f9418393/README.md), lines 17–44 and 71–76.
  - [Corrected raw LICENSE](https://raw.githubusercontent.com/CyberSnackCat/caesar-escape-room/cd68dbd0ca5f6592e169cd2a06968417f9418393/LICENSE), exactly 19 lines, selectors 0–18: MIT.

- **Decrypted:** commit [`99e0e7888053d1098f8f674185b4c1d82c1b3319`](https://github.com/hasderhi/Escape-Room/tree/99e0e7888053d1098f8f674185b4c1d82c1b3319)
  - [Pinned README](https://raw.githubusercontent.com/hasderhi/Escape-Room/99e0e7888053d1098f8f674185b4c1d82c1b3319/readme.md), lines 0–19 and 22–57.
  - [Pinned license](https://raw.githubusercontent.com/hasderhi/Escape-Room/99e0e7888053d1098f8f674185b4c1d82c1b3319/license), lines 0–10: GPL-3.0-or-later declaration and separate icon provenance.

### Corrected browser-analogue claim

Replace:

> “the strongest direct browser analogue”

with:

> **Observed:** Hungry Fridge is one direct browser analogue in which connecting a controller changes game mode and a keyboard route remains available.

No comparative “strongest” claim is supported by this corpus.

### Corrected candidate interaction vocabulary

Remove `P1`, `P2`, controller-port labels, jack imagery, and physical port-switch metaphors from the BUG-4821 candidate.

Use only:

```text
projection-channel
maintenance-channel
```

Corrected relations:

```text
InputBinding --routes_actions_through--> InputChannel
ObserverModel --observes--> projection-channel
maintenance-channel --is_not_observed_by--> ObserverModel
InWorldRouteControl --reroutes--> InputBinding
GamepadInput --optionally_realizes--> RerouteInputVerb
KeyboardInput --realizes--> RerouteInputVerb
PointerInput --realizes--> RerouteInputVerb
```

Corrected transition:

```text
WORD_RAIN_PROJECTION_CHANNEL
  -- player discovers observation relation -->
ROUTE_CONTROL_AVAILABLE
  -- in-world reroute action -->
WORD_RAIN_MAINTENANCE_CHANNEL
```

Corrected puzzle action:

- The canonical solution is an in-world terminal command or accessible routing control that moves event-selection input from `projection-channel` to `maintenance-channel`.
- The optional gamepad may trigger the same `RerouteInputVerb`, but it neither represents another controller port nor provides exclusive progress.
- Keyboard, pointer, touch, and gamepad all map to the same logical action.
- The fiction concerns escaping an observed system boundary, not imitating the proprietary controller-switch puzzle.

## Agent 1 — Baez, John

## Spatial report repair addendum

### Provenance binding corrections

- All GitHub implementation references remain bound to immutable commits:

  - Madrona Escape Room: `21f674951c68888045c824b5b981e158975f9e90`
  - EvscapeRoom: `f50d911c97d2b828da256269327900d3197f3687`
  - Farama MiniWorld: `c660156dd73994e55ad81a4e2925582399446aba`
  - Three.js: `20bd26f2d1f2797602c084975b793591b3472558`
  - Enable3D: `17cc02f9f79936a0b60c339650a8705970cd50a6`

- Replace the mutable Pointer Lock link with the dated W3C Working Draft: [Pointer Lock 2.0, 25 February 2026](https://www.w3.org/TR/2026/WD-pointerlock-2-20260225/). Its status remains Working Draft, not final Recommendation.

- Bind the WCAG keyboard-trap interpretation to public commit `2cde22ec6cfa8d5a6ec00d2ffae91509a24295db`: [`understanding/20/no-keyboard-trap.html` L37-L47 and L70-L73](https://github.com/w3c/wcag/blob/2cde22ec6cfa8d5a6ec00d2ffae91509a24295db/understanding/20/no-keyboard-trap.html#L37-L47).

- The Microsoft Learn XAG 103 and 107 pages disclose source commit `fcf89d7c7ec0976ca008b7a9dfc232cfc44e2f68` in their page metadata, but the disclosed `MicrosoftDocs/gaming-docs-pr` repository is not publicly dereferenceable. Record that SHA as retrieval provenance while retaining the public Learn URLs and access date `2026-09-01`; do not claim independently reproducible source bytes.

- The Ubisoft article is bound only by title, publication date `2024-01-19`, displayed update date `2024-08-28`, URL, and access date. The Game Developer article is similarly bound by author Tom Pugh, publication date `2018-10-22`, URL, and access date. Both remain mutable prose references.

### Exclusive ownership boundary

`GAME-ONTOLOGY-SPATIAL-SYSTEMS-CANDIDATE-01` exclusively owns:

```text
room topology
portal and traversal topology
player pose and navigation mode
approach envelopes
line-of-sight and occlusion
target detection and focus
spatial affordance availability
physical actuator and door state
physical reset/checkpoint locations
spatial accessibility cues
renderer/input fallback state
```

It references, but does not own:

```text
EvidenceTokenRef
  -> evidence meaning and event reconstruction belong to the
     diegetic-investigation ontology

InterfaceGateRef
  -> console lock, word-rain behavior, and interface fiction belong to
     the meta-interface ontology

AuthorityDecisionRef
  -> commitment, trust, false-green endings, and governing residue belong to
     the social/stateful-consequence ontology
```

A machine identifier’s spatial location and acquisition transition belong here; its semantic interpretation does not. The spatial ontology may report `identifier_observed` or `interface_reachable`, but cannot infer the event order, business rule, owner acceptance, or successful ending.

### Enable3D non-selection

Enable3D remains an observed candidate only. It must not be named as the chosen engine or Phaser integration path until:

- LGPL-3.0 distribution and modification obligations are reviewed;
- Phaser, Three.js, Ammo.js, and package-version compatibility is verified;
- bundle size, browser support, maintenance posture, and asset pipeline are tested;
- its accessibility/input fallback surface is demonstrated.

Three.js is likewise a technical candidate, not an adopted architecture.

### Structural-not-fun caveats

- Madrona is an ECS/RL reference environment; its conjunctive buttons and doors demonstrate state structure, not human puzzle enjoyment.
- MiniWorld demonstrates topology and discrete actions, not escape-room clarity or challenge.
- EvscapeRoom supports inspectability and soft-lock prevention in text; transfer to visual 3D remains unproven.
- Three.js and Enable3D demonstrate rendering/control primitives, not gameability.
- General level-design guidance supplies hypotheses requiring player tests.

No cited source establishes that the proposed BUG-4821 spatial loop is understandable, enjoyable, or appropriately difficult.

### Mandatory dimensionality gate

Before selecting an engine or preparing production art, resolve:

```text
Does the intended puzzle require continuous depth, free camera movement,
occlusion reasoning, physical placement, or physics-based state?
```

- If `no`, keep a 2.5D/fixed-camera room model with explicit hotspots and semantic controls.
- If `yes`, true 3D remains a candidate, subject to an accessibility-equivalent navigation path.
- If mixed, use fixed spatial nodes with bounded 3D inspection rather than continuous first-person traversal.

Minimum decision evidence should compare one identical room implemented as 2.5D and 3D for:

```text
task completion
missed-target rate
navigation/control errors
time to first meaningful interaction
motion discomfort
keyboard/touch parity
screen-reader control-plane parity
frame time and bundle cost
```

Until an owner accepts that comparison, dimensionality, renderer, physics library, and final asset pipeline remain unresolved and downstream implementation claims are `not_evaluable`.

## Agent 3 — Brandenburg, Martin

## Repair addendum

### Immutable source bindings

- `ncase/trust` pinned to commit [`6ec45d73befdb922bd40654dd1c1c903a953562f`](https://github.com/ncase/trust/tree/6ec45d73befdb922bd40654dd1c1c903a953562f):
  - [CC0 license](https://raw.githubusercontent.com/ncase/trust/6ec45d73befdb922bd40654dd1c1c903a953562f/LICENSE)
  - [`words.html`](https://raw.githubusercontent.com/ncase/trust/6ec45d73befdb922bd40654dd1c1c903a953562f/words.html)
  - [`PD.js`](https://raw.githubusercontent.com/ncase/trust/6ec45d73befdb922bd40654dd1c1c903a953562f/js/sims/PD.js)
  - [`6_Slides_Noise.js`](https://raw.githubusercontent.com/ncase/trust/6ec45d73befdb922bd40654dd1c1c903a953562f/js/slides/6_Slides_Noise.js)
  - License caveat: the repository README identifies third-party assets under several licenses, including restrictive terms.

- `ncase/coming-out-simulator-2014` pinned to commit [`69918f33e749117586ebd0fb57d9ec6ab047e7a3`](https://github.com/ncase/coming-out-simulator-2014/tree/69918f33e749117586ebd0fb57d9ec6ab047e7a3):
  - [Unlicense](https://raw.githubusercontent.com/ncase/coming-out-simulator-2014/69918f33e749117586ebd0fb57d9ec6ab047e7a3/UNLICENSE)
  - [`dinner_1.js`](https://raw.githubusercontent.com/ncase/coming-out-simulator-2014/69918f33e749117586ebd0fb57d9ec6ab047e7a3/js/game/dinner_1.js)
  - [`dinner_2.js`](https://raw.githubusercontent.com/ncase/coming-out-simulator-2014/69918f33e749117586ebd0fb57d9ec6ab047e7a3/js/game/dinner_2.js)
  - [`outro.js`](https://raw.githubusercontent.com/ncase/coming-out-simulator-2014/69918f33e749117586ebd0fb57d9ec6ab047e7a3/js/game/outro.js)

`Papers, Please` and `Orwell` official pages remain mutable publisher sources bound to access date 2026-09-01; no immutable source release was established.

### Reuse boundary

No external art, audio, prose, characters, UI composition, narrative sequence, names, or puzzle presentation will be reused—even where CC0 or Unlicense might permit it. The candidate retains only abstract patterns: remembered decisions, explicit commitment, delayed consequence, and inspectable state transition. All game assets and narrative expression must be original.

### Narrowed social ontology boundary

The social ontology no longer reconstructs evidence or owns the event trace. It begins after the diegetic-investigation ontology produces a submitted, bounded finding.

External references consumed:

- `DiegeticTraceRef`
- `EvidenceBundleRef`
- `ClaimRef`
- `SourceBindingRef`
- `ScopeRef`

Social-ontology-owned entities:

- `SubmittedBoundedFinding`
- `AuthorityReview`
- `OwnerDecision`
- `CommitmentState`
- `ContainmentAction`
- `PublicationAction`
- `ConsequenceRecord`
- `TrustDebt`
- `ResidueDisposition`

Key relations:

```text
SubmittedBoundedFinding --references--> DiegeticTraceRef
SubmittedBoundedFinding --binds--> SourceBindingRef
SubmittedBoundedFinding --is_bounded_by--> ScopeRef
SubmittedBoundedFinding --enters--> AuthorityReview
AuthorityReview --produces--> OwnerDecision
OwnerDecision --changes--> CommitmentState
ContainmentAction --preserves_uncertainty_without_promoting--> ClaimRef
PublicationAction --depends_on--> CommitmentState
PrematurePublication --produces--> FalseGreen
CustomerConsequence --creates--> TrustDebt
UnansweredPolicyQuestion --receives--> ResidueDisposition
```

Revised state-machine entry:

```text
SUBMITTED_BOUNDED_FINDING
  --owner requests evidence-->
RETURN_TO_DIEGETIC_INVESTIGATION
  --owner rejects interpretation-->
REJECTED_WITH_REASON
  --owner accepts bounded rule-->
COMMITTED_RULE
  --decision remains pending-->
PENDING_WITH_CONTAINMENT
```

### Fair BUG-4821 choice structure

`FalseGreen` is specifically grounded in BUG-4821: adding `quality_state` can make the reproduction test pass while owner commitment and scope remain unresolved. It is synthesis from the incident, not a claimed mechanic from an external precedent.

Replace the ambiguous `PATCH NOW` choice with three explicit alternatives:

1. `CONTAIN RETURNED ELECTRONICS`

   Temporarily prevent affected returned units from reaching storefront purchase while policy is unresolved. This is reversible containment, not semantic promotion. It costs availability and creates an operational-review consequence, but avoids customer harm.

2. `SUBMIT BOUNDED FINDING`

   Send the source-bound, scoped candidate to the fictional owner. The player may continue investigating other systems while the review progresses.

3. `PUBLISH CANDIDATE AS ADOPTED RULE`

   Apply the quality filter while representing the candidate as accepted. The interface must visibly state `OWNER DECISION: MISSING` and require deliberate confirmation. Only this misrepresentation produces the BUG-4821 false-green branch.

The game must never punish a player for choosing safe containment or honest submission. The premature path remains playable, but its risk is foreseeable: the local test becomes green, the authority ledger remains incomplete, and a later customer or operational consequence exposes the distinction. This keeps the branch consequential without turning it into a hidden designer trap.

Candidate research only; no ontology adoption or implementation authority is claimed.
