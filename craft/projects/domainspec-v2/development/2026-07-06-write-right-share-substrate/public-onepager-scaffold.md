# The Write-Right Substrate — Public One-Pager (scaffold)

*Status: thesis / roadmap. **Intended, not shipped.** This is a scaffold for external
copy; publishing it is a separate gated step.*

---

## WHAT IT DOES
A governed substrate that turns author intent into a citable knowledge base **designed to
keep** reads cheap and high-signal. Capture writes everything — cheap, complete, ungoverned. Only
the important things are **promoted** to a stable, citable typed referent. A question that
arrives already-typed is then handed a discrete subgraph to traverse, instead of a fuzzy
embedding to denoise. [E1 §1–2; E1 §4]

## HOW IT WORKS
- **Two write surfaces.** Ungoverned capture stays complete; a default-deny promotion gate
  stays selective. The pitch in one line: **"promote less, not write less"** — you don't
  write less, you promote less, and the selectivity lives at the gate, not the keystroke.
  [E1 §1–2; E2 §1]
- **The write confers a referent.** Content is proposed non-deterministically at write; the
  promotion **records a gate** over a frozen, citable typed referent — a default-deny
  governance gate in the **VSM-S5 / symbolic-IR-auditability lineage (prior art)**, not a new
  mechanism. The gate filters on *govern*-importance ("may we rely on this?"), not on recall. [E1 §2–3]
- **The read is a traversal, not a re-derivation.** Because comprehension is *intended to be*
  pre-paid at write and crystallized into typed edges (a CQRS / materialized-view relocation
  of cost), the read loop is **designed to need no model inference — latency unbenchmarked, no
  speed is claimed.** Traversal itself is GraphRAG / knowledge-graph retrieval — **prior art,
  not a new algorithm.** [E2 §1; E2 §3]

*(Mechanism beyond this prior-art level is withheld.)*

## WHY IT MATTERS
- **An explicit, asymmetric trade:** pay once, non-deterministically, at write; then read
  cheaply **within a stable schema epoch.** [E2 §1]
- **Governable and cheap to attest — honestly framed.** Determinism here is a *cost*
  optimization, **not** a trust precondition: auditors attest non-deterministic pipelines
  routinely (e.g. SOC2 attests *that a reviewer approved at time T against version V*, not
  reproducibility). We sell "cheaper to trust," never "therefore correct." [E1 §3; E3 §1]
- **The genuine novelty is positioning, not algorithm:** (a) *two ontologies* — a governed,
  hand-typed provenance graph versus GraphRAG's LLM-extracted statistical one; and (b) the
  *already-typed query* that arrives as a graph node instead of an embedding to be matched — a
  novel *positioning*, not an invention: typed-intent is **build-from-owned**
  (spec-ontology-unification SEED, **owned-but-unexecuted**), not proven. [E2 §2–3]

## TRADE-OFFS (stated up front)
- **Determinism ≠ correctness.** A deterministic read of a bad or stale write fails
  *silently* — a confident wrong answer with no variance to signal doubt — where a
  probabilistic pipeline would fail loud (low-confidence, disagreement across samples).
  Determinism can *remove* an error-detection surface. [E2 §2; E3 §3]
- **The re-ingestion treadmill is unbounded.** Cheap reads are bought at a model-heavy write
  loop, and that cost recurs: a full re-ingestion at every ontology epoch, with **no
  sampling or utility bound named.** It is paid *per epoch*, not once. [E3 §2]
- **"Trivial" would overclaim.** The read is cheap + high-signal, **not zero** — it is
  *bought, not free*, and only cheap within a stable schema epoch. [E1 §4; E3 §5]
- **Owned ≠ proven.** The typed-seed design is *build-from-owned* of established patterns,
  but the owning work is **unexecuted**; the core 1:1 node→pattern assumption is unproven,
  and the discreteness that makes the query "arrive already-typed" holds only under a
  node-contract boundary — without it, traversal re-inflates to whole-graph RAG. [E1 §4; E3 §4]
- **The single highest-leverage open item** is the cross-feature correctness seam
  (ordering / read-set freshness / contract sufficiency). It is where the closure-leak,
  reconciliation-cost, and write-time non-determinism risks all bottom out — so resolving
  that one seam gates all three at once. [E3 §6]
- **A modeling ceiling remains** (Ashby/Gödel): you can only economically traverse what you
  have modeled; the un-modeled margin still needs a semantic fallback. [E2 §2]

---

### Honesty footer
- **Not shipped.** Everything above is thesis / roadmap. Nothing here is proven in
  production; DomainSpec and the surrounding loop are *intended, not shipped.* [E2 footer; E3 §6]
- **Wrapper, not a novel algorithm.** The contribution is a governance + typed-intent
  provenance *wrapper* around established parts — **GraphRAG / KG-retrieval, CQRS /
  materialized-view, and VSM-S5 / symbolic-IR auditability are prior art** that we cite, not
  invent. [E2 §3]
- **Guardrail (verbatim discipline):** marketing "ontology traversal" as a new retrieval
  algorithm would be a **tautological overclaim** — we don't make it. [E2 §3]
