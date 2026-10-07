# CyberAlchemy Workspace

CyberAlchemy Workspace is a candidate inspect-only Product Capability of the
parent CyberAlchemy product. It gives a person one place to browse definitions,
products, projects, and ontologies while preserving the source identity,
provenance, owner route, boundary, claim ceiling, and source epoch of every
record.

The Workspace is not a new product, a canonical registry, an ontology owner, or
a synonym for a CAV2-D60 Project. The Project coordinates its construction; the
capability describes what CyberAlchemy should enable; the generated system
ontology describes one candidate realization.

Essays is the first projected Project entry. The unaccepted Essays semantic
explorer candidate is used only as evidence for useful projection fields and
read-only obligations. Workspace preserves the Essays-local ownership and
runtime boundary; it rejects inheriting either boundary as Workspace authority.

The runtime also contains a bounded implementation candidate that composes the
read-only Workspace snapshot, the Essays lifecycle, a separate Rust proposal
ledger, and a generated presentation graph. That candidate does not replace the
canonical snapshot generator and carries no acceptance, release, or mutation
authority.

## Current source views

The local UI can also show an additive, non-authoritative working-tree view.
`runtime/scripts/build-current-source-views.mjs` reads the exact current
CyberAlchemy v2 definitions source and index, product ontology nodes, product
capability records, Goals Project records, and ontology package profiles. When a
profile supplies readable node and relation registries, it creates a selectable
source graph. Each displayed record keeps its source path, source status, owner
route, boundary, and claim ceiling. The generated source epoch identifies the
selected bytes at build time; it is not live currentness after those files
change.

The Products and Projects views also display a source-declared hierarchy from
Product Thesis records, product-ontology containment and thesis relations, and
Project `thesis_refs`. Define is visible under the CyberAlchemy thesis with its
declared `realizes_part_of` relation and Goal reference. Products without a
linked thesis and projects without a thesis link remain visible as gaps. A
shared thesis groups projects for navigation; it does not assert a direct
project-to-project dependency, completed integration, or thesis progress.

Run `pnpm --dir workspace/runtime generate:current` to refresh the local view,
or `pnpm --dir workspace/runtime dev:current` to refresh and start the app. The
accepted historical Workspace snapshot and its pinned baseline generator stay
separate. The working-tree view neither changes canonical definitions nor
registers, validates, adopts, or admits any ontology.

## Open Questions

An owner-selected complete source manifest, live currentness policy, explicit
cross-project integration records, support for heterogeneous ontology registry
formats, and any relation between this working-tree view and the accepted
Workspace baseline remain open.

Validation and deterministic compilation are construction evidence only. They
do not accept the realization candidate or authorize runtime implementation.
