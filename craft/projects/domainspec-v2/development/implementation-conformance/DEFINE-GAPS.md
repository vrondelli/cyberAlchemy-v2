# Define Gaps And Owner Routes

These gaps do not prevent design authoring. They prevent implementation
admission, exception handling, or stronger claims until the named owner acts.

| ID | Gap | Why it matters | Required owner / next decision |
| --- | --- | --- | --- |
| DEF-G01 | The existing supported profile does not admit the proposed package contracts or `EvaluationLifecycle`. | Draft package records and the State Machine cannot be treated as admitted kinds merely because they appear in this design. | supported-profile/compiler owner decides profile extension and digest binding |
| DEF-G02 | Direct Rule-leaf dependency conflicts with the v1 public-index/no-internal-import precedent. | Selecting both as universal laws would make conforming code impossible in some layouts. | DomainSpec implementation architecture owner chooses direct leaf, public index, or an explicitly scoped profile alternative |
| DEF-G03 | The code-tag mapping shape is pending reformulation and migration. | Exact binding must not create a second source-of-truth while the intended mapping owner changes. | Code-Tag Conformance and Import Manifest owners close the projection and migration contract |
| DEF-G04 | Tool versions, configuration digests, repository root rules, and generated-source policy are unbound. | A native result without those bindings is not reproducible evidence. | each language/project integration owner pins its adapter and tool contract |
| DEF-G05 | No general exception authority exists. | Suppression without owner, expiry, scope, and audit would erase failures. | external authority model selects an owner before any exception lifecycle is designed |
| DEF-G06 | Runtime fixture ownership and effect-observation depth are project-specific. | A transition assertion does not prove delivery, persistence, idempotency, or external effects. | application/runtime owner binds fixtures and explicit claim limits |
| DEF-G07 | Rust intra-crate source topology is unsupported for `cfg`, `#[path]`, macros, ambiguous re-exports, build-generated modules, and dynamic loading. | Textual approximation would create false confidence. | Rust adapter owner either narrows the admitted profile or selects an authoritative source-graph provider |
| DEF-G08 | Performance budgets and fixture-corpus size are not measured. | Determinism does not imply acceptable developer-loop cost. | future Plan/implementation owner benchmarks only after profile and toolchain selection |
| DEF-G09 | Receipt retention, redaction, and raw diagnostic location are not owned. | Paths and diagnostics can expose private repository data. | privacy/data-lifecycle owner selects retention and redaction before persistence or publication |
| DEF-G10 | Migration from folder/filename assumptions to explicit binding is unplanned. | A flag-day change could strand current tags and generated projections. | future adoption owner defines compatibility and rollout after Design acceptance |

