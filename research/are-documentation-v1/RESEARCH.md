# ARE documentation research

Status: candidate documentation research, 2026-09-16.
Scope: the ARE product and its declared dependencies; not every product in CyberAlchemy.
Authority effect: none. User requested writing and three proposer–reviewer pairs.

## Question and objective

How can a newcomer understand the ARE thesis, identify what works today, connect an agent, and assess the evidence without confusing prototype mechanisms with supported behavior?

The documentation preserves the [lighthouse](../../agent-reasoning-engine/LIGHTHOUSE.md): reliable problem solving across domains, models and context budgets, measured through outcomes, continuity, recovery and total model tokens. The initial GLM small-window work remains a bounded experimental milestone. Documentation cannot establish transfer by describing an architecture.

## Competing documentation proposals

1. Package-first navigation: accurate code lookup, but newcomers must reconstruct user outcomes across packages.
2. Task-first navigation alone: easier entry, but risks hiding disabled capabilities and cross-cutting contracts.
3. Reader journeys plus linked thesis, feature and architecture catalogs: selected candidate. Additional maintenance requires explicit coverage links and source ownership.

Falsifier for proposal 3: a reader cannot distinguish a working connection path from a proposed universal gateway, mistakes the 8K result for general task success, or cannot trace a feature to its status and evidence. No participant study has been run; usability is unverified.

## Online examples and decisions

| Primary example | Observed pattern | ARE adaptation | Limit |
| --- | --- | --- | --- |
| [Diátaxis](https://diataxis.fr/) | Tutorials, how-to guides, reference and explanation address different reader needs. | Give each planned page one primary purpose; link between forms. | A navigation framework does not verify implementation claims. |
| [C4 diagrams](https://c4model.com/diagrams) | Multiple structural zoom levels with dynamic and deployment views. | Separate system context, process boundaries, module relationships and request sequences. | Software layers are not automatically deployed processes. |
| [Kubernetes controllers](https://kubernetes.io/docs/concepts/architecture/controller/) | Desired/current state and repeated observation explain a control loop. | Show objective, observed outcome, comparison, controller, actions, disturbances and feedback. | ARE semantics and permissions differ; this is an explanatory analogy, not convergence proof. |
| [arc42 cross-cutting concepts](https://docs.arc42.org/section-8/) | Explain concepts shared across architecture elements. | Put identity, freshness, budgets, persistence and authorization in shared reference pages. | Do not duplicate canonical definitions in every module page. |
| [OpenTelemetry concepts](https://opentelemetry.io/docs/concepts/) | Concepts, signals, components, SDKs and glossary have distinct entries. | Separate evidence records from adapters and operator journeys. | A journal is not a deployed observability service. |
| [MCP architecture](https://modelcontextprotocol.io/docs/2026-07-28/learn/architecture) | Protocol architecture distinguishes participants and communication responsibilities. | Distinguish host adapter, gateway transport, model provider and tool protocol. | Does not mean ARE implements MCP. |

Sources retrieved 2026-09-16. These are paraphrased design observations, not imported specifications or copied documentation.

## Delegation sheet

Explicit user authorization: “use 3 pair of subagents, proposer and reviewer”.
Three proposers run first. The environment rejected additional reviewer threads even after a proposer finished. Therefore the three agents cross-review: coverage proposer reviews theses; thesis proposer reviews architecture; architecture proposer reviews coverage. Nobody reviews their own work. Root integrates after review.

| Pair | Proposer scope / owned output | Reviewer scope / owned output | Dependency and close condition |
| --- | --- | --- | --- |
| 1 | Thesis, definitions, source inventory: THESIS-INVENTORY.md | THESIS-REVIEW.md | Review actual proposal and primary examples; list corrections, omissions and disposition. |
| 2 | Modules, adapters, layers, cybernetic graphs: ARCHITECTURE.md | ARCHITECTURE-REVIEW.md | Check graph semantics, current/target separation and package coverage. |
| 3 | Feature coverage and reader journeys: FEATURE-COVERAGE.md and feature-coverage.json | COVERAGE-REVIEW.md | Check all 42 prior audit IDs, claims, page mapping and sources. |

Common gate: research writing only, no authority promotion or runtime mutation.
Join rule: root records review findings and resolves material inconsistencies in a synthesis. A review is not product approval.
Root owns README.md, RESEARCH.md, DOCUMENTATION-BLUEPRINT.md and reconciliation/validation evidence.

## Construction and operations

Current frontier: reviewed documentation inventory and blueprint.
Runnable work: source inventory, primary online comparison, proposal, review, editorial reconciliation and local link/coverage checks.
Causal blockers: none for research drafting.
Operational tasks: hosting/domain/remote publication (documentation owner), production signing or deployment (release owner). All deferred; none blocks these files.
A future site build, product fixes and live research rounds require their own bounded work plans; they are not an obligatory serial dependency chain.

## Open Questions

- Which reader should receive the first evaluated tutorial: operator, agent integrator or researcher?
- Will documentation remain private or later receive a separately reviewed public edition?
- Which participant test will evaluate navigation and comprehension?
- Which generated API inventory should accompany the feature-level catalog?
