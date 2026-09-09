# Scene Assets and Controls Implementation Layering

Status: planning candidate  
Authority effect: none  
Target: `bug-ticket-ontology-game` spatial renderer  
Mode: brownfield decomposition  

## Decision to make

The next implementation should prove whether the game becomes readable and
comfortable when every important machine has one visual identity, one physical
location, one interaction root, and one visible state. The current scene cannot
prove that: Incident Control and the Transfer Annex each combine a full-room
mural, a second full-width multi-prop image, and procedural copies of the same
machines. The player sees several representations in one plane while the
interactive geometry sits somewhere else.

The current control path compounds the problem. Walking requires pointer lock,
camera aiming, proximity, and a centre-screen raycast before `E` can inspect an
object. That is suitable as an optional immersive mode, not as the default for
an investigative escape game.

## Scene composition rule

One asset gets one responsibility. A semantic station must never appear both in
the architectural background and in a multi-prop overlay.

```text
room shell       walls, floor, ceiling, windows, fixed pipes      no interaction
landmarks        one or two objects that establish room identity  navigation aid
stations         one asset root per inspectable machine           raycast + state
clue inserts     paper, screens, sockets, lamps, seals             child of station
doors            one root per traversable exit                     navigation
atmosphere       light, particles, audio, grime                    never raycastable
interface        prompt, inventory, puzzle close-up                DOM, not world art
```

The centre of every room remains a clear circulation zone. Stations occupy the
perimeter in small narrative clusters, with at least 2.4 world metres between
interaction anchors. Each station faces its approach point instead of facing a
shared picture plane. No atmospheric or decorative object enters the
interaction raycast collection.

## Existing asset disposition

| Existing asset | Current problem | Planned use |
| --- | --- | --- |
| `incident-control-room-v1.png` | The mural already depicts multiple machines. | Concept reference; replace in Three.js with a shell-only Incident Control plate. Retain for the Phaser fallback until its replacement is ready. |
| `policy-archive-v1.png` | The mural contains station-like archive furniture. | Concept reference; replace with a shell-only archive plate. |
| `transfer-annex-v1.png` | The mural depicts the crate, table, clock, and airlock. | Concept reference; replace with a shell-only annex plate. Retain temporarily for fallback. |
| `incident-control-props-v1.png` | Four props share one full-width plane, so their pixels do not occupy their interactive coordinates. | Stop rendering it in the final Three.js scene. Use it only as style and silhouette reference when producing four individual RGBA assets. |
| `policy-meaning-rings-v1.png` | Correctly belongs to one station, but is a flat skin over generic geometry. | Keep as the first valid station asset; recalibrate its scale, facing, anchor, and depth. |
| `transfer-annex-props-v1.png` | Five props share one plane and duplicate procedural stations. | Stop rendering it in the final Three.js scene. Use only as reference for individual station and landmark assets. |

Generated pixels remain visual evidence only. Station IDs, prerequisites,
rewards, collision, interaction, and puzzle state remain owned by the authored
content and runtime model.

## Planned asset inventory

### Shared architecture and interface

| Asset family | Count | Interaction |
| --- | ---: | --- |
| Shell-only room plates | 3 | None; far-wall depth and room identity only. |
| Modular floor, wall, and ceiling materials | 3 sets | None; procedural geometry receives them. |
| Door visual families | 3 | Each door has a dedicated root and approach anchor; click walks to it, then traverses. |
| Inventory icon atlas | 18 icons | DOM inventory only; it is never positioned as a world prop. |
| Focus, locked, ready, and solved indicators | 4 reusable treatments | Applied by state to a station root; no duplicated models. |
| Interaction cursor and destination marker | 2 | Confirms hover and click-to-walk destination. |

### Incident Control

The room uses a U-shaped evidence trail. The spawn and centre aisle remain
empty. The support desk is near-left, the ledger is deep-left, the availability
rack is centred on the back wall, the storefront terminal is deep-right, and
the archive door occupies the right wall.

| World asset | Role and interaction | Visible state changes |
| --- | --- | --- |
| Red-folder support desk | Click walks to the desk and opens a close inspection. It yields the ticket and order receipt. | Folder closed -> open; two paper silhouettes -> collected impressions. |
| Sealed event ledger | A terminal with three witness sockets. Inspection opens the address keypad; a valid address starts the deterministic word rain. | Dormant -> witnesses present -> address unlocked -> rain active -> two captures sealed. |
| Availability rack | Four physically separate input lamps and one projection aperture. It opens only after the replay. | Three lit/one dark -> quality socket identified -> fault record emitted. |
| Commitment printer | A storefront terminal and narrow receipt printer. Using the order receipt exposes the machine witness. | Smoked screen -> receipt pulse -> witness released. |
| Paper-rail archive door | The room exit, visually separate from the storefront terminal. | Inactive edge light -> available traversal light. |

### Policy Archive

The archive is a broken circle rather than a row of machines. The quality index
stands near the entry, catalogue drawers occupy the back-left, the meaning dial
is the central landmark, the ontology bench sits back-right, and the owner
terminal sits beside the cold-passage door. The middle remains wide enough to
walk around the dial.

| World asset | Role and interaction | Visible state changes |
| --- | --- | --- |
| Quality index cabinet | Pull-out cold-glass record drawer; inspection yields the quality witness. | Drawer shut -> subject mask illuminated -> witness released. |
| Policy catalogue | Three physical drums select origin, material domain, and promise. A close-up may provide precise controls. | Unindexed -> coordinate aligned -> policy fragment and scope card exposed. |
| Five-ring meaning dial | Room landmark and puzzle. Clicking a ring rotates only that ring; keyboard equivalents remain in the close-up. | Collapsed axle -> five ordered distinctions -> semantic map released. |
| Ontology bench | Five labelled-by-shape sockets receive evidence artifacts. | Empty edge -> framed candidate relation -> forbidden inference visibly fenced. |
| Pneumatic owner terminal | Accepts the source-bound candidate package. The player cannot forge the decision with another item. | Empty carrier -> review transit -> bounded owner seal and contract cassette returned. |
| Warm and cold doors | Separate return and onward routes on opposite walls. | Destination light and room-temperature colour identify direction without text selectors. |

### Transfer Annex

The annex uses three separated custody zones: intake on the left, inspection in
the centre, and release on the right. The transferred crate occupies its own
quarantine bay rather than sitting on the inspection table. The airlock is a
large destination landmark at the far-right wall.

| World asset | Role and interaction | Visible state changes |
| --- | --- | --- |
| Warehouse intake scanner | First machine in the left zone; inspection reveals the warehouse witness. | Frosted display -> serial sweep -> witness released. |
| Inspection light table | Centre work surface comparing the old inspection and new warehouse tag. | Dark glass -> overlapping evidence lit -> unresolved mismatch visible. |
| Transferred crate and custody clock | One station root in a bounded quarantine bay; the clock is its child clue, not another hotspot. The residue marker is placed here. | Unmarked -> owner seal present but clock broken -> residue tag attached and use blocked. |
| Seven-socket deployment airlock | Final construction surface. Individual sockets accept the bounded evidence chain; the red override remains deliberately dangerous. | Empty -> evidence chain assembled -> bounded passage; override -> false-green ending. |
| Archive return door | Dedicated return route on the left wall. | Warm edge light distinguishes it from the release airlock. |

Decorative annex objects—cage, frost pipes, trolley tracks, hanging lamps—remain
noninteractive and cannot resemble clue-bearing stations.

## Station asset contract

Every station entry should eventually declare the following spatial fields in
the authored content. These are planning fields, not current schema additions.

```json
{
  "visual_asset": "./assets/stations/event-ledger-v1.png",
  "position": {"x": -5.8, "z": -3.8},
  "facing": 0.35,
  "interaction_anchor": {"x": -4.7, "z": -2.7},
  "look_at_height": 1.35,
  "interaction_radius": 1.4,
  "footprint": {"width": 1.7, "depth": 1.0},
  "interaction_mode": "walk_then_inspect",
  "state_visuals": {
    "locked": "ledger-locked",
    "ready": "ledger-ready",
    "solved": "ledger-solved"
  }
}
```

The visual, collider, interaction anchor, and state all share one station root.
The `interaction_anchor` is a safe standing point, not the centre of the prop.
This removes the current ambiguity between where an image appears and where its
generic collision mesh happens to be.

## Control model

### Guided mode — default

- Hovering an interactive prop changes the pointer and reveals its short
  diegetic description.
- Clicking a nearby prop inspects it immediately.
- Clicking a distant prop finds its interaction anchor, walks the player there,
  turns the camera toward it, and then opens the inspection.
- Clicking the floor displays a short-lived destination marker and walks there.
- Dragging the empty scene rotates the view within bounded yaw and pitch; no
  pointer lock is requested.
- Clicking a door walks to its threshold and traverses it.
- `E` or `Space` activates the focused station, `Tab` cycles nearby stations,
  and arrow keys or `WASD` remain optional direct movement.
- Any manual movement cancels auto-walk. `Escape` cancels auto-walk or closes a
  puzzle before it leaves the browser context.
- On touch, tap moves or interacts and drag rotates. No hidden mouse-only action
  is required.

### Immersive mode — optional

The current pointer-lock, mouse-look, `WASD`, and centre-reticle interaction
becomes an explicit mode chosen from a small Controls panel. It remembers the
player's preference locally but is never required to finish a puzzle.

### Interaction feedback

The prompt reports an action, not a control mystery: `Inspect ledger`, `Walk to
ledger`, `Locked: three machine witnesses`, or `Return to archive`. The selected
station receives an outline and a floor halo; locked stations use a quiet pulse
instead of looking inactive. A destination marker and camera ease make automatic
movement legible. Reduced-motion mode performs the same transition without bob,
camera sweep, or animated travel.

## Progressive implementation layers

### Layer 0 — Incident Control composition and guided-control proof

Decision question: **After this layer, we know whether separated station art and
click-to-walk controls solve the visual crowding and navigation friction.**

Minimum working unit:

- Create one shell-only Incident Control plate and four individual station
  assets.
- Stop rendering `incident-control-props-v1.png` in Three.js.
- Place the four stations and one exit using dedicated roots and approach
  anchors around a clear centre aisle.
- Add click-to-floor, click-to-station, auto-walk, camera-facing, `Tab` focus,
  and cancellation; retain immersive controls behind a mode toggle.
- Preserve existing station IDs, prerequisites, rewards, word-rain behavior,
  autosave, and the Phaser fallback.

Exit evidence:

- A browser run from spawn to all four stations and the exit requires no
  pointer lock and no centre-screen aiming.
- Every station's visible pixels overlap its collider and approach anchor.
- At 1280x720 and 390x844, no two station silhouettes overlap from spawn.
- Existing deterministic logic tests still pass.

Risk: navigation can stop inside props or trigger an inspection through a wall.  
Cost: medium; one room and the shared control adapter change.  
Promotion rule: do not replicate the layout until observed play confirms that
players can identify and reach all four stations without instruction.

### Layer 1 — Three-room spatial and asset contract

Decision question: **After this layer, we know whether the same spatial contract
can keep all thirteen stations and four door placements readable across three
different room compositions.**

Minimum working unit:

- Produce the remaining two shell-only plates and eight remaining individual
  station assets; retain and recalibrate the existing meaning-dial asset.
- Apply the circular archive and three-zone annex layouts.
- Give every station and exit a footprint, approach anchor, facing, and state
  root.
- Remove both full-width multi-prop sheets from Three.js runtime composition.

Exit evidence:

- A layout validator proves every approach anchor is in bounds, outside all
  footprints, and reachable from spawn and each door.
- Each semantic station has exactly one rendered station asset and one
  interaction root.
- A complete three-room traversal works in guided and immersive modes.

Risk: artwork scale and perspective may make individual cutouts feel pasted on.  
Cost: high; two room shells, eight station assets, spatial tuning, and validation.  
Promotion rule: accept imperfect texture polish if spatial ownership and puzzle
readability are proven.

### Layer 2 — Physical puzzle state and close-up interactions

Decision question: **After this layer, we know whether the machines communicate
puzzle state without relying on a separate explanatory menu.**

Minimum working unit:

- Add child visuals for witness sockets, lamps, drawers, rings, evidence sockets,
  carrier, residue tag, and deployment sockets.
- Bind `locked`, `ready`, `active`, `solved`, and `unsafe` presentation to the
  existing game state.
- Let direct world interactions open the precise DOM close-up when text entry,
  ordering, or accessible keyboard controls are required.

Exit evidence:

- Locked, ready, solved, and unsafe states are distinguishable without reading
  the case log.
- Reload restores the correct physical state, including both word-rain captures.
- The false-green override remains visibly different from bounded completion.

Risk: visual animation can accidentally imply authority or completion.  
Cost: medium-high; state overlays and binding tests.  
Promotion rule: no visual state may exceed the claim made by the runtime state.

### Layer 3 — Input parity and accessibility

Decision question: **After this layer, we know whether mouse, keyboard, touch,
reduced-motion, and fallback users can complete the same investigation.**

Minimum working unit:

- Add keyboard focus ordering, descriptive prompts, optional movement speed and
  look sensitivity, touch gestures, and a visible control-mode switch.
- Give Phaser fallback the same station ordering and interaction language even
  if it remains fixed-camera.
- Ensure focus is restored to the originating station after every close-up.

Exit evidence:

- Full completion passes with mouse-only, keyboard-only, and touch emulation.
- Reduced-motion completion contains no forced camera animation.
- Browser accessibility inspection finds no unreachable station or unnamed
  control.

Risk: maintaining two movement modes can split behavior.  
Cost: medium.  
Promotion rule: modes may differ in navigation feel but not in puzzle access or
outcomes.

### Layer 4 — Art, sound, and performance finish

Decision question: **After this layer, we know whether atmosphere improves the
experience without obscuring the evidence trail or harming browser performance.**

Minimum working unit:

- Add restrained machine loops, one interaction sound family, room ambience,
  decals, particles, and final material tuning.
- Atlas small state overlays and lazy-load assets by room.
- Preserve a silent mode and reduced motion.

Exit evidence:

- Room entry remains responsive on the supported desktop and mobile profiles.
- Decorative contrast never outranks an available station or door.
- Asset provenance, dimensions, alpha requirements, and digests are complete in
  the art manifest.

Risk: polish can reintroduce clutter.  
Cost: medium and scalable.  
Promotion rule: remove decoration before weakening interaction contrast.

## Validation additions

The implementation should add machine-checkable constraints alongside browser
playthrough evidence:

- no Three.js room may render an asset whose role is `multi-prop-sheet`;
- every station ID maps to exactly one root, asset, footprint, and approach
  anchor;
- approach anchors are reachable and at least 0.35 metres outside blockers;
- station silhouettes do not overlap from the declared spawn camera above an
  agreed threshold;
- guided mode never calls `requestPointerLock`;
- manual input cancels automatic travel immediately;
- the same station callback and puzzle state serve both control modes;
- all three rooms, thirteen stations, and four door placements remain reachable;
- the seven-puzzle journey, deterministic word rain, reload boundary, residue
  requirement, and unsafe override continue to pass unchanged.

## Deferred deliberately

- Replacing Three.js with a different engine.
- Full 3D character movement, jumping, physics, or combat.
- Photogrammetric or high-polygon models.
- Procedural room generation.
- Networked saves or multiplayer.
- New puzzles, narrative branches, or changes to ontology authority semantics.
- Reworking the DomainSpec UI type profile or claiming D65 conformance.

## Recommended next layer

Implement **Layer 0 only**. It is the smallest unit that tests both complaints
together: spatial separation and difficult controls. Generating every remaining
asset before that proof would lock the current composition assumptions into a
larger and more expensive art set.

Success is not “more art.” Success is that a new player can enter Incident
Control, notice four distinct machines, reach each one by clicking it, understand
why a locked one is locked, and leave through the physical archive door without
being taught pointer lock.
