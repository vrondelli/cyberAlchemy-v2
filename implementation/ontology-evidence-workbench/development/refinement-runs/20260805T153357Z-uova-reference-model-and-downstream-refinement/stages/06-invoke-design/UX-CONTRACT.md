# UX Contract — Relation Meaning Across Surfaces

The relation-reference change is semantically visible because it controls labels, direction, portals, Path, selection, evidence, and static output.

- Every visible relation provides exact predicate text; color is redundant.
- Arrow/source direction and user traversal direction remain distinct in wording and markers.
- A portal constituent and a Path hop expose the same canonical relation sentence for the same reference.
- Selection remains stable by exact relation ID across graph, Path, inspector, and Full Index.
- A missing/stale reference produces an explicit recoverable state; it never silently selects an endpoint-equivalent relation.
- Static/no-JS output includes self-contained relation text and non-color cues.
- Keyboard focus restoration occurs only after a reference successfully re-resolves; otherwise use the declared fallback target.
- Full Index remains available when spatial geometry or renderer fails.

This contract plans structural behavior. Human comprehension and WCAG conformance still require later evidence.
