# Runtime Handoff Pack

## Identity

- Task/SWU: `INVOKE-DESIGN-DSV2-SPEC-ONTOLOGY-001`
- Source task/work-pack: `projects/domainspec-v2/development/spec-ontology-branch-decision/decision-gate/DECISION.md`
- Session/run id: `20260823T182917Z-spec-ontology-design`
- Session evidence path: `projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260823T182917Z-spec-ontology-design`
- Runtime handoff: `runtime`
- Repository revision: `7e77af60ea1fa80fca20d3ebe1df41e2391df149`
- Evidence date: `2026-08-23`

## Obligation Coverage

| Obligation | Status | Selected Evidence | Resolution |
| --- | --- | --- | --- |
| `O-ARCH` | covered | `decision-gate/DECISION.md#selected-architecture-contract` | Preserve one connected logical ontology with separately owned branches. |
| `O-CLAIM-OWNER` | covered | `FORMAL-CLAIMS-OWNER-DECISION.md#recorded-selection` | Model `formal-claims-owner` as an explicit per-claim role under primary-source authority. |
| `O-CORRESPONDENCE` | covered | `CORRESPONDENCE-ACCEPTANCE-DECISION.md#recorded-selection` | Bind one `FormalClaim --formalizes--> BusinessMeaning` assertion to two exact, non-collapsing owner receipts. |
| `O-PROVENANCE` | covered | `PROVENANCE-BINDING-PROFILE-DECISION.md#recorded-selection` | Keep identity/currentness fields on `derived_from`; keep derivation detail in an immutable content-addressed manifest. |
| `O-CANONICALITY` | covered | `CANONICAL-BYTES-AND-PROJECTIONS-DECISION.md#recorded-selection` | Owner-local catalogs are canonical; integrated graph and human views are generated with `authority_effect: none`. |
| `O-VALIDATION` | covered | `VALIDATION-AND-NEGATIVE-CONTROLS-DECISION.md#mandatory-behavior-in-every-admissible-option` | Preserve owner-local semantics and typed aggregate failure across twelve negative classes. |
| `O-AUTHORITY` | covered | `AUTHORITY-MODEL.md#core-rule`; `domainspec-v2-CONSTITUTION.md#rules` | A validator, receipt, or projection cannot accept meaning, discharge an obligation, or promote authority. |
| `O-RELATION` | covered | `RELATION-MODEL.md#relation-contract`; `CANONICAL-KINDS.md#edges` | Relations must bind endpoints, direction, owner, evidence, and authority effect; inverses are read directions, not authored edges. |
| `O-SUBSTRATE` | covered | `findings.md#decision-and-claim-ceiling`; `#index-and-validator-contracts` | Reuse syntax and exact binding shape without creating a shared semantic registry. |
| `O-MIGRATION` | covered | `financial-settlement-proof-lifecycle.ontology.json#/node_type_definitions`; `#/relation_definitions` | Treat `business.FormalClause` and the three-branch prototype as migration evidence, never as the target authority model. |
| `O-SYNTAX` | covered | `2026-08-22-top03-shared-syntax-owner-acceptance.md#exact-claim-ceiling` | CAV2 acceptance is syntax-only; DomainSpec adoption and this design's owner admissions remain separate. |
| `O-GLOSSARY` | covered | `DEFINITIONS.md#DS-D1`; `#DS-D2`; `#DS-D8`; `#domainspec-v2-D27` | Use existing DomainSpec terms; new candidate terms cannot silently become canonical definitions. |

Strict coverage: `pass`

## Selected Sources

- `projects/domainspec-v2/development/spec-ontology-branch-decision/decision-gate/DECISION.md`
  - Selectors: `#recorded-selection`, `#formal-claims-ownership-invariant`, `#selected-architecture-contract`, `#remaining-protected-admissions`
  - Obligations: `O-ARCH`, `O-CLAIM-OWNER`, `O-CORRESPONDENCE`, `O-PROVENANCE`, `O-CANONICALITY`, `O-VALIDATION`
  - Evidence excerpt: the ten user-selected decisions form a complete architecture baseline while exact owner admission remains pending.
- `projects/domainspec-v2/development/spec-ontology-branch-decision/decision-gate/FORMAL-CLAIMS-OWNER-DECISION.md`
  - Selectors: `#recorded-selection`, `#current-gate-state`
  - Obligations: `O-CLAIM-OWNER`
  - Evidence excerpt: claim meaning belongs to an explicit per-claim role under existing primary-source authority.
- `projects/domainspec-v2/development/spec-ontology-branch-decision/decision-gate/CORRESPONDENCE-ACCEPTANCE-DECISION.md`
  - Selectors: `#recorded-selection`, `#invariant-already-fixed`, `#current-gate-state`
  - Obligations: `O-CORRESPONDENCE`
  - Evidence excerpt: exact two-key acceptance binds the same relation bytes and endpoints without transferring semantic authority.
- `projects/domainspec-v2/development/spec-ontology-branch-decision/decision-gate/PROVENANCE-BINDING-PROFILE-DECISION.md`
  - Selectors: `#recorded-selection`, `#required-information-in-every-admissible-option`
  - Obligations: `O-PROVENANCE`
  - Evidence excerpt: any bound change invalidates currentness and requires a new immutable version and lifecycle event.
- `projects/domainspec-v2/development/spec-ontology-branch-decision/decision-gate/CANONICAL-BYTES-AND-PROJECTIONS-DECISION.md`
  - Selectors: `#recorded-selection`, `#clarification`
  - Obligations: `O-CANONICALITY`
  - Evidence excerpt: one connected graph does not imply one file, writer, or authority owner.
- `projects/domainspec-v2/development/spec-ontology-branch-decision/decision-gate/VALIDATION-AND-NEGATIVE-CONTROLS-DECISION.md`
  - Selectors: `#recorded-selection`, `#mandatory-behavior-in-every-admissible-option`
  - Obligations: `O-VALIDATION`
  - Evidence excerpt: an ordered aggregate preserves the first fail, block, or indeterminate result across twelve exact negative classes.
- `projects/domainspec-v2/authority/AUTHORITY-MODEL.md`
  - Selectors: `#core-rule`, `#authority-kinds`, `#source-movement`, `#non-collapse-rules`
  - Obligations: `O-AUTHORITY`, `O-CLAIM-OWNER`, `O-VALIDATION`
  - Evidence excerpt: validation governance owns deterministic build-time fidelity, not runtime correctness, discharge, or source meaning.
- `projects/domainspec-v2/authority/constitutions/domainspec-v2-CONSTITUTION.md`
  - Selectors: `#domainspec-v2-C1-primary-source-boundary`, `#domainspec-v2-C3-candidate-before-commitment`, `#domainspec-v2-C4-separation-of-concerns`, `#domainspec-v2-C5-derivation-is-from-the-spec`
  - Obligations: `O-AUTHORITY`, `O-PROVENANCE`
  - Evidence excerpt: sources, derivation, implementation, evidence, and governance stay separate; obligations derive from the specification.
- `cyberAlchemy-v2/ontology/RELATION-MODEL.md`
  - Selectors: `#relation-contract`, `#endpoint-rule`
  - Obligations: `O-RELATION`
  - Evidence excerpt: relation proposals require explicit direction, owner route, evidence, and authority effect.
- `cyberAlchemy-v2/ontology/canonical-kinds/CANONICAL-KINDS.md`
  - Selectors: `#edges`, lines 339-343
  - Obligations: `O-RELATION`
  - Evidence excerpt: inverse labels are generated read directions, not separately authored semantic edges.
- `research/2026-08-20-domainspec-v2-cav2-proof-obligation-substrate/findings.md`
  - Selectors: `#decision-and-claim-ceiling`, `#owner-and-canonicality-matrix`, `#source-to-evidence-to-receipt-binding-contract`, `#index-and-validator-contracts`
  - Obligations: `O-SUBSTRATE`, `O-PROVENANCE`, `O-VALIDATION`, `O-CANONICALITY`
  - Evidence excerpt: the smallest shared layer is shape-only; owner-local catalogs and deterministic projections preserve semantic ownership.
- `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/examples/financial-settlement-proof-lifecycle.ontology.json`
  - Selectors: `/branches`, `/node_type_definitions`, `/relation_definitions`
  - Obligations: `O-MIGRATION`
  - Evidence excerpt: a useful prototype already separates business, bridge, and system evidence, but currently places `FormalClause` in business and is candidate-only.
- `cyberAlchemy-v2/authority/decisions/2026-08-22-top03-shared-syntax-owner-acceptance.md`
  - Selectors: `#decision`, `#exact-bindings`, `#exact-claim-ceiling`, `#residue-and-expiration`
  - Obligations: `O-SYNTAX`
  - Evidence excerpt: CAV2 adopted exact structural address syntax only; it did not adopt DomainSpec semantics or this branch design.
- `projects/domainspec-v2/definitions/DEFINITIONS.md`
  - Selectors: `#DS-D1--Meta-Type-System`, `#DS-D2--Relationship-Verb-Set`, `#DS-D8--Relationship-Signature-Authority`, `#domainspec-v2-D27-Canonical-Single-Responsibility-Principle`
  - Obligations: `O-GLOSSARY`, `O-RELATION`, `O-CANONICALITY`
  - Evidence excerpt: canonical terms and relationship authority already prohibit duplicated semantic authorship and projection-as-source confusion.

## Architecture Guidance

Model four owner-local canonical branches—business meaning, formal claims/specification composition, proof bridge, and system evidence—under one shared shape-only protocol. Store each cross-branch assertion with the narrowest owner making it. Generate integrated machine and human views from exact admitted catalogs; never accept those views as canonical semantic input.

## Related Feature Context

The financial-settlement ontology demonstrates the navigational benefit and exposes the migration seam: `business.FormalClause` must become a formal-claims/specification-branch concept only through a separately authorized, digest-exact migration.

## Constraints And Non-Goals

- Design candidate only; `authority_effect`, implementation effect, promotion effect, and publication effect remain `none`.
- Do not mint a standalone formal-claims authority kind.
- Do not modify the completed Decision Gate or any canonical authority, definition, ontology, schema, validator, prototype, Arcanum, Git, telemetry, release, or public surface.
- Do not claim owner acceptance, obligation discharge, execution, migration, promotion, publication, release, deployment, or production readiness.
- Planned fixtures and validator contracts remain unexecuted Design witnesses.

## Write Scope

- `projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260823T182917Z-spec-ontology-design/helper-draft/`

## Validation Surface

- Six-view architecture review against `invoke/templates/architecture/architecture.md`.
- Concern denominator extraction and two-pass fixed-point selection.
- Exact owner-boundary, glossary, planned-witness, and negative-corpus trace review.
- Distill Validate check with Proposer and Balancer roles.
- JSON parse, Markdown whitespace, path-scope, and source-digest checks.

## Gaps And Blockers

- `G-OWNER-ADMISSION`: deferred; exact candidate package must be accepted by every named semantic, protocol, relationship, lifecycle, projection, validation, and promotion owner before canonical application.
- `G-MIGRATION`: deferred; current prototype pre/postimages are not frozen and migration is not authorized.
- `G-EXECUTION`: deferred; validators and twelve negative fixtures are planned, not implemented or run.

## Authority Precedence

1. DomainSpec v2 primary-source, authority-model, constitution, definitions, and relationship owners.
2. The ten direct user selections in the completed Decision Gate.
3. CAV2 ontology-protocol, relationship, and exact syntax decisions within their stated scope.
4. Research synthesis and prototype evidence, both non-promoting.
5. This Invoke Design candidate and generated projections, all `authority_effect: none`.

## Fallback Exploration Rule

Broad repository exploration is allowed only for `G-OWNER-ADMISSION`, `G-MIGRATION`, or `G-EXECUTION`, and only after the parent names the exact unresolved input. Extra sources must be reported in the runtime result.

## Provenance

- Source refs: the fourteen selector-scoped paths above.
- Content hashes: recorded in `context-pack.index.json`.
- Builder mode: `standard`

## Output Paths

- Markdown: `projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260823T182917Z-spec-ontology-design/context/CONTEXT-PACK.md`
- JSON/index: `projects/domainspec-v2/development/spec-ontology-branch-decision/invoke-design/20260823T182917Z-spec-ontology-design/context/context-pack.index.json`
