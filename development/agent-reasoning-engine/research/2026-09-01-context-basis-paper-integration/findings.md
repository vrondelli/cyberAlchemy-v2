# Context Basis paper integration — bounded findings

## Start here

The strongest joined finding is a **selector-bound context lifecycle**:

```text
CodexRequestContext
  → CodexPreflightDecision
      → CodexRouteDirective | CodexDecisionGate | TypedBlocker
  → retrieval
  → provenance binding
  → dependency selection
  → NecessaryContextBasis
  → projection
  → ContextWindowView binding
  → non-authorizing RouteOwnedStrategy
```

The papers improve the vocabulary and expose protocol questions around this lifecycle, but they do not prove that the lifecycle is complete, fast, faithful, consistent, isolated, conformant, or production-ready. The local invariant remains a `local_owned_candidate`; the joined lifecycle and protocol sketches are `integration_inference` with `local_witness=none`. (`research.md`, “Tarski explorer memo,” §§2–4; `synthesis-round-2.md`, “Provenance and ownership” and “Repaired state and operation model”; `evidence-closure.md`, “Claim closure matrix”)

The practical design direction is to keep owner-controlled source records durable, select exact request-relative dependencies, freeze those dependencies into an immutable basis, derive consumer-bound views through explicit transformations, and permit route-owned reasoning only after the basis is complete and current. Cache state, retrieval output, shared visibility, provenance, consensus, validation, or a receipt cannot become routing, admission, owner-decision, continuation, or effect authority. (`research.md`, Tarski memo, exact selectors `CA2-ARE-RULE-CONTEXT-BEFORE-JUDGMENT`, `CA2-ARE-RULE-DRIFT-INVALIDATES`, and `CA2-ARE-RULE-ADVICE-NOT-PERMISSION`; `synthesis-round-2.md`, “Repaired state and operation model”)

## Evidence and provenance posture

| Claim class | Material in this result | Evidence posture |
|---|---|---|
| `paper_position` | Yu’s hierarchy, hybrid memory, access, visibility, ordering, and conflict questions; Dadhich’s lifecycle vocabulary | Candidate research vocabulary, not local validation. (`research.md`, first explorer memo §§1–4; second explorer memo §§1–3) |
| `paper_reported_product` | Synap architecture and benchmark results | External product reports only; killed as ARE evidence. (`research.md`, second explorer memo §§4–6; `synthesis-round-2.md`, “Typed outcome matrix”) |
| `local_owned_candidate` | Request → route/preflight → definition closure → selector lock → basis → view → strategy invariant | Candidate local contract, not an adopted Product Capability. (`research.md`, Tarski memo §§1–2 and exact local selectors listed there) |
| `integration_inference` | Operation taxonomy, protocol fields, reuse rules, and fixtures | Candidate design with `local_witness=none`. (`synthesis-round-2.md`, “Provenance and ownership,” “Fixture boundary”) |
| `local_witness` | None | No fixture ran and no runtime or conformance witness exists. (`synthesis-round-2.md`, “Fixture boundary”; `evidence-closure.md`, “Writer obligations”) |

`synthesis-round-2.md` supersedes any conflicting claim in `synthesis.md`. The exact upstream package and its SHA-256 bindings are recorded in `evidence-closure.md`, “Exact upstream package.” (`evidence-closure.md`, “Exact upstream package”)

## What each paper adds—and does not prove

### Yu et al., arXiv:2603.10062v2

Yu et al. add a useful separation among agent I/O, capacity-limited cache, and persistent memory; a hybrid pattern of local working memory plus selectively shared artifacts; explicit questions about access permissions and granularity; and a division between update-time visibility/ordering and read-time conflict resolution. These are useful candidate dimensions for distinguishing source acquisition, disposable cache, durable source memory, immutable views, and shared projections. ([Yu et al. §§3–6](https://arxiv.org/html/2603.10062v2); `research.md`, first explorer memo §§1–4)

The paper does not define semantic consistency, supply a cache-transfer or memory-access protocol, implement a violation detector, provide benchmarks, or show that hardware-style coherence preserves definitions, exclusions, conflicts, provenance, or authority posture. Its figures are conceptual, and the paper itself describes an open challenge rather than an evaluated system. ([Yu et al. §6](https://arxiv.org/html/2603.10062v2#S6); `research.md`, first explorer memo §8)

The hardware analogy must therefore stop at architecture and protocol questions. Semantic artifacts are not bytes; freshness is selector-relative; compression may remove qualifications; identical inputs do not guarantee identical model interpretation; and visibility, truth, ownership, admission, and authority remain distinct. (`research.md`, first explorer memo §8)

### Dadhich, arXiv:2607.21503v1

Dadhich adds a useful five-part context-management lifecycle: architecting, ingesting, scoping, anticipating, and compacting/consolidating. It also distinguishes extraction quality, retrieval quality, and reasoning sufficiency; treats scope isolation as first-class; and argues that latency, token use, fidelity, and context rot should be evaluated separately from recall. ([Dadhich §2](https://arxiv.org/html/2607.21503v1#S2), [§3](https://arxiv.org/html/2607.21503v1#S3), [§5](https://arxiv.org/html/2607.21503v1#S5); `research.md`, second explorer memo §§1–3)

The paper’s cost equations are analytic illustrations rather than observed ARE performance. Its public evaluations concern conversational recall, while latency, token efficiency, context-rot resistance, organizational isolation, exact provenance, compaction fidelity, forgetting, and authority safety were not benchmarked. The proprietary anticipation, graph-traversal, and compaction-validation mechanisms prevent independent assessment of the corresponding product claims. ([Dadhich §§4–6](https://arxiv.org/html/2607.21503v1#S4), [Appendices A–D](https://arxiv.org/html/2607.21503v1#A1); `research.md`, second explorer memo §§3–6)

The reported LongMemEval and LoCoMo scores therefore remain `paper_reported_product`, not ARE evidence. They do not demonstrate preservation of exact definitions, selector locks, negative constraints, conflicts, exclusions, supersession, or `authority_effect=none`. (`research.md`, second explorer memo §§5 and 8; `synthesis-round-2.md`, “Typed outcome matrix”)

## Adopt, adapt, test, reject

| Concern | Adopt as candidate vocabulary | Adapt for ARE | Test | Reject |
|---|---|---|---|---|
| `ObviousRoute` | Hierarchy and anticipated preparation may inform a low-latency preflight candidate. | Bind routing to preserved request provenance, exact registry state, and selected routing dependencies. | Exact-one route, route tie, zero route, unknown effect, stale selected routing dependency, and byte-identical repeated classification. | Popularity, similarity, cache locality, prediction confidence, or agent majority as route authority. (`research.md`, Tarski memo §§4–6; `review-round-1.md`, “Non-vacuity” item 3) |
| `RequestRelativeDefinitionClosure` | Retrieval is not sufficiency; missing bridge material can cap answer quality. | Define closure over exact definition identities, relation kinds, versions, digests, postures, and termination rules after OPEN-001. | A finite typed graph with an explicitly missing bridge and collect-all `not_evaluable` output, after OPEN-001. | Retrieval success, graph traversal, or semantic similarity as proof of closure. (`research.md`, Tarski memo §§4–6; `review-round-1.md`, “Non-vacuity” item 2) |
| `OntologySelectorLock` | Access, granularity, visibility, conflict, scope, temporal validity, and provenance are useful dimensions. | Bind exact ontology ID, node selectors, required-edge selectors, reasons, exclusions, source digests, and lock digest after OPEN-002. | Independently mutate selected and unrelated dependencies and verify selector-relative invalidation. | Global “latest ontology” coherence, best-effort entity resolution, or Python-runtime diagnostics as admission. (`research.md`, Tarski memo §§4–6; `synthesis-round-2.md`, “Full ontology-runtime suspension”) |
| `NecessaryContextBasis` | Treat durable context formation as a lifecycle rather than a store lookup. | Freeze request, route, declared dependencies, constraints, gaps, authority/effect posture, and digest. | Hand-authored succession plumbing may test mechanics; general sufficiency waits for OPEN-001 and OPEN-002. | Persistent storage, retrieved sets, or benchmark recall as proof of sufficiency, truth, admission, or authority. (`research.md`, Tarski memo §§2–4; `synthesis-round-2.md`, “Fixture boundary”) |
| `ContextWindowView` | Bounded context assembly and selectively shared artifacts are useful candidates. | Require immutable basis/lock binding, consumer, purpose, window, epoch, transform, protected fields, omissions, residue, and lineage. | Compare full append, free-form summary, typed compaction, cold regeneration, and validated reuse only within the fixture boundaries below. | Cache hit, recency, topical similarity, or a generic validation score as sufficient reuse evidence. (`research.md`, first memo §§2–3; second memo §§2 and 8; `synthesis-round-2.md`, “Invalidation and succession”) |
| `RouteOwnedStrategy` | Local reasoning state plus explicit cross-route artifacts fits the hybrid model. | Route owners control route-specific projection policy; reasoning remains bound to one current view and non-authorizing. | Compare local regeneration with shared projection reuse under identical declared bindings and explicit conflicts. | Autonomous architecture activation, anticipation, consensus, or cache coherence as ownership or continuation authority. (`research.md`, first memo §§1 and 5; second memo §§1 and 7; Tarski memo §4) |

## Exact operation and layer separations

| Operation or layer | Candidate output | What it does not establish |
|---|---|---|
| Source acquisition / I/O | Attributable observations or exact source bytes | Durability, acceptance, relevance, or authority. (`synthesis.md`, “Layer model”; `synthesis-round-2.md`, “Repaired state and operation model”) |
| Owner-controlled source memory | Durable original records with lifecycle posture | Request-relative relevance, currentness, permission, or sufficiency. (`research.md`, Tarski memo §3) |
| Retrieval | Candidate records | Closure, selector sufficiency, admission, or route selection. (`synthesis-round-2.md`, “Repaired state and operation model”) |
| Provenance binding | Source and transformation identities | Correctness, semantic sufficiency, permission, or authority. (`research.md`, Tarski memo §3; `synthesis-round-2.md`, “Repaired state and operation model”) |
| Dependency selection | Declared records, exclusions, and gaps | General closure before OPEN-001 or selector sufficiency before OPEN-002. (`synthesis-round-2.md`, “Repaired state and operation model,” “Fixture boundary”) |
| Basis construction | Frozen candidate basis, or `not_evaluable` | Truth, ontology admission, Product Capability adoption, or effect authority. (`research.md`, Tarski memo §§2–3) |
| Projection | Derived artifact not yet consumer-bound | Route selection, decision, admission, or authorization. (`synthesis-round-2.md`, “Repaired state and operation model”) |
| View binding | Consumer-, purpose-, window-, and epoch-bound immutable view | Continuation or implementation authority. (`research.md`, Tarski memo §§2–3) |
| Agent-local cache | Disposable performance state | Semantic currentness or view identity. (`research.md`, Tarski memo §3) |
| Shared reusable projection | Immutable transformed artifact with declared dependencies | Acceptance merely because it is published or visible. (`research.md`, first memo §§3–4; Tarski memo §3) |
| Reasoning | Non-authorizing judgment or route-strategy candidate | Owner decision, continuation, implementation, publication, deployment, or external effect. (`synthesis-round-2.md`, “Repaired state and operation model”) |
| Provenance or reuse receipt | Identity, derivation, and observed ordering evidence | Sufficiency, correctness, admission, conformance, or permission. (`research.md`, Tarski memo §§3 and 6) |

The routing objects are also distinct: `CodexRequestContext` records the request; `CodexPreflightDecision` classifies it; `CodexRouteDirective` names direct routing; `CodexDecisionGate` displays a choice; `TypedBlocker` records a fail-closed outcome; and only the responsible owner can make an owner decision. (`research.md`, Tarski memo §2; exact selectors `CA2-ARE-CODEX-CONCEPT-REQUEST-CONTEXT`, `CA2-ARE-CODEX-CONCEPT-PREFLIGHT-DECISION`, `CA2-ARE-CODEX-CONCEPT-ROUTE-DIRECTIVE`, `CA2-ARE-CODEX-WORKFLOW-PREFLIGHT`, and `CA2-ARE-CODEX-RULE-UNKNOWN-FAILS-CLOSED`)

## Access, version, visibility, invalidation, and conflict candidate

This protocol is an `integration_inference`, not an adopted contract. (`synthesis-round-2.md`, “Provenance and ownership”)

- **Access:** record `owner_route_id`, permitted readers, proposers, canonical writer, read/write posture, granularity, confidentiality scope, and public/private boundary. Missing access metadata fails closed for reuse. (`synthesis.md`, “Protocol contract candidates”; `review-round-1.md`, “Non-vacuity” item 5)

- **Version and identity:** bind request digest, route-decision digest, definition-closure digest, ontology-lock digest, basis digest, view ID, source epoch, consumer, purpose, window, transformation ID, artifact digest, parent references, and producer sequence. (`research.md`, Tarski memo §7, “Minimum contract deltas,” items 3–5)

- **Visibility:** distinguish local creation, proposal, publication, acceptance, and supersession events. Publication means observable, not accepted; canonical-write permission does not prove a particular write valid. (`research.md`, first memo §§4 and 6; `synthesis.md`, “Protocol contract candidates”)

- **Invalidation:** unknown, missing, ambiguous, or conflicting selected dependencies produce `not_evaluable`; known selected-dependency change creates immutable successor candidates; unrelated drift is diagnostic; changed consumer, purpose, access, material conflict, or expired external-state binding can also invalidate reuse. (`synthesis-round-2.md`, “Invalidation and succession”; `synthesis.md`, “Protocol contract candidates”)

- **Conflict:** preserve `stale_dependency`, `concurrent_write`, `semantic_disagreement`, `scope_violation`, `environment_drift`, and `authority_posture_conflict` as typed candidates. A material unresolved conflict makes dependent strategy `not_evaluable` unless an owner-declared deterministic rule applies; last-writer-wins is rejected. (`research.md`, first memo §§4 and 6–8; `synthesis.md`, “Protocol contract candidates”)

- **Speculation:** anticipated material remains `warm-unbound` until rebound to the current request, route, dependency set, consumer, purpose, and access scope. It cannot select or widen a route. (`research.md`, second memo §§1–2 and 7; `synthesis.md`, “Protocol contract candidates”)

- **Compaction:** definitions, selectors, negative constraints, exclusions, conflicts, gaps, authority/effect posture, and provenance must remain exact or mechanically validated; otherwise the result is `not_safely_compactable`. Compaction cannot silently perform forgetting or retirement. (`research.md`, second memo §§2 and 8; `synthesis.md`, “Protocol contract candidates”)

## OPEN-003: both unresolved alternatives

`ARE-CONTEXT-OPEN-003` remains `owner_decision_required`; neither paper nor the current evidence selects an alternative. (`review-round-1.md`, “Precedent and ownership” item 2; `synthesis-round-2.md`, “Invalidation and succession”)

| Alternative | Identity rule | Required evidence | Principal trade-off |
|---|---|---|---|
| **A — retained identity** | When every binding is unchanged, retain the existing view identity and issue a new per-turn reuse receipt. | Exact equality/currentness checks for request, route decision, closure, lock, selected dependencies, consumer, purpose, access, transformation, protected fields, conflicts, external freshness, exclusions, residue, and authority/effect posture. | Lower identity churn, but correctness depends on a complete reuse predicate and trustworthy per-turn receipts. (`synthesis.md`, “View reuse candidate”; `synthesis-round-2.md`, “Invalidation and succession”) |
| **B — per-turn successor** | Create a new successor view each turn, even when content is equal, and record equality through digests and predecessor references. | Deterministic successor construction, predecessor linkage, equality semantics, and explicit cost/accounting rules. | Stronger turn-level identity and history, but greater artifact churn and potentially higher construction/storage cost. (`review-round-1.md`, “Precedent and ownership” item 2; `synthesis-round-2.md`, “Invalidation and succession”) |

No experiment may silently choose A or B, and cold regeneration is only a construction method—not a semantic outcome. (`synthesis-round-2.md`, “Invalidation and succession”)

## Experiment program

### Predecision and bounded plumbing experiments: candidate

These experiments may proceed as designs against frozen, hand-authored inputs because they do not claim discovered semantic closure. Each fixture must freeze exact request, profile, route-registry and source bytes/digests, declared dependency set, mutations, expected identities and reason codes, repetition count, tokenizer/token accounting, causal events, and machine-readable oracles. (`review-round-1.md`, “Non-vacuity” item 1; `synthesis-round-2.md`, “Fixture boundary”)

Candidate cases are:

1. Exact-one route, route tie, zero route, unknown effect, and stale selected routing dependency, including byte-identical repeated classifications. (`review-round-1.md`, “Non-vacuity” item 3)
2. Succession plumbing over a hand-authored dependency set: unchanged bindings, unrelated drift, known selected change, and unknown/conflicting selected dependency. (`synthesis-round-2.md`, “Invalidation and succession,” “Fixture boundary”)
3. An immutable multi-agent causal log distinguishing publication from acceptance and preserving a deterministic conflict-set digest. (`review-round-1.md`, “Non-vacuity” item 4)
4. A two-scope leakage fixture containing a forbidden same-topic record, excluded adjacent node, superseded record, permitted shared projection, explicit leakage denominator, false-exclusion measure, and missing-access-metadata fail-closed case. (`review-round-1.md`, “Non-vacuity” item 5)

These remain unexecuted candidate fixtures; no result exists. (`synthesis-round-2.md`, “Fixture boundary”)

### Semantic experiments: blocked or `not_evaluable`

Definition-closure completeness and the missing-bridge oracle are `not_evaluable` until OPEN-001 defines the participating relation kinds and termination rule. Selector-lock sufficiency and the required-edge oracle are `not_evaluable` until OPEN-002 defines minimum edge closure, exclusions, and missing/ambiguous outcomes. General Necessary Context Basis sufficiency and all dependent retrieval-sufficiency and compaction metrics are `not_evaluable` until both predecessors are resolved. (`review-round-1.md`, “Precedent and ownership” item 3; `synthesis-round-2.md`, “Fixture boundary”)

The proposed 120-turn compaction corpus, warm/cold comparison, selected-versus-unrelated drift checks, multi-agent conflict fixture, and context-rot measurements remain candidate designs only. They must not be reported as ready semantic validation, and none may establish general completeness from a hand-authored dependency set. (`research.md`, first memo §7; second memo §8; `review-round-1.md`, “Non-vacuity” item 6; `synthesis-round-2.md`, “Fixture boundary”)

No fixture has run. There is no measured latency, token saving, fidelity, consistency, isolation, leakage, context-rot resistance, warm/cold equivalence, conformance, implementation, or production-readiness result. (`synthesis-round-2.md`, “Fixture boundary” and “Typed outcome matrix”; `evidence-closure.md`, “Writer obligations”)

## Typed disposition matrix

| Item | State | Basis |
|---|---|---|
| Paper hierarchy, lifecycle, access, visibility, provenance, scope, anticipation, and compaction vocabulary | `candidate` | Useful `paper_position`; no local witness. (`evidence-closure.md`, “Claim closure matrix”) |
| Local request → preflight → closure → lock → basis → view → strategy invariant | `candidate` | `local_owned_candidate`, not adopted capability. (`research.md`, Tarski memo §2; `evidence-closure.md`, “Claim closure matrix”) |
| Operation taxonomy, layer distinctions, protocol fields, and protected-field sketch | `candidate` | `integration_inference`, `local_witness=none`. (`synthesis-round-2.md`, “Provenance and ownership”) |
| Frozen predecision fixture schema and hand-authored succession plumbing | `candidate` | Unexecuted plumbing design. (`synthesis-round-2.md`, “Fixture boundary”) |
| General definition closure | `not_evaluable` | OPEN-001 unresolved. (`review-round-1.md`, “Precedent and ownership” item 3) |
| General selector-lock sufficiency | `not_evaluable` | OPEN-002 unresolved. (`review-round-1.md`, “Precedent and ownership” item 3) |
| General basis sufficiency and semantic benchmarks | `not_evaluable` | Depend on OPEN-001 and OPEN-002. (`synthesis-round-2.md`, “Fixture boundary”) |
| Python ontology runtime as admission, rejection, blocking, routing, continuation, or authority mechanism | `killed` | Runtime enforcement is suspended and diagnostic only. (`synthesis-round-2.md`, “Full ontology-runtime suspension”) |
| Synap behavior and benchmark scores as ARE evidence | `killed` | Product-reported, configuration-sensitive, and incomplete for ARE obligations. (`research.md`, second memo §§4–6; `synthesis-round-2.md`, “Typed outcome matrix”) |
| Positive latency, savings, fidelity, consistency, isolation, context-rot, warm/cold equivalence, or readiness claims | `killed` until witnessed | No fixture ran and the papers do not supply ARE-grade evidence. (`synthesis-round-2.md`, “Fixture boundary,” “Typed outcome matrix”) |
| Retrieval, cache, provenance, consensus, publication, projection, reasoning, or receipt as route, decision, admission, owner decision, continuation, or effect authority | `killed` | Violates Advice-Not-Permission and the repaired operation boundary. (`research.md`, Tarski memo §§2 and 6; `synthesis-round-2.md`, “Repaired state and operation model”) |
| OPEN-001, OPEN-002, OPEN-003, projection taxonomy, source lifecycle, projection policy, authority/event vocabulary, and thresholds | `owner_decision_required` | Ownership is explicitly split and no reviewer or paper may substitute for the owners. (`synthesis-round-2.md`, “Provenance and ownership,” “Typed outcome matrix”) |

## Reviewer verdict matrix

| Reviewer lane | Round-1 defect focus | Final verdict | What PASS establishes | What PASS does not establish |
|---|---|---|---|---|
| Precedent and ownership | Claim provenance, split ownership, OPEN-003 neutrality, and demotion of closure-dependent claims | `PASS` after bounded repair | Paper claims are classified, product reports are separated, ownership is explicit, and both OPEN-003 alternatives remain open. | Adoption, correctness, semantic completeness, or authority. (`review-round-1.md`, “Precedent and ownership”; `evidence-closure.md`, “Exact upstream package”) |
| Non-vacuity | Frozen fixtures, exact oracles, route cases, causal logs, leakage cases, and demotion of unwitnessed metrics | `PASS` after bounded repair | Unexecuted designs are identified as candidates and blocked semantic claims are typed `not_evaluable`. | Any fixture result, performance number, fidelity, consistency, isolation, or context-rot result. (`review-round-1.md`, “Non-vacuity”; `evidence-closure.md`, “Claim closure matrix”) |
| Definitional and authority separation | Routing-object distinctions, operation boundaries, succession precedence, and ontology-runtime suspension | `PASS` after bounded repair | Retrieval, provenance, projection, reasoning, publication, and diagnostics remain below decision and authority boundaries. | Ontology admission, Product Capability adoption, conformance, continuation, implementation, publication, deployment, or effects. (`review-round-1.md`, “Definitional and authority separation”; `evidence-closure.md`, “Claim closure matrix”) |

All three PASS verdicts establish evidence classification, non-vacuity demotion, and definitional separation only. (`evidence-closure.md`, “Exact upstream package”)

## Next owner decisions

1. **OPEN-001 — definition closure:** ARE and definitions-governance owners must choose the typed relation kinds participating in request-relative traversal and its deterministic termination rule. Until then, closure completeness remains `not_evaluable`. (`research.md`, Tarski memo §§4 and 7; `synthesis-round-2.md`, “Provenance and ownership”)

2. **OPEN-002 — selector sufficiency:** ARE and ontology owners must define minimum required-edge closure, exclusions, and typed outcomes for missing, ambiguous, or conflicting selected dependencies. Until then, selector-lock and general-basis sufficiency remain `not_evaluable`. (`research.md`, Tarski memo §§4 and 7; `synthesis-round-2.md`, “Provenance and ownership”)

3. **OPEN-003 — view identity:** Codex integration and Context owners must choose retained identity plus per-turn reuse receipt or per-turn successor views, including equality, currentness, predecessor, and cost semantics. (`synthesis-round-2.md`, “Invalidation and succession”)

4. **Projection taxonomy:** The ARE product owner must accept, revise, or reject distinct types for source record, selected dependency set, basis, projection, bound view, local cache entry, shared reusable projection, speculative candidate, and provenance receipt. (`research.md`, Tarski memo §7; `synthesis-round-2.md`, “Provenance and ownership”)

5. **Source lifecycle:** Source and Context owners must define current, superseded, conflicting, retired, retention, tombstone, and deletion-evidence semantics; compaction cannot supply these implicitly. (`research.md`, second explorer memo §2; `synthesis-round-2.md`, “Provenance and ownership”)

6. **Route-specific projection policy:** Each route owner must define its allowed transformations and protected fields within the adopted projection taxonomy. (`synthesis-round-2.md`, “Provenance and ownership”)

7. **Authority and event vocabulary:** Governance must define creation, proposal, publication, acceptance, supersession, owner decision, continuation, and effect events without collapsing visibility into authority. (`research.md`, first explorer memo §§4 and 6; `synthesis-round-2.md`, “Provenance and ownership”)

8. **Experiment contract:** The experiment owner must freeze corpora, mutations, machine oracles, tokenizer/accounting rules, repetitions, and thresholds before any result claim. (`review-round-1.md`, “Non-vacuity”; `synthesis-round-2.md`, “Fixture boundary”)

Only after OPEN-001 and OPEN-002 are resolved can an owning Product Capability be proposed under the repository construction invariant; this findings candidate does not authorize that successor. (`research.md`, Tarski memo §7, items 1–2 and 12; `evidence-closure.md`, “Closure result”)

## Claim ceiling

This document is a bounded findings candidate produced from the exact evidence package recorded in `evidence-closure.md`. It reports paper positions, product-reported evidence, local candidate definitions, integration inferences, reviewer dispositions, blockers, and owner decisions; `authority_effect=none`. (`evidence-closure.md`, “Evidence contract,” “Closure result”; `strategy-inventory-packet.json`, `authority_effect` and `claim_ceiling`)

It does **not** endorse either paper or Synap; validate reported benchmarks; establish definition closure, selector-lock sufficiency, or general Context Basis sufficiency; promote a definition; admit `CA2-ARE-BUSINESS-ONTOLOGY`; restore Python ontology-runtime enforcement; adopt a Product Capability; select a runtime or implementation design; authorize DomainSpec v2 construction; establish conformance; register or execute a successor dispatch; authorize an agent; publish, release, deploy, or create an external effect. No fixture ran, and no positive performance, fidelity, consistency, isolation, context-rot, warm/cold equivalence, production-readiness, or implementation claim exists. (`synthesis-round-2.md`, “Full ontology-runtime suspension,” “Fixture boundary,” and “Typed outcome matrix”; `strategy-inventory-packet.json`, `claim_ceiling`; `evidence-closure.md`, “Writer obligations”)
