# Implementation Layering

## Layer order

1. **Authority input** — admitted SourceGraph and ViewPack; unchanged semantic owner.
2. **Scene contract** — KnowledgeScene v1.2, digest profile, relation index receipt,
   compatibility migration.
3. **Semantic resolution** — exact-ID immutable resolver with typed failure.
4. **Interaction records** — Portal, Path, selection, and restoration references plus
   traversal-local state.
5. **Derived presentation** — relation view models, summaries, encoding, geometry,
   renderer, inspector, and Full Index; all validate reference/digest joins.
6. **Detached projection** — validated relation snapshots for SVG, print, and no-JS.
7. **Project adapters** — Body War and a second fixture supply SourceGraph/ViewPack
   only.
8. **Acceptance** — structural, integration, full bundle, browser, accessibility,
   determinism, and reuse witnesses.

No upper layer may infer or overwrite exact predicate, source endpoints, evidence,
mapping loss, or authority effect.

## Implementation seams

- Scene core can be accepted before Portal/Path.
- Portal and Path share the resolver but have separate task receipts.
- Geometry is semantic-free and can be tested before renderer activation.
- Static output depends on resolver plus snapshot validation, not live UI state.
- Body War depends on the generic pipeline and cannot introduce project branches.
