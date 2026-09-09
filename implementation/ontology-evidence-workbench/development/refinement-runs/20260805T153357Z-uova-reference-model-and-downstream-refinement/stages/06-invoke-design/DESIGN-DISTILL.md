# Design Unit Distill

Verdict: PASS before adversarial review.

The coherent unit is one relation reference/index/snapshot architecture plus its downstream ownership matrix. Splitting Portal, Path, geometry, UI, and static contracts would reintroduce independent semantic ownership. Implementation remains decomposable: schema/version, index/resolver, Portal/Path, projections, geometry/rendering, static output, and project adapters can be separate later SWUs.

Split pressure retained for Plan:

- index/resolver schema and compatibility;
- Portal and Path contract repair;
- view-model/cache drift enforcement;
- static snapshot serialization;
- downstream integration/acceptance.
