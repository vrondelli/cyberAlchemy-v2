# Glossary Consistency

Verdict: **pass for feature-local Design use**.

| Check | Result | Notes |
| --- | --- | --- |
| Spec registry terms exist in glossary/aspects | pass | All public API concepts use the `ontology-runtime.*` feature namespace |
| Authority wording | pass | Runtime authority is invariant `none`; owner routes remain opaque |
| Validation wording | pass | Runtime execution, native result, conformance, and readiness stay distinct |
| Identity wording | pass | Local IDs remain qualified by package/profile/snapshot |
| Branch/alias/confidence wording | pass | No collapse into identity, canonical vocabulary, or scalar confidence |
| Promotion wording | pass | Draft byte construction never becomes owner lifecycle |

No term is promoted. `owner route` and `readiness` remain `partial` because their
meaning is owner/scope qualified; the runtime preserves rather than defines
them.

