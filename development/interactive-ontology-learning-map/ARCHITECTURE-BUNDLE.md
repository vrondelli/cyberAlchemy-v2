---
module: interactive-ontology-learning-map
version: 0.1.0-candidate
status: candidate
updatedAt: 2026-07-20
docType: architecture-bundle
scope: private
---

# Interactive Ontology Learning Map — Architecture Bundle

> Apply-approved refresh (2026-07-20): the map starts with the candidate
> `feature-with-independent-node-and-edge-files@1` minted-project route and later
> rebinds the same normalized graph boundary to an owner-issued FPR `Sg`.
> Candidate evidence cannot define the denominator, profile admission, FPR closure,
> ontology authority, or production state. `G-DSV2-SG` remains independently blocked
> for authoritative labeling and rebind.

## Design decision

Build a **two-posture source adapter, private projection compiler, and immutable read application**, divided into six ownership planes and three separately stored read views. A minted-project adapter supplies an explicitly non-authoritative candidate graph now; a later DomainSpec adapter verifies and preserves an owner-produced `Sg`. Both feed one normalized graph contract and one UI/read-model pipeline. Validators prevent candidate evidence from satisfying authority gates and prevent invalid type, evidence, authority, and view collapses. The first renderer is React Flow with build-time ELK coordinates, paired with first-class DOM hierarchy and relation-table surfaces.

## Why this shape

A single graph conflates documents, concepts, claims, decisions, work state, and pedagogy. A live canonical ontology would require unresolved morphism and authority laws. A renderer-only implementation would hide provenance and accessibility behind pixels. This architecture makes the smallest useful product while keeping every strong claim behind an independent receipt.

## System context

    repository-local minted-project sources
      -> project + feature metadata
      -> one node per file + one typed connection per file
      -> candidate source/build receipt
      -> minted-project candidate adapter

    later DomainSpec owner route
      -> FPR-01/02/03 receipts
      -> bounded FPR-04 Sg + quotient/retraction receipt
      -> authoritative read-only DomainSpec Sg adapter

    other owned sources (read only)
      -> revision-pinned source manifest
      -> source-local documentary adapters

    declared candidate or authoritative source material
      -> posture guard
      -> candidate projection normalization
      -> independent validators
      -> deterministic projection snapshot builder
           |- semantic.json + semanticHash
           |- learner.json
           |- navigation.json
           |- layouts.json
           |- search-index.json
           +- validation receipts
      -> immutable GET query layer
      -> journey + graph + hierarchy + tables

    exact successful DomainSpec evidence handle
      -> versioned evidence-handle adapter
      -> identity/provenance/digest and stage checks
      -> deterministic IOLM projection/parity/negative replay
      -> fresh non-admitting IOLM consumer receipt

Source owners remain upstream authority. The compiler owns only its build receipt and projection bytes. The application owns presentation and local ephemeral learner state.

## Component contracts

| Component | Owns | Emits | Must not do |
|---|---|---|---|
| Minted-project candidate adapter | private project/feature/node/connection sources and compiler receipt | normalized candidate graph plus source/build provenance | claim FPR, release, admission, or ontology authority |
| Posture guard | declared posture, source digest, compiler version, and authority receipt shape | accepted candidate or authoritative input handle | let a candidate receipt satisfy `G-DSV2-SG` |
| DomainSpec readiness verifier | exact FPR-01/02/03 and FPR-04 graph/quotient/retraction receipts | immutable authoritative `Sg` input handle or named block | set FPR state, accept an empty graph, or infer owner approval |
| DomainSpec `Sg` adapter | exact immutable `Sg` identity and profile | unchanged authoritative nodes/relations plus provenance | parse feature SPEC tables or candidate sources into replacement DomainSpec relations |
| DomainSpec evidence-handle adapter | exact `evf-l0-core` or `bte-core` handles accepted by the private YAML contract | fresh IOLM receipt conforming to the private JSON Schema | define obligations, rewrite upstream evidence, self-author an upstream handle, or turn consumption into authority |
| Source manifest | allowlist, revisions, hashes, privacy class, extractors | deterministic private manifest | glob arbitrary repo content |
| Documentary source adapters | syntax-specific extraction outside DomainSpec graph authority | source-local records/anchors | normalize away local meaning or mint DomainSpec relations |
| Candidate normalizer | versioned cross-source projection/learning axes | candidate records | claim canonical vocabulary or alter imported `Sg` semantics |
| Validation kernel | non-collapse, source, endpoint, proof, view laws | independent receipts, residue | promote or adjudicate |
| Snapshot builder | stable sort, canonical bytes, identities, hashes | immutable JSON artifacts | include clock data in canonical bytes |
| Layout builder | deterministic view coordinates | layouts keyed by snapshot/policy | affect semantic hash |
| Read API | bounded immutable queries | GET responses + ETags | expose mutation verbs |
| Learning application | journey, graph, hierarchy, table, details | accessible interactions | infer authority from prominence |
| Evidence harness | repeat builds, parity, accessibility/performance runs | run receipts | turn one gate into another |

## Data partitions

### Identity and semantic material

Snapshot identity includes posture, projection contract version, source digest, compiler version, source revisions/hashes, extractor version, and source-local identity material. Authoritative snapshots additionally bind exact `Sg` identity/profile/receipt references. `semanticHash` covers the selected posture's unchanged normalized records/relations plus other admitted source-local material, source references, independent epistemic/governance axes, unresolved references, and relevant validation posture. Here “canonical bytes” means deterministic bytes for this private projection; it does not grant DomainSpec or CAV2 authority.

### Learning material

Focus questions, propositions, explanations, completion checks, and challenges reference stable IDs but are stored outside semantic material.

### Navigation and layout material

Journey order, prerequisites, learn-next edges, breadcrumbs, filters, coordinates, and viewport hints are separately stored. Every navigation edge is non-semantic. Layouts are versioned by layout policy.

## Stable identity policy

- IDs are namespaced, human-debuggable, and deterministic.
- Candidate IDs remain stable across recompilation and later rebind, or the rebind supplies an explicit migration map.
- Imported authoritative DomainSpec node and relation IDs remain identical to their `Sg` identities.
- Source-local objects retain their namespace when normalized axes are added.
- Non-DomainSpec relation IDs derive from source namespace, endpoints, label, and source anchor; DomainSpec relation IDs are never recomputed locally.
- Attempted relations use a separate namespace and cannot satisfy a semantic-relation reference.
- Changing identity-bearing inputs changes snapshot identity.
- Changing learner copy or navigation alone does not change semantic identity.

## Validation architecture

| Validator | Positive fixture | Negative fixture | Receipt |
|---|---|---|---|
| Candidate posture/import | candidate project, node, connection, source, and build receipts | missing posture/provenance or forged authority receipt | bound candidate identity or named block |
| DomainSpec readiness/import | exact two-node/one-edge `Sg` plus FPR/profile/quotient/retraction receipts | missing/empty input, profile mismatch, changed identity | bound authoritative identity or named block |
| Schema/non-collapse | candidate record with independent axes | one fixture per forbidden merge | violation name + path |
| Source | allowed pinned anchors | missing/unallowed/changed anchor | manifest coverage |
| DomainSpec mapping/retraction | imported admitted edge | unapproved local label plus node/field/direction/edge/quotient mutants | unchanged import, explicit residue, independent comparison failure |
| Proof posture | domain-scoped formal claim | analogy cast as universal proof | claim/proof separation |
| View independence | semantic + learning views | mutate learner/nav only | semantic byte/hash equality |
| Determinism | two clean identical builds | changed identity input | bytes/hash/ETag/layout/index diff |
| API boundary | documented GET routes | mutation-route scan | route inventory |
| Information parity | spatial/hierarchy/table set | deliberately omitted row | parity diff |
| Accessibility | complete both journeys by tested mode | missing non-drag action | browser/AT evidence |
| Performance | curated 50–150-node fixture | measured budget breach | distributions and traces |

All executable receipts begin as `NOT_RUN`.

## Read API

The route family is defined in [queries.md](./queries.md). Responses include snapshot identity, ETag, stable IDs, and explicit truncation/pagination metadata. Neighborhood depth and relation facets are capped. Source-anchor queries resolve only through manifest entries. No endpoint accepts a filesystem path.

## UI architecture

One shared selection controller and typed read model feed four equal presentations:

1. focus-question overview and guided journey;
2. bounded spatial neighborhood;
3. authored semantic DOM hierarchy;
4. native table for relations, sources, claim posture, status, and authority effect.

Lens switches preserve selected stable ID and focus intent. The hierarchy/table never depend on geometry to carry meaning.

## Technology and scale

- Candidate renderer: React Flow major version 12.
- Candidate layout: ELK layered, precomputed under a versioned policy.
- Data: immutable JSON plus deterministic search index.
- Private witness root: `./prototype/`. Runtime framework is pinned by the first implementation task; the production website host remains unselected.
- Exact dependency versions: recheck and pin during the first implementation task.
- Candidate size: 50–150 curated nodes.
- Review triggers: more than 250 visible nodes, 500 visible edges, or 1,500 total nodes.

Crossing a trigger opens measured review; it does not authorize an automatic renderer change.

## Privacy and security

- Default-deny manifest; no crawling beyond explicit entries.
- Private paths, excerpts, JSON, indexes, source maps, logs, and receipts are private outputs.
- Query parameters cannot become filesystem paths or extractor selectors.
- Build logs are output channels subject to private-sentinel scans.
- L0 writes nothing into `arcanum/`.
- A future public Arcanum-only derivative is an independent build graph, not a feature flag.

## Degraded behavior

- Unresolved reference: retain explicit residue and fail its source gate.
- Missing candidate posture, provenance, or stable identity: block candidate compilation.
- Missing, empty, mismatched, or unreceipted DomainSpec `Sg`: block authoritative labeling/rebind, not candidate compilation.
- Unsupported syntax: fail closed and name the manifest entry.
- Layout failure: hierarchy/table remain available, but spatial gate fails.
- Partial validation: display exact `NOT_RUN` or failed state.
- Missing learning content: semantic snapshot may remain valid without a journey.
- Missing, stale, fixture-only, schema-only, self-authored, or stage-mismatched DomainSpec evidence: block only that IOLM consumer run and its combined claim; preserve the upstream core verdict.
- Missing UI host: immutable artifacts remain design evidence, not production evidence.

## Observability

Each build groups manifest ID, source revisions, extractor/schema/layout versions, snapshot/hash/ETag, record/relation/view counts, unresolved references, gate verdicts, duration, and artifact paths. Logs are evidence, not semantic nodes or owner decisions.

## Decision boundaries

| Decision | Owner status | Current effect |
|---|---|---|
| Approve combined schema/enums | selected: `private-learning-map-product-owner` | permits candidate contract work within the bounded projection scope |
| Select candidate-first posture | selected: `code-first-candidate-later-authority-rebind` | permits L0C candidate work through the shared pipeline |
| Select executable-proof consumer role | selected: `DEC-GCP-002` option 1 | adds an independent narrow IOLM receipt and a later BTE breadth rerun without gating either upstream core |
| Produce bounded DomainSpec `Sg` and prerequisite receipts | unresolved existing FPR owners | blocks authoritative labeling/rebind only |
| Select private L0 witness root | selected: `./prototype/` | permits bounded prototype work after schema owner gate |
| Select production website host | unresolved | blocks production integration only |
| Approve source-local meaning | existing source owners | adapters must preserve it |
| Maintain learner journeys | unresolved | only fixed fixtures are plan-ready |
| Approve public manifest | separate unresolved owner | outside L0 |

## Design risks

- Normalization may harden into de facto canon: retain source-local fields, candidate banners, versions, owner gate.
- A local parser may masquerade as DomainSpec authority: accept DomainSpec semantics only through exact `Sg` identity and receipts; route incompatible mappings as residue.
- Visual centrality may imply truth: explicit legends, focus framing, authority effect, labeled edges.
- Equivalent views may drift: one typed read model plus automated parity diff.
- ELK determinism may vary by version/platform: pin runtime and compare clean builds.
- Philosophy may overclaim formal support: typed claim ladder, proof-domain fields, challenges, no upward cast.

## Design gate

The architecture is complete enough for the selected L0C candidate SWU. G-OWNER and G-POSTURE pass; G-DSV2-SG remains `BLOCKED` only for the L0A authoritative rebind. G-HOST is satisfied for the repository-local private witness. Production website integration remains deferred. CAV2 hom-set/open-category questions are not prerequisites for this read-only candidate because it never calls application relations CAV2 morphisms.
