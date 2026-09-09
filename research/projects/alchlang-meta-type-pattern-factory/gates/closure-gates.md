# Closure gates

| Gate | PASS condition | Failure state |
|---|---|---|
| G1 Meaning | Profile, meta-type, source factory, realization provider, integration binding, pattern, and runtime provider are non-overlapping definitions. | blocked |
| G2 D65 | Canonical definitions, Product Capability, business ontology, DomainSpec source, compiled ontology, binding, and evidence are ordered and digest-bound. | not_evaluable |
| G3 Profile | Every selected sub-profile and registry has an exact ID/digest and compatibility result. | invalid-profile |
| G4 Carrier | Every semantic node has exact meta-type and source-profile refs; every edge has a canonical signature. | invalid-carrier |
| G5 Frontend | Markdown and arrow inputs lower deterministically without executing source code. | rejected-source |
| G6 Projection | Every carrier node maps to one canonical instantiation and every proof dependency is explicit. | invalid-projection |
| G7 Provider | Every realization provider is explicitly registered with complete inputs/components/tools/dependencies. | blocked-provider |
| G8 Pattern | Host types, edges, bindings, generator, and static conformance close for `generatable`. | blocked-pattern |
| G9 Runtime | Concrete provider, observed guarantees, and runtime evidence close for `runtime-capable`. | generation-only |
| G10 Stability | Owner decision binds the immutable pattern definition digest. | candidate-only |
| G11 Authority | Effectful execution has separate exact authorization. | no-execution-authority |
| G12 Replay | Profile, carrier, projection, generation, and proofs reproduce or fail with causal drift codes. | stale-or-nondeterministic |

Research status: G1 and the proposed architecture are research-closed. G2-G12
require future artifacts and execution and therefore remain open.

