# TASK-UOVA-02 — UI API, Cues, and Geometry

Goal: admit one development UI profile, then make semantic cues and geometry explicit, versioned adapter inputs rather than renderer guesses.

Write scope: OEW overlay `src/oew/ui-api/**`, `src/oew/encoding/**`, `src/oew/layout/**`, focused tests, approved lock/manifest only if the unit preflight proves it necessary, and session evidence.

## SWU-UOVA-007 — DomainSpec UI-profile admission

Primary behavior: compile the digest-bound DomainSpec development UI profile into a versioned, OEW-owned UI API inventory without making DomainSpec a runtime dependency or authority source.

Algorithm:

1. Bind the exact `profile.yml`, profile schema, all nine candidate formation-schema paths/digests, `KnowledgeScene` schema, and `SemanticIntent` source digests named in `UI-API-CONTRACT.md`.
2. Validate the profile as development-only, `authority_effect: none`, and canonically inactive; preserve each concept's declared source confidence, including mechanically supported Adapter-to-Mapping alias evidence, while keeping the overall OEW corpus evidence ceiling empirically provisional.
3. Copy the exact source profile to the inventory's OEW-owned snapshot path and compile every typed Page, Layout, Component, View Model, Hook, Form, Action, Guard, Binding, Mapping, and State Indicator record into `src/oew/ui-api/**` using the exact inventory IDs.
4. Require the ten Action records to be bijective with the ten `SemanticIntent` kinds; reject aliases, omissions, and presentation-only mutations.
5. Keep Guards non-authoritative, Bindings read-oriented, and State Indicator distinct from an undeclared domain State Machine; bind each Adapter specialization to the canonical Mapping formation digest with source/target shape, direction, and deterministic field transforms.
6. Require every record to carry its individual source confidence, owner module, runtime symbol, and realization SWU; require every consumer SWU to register exact contract IDs.
7. Prove zero runtime import/path/package dependency on `projects/domainspec-v2/`; the compiled contract is owned by OEW and changes only through a new digest-bound admission.

Acceptance: profile, profile-schema, nine UI formation-schema, canonical Mapping formation-schema, Scene, and Intent digests pass; every typed instance satisfies its formation fields with native booleans; all inventory records resolve exactly once; action-intent bijection passes; six mappings have source/target/direction/nonempty deterministic transforms; guard/binding/adapter/state/owner/realization/transform/denominator negative controls emit stable diagnostics; owned snapshot digest equals source profile digest; cross-project runtime import scan is empty; a profile or record mutation fails closed. Dependencies: 001–006. Select 008.

## SWU-UOVA-008 — Exact-predicate encoding registry

Primary behavior: resolve each exact predicate to its own color token plus redundant pattern, label, family, and direction phrase.

Algorithm: validate versioned registry entries; require a one-to-one predicate-to-color-token mapping across the admitted registry; permit pattern reuse only as a redundant family cue; require text and direction phrase; produce a visible-scene legend and a searchable complete registry without showing 39 items at once.

Acceptance: exact/generalized/collision/missing/pattern-only fixtures; the color-collision mutation must emit `PREDICATE_COLOR_COLLISION`. Dependencies: 001, 007. Select 009.

## SWU-UOVA-009 — Node kind and role icon registry

Primary behavior: provide recognizable category icons while keeping label and kind/role text primary.

Algorithm: resolve kind and role through separate registries; render an icon token with accessible name; preserve adjacent label and textual kind/role; use no decorative icon as the only distinction; reject unknown registry values rather than silently choosing a generic semantic category.

Acceptance: all admitted kinds/roles resolve, text remains present, unknown and icon-removal fixtures fail, forced-color tokens are defined. Dependencies: 001, 007. Select 010.

## SWU-UOVA-010 — Canonical ELK geometry

Primary behavior: convert a scene plus stable measurements into deterministic, machine-addressable geometry.

Algorithm:

1. Build an ELK input sorted by exact cluster/node/relation IDs, with explicit hierarchy, ports, sizes, nonzero seed, options digest, and prior-position hints.
2. Run pinned `elkjs@0.9.3` in the declared worker mode.
3. Normalize node boxes, relation sections, bend points, label boxes, marker endpoints, and cluster bounds to 0.25px.
4. Sort output by source IDs and serialize canonical JSON bound to scene/options/tool versions.
5. Validate finite nonzero paths and addressability; keep semantics outside geometry.

Acceptance: byte-equal replay, shuffled-input invariance, multiedge separation, missing-section failure, and ≤2,000ms design cap in the later full fixture. Dependencies: 003, 007–009. Select 011.

Every SWU runs focused tests plus OEW root regression and scoped whitespace. Closeout synchronizes its manifest row, this task, W2, and the Work Pack. Expected result: registry/geometry contract receipt with fixture counts, exact dependency identity, raw timing where applicable, and deterministic successor.
