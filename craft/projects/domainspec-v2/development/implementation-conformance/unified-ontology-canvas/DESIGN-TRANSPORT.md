# Design Transport

Plan must preserve:

- one immutable graph built independently of SVG/DOM;
- all profiles inside the graph and TypeScript-only fixture provenance;
- explicit constraint nodes and exact finding provenance;
- deterministic band positions followed by separate edge routing;
- all identities present, with default Rule trace emphasis and semantic zoom;
- structured navigator equivalence and staged keyboard semantics;
- no source JSON mutation, external dependency, source adapter, or authority move;
- atomic SWUs with independent fixtures and a browser recomposition closure.

Any implementation route that starts by editing the renderer before the pure
projection fixture violates the selected L0 boundary.
