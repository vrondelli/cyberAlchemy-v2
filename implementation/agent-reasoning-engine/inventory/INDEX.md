# ARE implementation inventory index

**Status:** working-tree observation, not a product declaration or candidate receipt.  
**Observed:** 2026-09-25.  
**Scope:** `implementation/agent-reasoning-engine` package, benchmark, app, CLI, and selected nested runtime surfaces.  
**Owner of meaning:** the owning source for each row; this index has no authority effect.

Use [SURFACES.md](SURFACES.md) to compare the current repository with the
[product selector](../product.json) and its
[generated declared-capability matrix](../docs/generated/CAPABILITY-MATRIX.md).
The [change log](LOG.md) records inventory edits. The matrix lists declared
components and integrations; it is not an inventory of every implemented file.

Classification in this inventory has two independent axes:

| Axis | Meaning |
| --- | --- |
| Declaration | Listed in `product.json` as a component or integration, or not listed there. |
| Delivery | Selected by the current default product closure, excluded from it, or partially included through another selected source. |

Neither source presence nor closure inclusion proves support, governance
admission, active enforcement, runtime health, installer readiness, or approval.
This inventory does not change `product.json`, the frozen Candidate 020 records,
or the documentation release manifest.

To refresh the comparison, enumerate the immediate `packages/`, `benchmarks/`,
and `apps/` directories; compare their paths to `product.json`; then inspect
`node bin/are.mjs closure --json` from the ARE root. Check nested entrypoints
and source-root inclusion separately. Do not treat a closure digest from an
unfrozen working tree as a frozen candidate identity.

## Open Questions

- Which undeclared surfaces should remain development-only, and which should
  receive an explicit component, integration, or app declaration in a later
  owner-reviewed product profile?
- Should a future generated reconciliation check enforce directory-to-profile
  classification without confusing internal modules with product components?
