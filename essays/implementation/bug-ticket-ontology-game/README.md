# The Must in the Ticket

Status: implementation candidate  
Authority effect: none  
Release admission: not granted

This package is a first-person spatial browser escape-game vertical derived from
`the-bug-ticket-that-became-an-ontology.md`. The player freely revisits three
connected places—Incident Control, the Policy Archive, and the Transfer
Annex—while carrying evidence across location boundaries. Three subsystem
machines emit masked witnesses which assemble into Replay Address
`2041-0917-R4`; the ticket and order identifiers are explicitly rejected as
execution locators. The address wakes a deterministic event-word rain. Its
causal stream must be captured on both sides of a real browser reload before
the later ontology investigation can proceed. Seven environmental puzzles lead
to a bounded BUG-4821 construction chain. A red override still produces a
deliberately unsafe false-green ending.

The primary place renderer uses Three.js for navigable 3D rooms, unique
illustrated machines, lights, shadows, bounded movement, collision standoff,
physical state indicators, and doors. Guided control is the default: click a
machine to walk to its authored inspection point, click the floor to relocate,
and drag to look. `Tab` cycles machines and doors; `E` or `Space` approaches and
activates the selected target. `WASD` and arrow keys remain available. The
optional Immersive mode enables pointer-lock mouse-look for players who want
direct first-person control, while sound remains opt-in. Phaser 4.2.1 retains
the original populated room plates as a progressive fixed-camera fallback for
browsers where a WebGL context cannot be created. The surrounding DOM keeps
the inventory, puzzle workbenches, case log, and keyboard station controls
readable and accessible. The experience supports click-to-use inventory,
drag-and-drop, three-level hints, reduced-motion preferences, and local autosave.
Wrong combinations remain in the room with contextual feedback; the unresolved
warehouse-transfer question can only be passed by preserving it as residue.

The word-rain rendering techniques were developed with the GPL-2.0
`Cyphers-News/gematro-hyperdope` code-rain implementation as an external
technical reference. The package contains an independent deterministic ES
module rather than copied upstream code or fonts. Exact provenance is recorded
in [`EXTERNAL-SOURCES.md`](EXTERNAL-SOURCES.md).

The package exercises the DomainSpec v2 development UI profile. Its UI types
are implementation-owned development contracts; they are not canonical or
release-admitted. The package-local v0.2 binding snapshot updates only the
digest of the current meta-type registry. It does not mutate or promote that
registry.

## Run

From `projects/domainspec-v2/impl`:

```bash
node --import tsx tools/build-ui-profile-feature.ts \
  --project ../../../cyberAlchemy-v2/essays/implementation/bug-ticket-ontology-game/domainspec \
  --registry ../../../cyberAlchemy-v2/essays/implementation/bug-ticket-ontology-game/domainspec/ui-development-profile-binding-v0.2.json \
  --handle ui-development-explicit-binding-v0.2
```

Then, from this package:

```bash
npm install
npm run check
npm run dev -- --port 4173
```

Open `http://127.0.0.1:4173/`.

`npm run build` writes a production bundle to `dist/`. The three generated room
plates live under `web/assets/`; they were produced with the built-in
image-generation workflow and are consumed locally by the Three.js renderer
and Phaser fallback. Inspectable objects are discovered in the world rather
than exposed as an always-visible station menu.

The Three.js art is decomposed by place and machine rather than treated as one
flat painting. Each place has an empty architectural shell, and every one of
the 13 evidence machines has its own transparent RGBA asset, spatial footprint,
interaction anchor, look-at height, and state beacon. The three original
populated plates remain only for the fixed-camera fallback. Procedural geometry
remains the collision and raycast surface, while authored content remains the
source of puzzle behavior; generated pixels own neither semantics nor authority.
The exact accepted asset digests and normalized generation prompt sets are in
[`web/assets/art-manifest.json`](web/assets/art-manifest.json).

## Claim ceiling

The vertical proves only that the selected candidate source can compile into a
deterministic development graph and drive tested local escape-room transitions. It does
not adopt the Product Capability, promote definitions, register a CAV2-D65
ConstructionBinding, establish independent conformance, or authorize release,
deployment, or external effects.
