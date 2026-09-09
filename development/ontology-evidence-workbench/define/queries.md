# Queries and Views

| Query | Result |
| --- | --- |
| `find(text, filters)` | matching evidence/presentation objects with exact status facets |
| `lineage(nodeId)` | exact composing path plus excluded contradiction residue |
| `conflicts(nodeId)` | exact contradicting edges and endpoints |
| `indeterminate()` | policy-indeterminate candidates with diagnostics and owner gap |
| `evidence(ref)` | source item/edge, policy result, paths, digests, and sidecar mapping |
| `receipt()` | verifier result, bundle digest, adapter version, upstream pin, and freshness |
| `tour(id)` | ordered source IDs and explanations |
| `codeContext(ref)` | optional explicit mappings to code nodes, labeled external context |

## Equivalent Views

- **Graph:** spatial exploration and path emphasis.
- **Outline:** ordered semantic navigation.
- **Table:** dense audit and comparison.
- **Inspector:** exact source record and evidence.
- **Receipt drawer:** trust and reproducibility state.

All views share one selection state and must agree on exact status values.

## Open Questions

See [SPEC.md](SPEC.md#open-questions).
