# Learning Graph And Next-Route Guide

**Document family:** Product research blueprint
**Idea:** An evidence-bound learner guide for implementation-conformance questions
**One-line promise:** Help a learner turn a broad identity question into an exact evidence question and a display-only next-route suggestion, without pretending that the guide understands the learner or can authorize work.
**Status:** Candidate research artifact; `authority_effect: none`
**Prepared:** 2026-08-01
**Primary evidence:** `research.md`; `receipts/learning-graph-synthesis-revised.json`; `receipts/reviewer-precedent.json`; `receipts/reviewer-non-vacuity.json`; `receipts/reviewer-definitional.json`; `receipts/evidence-closure.json`

## Executive brief

A learner looking at a TypeScript function can easily ask the wrong first question: “Is this a DomainSpec Rule?” The current candidate ontology viewer can show concepts, profiles, supplied facts, and evaluator findings. It can orient a reader and expose exact evidence. It cannot establish that a real source symbol has a semantic identity, infer what the learner understands, or decide what work should run next.

The proposed product is therefore not a new ontology and not an executable learning graph. It is a **regenerable learner projection** over records with different owners: a candidate semantic concept, profile expectations, supplied source observations, evaluator output, session-local questions, an evidence gap, workflow-admission context, and a display-only route suggestion. Its useful move is small but consequential:

1. orient the learner to the layers;
2. focus on one exact subject;
3. inspect immutable evidence bindings;
4. expose what the evidence cannot establish;
5. revise a broad question into a falsifiable evidence-requirement question; and
6. suggest, without selecting or executing, the next governed owner route that could produce the missing witness.

The smallest credible proof is not “people learn from the graph.” No such evidence exists. The first credible proof is that frozen fixture inputs deterministically yield the right explanation, abstention, revised question, and non-executing suggestion—and that counterexamples fail closed.

## The frustration

Imagine a learner inspecting `LegacyLimitRule`. It looks rule-like. It lives in a TypeScript facts fixture. A profile describes what a TypeScript Rule implementation should look like. The evaluator reports mismatches. A graph could draw all these objects close together and tempt the learner to read proximity as meaning.

Three things are broken in that moment:

- The broad identity question collapses expectation, observation, evaluation, and semantic admission into one yes/no answer.
- A visually persuasive relation can look like proof even though the source is an example fixture whose digest explicitly says `example-only-not-a-product-receipt`.
- A link to “the next route” can look executable even though no owner has admitted the work and no route has been confirmed, registered, or launched.

The guide should make the boundary visible at the point of confusion. It should not answer what the evidence cannot answer.

## The idea in one image

Think of the projection as a **light table, not a knowledge brain**. Each transparent sheet retains its own owner and truth conditions:

- semantic candidate;
- profile expectation;
- supplied observation;
- evaluator result;
- learner session state;
- evidence gap;
- workflow-admission suggestion.

The learner may align the sheets to see where a question becomes precise. The projection does not fuse them into a new canonical object. It can be regenerated from frozen inputs, and a changed digest invalidates the affected display and suggestion.

## A target day with it

This is a target experience, not an observed human-comprehension result.

A learner opens the existing implementation-conformance HTML view and chooses the Rule concept. The guide explains that `architecture.RuleImplementation` is a candidate semantic anchor aligned to `DS-D1.7`, not proof that any TypeScript callable is a Rule. The learner focuses on `LegacyLimitRule`. The inspector separates the selected TypeScript profile from the supplied facts and the expected findings.

The guide then states an abstention: the binding is empty, it is marked non-current, the source digest is example-only, and there is no native adapter or owner-resolved semantic-admission receipt. Instead of answering the identity question, it revises it:

> What owner-resolved current semantic binding and native TypeScript adapter evidence would be required before LegacyLimitRule could be evaluated for Rule identity?

Finally, the view displays one candidate destination string—`TypeScript adapter owner`—alongside the verification question, proposed witness, prerequisites, and invalidation conditions. Nothing is selected, registered, dispatched, or executed. A human still owns every governance transition.

## Who it is for and the job it does

The initial audience is an internal product owner, researcher, or product builder who can follow system vocabulary once it is attached to a concrete subject. The job is not to teach the whole ontology. It is to prevent a learner from crossing an evidence boundary while helping them make the next question more testable.

The product succeeds at its candidate ceiling when the reader can inspect why a fixture conclusion is limited, see exactly what evidence is absent, and carry a precise verification question to the appropriate governed owner. Whether the reader actually comprehends or retains the distinction requires separate qualified human evidence.

## Why chase this

The opportunity is compositional. Existing work already provides candidate concept and profile records, fixture evaluation, immutable evidence handles, bounded focus scenes, synchronized projections, provenance inspection, and trust-rail patterns. The differentiator is not another graph carrier or another generic learner-map product. It is the disciplined assembly of those owned parts into a question-revision loop that refuses unsupported identity and routing claims.

Even if human testing later shows that the projection does not improve comprehension, a well-run experiment still yields value: it clarifies which distinctions are too dense, which evidence gaps need better representation, and whether the next-route suggestion is useful without looking authoritative.

## Product goals and intended impact

| Goal | Intended change | Evidence needed |
| --- | --- | --- |
| Learner goal | Turn “is this a Rule?” into an evidence-requirement question. | Qualified session evidence comparing the original and revised question. |
| System goal | Preserve semantic, expectation, observation, finding, session, gap, and admission boundaries in one synchronized projection. | Deterministic schema, binding, mutation, and view-parity checks. |
| Research goal | Test whether exact provenance plus explicit abstention improves question quality. | Predeclared human protocol and comprehension criteria. |
| Ecosystem goal | Hand an owner a better-scoped verification request without bypassing governance. | Owner review of suggestion usefulness and non-authoritative presentation. |

No impact claim is presently earned. These are target outcomes.

## The learner loop

### 1. Orient

Introduce the record layers before showing a dense graph. State that a concept is not a profile, a profile is not an observation, an observation is not a finding, and a finding is not semantic admission. Provide the current proof tier at every layer.

### 2. Focus

Select one immutable subject and the smallest relevant neighborhood. Focus is presentation state only. `session-focuses-on` says what the session is inspecting; it does not say that the learner understands the subject or that the subject has the hoped-for identity.

### 3. Inspect

Show the exact concept, profile, fact, evaluation, and evaluator bindings. Present expectation and observation side by side. Preserve the difference between an expected evaluation artifact and real-source behavior.

### 4. Expose the evidence gap

If the current inputs cannot support the identity question, state `ABSTAIN` and enumerate the missing witnesses. Absence of a finding is not positive per-assertion proof. A finding is not a domain identity verdict.

### 5. Revise the question

Apply the declared deterministic rule. When `binding.concept_id` is empty, `binding.current` is false, the source digest is example-only, and no native-adapter receipt exists, replace the broad identity question with one that names the required current binding and adapter evidence. The revised question supersedes the first within this session; it is not a graph edge claiming that questions think or generate other questions.

### 6. Suggest a non-executing next governed route

Display the exact destination owner-route string `TypeScript adapter owner` only while the frozen gap inputs remain current. Bind it to a verification question, proposed witness, prerequisites, and invalidation rule. The suggestion has `authority_effect: none`: it does not confirm, select, register, dispatch, execute, promote, publish, release, or deploy anything.

## Repaired node records

These are projection records, not members of a canonical LearningGraph ontology.

| Record | Owner boundary | Truth condition | Current evidence | Invalidation |
| --- | --- | --- | --- | --- |
| `semantic_concept` | Candidate semantic ontology owner | The frozen ontology contains the candidate concept at the bound pointer. | `ontology.json` digest `4b67…bbcd3`, `/concept_types/2`. | Ontology digest or pointer changes; owner rejects candidate alignment. |
| `profile_expectation` | Base-domain or language-profile owner | The frozen profile declares the selected candidate constraints. | Base digest `2e87…3873`, TypeScript digest `7949…e66b`, `/constraints/0-5`. | Profile digest, extension chain, constraint value, or status changes. |
| `source_observation` | Evidence/adapter owner | The frozen facts artifact contains the supplied record; its source status remains explicit. | Facts digest `74d6…fcf67`, `/elements/0` and `/elements/2`; source digest is example-only. | Facts digest changes; a real adapter supersedes the fixture; source identity changes. |
| `evaluation_finding` | Evaluator/evidence owner | Frozen expected output reports the stated finding set for the frozen inputs. | Evaluation digest `dd82…adee3`, `/findings/0-7`; evaluator digest `cd88…8fb`. | Input, evaluator, schema, profile, or expected-output digest changes. |
| `session_confusion` | Learner-session owner | A learner explicitly supplied the statement in this session. | Proposed fixture: “I cannot tell whether…” | Session correction, withdrawal, expiry, or absent self-report. |
| `session_question` | Learner-session owner | The exact text was recorded or deterministically revised in the session. | v1 and v2 texts in revised synthesis. | Input grounds change; learner rejects revision; rule no longer applies. |
| `session_focus` | Projection/session owner | The UI currently selects the bound subject. | Focus on `LegacyLimitRule`. | Selection changes or source subject disappears. |
| `evidence_gap` | Residue owner by gap type | Required evidence is demonstrably absent from the frozen input set. | Missing current semantic binding, native adapter, real source digest, unsupported set. | All missing evidence is supplied and validated, or requirements change. |
| `workflow_admission` | Governed workflow owner | A separately owned admission state exists. The projection may only report it. | No admission exists in this synthesis. | Any new admission must be independently bound; display is stale until regenerated. |
| `route_suggestion` | Suggestion renderer; destination merely referenced | One current evidence gap maps to one display-only question, witness, prerequisites, invalidation, and destination string. | Revised synthesis suggestion record. | Any immutable gap input changes; owner conflict; unsupported or circular prerequisite. |

## Repaired relation records

| Relation | Owner boundary | Truth condition | Evidence | Invalidation |
| --- | --- | --- | --- | --- |
| `profile-constrains-candidate-type` | Profile projection owner | Named constraints apply to candidate evaluation of the bound type. | Base and TypeScript profile bindings. | Profile/type binding changes. |
| `observation-evaluated-against-profile` | Evaluator/evidence owner | The frozen observation was compared with the frozen profile. | Facts, profile, evaluation, and evaluator digests. | Any participating digest or evaluator schema changes. |
| `finding-reports-evaluation` | Evaluator/evidence owner | A finding in the expected result names the bound subject/mismatch. | Findings 0–6 for element mismatches; finding 7 for dependency mismatch. | Finding identity or expected output changes. |
| `session-focuses-on` | Session/projection owner | The selected session object is the inspection target. | v1 question and `LegacyLimitRule` selection. | Selection or question changes. |
| `inspection-identifies-evidence-gap` | Projection derivation owner | Inspection of frozen records proves specified evidence is absent, without deciding identity. | Abstention grounds and exact bindings. | Evidence arrives, inputs change, or absence cannot be established. |
| `question-revision-supersedes` | Session/projection owner | The declared derivation rule yields v2 from v1 and meets the acceptance criterion. | v1/v2, rule, endpoint, criterion in revised synthesis. | Any rule premise becomes false or learner rejects the revision. |
| `suggestion-addresses-evidence-gap` | Suggestion renderer | The suggestion is display-only and binds exactly one current gap to its verification package. | Candidate suggestion record. | Stale inputs, owner conflict, unsupported route, or circular prerequisites. |

Generic `evidenced_by` and `routes_to` are deliberately absent: they erase evidence type and make a suggestion look executable. `understands` is absent because no interaction can establish a learner’s mental state. Anthropomorphic question/unknown relations are also absent; questions are session records, and missing proof is a typed `evidence_gap`.

## Owner and precedent disposition

This disposition follows the frozen cross-experiment exploration at `receipts/explorer-cross-experiment.json#/artifacts/0` (`research.md#agent-2--spivak-david`), whose validation says all named current experiment families were dispositioned against live owner artifacts. The receipt does not establish new ownership; “owned contribution” below means the contribution retained behind the already inspected owner boundary, not ownership minted by this guide.

| Frozen-sheet family | Status | Owned contribution retained | Exact frozen source selector / path | Boundary consequence |
| --- | --- | --- | --- | --- |
| `interactive-ontology-learning-map` | `blocked` | Existing interactive learning-map projection patterns | `receipts/explorer-cross-experiment.json#/residue/0`; `research.md#agent-2--spivak-david` | Do not adopt as a current-generation chain; its chain is incomplete. |
| `ontology-candidate-graph-prototype` | `build-from-owned` | Candidate graph carrier and ontology projection patterns | `receipts/explorer-cross-experiment.json#/artifacts/0`; `research.md#agent-2--spivak-david` | Compose through its owner; do not treat the carrier as a canonical LearningGraph ontology. |
| `ontology-evidence-workbench` | `blocked` | Evidence/provenance workbench patterns | `receipts/explorer-cross-experiment.json#/residue/1`; `research.md#agent-2--spivak-david` | Parent final acceptance is blocked, so it cannot supply acceptance or promotion proof. |
| `ontology-evidence-workbench-focus-scene` | `reuse` | Bounded focus-scene and subject-neighborhood presentation | `receipts/explorer-cross-experiment.json#/artifacts/0`; `research.md#agent-2--spivak-david` | Reuse as presentation state only; focus cannot assert identity or comprehension. |
| `ontology-evidence-workbench-semantic-navigation` | `defer` | Semantic-navigation plan | `receipts/explorer-cross-experiment.json#/residue/2`; `research.md#agent-2--spivak-david` | Plan-only evidence cannot support implemented navigation or acceptance claims. |
| `ontology-evidence-workbench-thin-prototype` | `reuse` | Thin synchronized evidence-projection pattern | `receipts/explorer-cross-experiment.json#/artifacts/0`; `research.md#agent-2--spivak-david` | Reuse only behind the workbench owner boundary; no parent acceptance is inherited. |
| `ux-rule-governed-artifact-tree` | `build-from-owned` | Governed artifact-tree and trust-rail presentation pattern | `receipts/explorer-cross-experiment.json#/artifacts/0`; `research.md#agent-2--spivak-david` | Adopt presentation conventions compositionally; do not transfer authority or claim UX acceptance. |
| `Body War atlas` | `reuse` | Atlas-style navigation and provenance-inspection precedent | `receipts/explorer-cross-experiment.json#/artifacts/0`; `research.md#agent-2--spivak-david` | Treat as a separately owned precedent; no product, promotion, or human-comprehension proof transfers. |

## Exact immutable binding set

| Input | SHA-256 | Required selectors / identity | Proof ceiling |
| --- | --- | --- | --- |
| Candidate ontology | `4b67ba1d631b11a09ab073a1e8003ccc0367a3c49e625693c54b2a7ddf3bbcd3` | `/concept_types/2`; `/language_projections/0/drift_owner` | Candidate concept and candidate owner-route string only. |
| Base profile | `2e877fa59399f82fd192310689634a07659e65531941efe1db4abb5f6e903873` | `/profile_id`, `/status`, `/language`, `/constraints/0-5`, `/authority_effect` | Candidate expectations. |
| TypeScript profile | `79496329856b53da6f3d5c66521c194ad7fc4251c879b0d91a9aed2d0d94666b` | `/profile_id`, `/status`, `/language`, `/extends/0`, `/constraints/0-5`, `/authority_effect` | Candidate TypeScript expectations. |
| Supplied facts | `74d637de8b6a8c96246df037b85088cad4b80f22207db74ed9218eea874fcf67` | `/facts_id`, `/source_digest`, `/elements/0`, `/elements/2`, `/relations/1`, `/authority_effect` | Fixture observation only; source digest is `example-only-not-a-product-receipt`. |
| Expected evaluation | `dd82fc27f21a87f9ef965f245c3149224d3d91823da902047a3d7fa5c74adee3` | profile/facts IDs, verdict, counts, `/findings/0-7`, `/authority_effect` | Expected fixture evaluation only. |
| Evaluator | `cd88bd45baced31080f22c0498bd5a63688d6e35504e593a70b9db7e6d7588fb` | schema `domainspec-architecture-evaluation/v1` | Executable fixture validator; no distinct `evaluator_version`. |
| HTML projection host | `601ab580789b3aa82e97a7b5d2d1b93749fce21b4a5585486f3863bb5ddbead9` | `projects/domainspec-v2/development/implementation-conformance/ontology-experiment/architecture-ontology-view.html`; five lenses at `.view-button[data-view="metaTypes"]`, `.view-button[data-view="types"]`, `.view-button[data-view="profiles"]`, `.view-button[data-view="facts"]`, `.view-button[data-view="findings"]`; canvas `#ontology-canvas`; inspector `#inspector`; help `#help-modal` and `#help-button`; beginner guide `a.guide-link[href="BEGINNER-GUIDE.html"]` | Exact source/UI bindings only; not browser execution, visual correctness, accessibility acceptance, or human-comprehension proof. |
| Revised synthesis: session questions | `97523013f4832ac836ce14ffc124d9a33176e97c8bf1f0043546a7cf3957d200` | `receipts/learning-graph-synthesis-revised.json`; `/candidate_nodes/7` (v1), `/candidate_nodes/8` (v2) | Synthesis-local candidate fixtures only. |
| Revised synthesis: evidence gap | `97523013f4832ac836ce14ffc124d9a33176e97c8bf1f0043546a7cf3957d200` | `receipts/learning-graph-synthesis-revised.json`; `/candidate_nodes/9` | Observed absence in frozen inputs only; not a semantic verdict or workflow admission. |
| Revised synthesis: question revision | `97523013f4832ac836ce14ffc124d9a33176e97c8bf1f0043546a7cf3957d200` | `receipts/learning-graph-synthesis-revised.json`; `/candidate_relations/7` | Deterministic synthesis-local revision relation; not learner cognition or route initiation. |
| Revised synthesis: route suggestion | `97523013f4832ac836ce14ffc124d9a33176e97c8bf1f0043546a7cf3957d200` | `receipts/learning-graph-synthesis-revised.json`; `/candidate_nodes/10` | Display-only candidate owner-route string with `authority_effect: none`; no admission or execution. |

The DOM selectors above bind claims to source and UI structure. They are not evidence that a browser loaded the page, that a person could use or understand it, or that any accessibility or visual acceptance gate passed.

## Positive and abstention witnesses

### Positive fixture witness

For `implementation.payment.MaxAmountRule`, the frozen supplied fixture satisfies the applicable candidate-profile checks represented by the frozen inputs, and the expected evaluation reports no finding for that subject. Decision: `FIXTURE_HAS_NO_REPORTED_FINDING`.

This is only an evaluator-checked absence of a reported finding. There is no positive per-assertion record. It does not prove semantic identity, live-source conformance, runtime behavior, owner admission, or human comprehension.

### Abstention witness

For `implementation.payment.LegacyLimitRule`, the question “Is LegacyLimitRule a DomainSpec Rule in a live repository?” must return `ABSTAIN` because:

- `binding.concept_id` is empty;
- `binding.current` is false;
- the source digest is example-only;
- no native TypeScript adapter receipt or exact real source digest exists; and
- no owner-resolved semantic-admission receipt exists.

The allowed output is the typed evidence gap, the revised verification question, and the candidate owner-route string. The system must not supply a semantic verdict.

## HTML integration hypothesis

The existing `architecture-ontology-view.html` is the likely projection host because it already fetches the ontology, meta-type projection, four profiles, supplied facts, and expected evaluation; exposes five lenses (`metaTypes`, `types`, `profiles`, `facts`, `findings`); and provides search, navigator, profile selection, inspector, help, and beginner-guide navigation.

The hypothesis is to add a **learner guide projection**, not new ontology semantics:

1. Reuse stable selection and provenance inspection.
2. Add a compact orientation rail that labels each record class and proof tier.
3. On subject focus, render the exact binding stack and explanation fixture.
4. When abstention grounds match, render the evidence gap and deterministic v1→v2 question revision.
5. Render the suggestion package with `authority_effect: none`, the literal candidate owner string `TypeScript adapter owner`, prerequisites, and invalidation.
6. Keep Graph, Outline, and Table views synchronized without encoding presentation edges as semantic relations.

Existing browser behavior and prior UI checks make this assembly plausible. They do not establish visual correctness for a new integration, accessibility acceptance, comprehension, or route usefulness. A second generic learning-map product should not be created; any implementation should extend the separately owned learner-view/navigation surfaces through their owners.

## Verdict matrix

| Claim or component | Verdict | Why |
| --- | --- | --- |
| Candidate Rule concept and profiles exist | `executed / fixture-bound` | Frozen ontology and profile inputs validate. |
| Fixture evaluator behavior | `executed / fixture-only` | Validator and expected output are bound; no real source adapter. |
| Positive MaxAmountRule result | `flag` | Absence of finding only; no positive per-assertion record. |
| LegacyLimitRule identity | `abstain` | Current binding, native adapter, real source, and owner admission are absent. |
| Repaired projection vocabulary | `candidate / review-passed` | Definitional and non-vacuity reviews passed with repairs. |
| Regenerable learner projection | `build-from-owned` | Composes owned projection/evidence patterns; not yet implemented here. |
| HTML integration | `hypothesis` | Host seams exist; integration and acceptance have not run. |
| Next-route suggestion | `candidate display only` | Bound to evidence gap at candidate-string ceiling. |
| Human comprehension | `deferred` | No qualified human receipt. |
| Accessibility | `deferred` | No accessibility acceptance evidence. |
| Owner admission or execution | `not evidenced` | No owner identity/admission or governed launch. |
| Promotion, publication, release, deployment, production readiness | `not evidenced` | Research artifact has no authority effect. |

## Verification plan

| Question | Witness and method | Pass signal | Fail signal | Next governed route |
| --- | --- | --- | --- | --- |
| Does generation preserve exact identities? | Regenerate from frozen digests; compare every selector and rendered provenance handle. | Exact match; stale input fails closed. | Missing selector, silent rebinding, or digest drift accepted. | Projection implementation owner. |
| Does the loop abstain correctly? | Run positive, abstention, and mutant fixtures. | Expected `FIXTURE_HAS_NO_REPORTED_FINDING`, `ABSTAIN`, and mutant decisions. | Semantic identity inferred, missing evidence hidden, or unsupported route shown. | Fixture/evaluator owner. |
| Is question revision deterministic? | Replay declared premises and compare exact v2 text plus criterion. | Same premises yield the same bounded revision. | Anthropomorphic or unconstrained next question. | Session projection owner. |
| Is the suggestion non-executing? | Inspect UI state, events, network, and emitted payload. | Display only; no selection, registration, dispatch, mutation, or outbound request. | Any execution-like side effect or authority language. | Suggestion renderer owner. |
| Do views preserve record classes? | Graph/Outline/Table parity test with exact IDs and proof tiers. | No class collapse or semantic inference from geometry. | Generic edges, dropped provenance, or divergent view truth. | Learner-view/navigation owner. |
| Does the UI work mechanically? | Browser acceptance across search, focus, inspector, guide, keyboard path, zero unexpected errors/outbound requests. | Predeclared checks pass. | Broken navigation, inaccessible control path, stale state, or external request. | UI implementation owner. |
| Does it improve learner questions? | Qualified novice protocol with predeclared scoring and counterexamples. | Learners distinguish the layers and produce evidence-bound questions at the agreed threshold. | Confidence rises without boundary accuracy, or revision quality does not improve. | Human research owner; do not promote automatically. |
| Can real TypeScript source be observed? | Language owner plus native parser/compiler fixture, exact source digest, tool/version, current owner binding, typed observation, unsupported set. | Reproducible real-source observation admitted by its owner. | Unsupported syntax, nondeterminism, stale binding, or owner rejection. | `TypeScript adapter owner` only. |

## Stage sequence

1. **Projection contract:** freeze schema, record classes, derivations, proof-tier labels, and fail-closed mutants.
2. **Static integration:** render the exact positive and abstention fixtures into the existing owned learner-view surface without adding authority semantics.
3. **Automated acceptance:** validate immutable binding, view parity, keyboard behavior, no visual-inference relations, no outbound activity, and non-execution.
4. **Human protocol:** test question quality and boundary recognition; keep comprehension and accessibility separate.
5. **Real-source evidence:** only if separately admitted, take the verification package to `TypeScript adapter owner`.
6. **Owner decision:** use the new evidence to decide whether to revise, continue, or kill the product direction. None of these stages implicitly promotes or publishes it.

## Risks and non-goals

### Risks

- A polished graph may create more confidence than the evidence deserves.
- “No finding” may be misread as positive conformance.
- Session-local confusion may be mistaken for a durable learner model.
- A route suggestion may be mistaken for authorization.
- Reusing multiple product seams may bypass their owners or duplicate an existing learner map.
- Digest drift may leave a convincing but stale projection.
- Human testing may measure task completion while missing conceptual misunderstanding.

### Non-goals

- Define or promote a canonical LearningGraph ontology.
- Create `QuestionNode`, `UnknownNode`, `understands`, `confused_about`, generic `explains`, generic `evidenced_by`, generic `blocks`, or generic `routes_to` semantics.
- Infer comprehension, intent, confusion, or identity from clicks, geometry, or source shape.
- Build a second generic learning-map, graph carrier, evidence viewer, or focus-scene system.
- Implement a real-source TypeScript adapter in this research artifact.
- Admit an owner, confirm a route, launch work, change authority, promote, publish, release, deploy, or claim production readiness.

## Terminology

| Term | Meaning here | Not equivalent to |
| --- | --- | --- |
| Regenerable learner projection | A disposable, reproducible view assembled from separately owned frozen records. | Canonical LearningGraph ontology. |
| Semantic concept | Candidate domain meaning owned outside the projection. | Source symbol shape or profile match. |
| Profile expectation | A candidate constraint used for evaluation. | Observation, finding, or semantic admission. |
| Source observation | A typed record of supplied or adapter-produced facts. | Truth about domain identity. |
| Evaluation finding | A report of comparison between observation and profile. | Runtime correctness or owner verdict. |
| Session confusion | Explicit learner-supplied text local to a session. | Inferred mental or comprehension state. |
| Session question | Exact question text recorded in a session. | A canonical graph node. |
| Evidence gap | A typed, demonstrable absence of required evidence. | An anthropomorphic “unknown” or semantic negation. |
| Workflow admission | Separately governed permission/state for work to proceed. | A display suggestion. |
| Route suggestion | A non-executing verification package referencing a destination owner string. | Selection, confirmation, dispatch, or execution. |
| Authority effect | Whether an artifact can change governed authority. Here it is `none`. | Persuasiveness or visual prominence. |
| Positive witness | Fixture evidence that a specific expected failure was not reported. | Positive per-assertion proof or semantic conformance. |
| Abstention witness | Evidence that the system must withhold a requested verdict. | Failure of the guide; abstention is the correct result. |

## Proof boundary

The current research establishes exact-bound candidate records, fixture evaluator behavior, a repaired non-anthropomorphic vocabulary, deterministic question-revision logic, an explicit abstention witness, and a display-only candidate suggestion. It does **not** establish human comprehension, accessibility, a real-source TypeScript adapter, owner admission, route execution, semantic admission, promotion, publication, release, deployment, or production readiness. No evidence for any of those claims exists in the scoped inputs.

The one-line promise therefore remains narrow: help expose and refine the next evidence question while preserving ownership and proof boundaries.

## Next decisions

1. Will the learner-view owner admit this projection contract as a candidate extension rather than a new product?
2. Which exact UI surface owns session-local question text and its retention/privacy policy?
3. What predeclared human protocol would count as question-quality evidence, and what separate protocol would count as accessibility acceptance?
4. Is a distinct `evaluator_version` and positive per-assertion result required before UI implementation?
5. If the fixture projection passes, should a separately governed verification request be presented to `TypeScript adapter owner` with the exact source/tool/binding prerequisites?

The smallest next decision is the first one: owner review of the candidate projection contract. Until that happens, implementation and route execution should not be inferred from this guide.
