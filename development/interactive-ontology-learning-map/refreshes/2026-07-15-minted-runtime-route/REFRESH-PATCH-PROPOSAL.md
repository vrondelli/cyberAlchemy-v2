# Refresh Patch Proposal — Candidate-First Learning Map

Status: `proposal-only`

Recommended option: code-first candidate posture with later authority rebind

## Decision Being Proposed

Permit repository-local learning-map implementation before the FPR `Sg` exists, using
the tested minted-project runtime as the DomainSpec graph substrate.

The resulting graph must be identified as `candidate`. It may model CyberAlchemy
Method, Craft formal concepts, definitions, claims, evidence, tasks, decisions, and
their typed connections, but it may not claim to be the owner-issued FPR `Sg`, an
admitted release, or a promoted ontology authority.

The alternative is to preserve the current assurance-first plan unchanged and wait
for all FPR receipts. That remains valid, but it keeps implementation blocked.

## Non-Collapse Rule

There is one graph data contract and one projection pipeline:

```text
concept node files + connection files
                 |
                 v
      DomainSpec minted-project compiler
                 |
                 v
          shared graph read model
          /        |          \
       graph    hierarchy     table
```

`candidate` and `authoritative` are provenance/assurance postures of that pipeline,
not separate graph technologies. Rebinding later replaces or migrates the input
receipt while keeping the consumer contract stable.

## Proposed Artifact Deltas

### `SPEC.md`

- Replace the universal pre-prototype prohibition with a two-posture rule.
- Define `candidate` as machine-valid but non-authoritative.
- Reserve `authoritative` for an exact owner-issued FPR `Sg` plus prerequisite receipts.
- Require posture, source digest, compiler version, and provenance on every graph build.
- Preserve graph/hierarchy/table parity and the two learning journeys.

### `ARCHITECTURE-BUNDLE.md`

- Add a minted-project source adapter before the shared read model.
- Keep an FPR `Sg` adapter behind the same normalized graph boundary.
- Add a posture guard that prevents candidate artifacts from satisfying authority gates.
- Preserve read-only behavior and deterministic generated views.

### `INVOKE-PLAN.md`

- Mark the retired-reference guard dependency complete.
- Record `SWU-FPR01-001` complete while leaving FPR-01 open.
- Split the pre-L0 route into:
  - L0C: candidate learning graph and read-model proof;
  - L0A: later authoritative FPR rebind and equivalence/migration proof.
- Select L0C as the recommended active window only after posture approval.

### `IMPLEMENTATION-LAYERING.md`

- Insert L0C before the current L0 contract work.
- Keep UI work dependent on one stable normalized graph contract, not on FPR authority.
- Make the authority rebind a promotion gate, not a prerequisite for exploratory code.
- Keep production website integration outside the repository-local prototype layers.

### `WORK-PACK.md` and `EXECUTION-PACK.md`

- Add a posture decision receipt as the sole new precondition for candidate work.
- Add a bounded candidate slice that writes only under `prototype/` and its session evidence.
- Keep `G-DSV2-SG` attached to authoritative labeling/rebind, not to candidate compilation.
- Preserve all existing FPR nodes and owners; do not mint replacement lifecycle IDs for them.
- Select only one first SWU after the patch validates.

### Task and wave artifacts

Add or recompose one bounded first task with these outputs:

- machine-readable private project metadata;
- one file per concept node;
- one file per typed connection;
- a small Craft/CyberAlchemy seed corpus;
- compiled graph plus source/build receipts;
- graph/hierarchy/table parity fixture;
- a visible `candidate` posture badge and machine field.

The first slice should not include the production website, authoring CMS, accounts,
collaboration, editorial promotion, or the full corpus.

### `DISPATCH.json` and `DISTILL-VALIDATION.md`

- Re-run Dispatch Spec after the route changes.
- Re-run Distill Validate against the smallest code-first slice.
- Fail if candidate output can satisfy `G-DSV2-SG`, omit provenance, or fork the read model.

## Proposed Machine Layout

The exact filenames remain a design output, but the plan should preserve the existing
one-node-per-file decision and use a shape equivalent to:

```text
prototype/
  project.json
  features/
    cyberalchemy-method/
      feature.json
      nodes/
        <concept-id>.json
      connections/
        <connection-id>.json
    craft/
      feature.json
      nodes/
        <concept-id>.json
      connections/
        <connection-id>.json
  generated/
    graph.json
    views/
    receipts/
```

Markdown remains a generated or curated human view; machine JSON remains the
compilation source for graph semantics.

## Acceptance Contract for an Apply-Approved Refresh

An applied refresh passes only if:

1. candidate and authoritative postures cannot collapse;
2. all graph surfaces consume the same normalized read model;
3. no candidate receipt satisfies an FPR authority gate;
4. every node and edge has stable identity and provenance;
5. FPR-01 through FPR-04 retain their existing owners and states;
6. a single bounded first SWU is selected with exact write paths and validation;
7. no implementation is executed by the refresh itself.

## Explicit Non-Goals

- resolving FPR authority disagreements;
- declaring the minted-project stack release-admitted;
- creating a second ontology authority;
- creating two unrelated graph models;
- integrating the production website;
- migrating or publishing private CyberAlchemy material.
