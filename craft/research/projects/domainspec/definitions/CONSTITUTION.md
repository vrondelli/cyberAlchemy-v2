# DomainSpec Research Constitution

This constitution defines non-optional documentation governance rules for the DomainSpec research project.

## Rule Catalog

| Rule ID | Rule Statement | Scope | Enforcement |
|---|---|---|---|
| RC1 | Every identifier must be a Markdown link at every occurrence. | `C*` claim IDs, `E*` experiment IDs, `G*` gate IDs, dependency IDs, method IDs, and evidence IDs in canonical project docs. | Pull request review blocks until links are present. |
| RC2 | Link targets must resolve to canonical local artifacts first. | Use local project paths under `research/projects/domainspec` whenever a canonical file exists. | Review must reject links that point to non-canonical mirrors when canonical exists. |
| RC3 | IDs without stable targets must be removed or replaced by a stable linked artifact. | Draft IDs, placeholder IDs, or temporary labels. | No placeholder ID may remain in committed canonical docs. |

## Link Target Policy

- Claim IDs link to `claims/CLAIMS.md`.
- Experiment IDs link to `experiments/<experiment-key>/protocol.md`.
- Gate IDs link to the governing checklist or pipeline definition.
- Dependency IDs link to `deps/DEPENDENCIES.yaml`.
- Evidence/result IDs link to `experiments/*/results/*.md` or `experiments/*/data/*.jsonl` references.

## Compliance Notes

1. This constitution is authoritative for documentation under `research/projects/domainspec`.
2. New and edited files must satisfy RC1-RC3 before merge.
3. Existing non-compliant files should be backfilled opportunistically, with `README.md` treated as immediate priority.