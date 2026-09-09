# CyberAlchemy: product thesis for marketing

**Internal strategy draft · 5 September 2026 · Private**  
**Scope:** CyberAlchemy-v2 and the separate `/home/vrondelli/projects/CyberAlchemy-lab` repository.  
**Purpose:** give marketing one coherent product narrative, an initial commercial hypothesis, usable draft messaging, and a defensible evidence boundary.  
**Posture:** editorial synthesis, not a replacement for an owner’s Product Thesis, a canonical Research record, product approval, or publication permission.  
**Work classification:** operational support — marketing research and composition; no product-construction stage is changed.

The earlier `domainspec-core/projects/cyberalchemy-lab` research-navigation project is excluded. It is not the Lab this thesis describes. Source references below resolve to the linked source register at the end; the accompanying JSON records exact source bytes and selectors.

## 1. The thesis in one page

**CyberAlchemy is being built to help people and AI build and evolve complex systems while keeping the original intent, shared meaning, evidence, and human decisions connected.**

The long-term ambition is a system that builds other systems. Its practical value begins with a smaller promise: when work moves between a person, an agent, a tool, or a session, the next participant should understand what the work means, what has been established, what remains uncertain, and what may happen next. [S01–S03]

Consider a team changing how customer orders are fulfilled. The requirement begins in a conversation, becomes a specification, passes through several agents, and lands in code. A test suite is green. Yet the reviewer still has to reconstruct whether the team preserved the intended business rule, which assumptions were introduced, and whether the tests actually cover the promised behavior. CyberAlchemy’s product hypothesis is that maintaining those connections as explicit, inspectable work state can reduce that reconstruction burden and make change easier to evaluate. This is an illustrative scenario, not a customer case study.

The product has several complementary expressions:

- **Craft** carries product and domain intent toward a working system through typed specifications, explicit implementation choices, construction, and independent checks. Its product lineage was formerly named DomainSpec v2. [S05, S14–S15]
- **The Ontology Product** turns selected project meaning into durable packages of concepts, relationships, source evidence, and unresolved questions that people and machines can inspect and reuse. [S04, S12]
- **The Agent Reasoning Engine** develops continuity in how agents interpret objectives, select context, preserve explicit reasoning records, and evaluate improvements. It has bounded implementations and local benchmarks; the whole product promise remains broader. [S07]
- **Workspace and related interaction surfaces** aim to make that depth accessible through a quiet ordinary interface with deeper inspection and control available when needed. [S01, S08]

CyberAlchemy-v2 holds broad product meaning and development evidence. CyberAlchemy Lab is the separate private development line for the first stable CyberAlchemy release. Referencing or importing v2 material does not automatically transfer its authority into the Lab. [S10–S11]

The strongest bounded milestone inspected for this thesis is the Lab’s **September 4 approval of one exact Ontology Product candidate**. The decision binds passing structural and Rust product-test receipts. It does not designate a stable release or authorize runtime adoption, activation, publication, or deployment. [S16–S19]

**Proposed positioning:** governed human–AI system building.  
**Proposed lead message:** “Keep intent connected to what you build.”  
**Initial audience hypothesis:** technical leaders and teams already using AI on complex, continuing system work, where reconstructing context and checking intent are recurring burdens.  
**Commercial hypothesis:** buyers will pay for less reconstruction, clearer review, and safer evolution if the product delivers those outcomes without imposing greater modeling and governance overhead.

Those audience and commercial statements are proposals for validation. This compilation does not establish market size, willingness to pay, comparative superiority, or measured productivity gains.

## 2. The customer problem

The source thesis identifies a disconnected work loop: useful outputs can arrive without preserving the goal, meanings, evidence, ownership, and continuation state needed to use them. [S01]

For marketing, translate that into recognizable moments:

| Moment | Human burden | Intended product response |
| --- | --- | --- |
| Returning to a project after an interruption | Reconstruct the objective, decisions, and unfinished work | Preserve a reviewable continuation state |
| Giving another agent a task | Repeat context and discover inconsistent interpretations | Supply bounded, source-linked meanings and context |
| Reviewing generated code | Determine whether plausible code matches the selected intent | Compare independent observations with an explicit contract |
| Changing an established concept | Find what depends on the old meaning | Preserve identities, relationships, source versions, and change evidence |
| Handing work to another owner | Explain what is ready, uncertain, and still awaiting a decision | Keep evidence and receiving responsibility attached |
| Deciding whether a result can be used | Distinguish “generated,” “tested,” “approved,” and “released” | Show the exact consequence and decision boundary |

The emotional stakes are lost confidence, repeated explanation, and the feeling of being the only person holding the whole project together. The business stakes are hypothesized rework, review cost, inconsistent implementations, and slow change. Neither is quantified by the inspected product evidence.

The problem becomes more consequential when work spans multiple domains, long periods, multiple agents, or several implementation languages. That is an applicability hypothesis, not a measured segment finding.

## 3. Product belief and value mechanism

CyberAlchemy’s source commitment combines human agency, shared meaning, evidence continuity, owner continuity, honest incompleteness, proportionate governance, and work that fits the person’s explicitly supplied context. [S01–S03]

The intended value chain is:

```text
State the desired result
    → resolve the meanings the work depends on
    → preserve sources, choices, and open questions
    → select a bounded action and implementation approach
    → construct or change the system
    → observe and test the result
    → compare the evidence with the intended result
    → preserve the next useful state for the next participant
```

Every transition must add usable information. Producing more documents is not the success criterion. The next participant must be able to continue, challenge, or reject the work without unnecessary reconstruction.

Three benefits organize the story:

1. **Continuity:** retain what the work means as it moves.
2. **Inspectability:** make the basis and limits of a result available for review.
3. **Controlled evolution:** change the system through explicit versions, evidence, and decisions.

These are intended outcomes. Their realized value must be measured in actual user work. [S03–S05]

## 4. Brand and product architecture

| Name | Role in this thesis | Marketing treatment |
| --- | --- | --- |
| CyberAlchemy | Umbrella product vision for human–machine work | Lead with this name and its user benefit |
| CyberAlchemy-v2 | Private source, meaning, and development-evidence surface | Explain in technical background; avoid presenting a repository version as a purchased offer |
| CyberAlchemy Lab | Separate private development line pursuing the first stable CyberAlchemy release | Describe as the development home; commercial packaging remains open |
| Craft | System-building Product, continuing the DomainSpec v2 lineage | Explain as the path from product intent to an inspectable working system |
| DomainSpec | Typed specification language and legacy lineage terminology in relevant sources | Retain where technical precision requires it; do not globally replace every occurrence with Craft |
| Ontology Product | Product for building and using project-owned ontology packages | Explain first as connected, source-linked project meaning |
| Agent Reasoning Engine | Reasoning and context-management capability with bounded local realizations | Support the continuity story; avoid universal understanding or autonomous self-improvement claims |
| Workspace | Candidate capability composing separately owned views and work surfaces | Demonstrate only the exact available surface; its existence does not establish a released suite |

Craft the Product, Craft the Project, and the Craft Method are separate identities. The Lab’s identity admission records preserve those distinctions. The same name does not make project coordination, system-building machinery, and decision authority interchangeable. [S14–S15]

The Ontology Product is also distinct from a Product Ontology. The former helps produce usable ontology packages; the latter describes a product’s meaning. The delivered package is a third object. This distinction matters when describing what a customer receives. [S12–S13]

The v2 portfolio also contains a Knowledge Exchange Protocol thesis and a bounded Lean Ontology Evidence Compiler. Keep them in the longer-term portfolio appendix until an audience or offer specifically requires them. They introduce additional promises that the core system-building story does not need. This is an editorial recommendation, not a portfolio cancellation or lifecycle decision. [S09, S23]

## 5. Who the product should serve first

The following is a proposed segmentation to test, derived from the source problems rather than customer interviews.

| Segment | Trigger | Likely champion | Likely buying concern |
| --- | --- | --- | --- |
| AI-assisted product engineering teams | Agents produce work faster than the team can reconstruct and review its meaning | Technical lead or staff engineer | Does it reduce total delivery burden? |
| Platform and architecture teams | Repeated implementations drift from intended structures and contracts | Platform lead or architect | Can existing systems integrate incrementally? |
| Knowledge-intensive technical teams | Definitions, research, and decisions need to survive repeated handoffs | Research or knowledge-engineering lead | Are sources, uncertainty, and ownership preserved? |

**Proposed first focus:** a technical team using agents on one continuing product with recurring handoffs and changes. It offers a bounded way to test the entire value proposition without making an organization-wide transformation the first sale.

The economic buyer might be an engineering leader or founder; the technical champion might be an architect or agent-workflow owner. These roles require discovery. No buying authority, budget, procurement route, or willingness to pay was observed.

Weak initial fits may include disposable one-shot tasks, teams whose current tools already preserve continuity at low cost, or buyers seeking unattended consequential execution. These are screening hypotheses rather than categorical exclusions.

## 6. Jobs to be done and product stories

**“When I resume complex work, help me recover the actual decision state so I can continue without retelling the whole project.”**

Intended experience: the user sees the objective, selected sources, important assumptions, unresolved questions, and next bounded action. They can inspect or correct the interpretation. The ARE and umbrella thesis supply this direction; complete cross-session product behavior must be demonstrated in the selected runtime. [S01, S07]

**“When an agent builds a feature, help me preserve the domain meaning so the reviewer can compare what was built with what we chose.”**

Intended experience: Craft turns selected meaning into a typed specification, makes realization choices explicit, and supplies independent conformance evidence. A workflow’s recovery behavior should remain connected to the operations and obligations it actually invokes. The source contains this mechanism and bounded implementation claims, not proof that arbitrary applications are correct. [S05–S06]

**“When several people and agents use our knowledge, help us share the same bounded meanings without giving a tool control over them.”**

Intended experience: the Ontology Product produces a package with concepts, relations, provenance, and explicit gaps. Consumers retrieve known identities and inspect the evidence. A change creates a new observable state; reconstruction and replacement can be checked. The Lab candidate provides concrete bounded evidence in this area. [S04, S12, S17–S19]

**“When I approve something, help me know exactly what that decision permits.”**

Intended experience: a successful test does not silently become release permission. The system makes consequential boundaries visible while keeping already-authorized, harmless work lightweight. The Lab’s separate product-approval record is a concrete example of this separation. [S01, S16]

These stories should become demonstrations with observable pass/fail conditions, not slides that merely list architecture components.

## 7. What the evidence supports today

The evidence levels below apply to the inspected sources as of this compilation. Recorded tests were read, not rerun.

| Surface | Evidence inspected | Defensible statement | Claim limit |
| --- | --- | --- | --- |
| Umbrella product | Product thesis, journeys, and outcome model | There is an explicit commitment to governed human–machine work and continuity | Does not establish effectiveness or market demand |
| Craft in the Lab | Product carrier and identity decision 0031 | A decision admits six exact identity carriers and five relations, with schema and identity-contract conformance | Implementation and runtime conformance are `not_evaluable` in that decision |
| Ontology Product candidate 0004 | Approval 0042, exact candidate, candidate receipt, product-test receipt | The September 4 decision approves one frozen and tested Product candidate | Product approval only; no stable-release designation or operational authority |
| Ontology test epoch | Recorded nine structural checks and nine Rust product tests; 23 nodes, 24 relations, five typed residues | Bounded source-to-package, retrieval, evolution, replay, recovery, context, and runtime-replacement evidence is recorded | One selected source/package/test boundary; no universal scale, reliability, or customer-outcome claim |
| Ontology lifecycle | Candidate runtime description | Event histories support reconstructing a bounded ontology state; views are calculated projections | An early witness README does not certify the full successor runtime |
| Agent Reasoning Engine | Current v2 capability README and scorecard narrative | Local implementations and measured experiments exist; specific gaps are explicit | No generalized model-quality, token-savings, or autonomous improvement claim |
| Workspace | Capability README | A bounded implementation candidate and inspectable product direction exist | No inference of released, integrated, production-ready SaaS |

For the strongest milestone, this compilation rechecked the SHA-256 bindings of the candidate and both receipts against approval 0042. All three matched. It also checked all 18 material files listed by the candidate validation receipt; all 18 matched. This establishes those document/material bindings at inspection time. It is not a fresh execution of the test suite or a recursive audit of every runtime dependency. [S16–S19]

The graph counts characterize the test case; they are not traction, market coverage, or performance metrics. The five unresolved items remain visible rather than being converted to completed work by the passing test.

## 8. Positioning and differentiation to test

**Positioning statement:** For teams using AI to build and evolve complex systems, CyberAlchemy is a governed human–AI work system designed to preserve intent, meaning, evidence, and ownership from one step to the next.

The proposed differentiator is the combination of typed meaning, explicit realization, independent observation, recoverable work state, and human decision boundaries. Each component must contribute to a better user outcome. [S01, S04–S07]

These are comparison questions for future competitive research, not assertions about current vendors:

| Comparison frame | Question that tests CyberAlchemy’s value |
| --- | --- |
| Coding assistant | Can the next agent recover the same intended meaning and evidence after a handoff? |
| Documentation or knowledge system | Can a consumer identify source versions, contradictions, and which claims remain unsupported? |
| Code generator | Can an independent observer verify the selected realization in the actual target? |
| Workflow orchestrator | Does a completed step preserve the receiving state and exact permission boundary? |
| Knowledge graph | Can meaning survive runtime replacement while remaining owned by the source project? |

No current competitor survey was performed. Avoid “only,” “first,” “best,” or claims that an entire category lacks these capabilities.

The potential defensibility is accumulated, reusable system-building knowledge: typed contracts, realization mappings, negative checks, recovery behavior, and well-scoped evidence. Its durability as a business advantage is unproven. It depends on useful coverage, adoption, maintenance cost, and how readily other approaches can provide equivalent outcomes.

## 9. The commercial thesis

Customers would be paying for a more dependable way to continue and change work: less reconstruction, clearer review, and evidence that stays attached to its meaning. “More ontology nodes” and “more generated artifacts” are weak value units by themselves.

**Proposed entry offer:** a bounded continuity pilot around one existing project. Select a real task with meaningful handoffs, preserve a defined source set, carry one change through a reviewable chain, and compare the result with the team’s existing workflow. Availability of that pilot depends on the exact usable product slice; this document does not launch an offer.

A plausible expansion path is from one workflow to reusable project meanings, then recurring construction and review practices, then multiple projects. Expansion should follow observed reuse and customer value rather than mandatory adoption of the entire conceptual model.

Potential commercial forms to investigate include an assisted implementation engagement, a team product, or a supported private deployment. Do not select an edition, license, hosting promise, support level, or price from repository layout. The inspected sources do not settle them.

The economic test must include setup, modeling, maintenance, compute, and review costs. Faster generation can still lose economically if users spend more time feeding the system or interpreting its machinery.

## 10. Experience and trust principles for marketing

The ordinary surface should make the next useful action clear. The deeper view should let a person inspect the objective, selected sources, transformations, assumptions, evidence, and continuation state. This is the source thesis’s progressive inspectability: quiet, explain, inspect, control. [S01, S07]

Translate technical principles into customer language:

| Internal concept | Plain-language expression |
| --- | --- |
| Ontology | Shared concepts and relationships, connected to their sources |
| Provenance | Where this came from and which version was used |
| Typed residue | The unresolved questions and limits that still matter |
| Conformance | Evidence that the observed system matches the selected contract |
| Bounded authority | Exactly what this action or approval permits |
| Deterministic projection | The same selected inputs produce the same view |
| Explicit reasoning state | The inspectable interpretation, evidence, and decisions needed to continue |
| Runtime replaceability | Change the machinery while preserving the agreed meaning |

Avoid presenting human context as surveillance. The product commitment is to explicit, opt-in, local, reviewable information; fatigue or attention must not be silently inferred. Avoid presenting structured reasoning records as hidden model chain-of-thought. [S01, S07]

## 11. Draft messaging kit

All copy in this section is for internal review. Wording is not a public-boundary approval.

**Primary headline**

> Keep intent connected to what you build.

**Supporting line**

> CyberAlchemy is building a shared work system for people and AI—connecting meaning, decisions, implementation, and evidence as complex projects evolve.

**Short description**

> CyberAlchemy helps people and AI carry complex work forward with clear meaning, inspectable evidence, and human control. It is being developed to preserve the thread from the result you want to the system you build and the changes that follow.

**Long description**

> Complex projects move through conversations, specifications, agents, code, tests, and human decisions. CyberAlchemy is being built to keep those steps connected. Craft carries product intent toward explicit system specifications and independently checked implementations. The Ontology Product preserves project-owned concepts, relationships, sources, and unresolved questions in reusable packages. Reasoning and workspace capabilities aim to make that depth available without forcing every user to operate inside it. The intended result is work that people and machines can inspect, challenge, resume, and evolve together.

**Craft message**

> Carry product intent into an explainable, testable system.

**Ontology Product message**

> Give people and AI shared meaning they can trace, inspect, and reuse.

**Reasoning continuity message**

> Preserve the understanding needed for the next step.

**Internal milestone sentence**

> CyberAlchemy Lab has recorded product approval for an exact Ontology Product candidate backed by nine structural checks and nine Rust product tests over a bounded source package.

If used outside the team after a separate boundary review, that sentence must retain its scope and must not appear beneath a “now generally available” claim.

**Proposed future call to action:** “Explore a bounded project pilot.” Use only when a pilot offer, delivery owner, and actual available product slice have been established.

## 12. Objection handling

| Objection | Honest response |
| --- | --- |
| “This sounds like more documentation.” | The intended test is whether the next person or agent can continue with less reconstruction. If the records cost more than they save, the realization needs revision. |
| “Will this slow my team down?” | Setup and routine governance overhead are real risks. A pilot must measure the full workflow, including modeling and review. |
| “Does it guarantee correct software?” | It provides bounded evidence against selected contracts. Missing or incorrect meaning can still produce the wrong product. |
| “Do we have to replace all our tools?” | Replaceable realizations and source ownership are product principles. Integration effort and supported adapters need to be verified for the specific deployment. |
| “Is this an autonomous development company?” | The ambition is system building with human–machine collaboration. Consequential decisions and effects retain explicit ownership and permission boundaries. |
| “Is it ready to buy and run?” | This research found specific candidate implementations and a bounded Product approval. It does not establish a generally available package, commercial terms, or supported production deployment. |

## 13. Demonstration narrative

A useful demonstration should show one complete piece of work and one meaningful failure.

**Ontology demonstration concept:** select the exact approved source package; inspect a concept and its relations; locate its source and unresolved questions; retrieve a known identity; show how an unknown identity is rejected; demonstrate the recorded evolution/replay/recovery behavior; explain what remains outside the approval.

The existing candidate evidence supports preparing this demonstration, but a live demo needs verification of the exact executable and environment. This compilation did not launch it.

**Craft demonstration concept:** take one product feature, identify the meanings it depends on, show an exact supported realization, and compare a target with the selected contract. Introduce one deliberate mismatch in an isolated test fixture and show the independent check naming it. This is a proposed demonstration design, not a performed demonstration or proof of a currently available end-to-end Lab feature.

The audience should leave able to answer: What did we intend? What was built? What supports the result? What is still unknown? Who decides the next consequence?

## 14. How to test product value

The source outcome model distinguishes outputs, outcomes, metrics, and KPI targets. It deliberately does not select formulas or targets. The following are proposed measurements for a future pilot, not approved KPIs. [S03]

| Outcome | Candidate observation | Essential guardrail |
| --- | --- | --- |
| Faster resumption | Time to reconstruct the objective and choose a correct next action | Check understanding, not speed alone |
| Better handoff | Material clarifications the receiver needs before continuing | Do not hide unresolved questions to improve the count |
| Intent preservation | Reviewer assessment of whether selected obligations survived implementation | Keep review independent of construction |
| Lower coordination burden | Human time spent assembling context, routing work, and checking state | Include initial setup and maintenance |
| Useful change control | Detection of relevant stale or conflicting inputs before reuse | Count false blocks and missed changes |
| Human control | Ability to identify, reject, or correct a consequential action | No implied consent or hidden effect |
| Commercial value | Repeat use and willingness to commit resources after a bounded trial | Separate enthusiasm from actual continued use |

Use comparable tasks and record user experience, source boundaries, failure cases, missing data, and learning effects. Establish the baseline and decision threshold before judging success. A passing technical benchmark supports a mechanism; it does not prove the user outcome.

Counterevidence that should change the strategy includes persistent overhead greater than time saved, users unable to understand the evidence, unreliable resumption, integration costs that overwhelm benefit, or a simpler approach delivering the same useful guarantees.

## 15. Construction frontier and marketing readiness

This is a research snapshot and proposed readiness framework, not an execution queue or a new construction authorization.

| Lane | Frontier or proposed work | Owner | Stage affected / exact dependency |
| --- | --- | --- | --- |
| Product construction | Ontology candidate 0004 has exact Product approval recorded | Ontology Product owner | Tested Product candidate; operational successors remain separate |
| Product construction | Craft identity chain admitted; implementation/runtime conformance not established by that decision | Craft Product and conformance owners | Identity-contract boundary; a current execution binding is required to name the next runnable implementation task |
| Product construction | ARE and Workspace have bounded v2 candidates | Respective capability owners | Exact current candidate and test scope must be selected before a delivery claim |
| Operational support | Compile this internal marketing thesis | Marketing research | No construction stage; completed by this artifact |
| Operational support | Customer discovery and offer selection | Proposed marketing/commercial owner | No construction stage; external outreach not authorized here |
| Operational support | Review public wording and evidence disclosure | Product and privacy/publication owners | Public release of marketing materials only |
| Operational support | Packaging, support, deployment, release | Respective delivery and release owners | Exact operational prerequisite depends on selected offer; not selected here |

**Runnable construction:** this research does not select an implementation task or claim an execution binding is ready. Already dependency-ready construction under its existing owner and authorization should continue independently of marketing, packaging, and future publication work.

**Causal blockers:** an unselected commercial offer limits launch claims; missing customer observations limit effectiveness claims; an absent exact execution binding prevents this document from declaring a new construction task runnable. None of these automatically blocks unrelated prototype work.

**Deferred operational residue:** public copy approval, market research, pricing, distribution, onboarding, support commitments, release designation, and deployment remain separately owned decisions. No release date is implied.

## 16. Claims discipline and source reconciliation

Use “designed to” or “being built to” for the umbrella value promise. Use “the recorded test demonstrates…” for a scoped mechanism. Use “the owner approved candidate…” only with the exact decision binding. Use “customers achieved…” only after customer evidence exists.

Do not claim general correctness, eliminated hallucination, proven cognitive benefit, autonomous workers, compliance certification, production readiness, broad model superiority, or quantified savings from these sources.

Specific reconciliation rules used here:

- The Lab’s foundation README says the *initial* repository contained no imported code or runtime evidence. Later Product and approval records show subsequent work. The initial statement is historical, not a complete present-day inventory. [S10, S16–S19]
- Frozen Craft and Ontology carriers retain pre-decision candidate labels. Later external decisions bind specific identities or bytes; the thesis reads the carrier together with its decision rather than pretending the historical label was edited. [S12, S14–S17]
- The early ontology lifecycle README retains pending and unimplemented successor language. It supports the witness model, while the later exact Ontology Product candidate supports its own broader, bounded test claims. One cannot silently certify the other. [S20, S17–S19]
- The v2 ARE documents describe both planned portions and subsequently implemented bounded mechanisms. This thesis claims partial implementations and local evidence, not complete integration or general adoption. [S01, S07]
- Broad v2 meaning and Lab-owned admission remain separate. A shared name or copied file is not proof of identical scope or transferred authority. [S10–S11]

## 17. Open questions for product and marketing

1. Is “CyberAlchemy Lab” a lasting customer-facing name or the development home for a CyberAlchemy-branded release?
2. Which exact usable slice will anchor the first commercial offer: ontology packages, Craft system building, reasoning continuity, or a combined workflow?
3. Which audience has enough recurring reconstruction cost to justify adopting a structured work model?
4. What installation, hosting, data-handling, integration, and support commitments can the team actually deliver?
5. What evidence threshold will justify a productivity, quality, or economic claim?
6. Which private mechanisms, diagrams, examples, and receipts may be disclosed publicly?
7. How will the team keep marketing claims current as candidates and implementation bindings change?
8. Which product name and explanation makes the value understandable without requiring an ontology lesson first?

These questions do not diminish the product direction. They identify the decisions and observations needed to turn a coherent technical thesis into a defensible commercial offer.

## 18. Source register

The links below identify the evidence used for this synthesis. `SOURCE-REGISTER.json` records absolute paths, hashes, selected sections or JSON fields, and inspection limits. File dates and original receipts remain historical; source inspection occurred on 5 September 2026.

- **S01** — [CyberAlchemy umbrella Product Thesis](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/product/PRODUCT-THESIS.md)
- **S02** — [Intended product journeys](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/product/PRODUCT-JOURNEYS.md)
- **S03** — [Outcomes and measurement boundaries](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/product/OUTCOME-MODEL.md)
- **S04** — [Ontology Product thesis](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/product/ontology-product/PRODUCT-THESIS.md)
- **S05** — [Craft Product thesis and lineage](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/product/craft/PRODUCT-THESIS.md)
- **S06** — [Imported DomainSpec product thesis](/home/vrondelli/projects/CyberAlchemy-lab/craft/PRODUCT-THESIS.md)
- **S07** — [Agent Reasoning Engine scope and local evidence](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/agent-reasoning-engine/README.md)
- **S08** — [Workspace capability boundary](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/workspace/README.md)
- **S09** — [Knowledge Exchange Protocol portfolio direction](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/product/knowledge-exchange-protocol/PRODUCT-THESIS.md)
- **S10** — [Lab foundation and release target](/home/vrondelli/projects/CyberAlchemy-lab/README.md)
- **S11** — [Lab architecture planning selection](/home/vrondelli/projects/CyberAlchemy-lab/docs/decisions/0004-lab-architecture-selection/DECISION.md)
- **S12** — [Lab Ontology Product purpose and scope](/home/vrondelli/projects/CyberAlchemy-lab/product/products/ontology/v1/PRODUCT.md)
- **S13** — [Product, Product Ontology, output, and Craft separation](/home/vrondelli/projects/CyberAlchemy-lab/docs/migration-plans/0003-ontology-as-product-context-migration-v1/SEMANTIC-MODEL.md)
- **S14** — [Lab Craft identity carrier](/home/vrondelli/projects/CyberAlchemy-lab/product/products/craft/v1/PRODUCT.md)
- **S15** — [Craft identity admission decision](/home/vrondelli/projects/CyberAlchemy-lab/docs/decisions/0031-cml07-craft-identity-v1/DECISION.md)
- **S16** — [Exact Ontology Product approval](/home/vrondelli/projects/CyberAlchemy-lab/docs/decisions/0042-ontology-product-v1-product-approval/decision.json)
- **S17** — [Approved Ontology Product candidate](/home/vrondelli/projects/CyberAlchemy-lab/product/products/ontology/v1/candidates/0004-first-stable/candidate.json)
- **S18** — [Candidate validation receipt](/home/vrondelli/projects/CyberAlchemy-lab/product/products/ontology/v1/candidates/0004-first-stable/receipts/validation.json)
- **S19** — [Recorded end-to-end Ontology Product tests](/home/vrondelli/projects/CyberAlchemy-lab/product/products/ontology/v1/product-tests/epoch-001/receipts/validation.json)
- **S20** — [Early ontology lifecycle witness and evidence ceiling](/home/vrondelli/projects/CyberAlchemy-lab/ontology-lifecycle/README.md)
- **S21** — [Source map and ingest rules](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/SOURCE-MAP.md)
- **S22** — [Earlier human-machine integration proposition](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/VALUE-AND-PHILOSOPHY-PROPOSITION.md)
- **S23** — [Bounded formal-evidence capability](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/product/lean-ontology-evidence-compiler/README.md)

[Machine-readable source register](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/research/marketing-product-thesis-2026-09-05/SOURCE-REGISTER.json)
