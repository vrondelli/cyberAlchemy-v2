# ARE thesis and meaning inventory — proposer draft

Status: candidate documentation research, 2026-09-16. Pair 1 proposer. Authority effect: none. This is an inventory and proposed documentation treatment; proposed page names below are not existing or published pages. It does not promote definitions or certify implementations.

## Online lens

[Diátaxis](https://diataxis.fr/) separates tutorial, how-to, reference, and explanation around reader needs. Reuse that separation: demonstrate one successful bounded workflow in a tutorial; put operational procedures in how-to pages; retain exact fields and statuses in reference; explain the product's reasoning in explanation pages. This is a proposed application, not an endorsement of ARE by Diátaxis.

[arc42's overview](https://arc42.org/overview/) separates goals, constraints, context, building blocks, runtime scenarios, deployment, decisions, quality scenarios, risks, and glossary. Reuse those architecture views within explanation/reference so modules, runtime loops and deployment boundaries cannot be mistaken for each other. Its [documentation site](https://docs.arc42.org/) is the framework's detailed source. We reuse the organizational ideas, not upstream prose or an entire template.

## Coverage and authority

The literal product has **one** `product_thesis` field. The rows T01–T18 below are reviewer-visible decomposition, not eighteen independently declared product theses. Three capability declarations are covered: two referenced by the ARE product plus contextual framings, a linked child capability still product-bound to CyberAlchemy. This discrepancy is preserved rather than silently reparented.

The finite meaning denominator is 164 source-node occurrences: 136 core business ontology nodes, 11 interaction scaffold nodes, and 17 framing nodes. All receive an individual documentation treatment in the appendix; duplicate IDs across registries retain their source occurrence. This covers named meaning in those registries, not every historical research hypothesis, test function, or unregistered future feature. The feature coverage artifact owns the implementation/functionality denominator, including the prior 42-item audit; The architecture artifact owns diagram/view completeness.

Source order: [canonical definitions](../../authority/definitions/DEFINITIONS.md) and [index](../../authority/definitions/DEFINITIONS-INDEX.md) own repository terms; [product](../../agent-reasoning-engine/product.json), [main capability](../../agent-reasoning-engine/product-capability.json), [interaction capability](../../agent-reasoning-engine/capabilities/interaction-context/product-capability.json), and [framing capability](../../agent-reasoning-engine/framings/product-capability.json) own candidate product meaning. [Sources registry](../../agent-reasoning-engine/sources.json) has 72 source entries; it is a selector/provenance map, not 72 additional features. Generated DomainSpec views are projections. This review reads current source files and does not revalidate stored digest freshness.

## Literal thesis

The [product declaration](../../agent-reasoning-engine/product.json) states:

> ARE helps people and agents solve problems with continuity: it reuses the explicit reasoning state that produced context, makes the current objective and interpretation inspectable, checks understanding against outcomes, learns scoped lessons from feedback, and improves the engine through research and controlled benchmarks.

Its lifecycle remains candidate, product approval is not requested, and canonical adoption is not granted. Documentation must keep purpose, implemented mechanism, measured benefit, and supported operation as separate claims.

## Thesis families and documentation treatment

Each row's proposed page begins with audience/outcome, a small example, current availability, evidence, and unresolved limits. Capability presence is not a passing effectiveness result.

| ID | Decomposed proposition | Source of meaning | Current limit / falsifiable evidence needed | Proposed documentation treatment |
|---|---|---|---|---|
| T01 | Help humans and agents solve problems continuously | [Product](../../agent-reasoning-engine/product.json), [lighthouse](../../agent-reasoning-engine/LIGHTHOUSE.md) | General completed-outcome improvement remains unproven | `explanation/product-purpose`: disrupted task example, value, protected boundaries, revisability |
| T02 | Reuse explicit state that produced context | [State model](../../agent-reasoning-engine/REASONING-AND-LEARNING.md) | Explicit records only; no hidden model reasoning claim | `explanation/reasoning-state`: transcript/state/envelope comparison; `tutorials/resume-work` with exact replay evidence |
| T03 | Make interpretation and current objective inspectable | [Learning model](../../agent-reasoning-engine/REASONING-AND-LEARNING.md) | Bounded cues; arbitrary language needs provider; routing category differs from objective | `explanation/objectives`: continue/refine/replace/interrupt/new examples; `reference/objective-lifecycle` |
| T04 | Preserve requirements through changes and interruptions | [Learning model](../../agent-reasoning-engine/REASONING-AND-LEARNING.md) | Explicit seeds required; must test multi-turn continuity | `how-to/resume-interrupted-work`: requirements retained, replaced, and unresolved |
| T05 | Route to nearest uniquely supported capability | [Owner intent](../../agent-reasoning-engine/OWNER-INTENT.md), [capability](../../agent-reasoning-engine/product-capability.json) | No fallback inference or Goal-as-default; route is not permission | `how-to/evaluate-request`, `reference/decision-cli`: unique/ambiguous/gated examples |
| T06 | Assemble necessary request-relative Context Basis | [Capability](../../agent-reasoning-engine/product-capability.json) | Declared closure does not prove semantic sufficiency | `explanation/context-construction`: route → definition closure → selector lock → basis → view → strategy |
| T07 | Preserve provenance, contradictions and freshness | [Core ontology](../../agent-reasoning-engine/business-ontology.json) | Historical replay differs from fresh evaluation; compression cannot remove material limits | `reference/context-lifecycle`: identities, inclusion/exclusion, invalidation and counterevidence |
| T08 | Recover and continue safely from explicit state | [Capability](../../agent-reasoning-engine/product-capability.json) | No silent repair or retry where delivery is uncertain; production coordination gaps persist | `how-to/recover-state`: normal replay plus incomplete checkpoint and uncertain-delivery cases |
| T09 | Check understanding against attributable outcomes | [Learning model](../../agent-reasoning-engine/REASONING-AND-LEARNING.md) | Schema, format compliance, self-judgment and silence do not establish task success | `explanation/understanding-evidence`: expected/observed/unknown comparison; evaluator boundary |
| T10 | Learn scoped lessons from corrections | [Interaction capability](../../agent-reasoning-engine/capabilities/interaction-context/product-capability.json) | Prototype/default-off; fixture demo is not live semantic benefit | `tutorials/inspect-correction-learning` explicitly fixture-labelled; `reference/learning-lifecycle` |
| T11 | Let users inspect, override and revoke retained preferences | [Learning model](../../agent-reasoning-engine/REASONING-AND-LEARNING.md) | Explicit actions; cross-conversation scope and interface unfinished | `how-to/control-learning`: source, scope, override, revoke and restart effect |
| T12 | Improve engine through controlled research | [Lighthouse](../../agent-reasoning-engine/LIGHTHOUSE.md), [capability](../../agent-reasoning-engine/product-capability.json) | Production providers/cadence and autonomous code changes not established | `explanation/research-method`: observation → competing hypotheses → frozen experiment → result → review → successor |
| T13 | Optimize useful outcomes within total model-token budgets | [Lighthouse](../../agent-reasoning-engine/LIGHTHOUSE.md) | Lower tokens alone cannot reward abandonment; latency/storage/prices are not current optimization targets | `reference/evaluation-metrics`: logical input/output tokens, correctness, continuity, recovery, rejection; separate storage operations |
| T14 | Discover mechanisms reusable across domains/models/windows | [Lighthouse](../../agent-reasoning-engine/LIGHTHOUSE.md) | Transfer is empirical; GLM/coding are current settings | `explanation/generalization`: core vs evaluator vs model configuration, qualification matrix and untested cells |
| T15 | Deliver bounded measured GLM context-selection improvement | [Lighthouse](../../agent-reasoning-engine/LIGHTHOUSE.md), [8K release and confirmation evidence index](../../agent-reasoning-engine/research/contextbench-v1/releases/glm-5.3-flash-8k-v1/README.md) | 8K milestone only; whole 1,136-identity/10K/12K contract not cleared | `evidence/glm-8k`: eight-pair confirmation, +13.15 pp macro Span-F1, 6/8→8/8 valid, −3,568 logical tokens; scope and failed/inconclusive history alongside result |
| T16 | Keep judgments and benchmark results non-authorizing | [Capability](../../agent-reasoning-engine/product-capability.json), [owner intent](../../agent-reasoning-engine/OWNER-INTENT.md) | Separate exact-effect and product-adoption decisions | `explanation/authority-boundaries`: advice/approval/action graph and who owns each boundary |
| T17 | Produce source-faithful contextual framings and bounded analogies | [Framing capability](../../agent-reasoning-engine/framings/product-capability.json) | Explicitly not implemented; cognitive benefit unmeasured; not model-weight learning | `roadmap/contextual-framings`: source substrate, distilled knowledge, partial analogy, fit, progressive depth, expiry; illustrative example labelled design |
| T18 | Make integration and release boundaries explicit | [Core ontology](../../agent-reasoning-engine/business-ontology.json), [product](../../agent-reasoning-engine/product.json) | Gateway is Codex-bound; universal adapter is proposed; release closure/test gaps from prior audit need revalidation | `reference/support-matrix` and `explanation/system-boundaries`: existing gateway vs provider transports vs future universal contract; release evidence linked, not inferred |

## Meaning ownership and glossary plan

The glossary should provide a short reader explanation, exact owning source/ID, status, example, counterexample, related runtime schema when one exists, and links to procedures. Never invent a schema from a conceptual example. Shared definition imports must follow the repository import/promotion process rather than promoting this research file.

| Vocabulary family | Owning source | Planned explanation / distinction |
|---|---|---|
| Product thesis, product capability, context | [CAV2-D63/D67/D66](../../authority/definitions/DEFINITIONS.md) | Durable value proposition vs useful outcome vs stable work frame |
| Intent, goal, research, experiment, construction invariant | [CAV2-D39/D59/D61/D62/D65](../../authority/definitions/DEFINITIONS.md) | Preserve original meaning; link rather than substitute casual UI language |
| Ontology, residue, append-only ledger | [CAV2-D19/D18/D26](../../authority/definitions/DEFINITIONS.md) | Typed meaning relationships, unresolved remainder, historical event record |
| Context Basis, envelope, window view, epoch, frontier | [Core ontology](../../agent-reasoning-engine/business-ontology.json) | Candidate ARE meanings; selected evidence vs consumer projection vs immutable identity vs continuation state |
| Interpretation, objective, understanding, lesson, application | [Core ontology](../../agent-reasoning-engine/business-ontology.json), [interaction scaffold](../../agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json) | Cross-link duplicate/related terms; do not equate route, objective and frontier |
| Framing, analogy, distilled knowledge, fit, expiry | [Framing nodes](../../agent-reasoning-engine/framings/nodes.json) | Design-only candidate meanings; partial mappings retain counterexamples and break conditions |
| Adapter, gateway, module, layer | Implementation contracts + architecture inventory owned by other pairs | Descriptive labels until exact source owner identified; never claim any-agent support from a provider fixture |

## Cybernetic representation contract for these theses

Use three separate feedback graphs matching the source learning model: work control, scoped lesson adaptation, and engine evolution. Each must label desired outcome, acting component, observed evidence, comparator, correction path, uncertainty, and the action/approval boundary. The research graph remains a DAG of recorded hypotheses and experiments even when the higher-level process repeats; successor iterations get distinct identities. Diagram edges are explanatory projections, not new ontology assertions. Existing, default-off candidate, and proposed components must be visibly distinguishable without relying only on color.

## Complete registered meaning index

Every row below is a source-linked occurrence with proposed placement, not evidence that the corresponding runtime feature is implemented. Core and interaction entries retain candidate meaning and their capability claim ceilings; every framing entry additionally retains `not-implemented`. Each linked owning source preserves its exact candidate meaning; canonical repository definitions retain authority. This index avoids duplicating their prose.

### core: 136 occurrences

| Source ID | Kind | Proposed page and treatment |
|---|---|---|
| [CA2-PRODUCT-CYBERALCHEMY](../../agent-reasoning-engine/business-ontology.json) | Product | `explanation/product-map`: ownership, scope and status |
| [CA2-PRODUCT-AGENT-REASONING-ENGINE](../../agent-reasoning-engine/business-ontology.json) | Product | `explanation/product-map`: ownership, scope and status |
| [CA2-ARE-BUSINESS-ONTOLOGY](../../agent-reasoning-engine/business-ontology.json) | Product Capability | `explanation/product-map`: ownership, scope and status |
| [CA2-ARE-OUTCOME-BOUNDED-REASONING](../../agent-reasoning-engine/business-ontology.json) | Outcome | `evidence/claims`: metric, tested scope, falsifier and unknowns |
| [CA2-ARE-OUTCOME-CONTEXT-INTEGRITY](../../agent-reasoning-engine/business-ontology.json) | Outcome | `evidence/claims`: metric, tested scope, falsifier and unknowns |
| [CA2-ARE-OUTCOME-CONTEXT-LIFECYCLE](../../agent-reasoning-engine/business-ontology.json) | Outcome | `evidence/claims`: metric, tested scope, falsifier and unknowns |
| [CA2-ARE-OUTCOME-REUSABLE-REASONING-STATE](../../agent-reasoning-engine/business-ontology.json) | Outcome | `evidence/claims`: metric, tested scope, falsifier and unknowns |
| [CA2-ARE-OUTCOME-NONAUTHORIZING-RESULT](../../agent-reasoning-engine/business-ontology.json) | Outcome | `evidence/claims`: metric, tested scope, falsifier and unknowns |
| [CA2-ARE-OUTCOME-FAST-DIRECT-ROUTING](../../agent-reasoning-engine/business-ontology.json) | Outcome | `evidence/claims`: metric, tested scope, falsifier and unknowns |
| [CA2-ARE-OUTCOME-NECESSARY-CONTEXT-BASIS](../../agent-reasoning-engine/business-ontology.json) | Outcome | `evidence/claims`: metric, tested scope, falsifier and unknowns |
| [CA2-ARE-ACTOR-INTENT-OWNER](../../agent-reasoning-engine/business-ontology.json) | Actor | `explanation/context-and-actors`: responsibility and boundary |
| [CA2-ARE-ACTOR-CONTEXT-STEWARD](../../agent-reasoning-engine/business-ontology.json) | Actor | `explanation/context-and-actors`: responsibility and boundary |
| [CA2-ARE-ACTOR-REASONING-CONSUMER](../../agent-reasoning-engine/business-ontology.json) | Actor | `explanation/context-and-actors`: responsibility and boundary |
| [CA2-ARE-CONCEPT-REASONING-REQUEST](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-CONTEXT-ITEM](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-CONTEXT-ENVELOPE](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-SEMANTIC-JUDGMENT](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REASONING-RECEIPT](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REASONING-RECEIPT-CONSTRAINT](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-RUNTIME-JOURNAL](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REASONING-STATE-LEDGER](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REASONING-STATE-EPOCH](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REASONING-STATE-CHECKPOINT](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-EXACT-REASONING-DISPATCH](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REASONING-STATE-DERIVED-INDEX](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REASONING-STATE-RECOVERY-ASSESSMENT](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REASONING-STATE-FRONTIER](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-JOURNAL-REPLAY](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-PERSISTENT-APP-SERVER-GATEWAY](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-GATEWAY-CONSUMER-SESSION](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REQUEST-CONTEXT](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-CAPABILITY-SELECTION](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-CONSEQUENCE-ASSESSMENT](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-DECISION-GATE-PROFILE](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-CONTINUATION-DECISION](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-DEFINITION-CLOSURE](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-ONTOLOGY-SELECTOR-LOCK](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-NECESSARY-CONTEXT-BASIS](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-CONTEXT-WINDOW-VIEW](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-ROUTE-OWNED-STRATEGY](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-WORKFLOW-CONTEXT-FORMATION](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-SEMANTIC-EVALUATION](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-CONTEXT-REFRESH](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-REQUEST-ROUTING](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-UNTIL-DECISION-GATE](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-DEFINITION-CLOSURE](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-ONTOLOGY-SELECTOR-LOCK](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-CONTEXT-BASIS-CONSTRUCTION](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-CONTEXT-VIEW-BINDING](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-RECEIPT-CONSTRAINT-DERIVATION](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-RUNTIME-JOURNAL-REPLAY](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-REASONING-STATE-FORMATION](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-EXACT-DISPATCH-PREPARATION](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-RISK-ALIGNED-CHECKPOINT](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-REASONING-STATE-RECOVERY](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-COMPLETION-FRONTIER-SEALING](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-GATEWAY-CONNECTION](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-RULE-CONTEXT-BEFORE-JUDGMENT](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-PROVENANCE-NONLOSS](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-DRIFT-INVALIDATES](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-ADVICE-NOT-PERMISSION](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-GOAL-NOT-DEFAULT](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-CONSEQUENTIAL-CHOICE-GATES](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-CONFIGURATION-IS-NOT-AUTHORITY](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-ROUTE-BEFORE-BASIS](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-BASIS-BEFORE-STRATEGY](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-DECLARED-EDGES-BIND](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-OMISSION-AUDIT-NONAUTHORIZING](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-DUAL-LANE-VIEW-IDENTITY](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-RECEIPT-CONSTRAINS-ONLY-DECLARED-DEPENDENCIES](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-JOURNAL-REPLAY-NO-EXTERNAL-CALLS](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-REASONING-STATE-APPEND-ONLY](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-CHECKPOINT-BEFORE-BOUNDARY](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-DISPATCH-MUST-RECONSTRUCT](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-RECOVERY-REQUIRES-COMPLETE-CHECKPOINT](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-DERIVED-INDEX-IS-DISPOSABLE](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-COMPLETION-FRONTIER-BEFORE-CONTINUATION](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-GATEWAY-CONSUMER-ISOLATION](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-OUTCOME-MEASURED-EVOLUTION](../../agent-reasoning-engine/business-ontology.json) | Outcome | `evidence/claims`: metric, tested scope, falsifier and unknowns |
| [CA2-ARE-CONCEPT-IMPROVEMENT-SIGNAL](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-IMPROVEMENT-TARGET](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-TECHNIQUE-CANDIDATE](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REPRODUCTION-TRIAL](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-ENGINE-VARIANT](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-VARIANT-COMPARISON](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-UPGRADE-DECISION](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-WORKFLOW-ENGINE-EVOLUTION](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-CONTROLLED-UPGRADE](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-RULE-BENCHMARK-IS-NOT-AUTHORITY](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-EVOLUTION-EXACT-BASELINE](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-VARIANT-ISOLATION](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-CANARY-ROLLBACK](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-CONCEPT-CACHE-AFFINITY-PROJECTION](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REASONING-STATE-WRITER-LOCK](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-WORKFLOW-CACHE-AFFINITY-PROJECTION](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-DURABLE-GATEWAY-RECOVERY](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-RULE-CACHE-AFFINITY-IS-DIAGNOSTIC](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-SINGLE-REASONING-STATE-WRITER](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-CONCEPT-REASONING-STATE-BRANCH](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REPLAY-FIXTURE](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REASONING-STATE-REDUCTION](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REASONING-COUNTEREVIDENCE](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-PORTABLE-REASONING-EPOCH](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-PROVENANCE-COMPARISON](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-WORKFLOW-ADVANCED-REASONING-STATE](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-RULE-REDUCTIONS-APPEND-ONLY](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-PORTABILITY-REQUIRES-COMPATIBILITY](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-COUNTEREVIDENCE-REQUIRES-CURRENT-SOURCE](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-RISK-SCALES-DURABILITY](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-CONCEPT-REASONING-STATE-TRANSITION-PLAN](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REASONING-STATE-TRANSITION-RECEIPT](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-REASONING-IMPROVEMENT-ITERATION](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-WORKFLOW-REASONING-STATE-LIFECYCLE-COORDINATION](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-RULE-STABILITY-BINDS-SAME-CANDIDATE](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-BENCHMARK-AUTHORITY-MUST-BE-MEASURED](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-OBSERVATION-TIME-NOT-IDENTITY](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-CONCEPT-INTEGRATED-PRODUCT-SURFACE](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-WORKFLOW-PRODUCT-STABILITY](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-RULE-PRODUCT-STABILITY-EXACT-CLOSURE](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-CONCEPT-REUSABLE-REASONING-STATE](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-INTERPRETATION](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-CURRENT-OBJECTIVE](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-OBJECTIVE-TRANSITION](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-EXPECTED-OUTCOME](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-OBSERVED-OUTCOME](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-UNDERSTANDING-ASSESSMENT](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-SCOPED-LESSON](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-COMMUNICATION-PREFERENCE](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-LESSON-APPLICATION](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-CONCEPT-APPLICATION-ASSESSMENT](../../agent-reasoning-engine/business-ontology.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-ARE-WORKFLOW-OBJECTIVE-RESOLUTION](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-UNDERSTANDING-VALIDATION](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-WORKFLOW-INTERACTION-LEARNING](../../agent-reasoning-engine/business-ontology.json) | Workflow | `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-ARE-RULE-UNDERSTANDING-REQUIRES-EVIDENCE](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-OBJECTIVE-IS-NOT-ROUTE](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-ARE-RULE-PREFERENCE-REUSE-IS-SCOPED](../../agent-reasoning-engine/business-ontology.json) | Business Rule | `reference/invariants`: constraint, violation example and enforcement status |

### interaction: 11 occurrences

| Source ID | Kind | Proposed page and treatment |
|---|---|---|
| [are.interaction-state](../../agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [are.interaction-context](../../agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [are.grounding](../../agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [are.preference](../../agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [are.preference-application](../../agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [are.lesson-application](../../agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [are.learning-progress](../../agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [are.scoped-reflection](../../agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [are.loop](../../agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json) | Domain Concept | `reference/glossary`: meaning, source, example and counterexample |
| [CA2-CAP-MANAGE-INTERACTION-CONTEXT](../../agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json) | Product Capability | `explanation/product-map`: ownership, scope and status |
| [CA2-ARE-OUTCOME-SCOPED-LESSON-APPLICATION](../../agent-reasoning-engine/capabilities/interaction-context/business-ontology.scaffold.json) | Outcome | `evidence/claims`: metric, tested scope, falsifier and unknowns |

### framings: 17 occurrences

| Source ID | Kind | Proposed page and treatment |
|---|---|---|
| [CA2-PRODUCT-CYBERALCHEMY](../../agent-reasoning-engine/framings/nodes.json) | Product | `roadmap/contextual-framings` + `explanation/product-map`: ownership, scope and status |
| [CA2-CAP-REASON-AND-MANAGE-CONTEXT](../../agent-reasoning-engine/framings/nodes.json) | Parent Capability | `roadmap/contextual-framings` + `explanation/product-map`: ownership, scope and status |
| [CA2-CAP-GENERATE-CONTEXTUAL-FRAMINGS](../../agent-reasoning-engine/framings/nodes.json) | Product Capability | `roadmap/contextual-framings` + `explanation/product-map`: ownership, scope and status |
| [CA2-FRAMINGS-BUSINESS-ONTOLOGY](../../agent-reasoning-engine/framings/nodes.json) | Business Ontology | `roadmap/contextual-framings` + `explanation/product-map`: ownership, scope and status |
| [CA2-FRAMINGS-OUTCOME-COGNITIVE-ERGONOMICS](../../agent-reasoning-engine/framings/nodes.json) | Outcome | `roadmap/contextual-framings` + `evidence/claims`: metric, tested scope, falsifier and unknowns |
| [CA2-FRAMINGS-CONCEPT-REQUEST](../../agent-reasoning-engine/framings/nodes.json) | Domain Concept | `roadmap/contextual-framings` + `reference/glossary`: meaning, source, example and counterexample |
| [CA2-FRAMINGS-CONCEPT-KNOWLEDGE-SUBSTRATE](../../agent-reasoning-engine/framings/nodes.json) | Domain Concept | `roadmap/contextual-framings` + `reference/glossary`: meaning, source, example and counterexample |
| [CA2-FRAMINGS-CONCEPT-DISTILLED-KNOWLEDGE](../../agent-reasoning-engine/framings/nodes.json) | Domain Concept | `roadmap/contextual-framings` + `reference/glossary`: meaning, source, example and counterexample |
| [CA2-FRAMINGS-CONCEPT-ANALOGY](../../agent-reasoning-engine/framings/nodes.json) | Domain Concept | `roadmap/contextual-framings` + `reference/glossary`: meaning, source, example and counterexample |
| [CA2-FRAMINGS-CONCEPT-CANDIDATE](../../agent-reasoning-engine/framings/nodes.json) | Domain Concept | `roadmap/contextual-framings` + `reference/glossary`: meaning, source, example and counterexample |
| [CA2-FRAMINGS-CONCEPT-FIT-ASSESSMENT](../../agent-reasoning-engine/framings/nodes.json) | Domain Concept | `roadmap/contextual-framings` + `reference/glossary`: meaning, source, example and counterexample |
| [CA2-FRAMINGS-WORKFLOW-GENERATE](../../agent-reasoning-engine/framings/nodes.json) | Workflow | `roadmap/contextual-framings` + `explanation/runtime-scenarios`: sequence, inputs, output, failure and feedback |
| [CA2-FRAMINGS-RULE-PRESERVE-SALIENCE](../../agent-reasoning-engine/framings/nodes.json) | Business Rule | `roadmap/contextual-framings` + `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-FRAMINGS-RULE-ANALOGY-IS-PARTIAL](../../agent-reasoning-engine/framings/nodes.json) | Business Rule | `roadmap/contextual-framings` + `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-FRAMINGS-RULE-CONTEXTUAL-VALIDITY](../../agent-reasoning-engine/framings/nodes.json) | Business Rule | `roadmap/contextual-framings` + `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-FRAMINGS-RULE-PROGRESSIVE-DEPTH](../../agent-reasoning-engine/framings/nodes.json) | Business Rule | `roadmap/contextual-framings` + `reference/invariants`: constraint, violation example and enforcement status |
| [CA2-FRAMINGS-RULE-NO-AUTHORITY](../../agent-reasoning-engine/framings/nodes.json) | Business Rule | `roadmap/contextual-framings` + `reference/invariants`: constraint, violation example and enforcement status |

## Open Questions

- Which prose/bridge disagreements represent stale evidence versus deliberate stronger claim ceilings? Resolve by exact source review before published status labels.
- Should the framing child remain bound to CyberAlchemy or become an ARE product capability? This inventory does not decide ownership.
- Which supported host/provider and persistence scope should the first live learning tutorial target?
- Which held-out multi-domain outcomes can support T01/T09/T14 beyond context-selection scores?
- Who owns publishing freshness checks connecting glossary entries, exact runtime contracts, implementation status, and evidence revisions?
- How should introductory documentation balance product-local vocabulary against conventional agent terminology without creating false equivalences?

## Joined documentation navigation

[page-register.json](page-register.json) maps T01–T18 to feature IDs, their source evidence and module reference destinations. The node occurrence appendix remains the complete meaning-source index. Per-item explanations and public schema certification belong to later authored reference pages.
