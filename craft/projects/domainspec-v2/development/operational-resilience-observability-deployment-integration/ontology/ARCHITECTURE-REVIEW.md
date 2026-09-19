# ORODI Ontology Architecture Review

## Review verdict

**Coherent and reviewable as an isolated candidate; blocked for canonical integration, static conformance, commissioning, and deployment.**

The design preserves the required construction order, separates business meaning from architecture and generated intent, binds all current implementation evidence by exact digest, and records negative evidence instead of promoting it. No architecture defect requires discarding the candidate. The next move is an owner decision, not more silent materialization.

## Findings

### F1 — Project ownership and immutable capability candidates exist; adoption remains absent (partially resolved, blocking)

The existing `CA2-PROJECT-CRAFT` now coordinates ORODI through `CA2-GOAL-CRAFT-ORODI-INTEGRATION`, names all six D65 candidates, and has six schema-valid immutable Product Capability candidate records. The Craft Product owner has not adopted the exact manifest, and the named business-ontology owner has not admitted the exact ontology candidate. Every D65 record therefore still keeps product ontology and later semantic/conformance claims candidate or not-evaluable. Project coordination and record validity cannot substitute for either owner decision.

### F2 — DomainSpec profile is deterministic but unadmitted (open, blocking)

The development profile compiles Entity, Rule, Operation, and Event source twice to equal bytes. Its `release_admission` remains `not-granted`. The compiled graph and system ontology are strong candidate evidence, but they cannot become the canonical runtime contract until the DomainSpec language/compiler owners review the profile or rematerialize the source under an admitted profile.

### F3 — Capability-to-graph traceability was initially too implicit (repaired)

The first architecture mapped capabilities to architecture components and mapped DomainSpec source to a graph, but did not name the exact graph subset owned by each capability. `domainspec/capability-projection.json` now maps all six capabilities to business nodes, architecture-system nodes, DomainSpec nodes, DomainSpec edges, and implementation bindings. The union covers the complete 32-node/31-edge graph.

### F4 — Existing code and tests could be mistaken for conformance (repaired)

ORODI has candidate-local offline replay evidence and SWU-BWCR-001 contract/decoder bytes, but neither proves D65 graph-to-code conformance. The construction records now point to a `not_evaluable` static-conformance candidate and an `absent` runtime-evidence index. Planned SWU manifests are binding targets only where implementation state remains `absent`.

### F5 — Two “system” views create naming risk (mitigated, residual)

The architecture-system branch names deployable modules, while the generated system ontology names typed DomainSpec intent. Both are useful, but calling both simply “system ontology” would invite false equivalence. `ARCHITECTURE.md`, `views/system.md`, and the capability projection now state the distinction. A future canonical target should preserve separate type names or namespaces.

### F6 — Brownfield implementation predates the D65 chain (open, blocking)

The offline implementation and runtime decoder existed before these candidate bindings. The exact SWU-BWCR-001 contract suite now passes fresh (19/19), but compatibility has not been independently assessed against an accepted graph. Once predecessors are admitted, each exact target must undergo a fresh static conformance review; a focused PASS cannot be grandfathered into conformance.

### F7 — Runtime and infrastructure claims remain absent (open, effect-gated)

SWU-BWCR-002 through 010 are not implemented, no admitted live observation exists, and commissioning is separately gated. The architecture correctly makes simulation insufficient and requires teardown/zero-residual evidence. Nothing in this package authorizes creating infrastructure or exercising a deployment.

## Quality attributes

| Attribute | Assessment | Evidence |
|---|---|---|
| Semantic separation | PASS for candidate | Separate business, architecture-system, generated intent, implementation, and evidence records |
| Traceability | PASS for candidate | Exact sources, full relation coverage, full capability projection, six D65 records |
| Determinism | PASS for candidate | Two-run equal graph and system-ontology bytes |
| Fail-closed behavior | PASS for candidate | Missing predecessors and evidence are blocked/not-evaluable/absent |
| Implementation completeness | FAIL as expected | One candidate-local vertical, one partial vertical, remaining SWUs planned/deferred |
| Static conformance | NOT EVALUABLE | No accepted predecessor chain or independent assessment |
| Runtime resilience | NOT EVALUABLE | Runtime evidence absent; commissioning unauthorized |
| Project coordination | PASS for candidate | Existing Craft Project and Goal close over all six D65 records |
| Product Capability identity | PASS for candidate | Six shared-schema records have immutable canonical hashes |
| Canonical integration | BLOCKED | Product Capability adoption and ontology/profile owner decisions remain absent |

## Recommended owner decision

The Project and candidate identities are now fixed. The next decisions are explicit and independent: the Craft Product owner chooses whether to adopt the exact six-record manifest; the Craft ORODI Business Ontology owner chooses whether to admit the exact business-ontology candidate; and the DomainSpec v2 language and compiler owners choose whether to admit the exact development-profile candidate. Do not start with canonical merge, remaining implementation, or commissioning: those would skip the decisions that make later evidence interpretable.

## Claim ceiling

This review evaluates candidate architecture and package integrity only. It does not admit an ontology, accept a profile or implementation, register a ConstructionBinding, establish static or runtime conformance, authorize infrastructure, publish, release, or deploy.
