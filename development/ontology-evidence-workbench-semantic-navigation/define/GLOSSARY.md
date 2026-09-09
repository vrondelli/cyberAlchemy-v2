# Glossary

| Term | Status | Meaning in this package | Authority note |
| --- | --- | --- | --- |
| Semantic navigation | local | Profile-driven bounded movement through an admitted presentation graph | Does not define ontology semantics |
| Projected context home | local | Owner-approved entry set of presentation clusters | Not the set of ontology Bounded Context nodes unless the owner proves that mapping |
| Projected cluster | partial | A navigation scope derived from a project profile and admitted records | Not a branch or membership assertion |
| Portal | local | A labeled entrance from one projected scope to another | Does not create an ontology edge |
| Exact predicate | linked | The source relation predicate preserved as `sourcePredicate` | Body War owns its vocabulary |
| Presentation relation | local | Coarse UI relation family used only for a redundant line pattern | Cannot replace the exact predicate |
| Source direction | local | Direction declared by the source record | Distinct from projection and traversal |
| Projected direction | local | Direction of the admitted presentation endpoints | Disclosed when it differs from source |
| Traversal orientation | local | Whether a Path hop follows or opposes the presented/source direction | Route-only, no semantic effect |
| Relation presentation record | local | Exact relation identity plus redundant color/pattern/text/marker fields | Authority effect none |
| Navigation frame | partial | Restorable scope, filters, selection, viewport, direction and focus | UI state only |
| Show all loaded graph | local | Explicit escape to the full admitted presentation graph | Does not mean complete ontology |
| Current-projection count | local | Count computed over the active admitted projection | Does not enumerate source ontology kinds |
| Comparable quality loop | partial | Frozen before/after audit yielding atomic deltas | Not a universal score or promoted capability |
| Human-study residue | linked | Claims that deterministic tools cannot establish | Requires separate participant authorization |
| Authority effect | linked | Whether an artifact changes governed authority | Fixed to `none` for this presentation feature |

## Consistency note

No canonical term is promoted or redefined. `linked` reuses an existing
workspace concept, `partial` is a narrower candidate usage, and `local` is
package-scoped vocabulary.
