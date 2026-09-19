---
mode: define
status: pass
discovery_waiver_reason: The approved Refine seed and strict Context Builder pack provide the bounded discovery baseline; widening to product discovery would cross the authorized run boundary.
---

# Invoke Define — Minted Project Machine-Node Package

## Define Context

The target is a candidate contract for what DomainSpec mints into a new consumer project. It is not a feature package authored inside the DomainSpec repository and it is not a decision about FPR-01's production source home.

The approved context resolves the working authority order:

1. DomainSpec supplies the language alphabet, relationship signatures, schemas, compiler behavior, validators, and default project shape.
2. A minted consumer project supplies its own canonical node declarations, connections, feature grouping, and local semantic decisions.
3. A compiler derives a normalized machine graph and source manifest.
4. Human Markdown and other views are generated consumers of that graph and manifest.

## Defined Object

`MintedProjectNodePackage` is a project-local, machine-first set of addressable node sources plus a project manifest that can be deterministically compiled into a traversal graph and generated human views.

It closes only when all of the following are true:

- every canonical node has one stable project-local ID and one source file;
- every canonical edge has one stable edge ID and one source owner;
- node kinds and relationship endpoint pairs resolve against a declared DomainSpec language authority version/digest;
- a project manifest resolves feature roots without a path into the DomainSpec development repository;
- compiled graph nodes point back to their canonical source files;
- graph and view outputs bind the canonical source-set digest;
- an implementer can traverse and inspect nodes without parsing Markdown.

## Candidate Machine Contract

This is an experiment contract, not a promoted schema:

```yaml
project_manifest:
  project_id: key-and-door
  domainspec_language:
    version: candidate
    kinds_digest: <sha256>
    relationships_digest: <sha256>
  feature_roots:
    - specs/key-and-door/feature.yml
  generated_root: .domainspec/generated

feature_manifest:
  feature_id: key-and-door
  source_layout: per-node-connections | per-node-plus-edges | aspect-bundles
  source_roots: [nodes]

node:
  schema_version: minted-node/v0
  node_id: key-and-door.Player
  feature_id: key-and-door
  kind: Entity
  intent: The player that can attempt to unlock a door.
  body: {}
  connections:
    - edge_id: key-and-door.Player-performs-UnlockDoor
      type: performs
      to: key-and-door.UnlockDoor
```

The three candidate layouts may encode the same contract differently, but the normalized graph must be byte-equivalent after canonical sorting.

## Defined Boundaries

| Boundary | DomainSpec factory owns | Minted consumer project owns | Generated/read-only |
| --- | --- | --- | --- |
| Language | kind and relationship registries; schema/compiler/validator behavior | selected compatible language version/digest | resolved registry subset in build receipt |
| Domain meaning | no concrete consumer feature meaning | nodes, bodies, connections, local feature grouping | normalized graph projection |
| Location | mint defaults and path-safety rules | project-relative manifest paths and optional allowed overrides | source manifest with resolved paths/digests |
| Human view | generator contract | optional presentation configuration that cannot add semantics | Markdown, diagrams, index pages |
| Evidence | validator and mutation-test contract | project-local source history and owner decisions | build receipt, graph digest, view digest |

## Non-Collapse Rules

1. A DomainSpec-local fixture is a workflow witness, not the canonical source of a minted project's business feature.
2. A generated `graph.json` is the normalized traversal projection, not a second writable source.
3. Generated Markdown is a human view, not an input needed to recover machine fields.
4. A source-owned connection is still a first-class edge in the compiled graph; storing it inside a node must not collapse its identity.
5. Domain relationship edges and artifact-provenance links remain different catalogs, even if they share an envelope mechanism.
6. Kind registration, shape evidence, and release admission remain separate maturity dimensions.

## Invariants

- `node_id` and `edge_id` are globally unique within the project graph.
- Every source path is project-relative and remains under the project root after resolution.
- Every connection target resolves to exactly one canonical node.
- Every relationship label is active and its endpoints match the canonical signature.
- Each authored edge is declared exactly once; generated inverse navigation is never counted as a second authored edge.
- Source-set digest changes invalidate graph and Markdown build receipts.
- Rebuilding unchanged sources produces byte-identical normalized graph and Markdown.

## Template Selection

- Selected: run-local candidate definition package because the target is an unsettled mint/authoring contract and no promoted production family may be mutated in this run.
- Reused shape: Invoke Define contract plus the existing DomainSpec node-envelope evidence.
- Rejected: treating `templates/domainspec-spec/` or an existing DomainSpec feature fixture as the consumer authority home.
- Eligibility: candidate-only, current-run evidence, no registry or canonical promotion effect.
- Tie: none; the approved seed explicitly selects a three-layout experiment before production planning.

## Decisions and Hypotheses

### Decisions fixed by the run

- Machine sources precede graph and Markdown views.
- Consumer project paths cannot resolve into DomainSpec's repository fixtures.
- The same graph semantics must survive three storage layouts.
- No production contract is selected until mutation evidence and design review exist.

### Hypotheses to test

- H1: per-node files with source-owned outgoing connections preserve edge identity while minimizing authoring fragmentation.
- H2: separate edge files add useful independence only if edges need a distinct lifecycle or owner.
- H3: aspect bundles reduce files but weaken node edit locality and increase merge/authority concentration.
- H4: a normalized graph plus source manifest makes implementer traversal independent of authoring layout.

## Gaps and Residue

| Gap | Effect now | Owner/route |
| --- | --- | --- |
| Production source home is unresolved | none for run-local manifest; blocks production promotion | FPR-01 Decision Gate |
| Node envelope/validator are designed, not built | candidate experiment only | future DomainSpec implementation plan |
| Cross-feature edges are absent from the toy | extension boundary only | rerun Refine when cross-feature proof is required |
| Edge independent lifecycle is unproven | do not pay separate-edge cost yet | toy tournament evidence |

## Implementation Layering Seed

See `LAYERING-SEED.md`. This define stage identifies only the L0 proof boundary; it creates no work-pack tasks.

## Dispatch Technique Trace

| Technique | Effect |
| --- | --- |
| `frame_handoff` | Uses the strict S01 obligation pack as the only bounded context. |
| `minimum_component_catalog` | Limits the contract to manifests, node/edge sources, compiler projection, human view, and receipts. |
| `authority_split_gate` | Separates factory form, consumer meaning, and generated views. |
| `concrete_path_evidence` | Requires project-relative source paths and rejects DomainSpec-repository escape. |
| `residue_ledger` | Carries FPR-01, cross-feature, and edge-lifecycle gaps without pretending to solve them. |

## Distill Sanity Check

- Status: `pass`
- Coherent definition unit: one project-local feature package that compiles four nodes and three edges under one manifest.
- Split pressure: layouts are experimental alternatives, not three product contracts.
- Rationale: the unit contains enough connected variety to test graph semantics while remaining small enough for identical mutants in S06.

## Transport Report

No upstream artifact, glossary authority, Necronomicon section, template registry, or production package was mutated. This run-local definition is handed to Interrogation refine-review and then Distill.

## Invoke Result

- Mode: define
- Spell: `invoke`
- Canonical ID: `invoke`
- Scope: library
- Phase status: `pass`
- Mode contract: `spells/invoke/define.md`
- Outputs: `DEFINE.md`, `GLOSSARY.md`, `LAYERING-SEED.md`, `transport-report.json`
- Template selection: run-local candidate definition package; no promotion
- Distill validation: `pass`; the four-node/three-edge feature package is a coherent experiment unit
- Decisions: authority and projection boundaries fixed for the experiment
- Unresolved gaps: production source home, cross-feature proof, and independent edge lifecycle
- Next route: `design`, after refine-review and Distill selection

