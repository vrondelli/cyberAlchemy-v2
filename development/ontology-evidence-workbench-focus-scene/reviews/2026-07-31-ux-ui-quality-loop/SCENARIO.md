# Body War OEW UX/UI Audit Scenario

Status: proposed frozen scenario; not executed

## Target Boundary

The run starts from a fresh loopback-only Body War OEW browser context. Each
attacker begins black-box from the rendered UI and accessibility tree. Source
may be inspected only after the initial observation record is frozen.

The run is read-only over:

- the Body War ontology;
- OEW source and upstream overlay;
- generated presentation graph and prior receipts;
- current focus-scene design documents.

The parent supplies an ephemeral token after registration. No agent persists
the token.

## Task Sequence

1. Explain what the page represents and what is currently in scope.
2. Find `SuggestedTrack` or the Suggested Track Route Expansion area without a
   supplied click script.
3. Trace one directed relation and state its exact edge type/predicate.
4. Explain the effect of Overview, Learn, Deep Dive, Filter, Export, Path,
   Theme, search, and keyboard help; record misleading or duplicate controls.
5. Move from the business-context home into one portal destination, then Back;
   retain orientation, selected relation, direction, and focus.
6. Use Path between two declared concepts and distinguish a route from a
   cluster or ontology branch.
7. Explain the projection/authority boundary and identify current provenance.

If the candidate home or Path behavior is not implemented, record the exact
missing state as a baseline failure instead of simulating success.

## State Matrix

- 1440x1000 desktop and 390x844 narrow viewport;
- pointer and keyboard-only;
- default colors and grayscale;
- forced-colors where the browser provides usable evidence;
- reduced motion;
- default, selected-node, selected-relation, portal-open, path-open, and
  returned-via-Back states.

## Contrast And Non-Color Checks

- Measure relevant foreground/background and UI-component boundaries before
  proposing exact tokens.
- Verify visible focus, selected state, node kind, exact edge type, direction,
  blocked/candidate status, and authority ceiling without relying on color.
- Require the same exact `sourcePredicate` to keep the same color across
  scenes; forbid arbitrary instance colors.
- Require visible text and line-pattern redundancy for each active edge type.

## Readability Checks

- Record smallest visible text, truncation, line length, card density, label
  collisions, simultaneous choices, and terminology drift.
- Test locate, trace, retell, distinguish, boundary, and vocabulary loci.
- Treat clarity, comprehension, workload, trust, and preference as human-study
  residue unless a separately authorized human protocol exists.

## Navigation Checks

- Every visible control has a clear accessible name, state, observable result,
  and focus-restoration target.
- Portal, Path, Back, Escape, and search preserve or explicitly announce scope.
- Keyboard and reduced-motion paths reach the same semantic states as pointer
  operation.
- A route presentation cannot create ontology branch membership, direction,
  sequence, causality, execution, promotion, or authority.

## Required Return

Each finding includes task, exact observation, target surface, evidence class,
severity, one-line repair, deterministic assertion where possible, authority
and human-evidence ceiling, and KEEP/FIX/DROP after verification. Zero findings
require an explicit attack ledger.
