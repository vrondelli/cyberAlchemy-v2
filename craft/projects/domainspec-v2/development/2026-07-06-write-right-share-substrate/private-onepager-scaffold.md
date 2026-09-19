# The Write-Right Substrate — Private / NDA One-Pager (scaffold)

*INTERNAL. PUBLIC + PRIVATE tiers. Do not copy into public `arcanum/`. The **engine
algorithm stays absent even here** (proprietary; we cite + demonstrate results, we never
publish it). Same claim≤proof discipline as the public sheet. Status: intended, not shipped.*

---

## WHAT IT DOES
Turns author intent into a governed, citable substrate. Two write surfaces feed one
machine: **capture** writes everything (cheap, complete, ungoverned) and **promotion**
writes only the important things (gated, owner-routed, default-deny). Reads are **designed to
be** cheap because the query arrives already-typed and traverses a discrete subgraph. [E1 §1–2, §4]

## THE WRITE→READ SEAM (machine-map shape)
- **Write, ungoverned:** capture takes the full evidence base — needed to promote correctly
  and to keep provenance. Selectivity does *not* exist at this step. [E1 §1]
- **Promote, governed:** a default-deny gate (realized internally as a closed 9-kind
  authority set, CAV2-D49) confers authority on a frozen typed referent. The gate filters on
  *govern*-importance, not recall — recall is already covered by substrate internals
  (utility_score, JEPA relevance, Self-Model density gate), so telling it what to recall is
  redundant. [E1 §2] *(PRIVATE: authority-triage internals, substrate internals.)*
- **The recorded gate = the missing System-5.** cav2 supplies the VSM S5 the underlying
  Living-Archive substrate lacks (strong S2/S4, no S5 — supersession is model-driven, not
  authority-grounded). Content non-deterministically proposed; authority deterministically
  conferred + recorded. [E1 §3; E2 §2] *(PRIVATE: VSM-S5-as-cav2, Living-Archive internal.)*
- **The governed write loop is five line items:** neural extraction · scope-tagging ·
  promotion/governance metadata · provenance · ontology maintenance. This is what "pay at
  write" actually costs. [E1 §3; E2 §1] *(PRIVATE: ingest-loop composition.)*
- **Read = typed-graph traversal** seeded by the already-typed query: comprehension *intended
  to be* pre-paid at ingest, crystallized into typed edges (CQRS / materialized-view); the read
  loop is **designed to need no model inference — latency unbenchmarked, no speed claimed.** [E2 §1]

## TWO ONTOLOGIES (the retained novelty)
- A **governed, hand-typed provenance graph** vs GraphRAG's **LLM-extracted statistical**
  one — *structural attenuation* (navigating declared relations, a clean channel) vs
  *statistical attenuation* (guessing by cosine similarity, a noisy channel); Conant-Ashby
  requisite variety. [E2 §2]
- Plus the **already-typed query seed**: standard RAG embeds the query to find its entry
  node; here the query *is* a node, so the grounding step is **reduced (a margin remains)** and
  traversal is replaced by direct **KG-retrieval traversal (prior art)** over the frozen referent
  — deterministic **within a stable schema epoch** (ontology authored non-deterministically).
  Typed-intent is itself **build-from-owned** (spec-ontology-unification SEED,
  **owned-but-unexecuted**), not proven. [E2 §2]
- Both are **positioning** novelty (how the parts are wired + gated), **not algorithmic**
  novelty. [E2 §3]

## WHY IT MATTERS / MOAT FRAMING (internal)
- **Determinism is a cost-optimization, not a requirement.** It **materially reduces** the
  attestation/provenance surface (direction, not a measured floor) — a genuine efficiency win, not a logical
  necessity; the actual requirement is provenance + a citable referent. Sell "cheaper to
  trust," never "therefore correct." [E1 §3; E2 §1; E3 §1] *(PRIVATE: attestation framing.)*
- **Moat position:** the defensibility is the *combination/wrapper* + attestation +
  governance-data + vertical — **not** any single mechanism, and **not** the engine algorithm
  (out of scope of this corpus and out of scope of this sheet by policy). [E1 residue; E2
  PRIVATE flags] *(PRIVATE: moat stack; engine algorithm absent.)*
- **Prior art we build from (no terminal KILLs):** traversal = GraphRAG/KG-retrieval;
  ingest-relocation = CQRS/materialized-view/ETL; gate = VSM-S5 / symbolic-IR-auditability.
  [E2 §3]

## TRADE-OFFS
- **Determinism ≠ correctness.** A deterministic read of a bad/stale write fails *silent* —
  confident-wrong, no variance to signal doubt; stochastic pipelines fail loud. Determinism
  can remove an error-detection surface. [E2 §2; E3 §3]
- **Unbounded ontology-epoch treadmill.** Full-corpus re-ingestion recurs at every ontology
  epoch, with **no sampling/utility bound named anywhere** — paid per-epoch, not once. A
  bound needs to be owned before pricing. [E3 §2]
- **"Trivial" overclaims.** Cheap + high-signal, not zero; the read is *bought, not free*;
  only cheap within a stable schema epoch; the two-ontologies distinction is real but the
  cheapness depends on the write legs holding. [E1 §4; E3 §5]
- **Build-from-owned ≠ build-from-proven.** The typed-seed tower (spec-ontology-unification
  SEED) is **UNEXECUTED**; the 1:1 node→pattern assumption is its own open residue;
  discreteness holds only under a node-contract boundary, else transitive closure re-inflates
  to whole-graph RAG (Z1). [E1 §4; E3 §4]
- **The dcb-correctness seam is the single highest-leverage open item.** Z1's closure-leak,
  Z2's super-linear reconciliation, and Z3's write-time non-determinism **all bottom out at
  the same seam** (cross-feature ordering / read-set freshness / contract sufficiency); no
  leg promotes past it, and resolving it gates all three at once — the cheapest single
  unlock. [E3 §6; E1 residue] *(seam existence is shareable; the internal doc reference is
  PRIVATE.)*
- **Ashby/Gödel ceiling.** You can only economically traverse what you've modeled; the
  un-modeled margin needs a semantic fallback. [E2 §2]

---

### Honesty footer
- **Intended, not shipped.** Nothing is proven-in-production; meta-authority is *posture,
  not enforcement*; Inventory cannot promote any of this — it stays candidate until the
  DomainSpec plan executes the tower, the authority owner ratifies the S5 framing, and the
  commercialization gate prices the re-ingestion treadmill and signs off on positioning.
  [E2 footer; E3 §6]
- **Wrapper, not a novel algorithm.** GraphRAG / CQRS / VSM-S5 are prior art we cite.
  Guardrail (verbatim): marketing "ontology traversal" as a new retrieval algorithm would be
  a **tautological overclaim**. [E2 §3]
- **Engine algorithm withheld even internally** — cite + demonstrate results, never publish
  the algorithm. [E2 PRIVATE flags]
