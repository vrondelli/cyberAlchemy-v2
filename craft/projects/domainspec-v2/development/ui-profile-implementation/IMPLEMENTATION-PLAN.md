---
artifact_id: UIP-IMPLEMENTATION-PLAN-v1
status: approved-plan
complexity: high
delivery_boundary: development UI profile and authority-ready packet
updated: 2026-07-17
---

# Required UI Profile Implementation Plan

## Objective

Implement all eleven required UI concepts as one development profile on the
existing DomainSpec graph engine, prove the profile mechanically with a complete
synthetic Create Player case, and produce exact authority-owner deltas. Real
corpora remain a later confidence lane and do not block this plan.

## Approved Design References

- `ARCHITECTURE.md` and `UI-PROFILE-DESIGN.json`.
- `../ui-meta-type-formalization/adjudication/verdicts.yml`.
- `../ui-meta-type-formalization/candidate-meta-types/ui/`.
- `../ui-meta-type-repair/` accepted repair contracts and integrated audit.
- `../../definitions/meta-types/meta-types.yml` and
  `../../definitions/relationships/relationships.yml` as read-only authority.

## Delivery Slices

| Slice | Layer | Outcome | SWUs |
| --- | --- | --- | --- |
| S0 Representation contract | L0 | all eleven concepts present with closed placement and confidence semantics | UIP-001 |
| S1 Formation and calibration | L1 | nine UI formation contracts plus alias/split contracts and complete synthetic fixtures | UIP-002..003 |
| S2 Graph integration | L2 | Create Player compiles and traverses through the existing engine with machine/human view agreement | UIP-004..005 |
| S3 Handoff and audit | L3 | exact owner packet and integrated receipt; no authority mutation | UIP-006..007 |

## Core Algorithms

### Representation normalization

1. Load the closed concept registry and reject missing/duplicate IDs.
2. Require `availability=required-by-design` for every UI concept.
3. Dispatch by representation:
   - `node`: validate against its UI formation schema;
   - `alias`: normalize to the declared canonical target while retaining the UI
     concept label as profile metadata;
   - `split`: require exactly the declared branches and normalize each branch by
     its own placement;
   - `role` or `projection`: attach typed profile metadata without inventing a
     canonical DS-D1 node;
   - `relationship`: emit a connection only when DS-D8 admits its endpoints.
4. Reject silent coercion, unknown placements, missing targets, and edge-only
   Binding instances presented as nodes.
5. Preserve unresolved endpoint questions as typed residue.

### Synthetic calibration

For every concept, produce one positive, nearest-neighbor, malformed,
label-erased, criterion-erased, and changed-consequence specimen. Port the
nonempty contract so empty/whitespace values fail. The Create Player case must
include all eleven concepts or their normalized representations and must never
be counted as a real corpus or independent witness.

### Engine integration

Add an explicit development-profile registry input to the existing
minted-project compiler/minter path. The canonical registry remains the default
and cannot be replaced implicitly. Compile per-node source files into the
existing graph, source manifest, build receipt, and Markdown view. Traverse the
graph deterministically and compare node/edge/profile handles across views.

### Authority handoff

Diff the development result against current DS-D1, DS-D8, and supported-profile
authority. Emit proposed activations/placements, Adapter alias handling, State
Indicator split handling, `shapes`/`reflects` endpoint residue, validation
receipts, and prohibited inferences. Do not apply the diff.

## Validation Strategy

| Slice | Validation |
| --- | --- |
| S0 | JSON/YAML parse, exact 11-concept census, closed placement enum, no duplicate IDs |
| S1 | schema/card parity, empty/whitespace rejection, all six fixture classes, round trip and targeted mutations |
| S2 | existing relationship validation, explicit profile-registry selection, graph/view equality, deterministic two-run digest |
| S3 | owner packet completeness, no canonical diff, package tests, `npm run validate`, `npm run typecheck` |

## Non-Goals

- Automatic DS-D1 activation, DS-D8 mutation, or release-profile admission.
- Proving empirical universality or framework completeness.
- Treating all eleven concepts as nodes.
- Building a second graph engine or a parallel ontology runtime.
- Blocking implementation on corpus B or independent reviewers.

## One-Stream Route

Execute `SWU-UIP-001` through `SWU-UIP-007` sequentially with Task Session,
stopping only on a contract contradiction, undeclared authority mutation, or
failed validation. No subagent fan-out or corpus decision is required.
