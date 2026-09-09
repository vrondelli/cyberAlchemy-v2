# Explorer returns

The following three memos are preserved verbatim from the independently bounded explorer lanes of dispatch `2026-09-01-are-context-basis-paper-integration`.

---

# Research memo — Multi-Agent Memory Architecture for the ARE Context Basis

**Dispatch:** `2026-09-01-are-context-basis-paper-integration`, explorer 0  
**Source:** Yu et al., *Multi-Agent Memory from a Computer Architecture Perspective: Visions and Challenges Ahead*, arXiv:2603.10062v2, 30 March 2026.  
**Evidence ceiling:** Research evidence only. This paper is a position paper, not an implemented or experimentally evaluated protocol. No repository context was read, so the ARE mappings below are structural inferences from the supplied concept names, not verified product-fit or authority claims.  
**Source expansion:** None. No primary source cited by the paper was needed to characterize the paper’s own proposals.

## 1. Problem and proposed model

**Paper statement.** Multi-agent systems face growing semantic-context complexity: long histories, multiple modalities, structured traces, customized environments, and execution state. The paper therefore reframes context as a “dynamic memory system” with bandwidth, caching, and coherence constraints, rather than as a static prompt. Its motivating claim is that agent performance and reliability increasingly depend on data movement and consistency, not just model compute. ([§1, paragraphs 1–2](https://arxiv.org/html/2603.10062v2#S1.p1), [§2, paragraphs 1–3](https://arxiv.org/html/2603.10062v2#S2.p1))

**Paper statement.** It distinguishes two prototypes:

- **Shared memory:** every agent accesses a common pool, such as a shared vector store or document database. Reuse is easy, but uncoordinated agents may overwrite one another, read stale information, or rely on inconsistent versions.
- **Distributed memory:** each agent owns local memory and synchronizes selectively. This improves isolation and scalability, but divergence is likely unless synchronization is explicit.
- The practical middle ground is **local working memory plus selectively shared artifacts**. ([§3, paragraphs 1–2](https://arxiv.org/html/2603.10062v2#S3.p1), [Figure 1](https://arxiv.org/html/2603.10062v2#S1.F1))

**Inference for ARE.** The hybrid model is the strongest candidate: route-owned/local reasoning state should remain isolated, while artifacts intended to affect other routes should cross a protocol boundary as explicit, immutable, provenance-bearing objects. A single ambient shared context would make ownership and staleness harder to determine; wholly private route memory would make cross-route closure expensive and divergence difficult to detect.

## 2. I/O, cache, and memory hierarchy

**Paper statement.** The proposed hierarchy has three layers:

1. **Agent I/O:** interfaces ingesting and emitting audio, documents, images, and network calls.
2. **Agent cache:** fast, capacity-limited material for immediate reasoning, including compressed context, recent tool calls, KV caches, and embeddings.
3. **Agent memory:** larger, slower, persistent storage such as full dialogue histories, vector databases, graph databases, and document stores.

The architectural principle is that reasoning degrades if relevant information remains in the wrong layer or is never loaded; the authors characterize performance as an end-to-end data-movement problem. ([§4, paragraphs 1–3](https://arxiv.org/html/2603.10062v2#S4.p1), [Figure 2](https://arxiv.org/html/2603.10062v2#S3.F2))

**Inference for ARE.** A useful translation is:

- **I/O = evidence ingress/egress:** exact source observations, tool results, user decisions, and emitted receipts.
- **Cache = ContextWindowView:** a bounded, task-shaped projection used in the present reasoning turn.
- **Memory = ContextBasis:** durable source artifacts, definitions, ontology records, decisions, and provenance.

The cache should be treated as a derived view, never as the canonical basis. Its derivation manifest must make omissions, compression, versions, and freshness visible. Promotion from I/O into persistent memory is a governed operation; merely appearing in a tool result or context window should not make content durable, accepted, or authoritative.

## 3. Protocol gaps

**Paper statement.** Connectivity or context-I/O protocols are necessary but insufficient. The authors identify two missing protocol classes:

- **Cache sharing:** no principled protocol governs how one agent’s cached artifact is transformed and reused by another.
- **Memory access:** permissions, scope, and access granularity remain under-specified even where frameworks share state. The open questions include who may read another agent’s long-term memory, whether access is read-only or read-write, and whether the unit is a document, chunk, key-value item, or trace segment. ([§5, paragraphs 1–3](https://arxiv.org/html/2603.10062v2#S5.p1), [Figure 2](https://arxiv.org/html/2603.10062v2#S3.F2))

**Inference for ARE.** “Share this context” is too weak a protocol operation. It needs to distinguish at least:

- sharing an immutable source artifact;
- sharing a lossy projection;
- delegating read access to owned memory;
- requesting a fresh projection;
- proposing a write;
- accepting a write into the canonical basis.

A receiver also needs enough metadata to decide whether reuse is valid for its route and selector set. Cache reuse without a derivation contract risks transferring another agent’s unstated omissions and assumptions.

## 4. Visibility, ordering, and conflicts

**Paper statement.** Hardware consistency models specify when operations become visible and in what order concurrent writes may be observed. The paper says no equivalent formalism yet exists for agent memory. In multi-agent systems, it divides consistency into:

- **Update-time visibility and ordering:** when one agent’s writes become observable to others and how concurrent writes are ordered.
- **Read-time conflict resolution:** how an agent reconciles stale or conflicting artifacts created by evolving versions and concurrent revision.

The problem is harder than hardware consistency because artifacts are semantically heterogeneous, dependencies are often implicit, and conflicts may be semantic and coupled to external environment state. The paper says there is currently no formal definition of multi-agent memory consistency and no practical framework for detecting or classifying violations. ([§6, paragraphs 1–4](https://arxiv.org/html/2603.10062v2#S6.p1), [Figure 3](https://arxiv.org/html/2603.10062v2#S5.F3))

**Inference for ARE.** A defensible first model is not “all agents immediately see the latest value.” It is **snapshot-visible, dependency-declared consistency**:

- every task reads a named immutable basis snapshot;
- every shared artifact identifies its producer, parent snapshot, exact dependencies, and digest;
- visibility occurs only through an explicit publication event;
- a consumer either pins the artifact’s dependency versions or reports a stale/conflict condition;
- conflicting semantic writes are preserved as candidates and routed to an owner-defined resolution rule rather than automatically overwritten.

This gives a testable happens-before relation without pretending that semantic conflicts can be resolved like byte writes.

## 5. Candidate mappings to ARE concepts

| ARE concept | Candidate disposition | Mechanism and boundary |
|---|---|---|
| **ObviousRoute** | **Adapt / test** | Use route metadata to determine which ContextBasis partitions and projections should be loaded into the cache. Test whether route-scoped prefetch reduces irrelevant context without hiding required dependencies. **Do not adopt** cache locality or retrieval frequency as routing authority; popularity is not objective ownership. |
| **DefinitionClosure** | **Adopt / test** | Require an artifact to declare exact definition dependencies and versions; detect when a cached view lacks a transitive dependency or mixes epochs. Test closure completeness under concurrent definition updates. The paper motivates explicit dependency handling but does not supply a closure algorithm. |
| **OntologySelectorLock** | **Adapt** | Treat a selected ontology record set as a pinned snapshot or lease-like read set, recording selector identity plus record digests. Invalidate or mark the view non-evaluable when a selected dependency changes. **Reject** a global “latest ontology is coherent” assumption: unrelated drift and semantic admission cannot be modeled as ordinary cache coherence. |
| **ContextBasis** | **Adopt as a candidate architecture** | Model it as durable, versioned memory containing canonical source artifacts and provenance, with explicit visibility events and conflict-preserving writes. The paper supports persistent memory as a layer, but not ARE’s authority semantics. |
| **ContextWindowView** | **Adapt** | Model it as a cache projection derived from one ContextBasis snapshot. Include a derivation manifest, selected dependencies, omissions/compression description, freshness condition, and intended route/task. Never treat view presence as canonicality or acceptance. |
| **RouteOwnedStrategy** | **Adopt / adapt** | Follow the hybrid pattern: local strategy state is owned by its route; only explicit artifacts cross route boundaries. Other routes receive read-only shared candidates or submit proposed changes through the owner’s write path. Test whether ownership plus selective sharing prevents lost updates and hidden strategy divergence. |

## 6. Candidate protocol fields

The following is an **inferred protocol sketch**, not specified by the paper:

```yaml
artifact_id: immutable logical identifier
artifact_version: monotonic or content-addressed version
content_digest: digest of exact shared bytes
artifact_kind: source | definition | ontology_record | plan | evidence | trace | projection
memory_layer: io | cache | persistent
producer_agent_id: creating agent
owner_route_id: route controlling canonical mutation
basis_snapshot_id: immutable ContextBasis snapshot used by producer
parent_artifact_refs: causal predecessor versions
dependency_refs:
  - selector_or_artifact_id
  - required_version_or_digest
derivation:
  kind: exact | filtered | summarized | transformed
  transform_id: named transformation
  omitted_scope: explicit exclusions or unknown
access:
  readers: bounded principals/routes
  writers: bounded principals/routes
  mode: read_only | propose_write | canonical_write
visibility:
  state: local | proposed | published | superseded
  publish_event_id: explicit visibility event
  visible_after: logical epoch or causal event
ordering:
  producer_sequence: per-producer monotonic sequence
  happens_after: causal event references
freshness:
  valid_until_event: invalidating dependency/event condition
  checked_at_snapshot: snapshot against which freshness was evaluated
conflict:
  class: none | stale_dependency | concurrent_write | semantic_disagreement | environment_drift
  competing_refs: preserved conflicting artifacts
  resolution_policy: reject | owner_review | merge_function | recompute
claim_status: candidate | validated | accepted
```

Critical separation: `visibility.state=published` means other agents may observe the artifact; it must not imply `claim_status=accepted`. Likewise, `canonical_write` permission does not itself establish that a particular write is valid.

## 7. Minimal multi-agent consistency fixture

**Fixture goal:** detect stale dependency use and concurrent semantic conflict without requiring a complete formal consistency model.

**Initial state**

- ContextBasis snapshot `B0`.
- Definition `D@v1`, digest `d1`, value: “eligible if score ≥ 70.”
- Explorer A and Explorer B both receive ContextWindowViews derived from `B0`, explicitly depending on `D@v1`.
- Owner route O is the only canonical writer for `D`.

**Interleaving**

1. A produces `Result-A`, using `D@v1`, and publishes it with `basis_snapshot_id=B0`, dependency `D@v1`, sequence `A:1`.
2. O publishes candidate `D@v2`, digest `d2`, changing the threshold to 80; its visibility event is `E2`.
3. B, whose view still pins `D@v1`, produces `Result-B` after observing `E2` but without refreshing.
4. Independently, A and B propose incompatible explanations of the threshold change, `Explanation-A` and `Explanation-B`, with the same parent `D@v1`; neither owns canonical definition mutation.

**Expected checks**

- `Result-A` remains reproducible against `B0`; it is not silently rewritten.
- `Result-B` is classified `stale_dependency` because its execution happens after visibility of `E2` while it claims the invalidated dependency.
- The two explanations are classified `semantic_disagreement`, preserved as competing candidates, and not last-writer-wins merged.
- Only O may resolve or supersede the definition; publication of `D@v2` still does not imply acceptance unless a separate acceptance event exists.
- Re-running from the same snapshot and manifests must reproduce the same classifications.

This fixture tests visibility, causal ordering, selector invalidation, ownership, and conflict preservation in one small graph. It does not test distributed failure, privacy, lossy-summary equivalence, or external-state races.

## 8. Assumptions, limitations, and analogy breakpoints

**Paper-supported limitations**

- The paper presents a vision and challenge taxonomy, not a formal protocol.
- It offers no implementation, benchmark, experimental comparison, or violation detector.
- It explicitly states that agent consistency is not formally defined and that dependencies are commonly implicit. ([§6, paragraphs 3–4](https://arxiv.org/html/2603.10062v2#S6.p3))
- Figures 1–3 are conceptual architecture illustrations/comparisons, not measured results. ([Figure 1](https://arxiv.org/html/2603.10062v2#S1.F1), [Figure 2](https://arxiv.org/html/2603.10062v2#S3.F2), [Figure 3](https://arxiv.org/html/2603.10062v2#S5.F3))

**Inferred analogy breakpoints**

1. **Semantic objects are not bytes.** Two artifacts may differ textually yet agree semantically, or match textually while carrying different provenance and authority.
2. **Freshness is selector-relative.** A changed record matters only if it intersects the consumer’s declared dependency set; global epoch drift is too coarse.
3. **LLM reads are partial and generative.** Loading the same memory does not guarantee the same interpretation or output.
4. **Compression is lossy.** A cache transfer may erase qualifications, negative evidence, or authority boundaries; cache equality cannot be assumed from topical similarity.
5. **Truth, visibility, and authority are distinct.** Hardware coherence asks which value is observed. An ARE-style system must also ask whether that value is evidenced, admitted, owned, and authorized.
6. **Conflicts may require human or owner judgment.** Automatic merge and last-writer-wins policies are unsafe for definitions, ontology records, or strategy.
7. **Environment state is external to memory.** A coherent record can still be obsolete relative to tools, files, or real-world state.
8. **Access control is not only performance isolation.** It may encode confidentiality, protected ownership, and public/private boundaries that cache-coherence analogies do not capture.

## Bottom line

The paper provides a useful vocabulary and decomposition: hybrid local/shared memory, a ContextBasis-like persistent layer, a ContextWindowView-like cache, explicit access/cache-transfer protocols, and separate update-time versus read-time consistency problems. The most promising ARE research direction is an immutable-snapshot, declared-dependency protocol with route-owned writes, explicit publication events, and conflict-preserving reads.

The paper does **not** establish that this architecture works, define semantic consistency, validate the proposed fields, or authorize adoption. The appropriate next evidence step is the minimal fixture above, followed by adversarial tests for lossy projections, hidden dependencies, owner conflicts, and environment drift.

---

# Research memo: Agentic Context Management as evidence for the ARE Context Basis

**Explorer:** Ahrens, Sönke  
**Source boundary:** Dadhich, *Agentic Context Management: Solving Agent Memory and Cost by Treating Them as Lifecycle and Architecture Problems*, arXiv:2607.21503v1, 23 July 2026. The paper-linked evaluation repositories were inspected only to verify reproducibility claims.  
**Authority ceiling:** Research evidence only. This memo does not admit `CA2-ARE-BUSINESS-ONTOLOGY`, endorse Maximem Synap, alter repository state, or authorize implementation.

## Executive finding

**Paper statement:** The paper’s strongest contribution is a useful category model: agent context is not merely stored and retrieved; it passes through a coupled lifecycle of **architecting, ingesting, scoping, anticipating, and compacting & consolidation**, operating across organizational scopes. This is a better conceptual basis for ARE than an undifferentiated “memory” abstraction because it separates the durable context basis from the bounded view assembled for one turn. [§2](https://arxiv.org/html/2607.21503v1#S2)

**Inference for ARE:** Adopt the lifecycle distinction and the separation between durable context and turn-local context. Adapt its scoping, provenance, and compaction ideas to ARE’s stricter requirements. Do not adopt the paper’s claims of “lossless” validated compaction as proven: its validation mechanism is proprietary and its public evaluation measures conversational recall, not preservation of exact definitions, selectors, constraints, exclusions, conflicts, or authority posture.

The paper supports a testable direction, not an implementation choice.

## 1. Category claims: the five ACM primitives

These are claims about the proposed **Agentic Context Management category**, distinct from the Maximem Synap product claims below.

1. **Architecting** decides, before ingestion, which categories matter, their structure, stores, retention, retrieval, and compaction behavior. The paper argues that this architecture must be use-case-specific rather than a universal memory schema. [§2](https://arxiv.org/html/2607.21503v1#S2), [§5](https://arxiv.org/html/2607.21503v1#S5)

2. **Ingesting** transforms raw conversations, documents, tool calls, and responses into structured memories, including entities, relations, and temporal information. The paper’s bottleneck claim is that later answer quality cannot exceed extraction quality: lost detail cannot be recovered by better retrieval. [§2](https://arxiv.org/html/2607.21503v1#S2), [§3.3](https://arxiv.org/html/2607.21503v1#S3.SS3)

3. **Scoping** decides which retained information belongs to which future context and enforces isolation. The proposed hierarchy is narrowest-first: **user → customer organization → client/platform operator**, with a separate global-knowledge layer for shared public identities. [§2, Figure 1](https://arxiv.org/html/2607.21503v1#S2)

4. **Anticipating** predicts what context will be needed next and prepares it before an explicit request. It is distinguished from retrieval: retrieval asks what is relevant now; anticipation asks what is likely to become relevant next. [§2](https://arxiv.org/html/2607.21503v1#S2)

5. **Compacting & consolidation** reduces relevant context to a usable budget while retaining what downstream reasoning needs. The paper insists that compaction should be verified, because silent loss can produce confident but incorrect answers. [§2](https://arxiv.org/html/2607.21503v1#S2), [§3.2](https://arxiv.org/html/2607.21503v1#S3.SS2)

**Paper statement:** The primitives are coupled: the architecture determines what ingestion extracts, what scope permits, what anticipation prepares, and what compaction may abstract. A system addressing only one primitive remains a memory tool; coherent coverage across all five and all scopes constitutes a context-management platform. [§2](https://arxiv.org/html/2607.21503v1#S2)

**Inference:** The valuable ARE unit is therefore not an isolated “memory item,” but a governed lifecycle contract connecting source capture, durable structured basis, selection, bounded projection, and retirement.

## 2. Storage, relevance, provenance, and forgetting

### Storage choices

**Paper statement:** The category argument favors storage matched to data type rather than a single vector database. Synap specifically reports a polyglot stack:

- relational storage as source of truth and for short-term context;
- graph storage for entity–relationship structure;
- vector storage for semantic retrieval;
- object storage for original content and configurations;
- time-series storage for usage telemetry;
- in-memory storage for queues, caching, and coordination.

The stores are tenant-namespaced; locally hosted sentence-transformer embeddings are the default. [§4](https://arxiv.org/html/2607.21503v1#S4)

**Inference:** ARE should adopt the separation of roles, not this engine topology. Exact definitions and authority records need canonical, digestible source bytes; semantic/vector indexes can only be derived retrieval aids. A similarity index cannot become the authority-bearing source of truth.

### Relevance and anticipation

**Paper statement:** Retrieval should combine lexical, semantic, and relational signals because each has different failure regimes. Its motivating study finds vector retrieval strongest for natural-language-to-code, keyword retrieval strongest for specific scientific terms, and neither sufficient for multi-document reasoning. The study uses five 10,000-document corpora and 1,000 queries per corpus, but is explicitly motivational: one operator, one engine of each kind, no chunking, small scale, and single-gold-document scoring. [§3.3](https://arxiv.org/html/2607.21503v1#S3.SS3), [Appendix B, Tables B1–B2](https://arxiv.org/html/2607.21503v1#A2)

**Inference:** Relevance for ARE cannot mean similarity alone. It should mean dependency sufficiency: all records required to evaluate a route, definition, selector, exclusion, conflict, or authority boundary must be present. Anticipation may prefetch likely dependencies, but a speculative hit must not select a route, relax a lock, or grant authority.

### Provenance

**Paper statement:** Synap returns provenance-tagged retrieval items, retains original content in object storage, and uses relational storage as source of truth. Graph structure is also presented as useful for relational provenance. [§4](https://arxiv.org/html/2607.21503v1#S4)

**Inference:** This is directionally aligned but underspecified for ARE. The paper gives no provenance schema, immutable source digest, transformation chain, selector identity, or rule for tracing a compacted assertion back to exact source bytes. ARE needs provenance at the field or claim level, including whether content is verbatim, derived, superseded, conflicting, or merely anticipated.

### Compaction, consolidation, and forgetting

**Paper statement:** Synap reportedly validates whether key information remains recoverable after compaction, emits a score and compression ratio, and retries less aggressively below a threshold. Compaction is category-aware: architecture determines what remains verbatim and what may be abstracted. Repeated compaction operates on the already-compacted state plus recent turns. [§4](https://arxiv.org/html/2607.21503v1#S4), [§5](https://arxiv.org/html/2607.21503v1#S5)

The abstract includes forgetting stale information while maintaining provenance, and related work treats forgetting and retention as lifecycle concerns. However, **forgetting is not a separate primitive**, and the paper specifies no Synap forgetting algorithm, tombstone model, supersession contract, deletion proof, or evaluation. [Abstract](https://arxiv.org/html/2607.21503v1), [§7](https://arxiv.org/html/2607.21503v1#S7)

**Inference:** ARE should separate three operations that the paper partly blends:

- **compaction:** reduce the active view without changing canonical truth;
- **consolidation:** derive a new structured assertion while retaining lineage;
- **forgetting/retirement:** remove or make ineligible material under an explicit retention or supersession rule.

Compaction must never silently implement forgetting.

## 3. Cost model

**Paper statement:** If each turn adds \(t\) tokens and the full history is resent, cumulative input is:

\[
C_{\mathrm{append}}=t\frac{n(n+1)}2=O(n^2).
\]

A fixed context budget \(W\) yields \(C_{\mathrm{bounded}}=nW=O(n)\). Periodic validated compaction every \(p\) turns, costing \(cW\), gives:

\[
NW(1+c/p),
\]

still linear in the number of turns. The paper’s illustrative parameters \(t=500\), \(W=4{,}000\), \(p=8\), \(c=2\) imply approximately 80%, 90%, and 96% savings against full append at 100, 200, and 500 turns. These are analytic illustrations, not measurements; caching discounts and actual variable turn sizes are omitted. [§3.1](https://arxiv.org/html/2607.21503v1#S3.SS1), [§5](https://arxiv.org/html/2607.21503v1#S5), [Appendix A](https://arxiv.org/html/2607.21503v1#A1)

**Inference:** The asymptotic argument is sound under its assumptions, but “linear cost with preserved fidelity” remains a target, not an established result. Verification expense, failed retries, retrieval expansion, provenance payloads, and pinned exact-byte material can materially change constants.

## 4. Maximem Synap claims, kept separate

The product-specific statements are:

- bespoke per-agent memory architecture is generated by an LLM with multi-agent checks and then activated;
- ingestion is asynchronous and queue-backed;
- entity resolution uses a confidence-ordered cascade and ambiguous matches may be reviewed;
- tenant isolation is enforced at storage and query layers, using credential-derived identity;
- retrieval supports low-latency and higher-accuracy modes, with vector-guided graph traversal;
- anticipatory retrieval reportedly achieves a consistent 60%+ client hit rate;
- compaction returns a validation score and retries when necessary.

These appear in [§4](https://arxiv.org/html/2607.21503v1#S4) and [§5](https://arxiv.org/html/2607.21503v1#S5). The paper expressly withholds the internals of graph traversal, anticipation, and compaction validation as proprietary. Consequently, the 60%+ anticipation rate and the information-loss validation cannot be independently assessed from this paper.

## 5. Evaluation and reproducibility

**Paper statement:** Synap reports:

- **LongMemEval:** 92.0%, 460/500, all six categories;
- **LoCoMo:** 93.2%, categories 1–4, excluding adversarial category 5.

Both answer generation and binary LLM judging use `gpt-5-mini`. LongMemEval’s weakest category is multi-session reasoning at 75.2% (100/133); single-session-assistant is 87.5% (49/56). [§6.1, Table 2](https://arxiv.org/html/2607.21503v1#S6.SS1), [§6.2, Tables 2–3](https://arxiv.org/html/2607.21503v1#S6.SS2)

**Paper-stated limits:** These benchmarks test conversational recall and reasoning over recalled material. They do not test production latency, token efficiency, context-rot resistance, organizational isolation, anticipation, exact provenance, compaction fidelity, or forgetting. Cross-vendor numbers are self-reported and methodologically non-comparable. Per-run artifacts are available only on request. [§6.3](https://arxiv.org/html/2607.21503v1#S6.SS3)

**Repository verification:** The linked [results repository](https://github.com/maximem-ai/eval_benchmark_runs_output) exposes methodology and category aggregates and confirms that generated answers, retrieved context, and judge verdicts are available on request rather than committed publicly. Its [methodology](https://github.com/maximem-ai/eval_benchmark_runs_output/blob/main/METHODOLOGY.md) specifies models, dataset scopes, and rerun steps. The linked [evaluation harness](https://github.com/maximem-ai/memory_and_context_eval_harness) exposes a five-phase ingest/search/answer/evaluate/report pipeline and provider adapters.

**Inference:** Reproducibility is partial. A third party can inspect and run the harness, but reproducing the exact Synap result requires credentials and access to a proprietary changing service. Public per-run outputs are absent, and Appendix C’s broad statement that raw per-question outputs are released conflicts with §6.3 and the repository’s “available on request” wording. [Appendix C](https://arxiv.org/html/2607.21503v1#A3)

Using the same model as answerer and judge also does not isolate judge bias. The results support conversational-memory capability under one configuration, not the full five-primitive category or ARE-grade compaction.

## 6. Privacy

**Paper statement:** Synap claims storage- and query-layer tenant isolation, customer-controlled retention guardrails, and per-agent extraction-time handling of personally identifying information. The paper uses public benchmark datasets and reports no customer data. [Appendix D](https://arxiv.org/html/2607.21503v1#A4)

**Inference:** This is a policy sketch, not privacy evidence. Missing are a threat model, encryption and key boundaries, deletion verification, auditability, data-residency behavior, model-provider exposure, speculative-prefetch leakage analysis, and tests of cross-scope isolation. Anticipation deserves particular scrutiny because it materializes context before demonstrated need.

## 7. Provisional ARE mechanism mapping

These are conceptual candidates based only on the named mechanisms, not contract-verified repository mappings.

| ARE mechanism | Candidate | Paper-derived mechanism | Necessary ARE adaptation |
|---|---|---|---|
| **ObviousRoute** | **Adapt** | Scope-aware, narrowest-first selection plus anticipated preparation | Route eligibility must be explicit and deterministic. Anticipation may warm dependencies but cannot choose or widen a route. |
| **DefinitionClosure** | **Adopt + test** | Structured ingestion and reasoning-sufficiency: answer quality is capped by missing bridge material | Define closure as exact dependency completeness, with pinned verbatim definitions and collect-all missing-dependency reporting. |
| **OntologySelectorLock** | **Adapt; reject best-effort resolution for locked selectors** | Canonical entity resolution, relational retrieval, provenance tags | Exact selectors need immutable identity and digest binding. Synap’s non-blocking best-effort ambiguity policy is unsuitable for authority-bearing references. |
| **ContextBasis** | **Adopt** | Durable structured context across lifecycle stages, stores, scopes, and time | Basis must retain canonical source bytes, provenance, supersession, conflicts, exclusions, and authority posture independently of any window budget. |
| **ContextWindowView** | **Adopt + test** | Token-budgeted assembly from retrieved items, compacted history, and recent verbatim turns | Treat the view as a derived projection. Pin exact authority-sensitive fields and expose omissions plus lineage. |
| **RouteOwnedStrategy** | **Adapt; reject autonomous activation** | Per-agent architecture configures extraction, retention, retrieval, and compaction | Strategy should be route-owner-authored or approved, immutable for an evaluation epoch, and unable to self-promote through LLM-generated architecture. |

## 8. Proposed latency–token–fidelity fixture

**Fixture name:** `ARE-CONTEXT-COMPACTION-LTF-001`

Construct a 120-turn synthetic work history containing:

- one canonical definition whose punctuation and normative modal must remain exact;
- one ontology selector with exact ID, path, and digest;
- three constraints, including one negative constraint;
- two explicit exclusions;
- one unresolved conflict between equally scoped records;
- one superseded record plus its replacement;
- an authority posture of `candidate / authority_effect=none`;
- unrelated high-similarity distractors, including a sentence that falsely says the candidate was accepted.

At every eight turns, compact the bounded state plus recent turns. Repeat for ten compaction generations. Compare:

1. full append;
2. crude free-form summary;
3. typed, category-aware compaction with pinned exact fields and provenance.

Measure:

- **Latency:** retrieval, compaction, validation, and total p50/p95 per turn;
- **Tokens:** input, output, validation, retry, and cumulative totals; compression ratio;
- **Exact fidelity:** byte equality for definition, selector, digest, exclusions, and authority posture;
- **Structural fidelity:** all constraint and conflict edges preserved; superseded material cannot appear current;
- **Reasoning sufficiency:** queries requiring definition + selector + constraint + conflict must retrieve the complete dependency set;
- **Authority safety:** zero transformations from candidate/no-effect to accepted/admitted/authorized;
- **Provenance:** every compacted field resolves to source turn, source digest, and transformation status.

Acceptance should require **100% exact-field preservation, 100% dependency closure, zero authority inflation, zero conflict deletion, and deterministic repeated output**. A semantic similarity score alone is insufficient. On any exact-field failure, the compactor must preserve a larger verbatim slice or declare the view not safely compactable.

## Bottom line

The paper offers a strong lifecycle vocabulary and a useful separation between durable context management and bounded context-window assembly. Its best contribution to ARE is the insistence that architecture, ingestion, scope, anticipation, and compaction form one coupled system.

Its evidence does **not** yet establish that compaction can preserve governance-sensitive context. ARE should therefore adopt the lifecycle model, adapt scope and provenance to exact dependency/authority semantics, test typed compaction under repeated generations, and reject autonomous architecture activation or best-effort selector resolution wherever authority-bearing material is involved.

---

# Tarski explorer memo — Context Basis and paper attachment analysis

**Dispatch:** `2026-09-01-are-context-basis-paper-integration`  
**Route:** `CA2-ROUTE-DELEGATE`  
**Ontology dependency:** `ontology_id=CA2-ARE-BUSINESS-ONTOLOGY`; mapped intent: exact local Context Basis and paper-attachment analysis.  
**Result posture:** research evidence only. The suspended Python ontology runtime is diagnostic and non-authorizing. Nothing here promotes definitions, admits ontology, adopts a Product Capability, selects a runtime, authorizes DomainSpec design, or permits implementation or effects.

## 1. Evidence basis

The local source of the candidate contract is:

- `cyberAlchemy-v2/development/agent-reasoning-engine/CONTEXT-BASIS-DEFINITION-PACK.v1-candidate.json`
  - selectors: `concepts`, `workflow`, `ontology_dependency_lock_candidate`, `relationships`, `open_questions_and_conflicts`, `blocked_actions`, `claim_ceiling`
- `cyberAlchemy-v2/development/agent-reasoning-engine/ontology/business-ontology.json`
  - exact selected selectors:
    - `CA2-ARE-CONCEPT-REQUEST-CONTEXT`
    - `CA2-ARE-CONCEPT-CONTEXT-ENVELOPE`
    - `CA2-ARE-WORKFLOW-CONTEXT-FORMATION`
    - `CA2-ARE-WORKFLOW-REQUEST-ROUTING`
    - `CA2-ARE-WORKFLOW-CONTEXT-REFRESH`
    - `CA2-ARE-RULE-CONTEXT-BEFORE-JUDGMENT`
    - `CA2-ARE-RULE-DRIFT-INVALIDATES`
    - `CA2-ARE-RULE-ADVICE-NOT-PERMISSION`
- `cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/CODEX-REQUEST-GOVERNANCE-DEFINITION-PACK.v1-candidate.json`
  - exact concepts: `CodexRequestContext`, `CodexPreflightDecision`, `CodexRouteDirective`, `CodexDecisionGate`, plus `open_questions_and_conflicts`
- `cyberAlchemy-v2/development/agent-reasoning-engine/codex-integration/business-ontology.json`
  - exact selected selectors:
    - `CA2-ARE-CODEX-CONCEPT-REQUEST-CONTEXT`
    - `CA2-ARE-CODEX-CONCEPT-PREFLIGHT-DECISION`
    - `CA2-ARE-CODEX-CONCEPT-ROUTE-DIRECTIVE`
    - `CA2-ARE-CODEX-WORKFLOW-PREFLIGHT`
    - `CA2-ARE-CODEX-RULE-UNKNOWN-FAILS-CLOSED`

External sources:

- [arXiv:2603.10062v2, “Multi-Agent Memory from a Computer Architecture Perspective”](https://arxiv.org/html/2603.10062v2), version dated 30 March 2026.
- [arXiv:2607.21503v1, “Agentic Context Management”](https://arxiv.org/html/2607.21503v1), version dated 23 July 2026.

Both papers are design evidence and analogy sources. The first is explicitly a position paper; the second describes a commercial reference implementation and reports configuration-sensitive benchmark results while acknowledging that latency, token efficiency, and context-rot resistance were not benchmarked. Neither is authority evidence for the ARE contract.

## 2. Reconstructed local invariant chain

The candidate chain is:

1. **Preserve request.** Digest-bind raw request and only the minimal routing context. `CA2-ARE-CONCEPT-REQUEST-CONTEXT` requires objective, effect, target, constraints, and provenance to remain explicit rather than silently inferred.
2. **Route fast.** `CA2-ARE-WORKFLOW-REQUEST-ROUTING` may return one uniquely supported declared route or visible ambiguity. This yields `ObviousRoute` only when exactly one route is supported, no material conflict remains, and selected route dependencies are current.
3. **Close meanings.** `RequestRelativeDefinitionClosure` computes the least request-and-route-relative fixed point of needed definitions. Missing or conflicting meaning blocks strategy formation.
4. **Lock selected ontology dependencies.** `OntologySelectorLock` freezes ontology identities, exact node and required-edge selectors, source digests, selection reasons, exclusions, and a lock digest. Only intersecting drift invalidates reuse.
5. **Create the basis and immutable view.** `NecessaryContextBasis` joins request, route, definition closure, selector lock, authority/effect posture, constraints, gaps, and digest. It emits a consumer/window/source-epoch-bound `ContextWindowView`; changed selected dependencies require a successor view.
6. **Formulate route-owned strategy.** Only the already selected route may create `RouteOwnedStrategy`, and only after the basis is complete and current.
7. **Continue under a separate effect boundary.** The strategy remains non-authorizing. Work starts only inside the route and an independently authorized effect ceiling.

The chain is reinforced by three selected rules:

- `CA2-ARE-RULE-CONTEXT-BEFORE-JUDGMENT`: no semantic judgment is evaluable before its envelope is explicit and frozen.
- `CA2-ARE-RULE-DRIFT-INVALIDATES`: selected-dependency change creates a successor epoch and prevents silent reuse.
- `CA2-ARE-RULE-ADVICE-NOT-PERMISSION`: context, judgment, consensus, validation, and receipts grant no authority.

The Codex boundary is similarly two-stage:

- **Preflight:** `CA2-ARE-CODEX-WORKFLOW-PREFLIGHT` captures the request, verifies provenance, selects one route or exposes ambiguity, and emits a non-authorizing directive before tools.
- **Continuation:** after a bounded result, continuation may be direct only for exactly one admissible, explicitly reversible, non-consequential option. Unknown route, effect, reversibility, owner gate, or selected dependency fails closed. A displayed `CodexDecisionGate` presents a choice but cannot satisfy it.

## 3. Distinctions the papers must not collapse

| Object | Meaning in the candidate contract | Currentness and sharing rule |
|---|---|---|
| **Source memory** | Durable source records, histories, tool traces, definitions, ontology records, and original artifacts from which context may be derived. It remains source truth under its actual owner. | Persistence does not imply relevance, currentness, authority, or permission. |
| **Selected dependency set** | The request-relative definitions, exact ontology node selectors, minimum required edge selectors, source digests, reasons, and exclusions actually needed by one request and route. | Only intersecting drift invalidates the view; ambient drift is diagnostic. |
| **Necessary Context Basis** | The minimum evidence-bearing semantic substrate joining request, route, closure, selector lock, authority/effect posture, constraints, gaps, and deterministic digest. | Complete/current is a precondition for strategy evaluability, not truth or authority. |
| **Context Window View** | Immutable consumer-specific projection of one basis, bound to window identity and source epoch, recording selected records, exclusions, and residue. | Reuse requires unchanged selected dependencies and compatible consumer/purpose; otherwise create a successor. |
| **Agent-local cache** | Fast disposable storage of already derived material, recent traces, precomputed retrieval, or model-serving state. | Cache presence or freshness is insufficient. A hit is usable only if its derivation and basis bindings still validate. |
| **Shared reusable projection** | A transformed, dependency-declared artifact that multiple agents may reuse without sharing their private working state. | Requires access scope, immutable identity, transformation provenance, visibility ordering, current basis/selector digests, and conflict posture. |
| **Provenance receipt** | Evidence joining a derived artifact or Codex action to source identities, digests, decision/basis identity, transformation, consumer, exclusions, and observed ordering. | Proves identity and ordering only; it does not prove semantic sufficiency, correctness, admission, or authorization. |

This separation is the main local correction to the papers’ broad use of “memory” and “context.” A cache is a performance layer; a view is an immutable semantic projection. A shared store is a source substrate; a shared projection is a bounded derivative. A receipt demonstrates derivation; it is not permission.

## 4. Six-concept constraint matrix

| Candidate concept | Local constraints and ontology attachment | Paper attachment | Open question / authority ceiling |
|---|---|---|---|
| **ObviousRoute** | Depends on `CA2-ARE-CONCEPT-REQUEST-CONTEXT`, `CA2-ARE-WORKFLOW-REQUEST-ROUTING`, and Codex preflight selectors. Exactly one declared route, no material contradiction, and current selected route dependencies are required. | 2603’s hierarchy/cache analogy can motivate a low-latency preflight path. 2607’s anticipation can precompute candidate context. Neither can select the route: cached or predicted material stays quarantined until request provenance and route registry checks pass. | No paper mechanism resolves route ambiguity or owner gates. `CA2-ARE-CODEX-RULE-UNKNOWN-FAILS-CLOSED` remains controlling. Authority effect: none. |
| **RequestRelativeDefinitionClosure** | Must contain every definition needed for request, route, targets, effects, constraints, and selected ontology meanings, but not the whole repository. Candidate and canonical postures remain distinct. | 2607’s “retrieval is not sufficiency” directly strengthens the need for closure and bridge-dependency tests. Its ingestion-quality bottleneck supports exact-source retention. 2603’s multi-hop/structured-context framing supports dependency traversal beyond one retrieved hit. | `ARE-CONTEXT-OPEN-001` is stop-required: relation kinds participating in route-specific definition traversal are unresolved. Retrieval scores cannot substitute for closure. |
| **OntologySelectorLock** | Exact ontology IDs, selected nodes, required typed edges, source digests, reasons, exclusions, and lock digest. `CA2-ARE-WORKFLOW-CONTEXT-REFRESH` plus `DRIFT-INVALIDATES` creates successor epochs only for intersecting drift. | 2603 contributes visibility ordering, read/write access, granularity, and read-time conflict resolution. 2607 contributes graph-aware bridge retrieval, scope isolation, temporal validity, and provenance-tagged retrieval. | `ARE-CONTEXT-OPEN-002` is stop-required: the minimum dependency-closed edge rule is unresolved. Graph neighborhood, vector similarity, or shared-store coherence cannot establish selector sufficiency or ontology admission. |
| **NecessaryContextBasis** | Requires definition closure and selector lock; joins request/route digests, authority/effect posture, constraints, gaps, and digest. It corresponds to a frozen `CA2-ARE-CONCEPT-CONTEXT-ENVELOPE`. | 2607’s five lifecycle primitives are a useful decomposition around basis formation: architect schema, ingest faithfully, scope narrowly, quarantine anticipation, compact with validation. 2603 adds hierarchy placement and coherence obligations. | Papers strengthen lifecycle requirements, not basis completeness. A benchmark or retrieved set cannot prove closure. Basis authority effect: none. |
| **ContextWindowView** | Immutable view bound to purpose, consumer, window, source epoch, basis digest, selections, exclusions, and residue. `BASIS emits VIEW`; changed selected dependencies create a successor. | 2603’s local-working-memory plus selectively shared artifacts maps well if sharing produces immutable projections with access and consistency protocols. 2607’s token budgets and validated compaction support bounded views, provided protected semantics are checked mechanically. | `ARE-CONTEXT-OPEN-003` remains: per-turn successor versus unchanged-view reuse. Reuse should be permitted only through an explicit equality/currentness contract, never by cache hit alone. |
| **RouteOwnedStrategy** | Must follow a current view and remain shaped by the selected route’s artifact and authority contract. Codex continuation performs another direct/gate/block assessment after completion. | 2607’s architecture-per-agent idea may inform route-specific projection policy; 2603’s access protocols may inform multi-agent handoff. These are inputs to strategy design, not replacements for the route owner or continuation gate. | Anticipation, consensus, cache coherence, successful compaction, and benchmark performance cannot authorize a successor. Advice is not permission; consequential or unknown continuation gates. |

The candidate relationships remain exact:

- `ObviousRoute precedes NecessaryContextBasis`
- `NecessaryContextBasis requires RequestRelativeDefinitionClosure`
- `NecessaryContextBasis requires OntologySelectorLock`
- `NecessaryContextBasis emits ContextWindowView`
- `ContextWindowView precedes RouteOwnedStrategy`

No additional ontology edge can be asserted as required until `ARE-CONTEXT-OPEN-002` is resolved by the named ARE and ontology owners.

## 5. Candidate paper attachment points

### arXiv:2603.10062v2

**Adopt as research vocabulary:**

- three-layer distinction among I/O, cache, and persistent memory;
- hybrid local/distributed organization;
- explicit memory-access protocol dimensions: permission, scope, read/write posture, and granularity;
- separate update-time visibility/ordering from read-time conflict resolution.

**Adapt into ARE contracts:**

- Map I/O to attributable source acquisition, persistent memory to owner-controlled source records, and cache to disposable derived artifacts.
- Replace generic “coherence” with selector-bound currentness: validity depends on source epoch and locked dependency intersection, not global synchronization.
- Make shared projection transfer explicit: producer basis digest, transformation identity, consumer scope, exclusions, and conflict state.
- Treat semantic conflict as a typed context gap that blocks strategy when material, rather than selecting a winner through last-write-wins.

**Experiment rather than accept:**

- compare local regeneration against shared projection reuse under warm/cold conditions;
- inject concurrent source revisions and measure stale-read detection;
- test access isolation and transformation fidelity;
- measure whether visibility guarantees actually preserve context sufficiency.

### arXiv:2607.21503v1

**Adopt as research vocabulary:**

- context management as a lifecycle rather than store/read;
- extraction quality, retrieval quality, and reasoning sufficiency as separate bottlenecks;
- first-class scope isolation;
- validated compaction;
- explicit evaluation of latency, token efficiency, and context rot in addition to recall.

**Adapt into ARE contracts:**

- “Architecting” becomes route- and consumer-specific projection policy owned by an admitted Product Capability, not autonomous architecture generation.
- “Ingesting” preserves original-source identity and exact protected fields before generating derivatives.
- “Scoping” begins from selected dependency locks, not organizational broadening.
- “Anticipating” may prepare quarantined candidates keyed to predicted request/route/basis inputs, but explicit preflight must rebind them.
- “Compaction” must preserve definitions, selectors, constraints, conflicts, exclusions, authority/effect posture, and provenance—not merely achieve a validation score.

**Experiment rather than accept:**

- compare full append, naïve summary, dependency-preserving compaction, and basis-view reuse;
- measure latency, input tokens, selected-dependency recall, closure sufficiency, irrelevant-context rate, stale reuse, and fail-closed correctness;
- treat the paper’s reported memory scores as configuration-bound external results, not ARE benchmarks.

## 6. Forbidden substitutions

The following substitutions would violate the local contract:

- paper analogy → canonical definition or Product Capability adoption;
- retrieval hit, vector similarity, or graph traversal → definition closure;
- shared-memory coherence → semantic sufficiency;
- cache hit or recent timestamp → selected-dependency currentness;
- agent-local cache → `ContextWindowView`;
- shared store → shared reusable projection;
- compaction score → preservation of authority, conflict, exclusion, or selector semantics;
- speculative prefetch → preflight decision;
- successful route prediction → `CodexRouteDirective`;
- consensus or conflict resolution → owner decision;
- provenance receipt → truth, ontology admission, conformance, or effect permission;
- ontology-runtime diagnostic → route, block, admission, or authority;
- benchmark recall → latency, token efficiency, context-rot resistance, fail-closed behavior, or production readiness;
- a coherent next step → authorized continuation.

## 7. Minimum contract deltas before Product Capability or DomainSpec design

1. **Resolve `ARE-CONTEXT-OPEN-001`.** Declare the allowed typed relation kinds and traversal termination rule for route-relative definition closure. This is a stop-required semantic predecessor.
2. **Resolve `ARE-CONTEXT-OPEN-002`.** Define the minimum required ontology-edge closure, exclusion obligations, and missing/ambiguous-edge outcome. This is also stop-required.
3. **Specify projection kinds.** Add distinct types for source record, selected dependency set, basis, window view, agent-local cache entry, shared reusable projection, speculative candidate, and provenance receipt.
4. **Specify immutable identities.** At minimum: request digest, route-decision digest, definition-closure digest, ontology-lock digest, basis digest, view ID, source epoch, consumer/window identity, transformation ID, and artifact digest.
5. **Define cache admission for reuse.** Require exact basis/lock binding, consumer-purpose compatibility, selected-dependency currentness, access permission, unresolved-conflict absence, and compaction-validation evidence. Cache presence alone must never satisfy the predicate.
6. **Define sharing and consistency protocols.** State scope, read/write posture, granularity, visibility ordering, concurrent-revision handling, conflict classes, invalidation propagation, and immutable-history behavior.
7. **Define speculation quarantine.** Anticipated artifacts need predicted scope, provenance, expiry, and a rule forbidding use until explicit request, route, and dependency rebinding succeeds.
8. **Define protected compaction semantics.** Enumerate fields that must remain exact and define mechanical equivalence checks for definition, selector, constraint, contradiction, exclusion, gap, authority, and effect posture.
9. **Define sufficiency evidence.** A context must cover every declared proof obligation or return typed missing dependencies; relevance-only recall is insufficient.
10. **Resolve or explicitly defer `ARE-CONTEXT-OPEN-003`.** If unchanged-view reuse is allowed, specify equality/currentness and per-turn receipt rules. If every turn creates a successor, specify the cost and identity consequences.
11. **Define the benchmark contract.** Include warm/cold latency, token cost, source and dependency recall, irrelevant-context rate, bridge-dependency sufficiency, compaction fidelity, context-rot resistance, stale-read detection, isolation violations, conflict handling, and fail-closed behavior.
12. **Preserve the D65 and Codex gates.** Only after the semantic predecessors are owner-resolved can an owning Product Capability be proposed; DomainSpec v2 design must then encode these typed distinctions and exact bindings. Paper mechanisms cannot bypass that predecessor chain.

## Conclusion

Both papers materially strengthen the candidate **architecture around** Context Basis, but neither changes its authority model. The strongest integration is:

- use 2603.10062v2 to formalize hierarchy, sharing, access, visibility, invalidation, and conflict contracts;
- use 2607.21503v1 to formalize lifecycle, scope, sufficiency, quarantined anticipation, validated compaction, and multidimensional evaluation;
- retain the local invariant that only an immutable, dependency-closed, selector-bound basis may yield a view, and only the selected route may formulate strategy from that view;
- keep cache state, shared coherence, retrieval output, paper benchmarks, and receipts permanently below routing, admission, owner-decision, continuation, and effect authority.

The immediate blockers before Product Capability or DomainSpec design are not implementation choices. They are the unresolved semantic contracts in `ARE-CONTEXT-OPEN-001` and `ARE-CONTEXT-OPEN-002`, followed by a precise reuse decision for `ARE-CONTEXT-OPEN-003`.
