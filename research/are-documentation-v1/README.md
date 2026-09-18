# ARE documentation inventory and blueprint

Status: candidate research and documentation drafts, 2026-09-16.
Authority effect: none.

Start with [the documentation blueprint](DOCUMENTATION-BLUEPRINT.md), then use the catalogs:

The next presentation proposal is [property-first canvas documentation](CANVAS-RESEARCH.md): repository and online examples, component interactions, compact in-canvas readers, and a bounded comparison experiment.

- [Product theses and definitions](THESIS-INVENTORY.md).
- [Modules, adapters, layers and cybernetic graphs](ARCHITECTURE.md).
- [Feature-to-documentation coverage](FEATURE-COVERAGE.md) and its machine-readable [inventory](feature-coverage.json).
- [Canonical page register and thesis-feature links](page-register.json).
- [Source-surface discovery](source-surfaces.json): exports, CLI flags, schemas and profiles; candidate lexical index.
- [Online examples, research question and three-pair work sheet](RESEARCH.md).
- [Release-readiness documentation research](RELEASE-READINESS-DOCS-RESEARCH.md):
  deployment, migration, generated API reference, security policy, runbook and
  SLOs, release notes, and compliance dependencies.
- Independent reviews: [theses](THESIS-REVIEW.md), [architecture](ARCHITECTURE-REVIEW.md), [coverage](COVERAGE-REVIEW.md).
- [Review reconciliation](REVIEW-RESOLUTION.md).

The catalogs describe the current source tree and proposed documentation destinations. A planned page is not an implemented feature, and a working fixture is not a supported production service.
This package stages research outside the frozen runtime candidate. Existing product definitions and source registries remain authoritative for their own terms.

Rebuild the lexical source index with `python3 research/are-documentation-v1/inventory-source-surfaces.py`. This does not classify public APIs. Structural check results are recorded in [validation.json](validation.json).

## Open Questions

See [the blueprint questions](DOCUMENTATION-BLUEPRINT.md#open-questions) and each independent review's unresolved issues.
