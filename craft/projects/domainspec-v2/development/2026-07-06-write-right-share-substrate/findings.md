# findings.md — Two-Tier Share Substrate (write→read machine)

**What this is.** A cited read model over the three explorer returns in `research.md`
(E1 mechanism-reconstruction · E2 comparative-positioning · E3 adversarial-cost). It
tiers every load-bearing claim PUBLIC vs PRIVATE and gives four scaffold sections
(WHAT / HOW / WHY / TRADE-OFFS) usable directly as one-pager copy.

**INTERNAL boundary note.** This file contains PRIVATE-tier rows (engine/moat/attestation
framing, private codenames, internal doc paths, the ingest-loop composition). Do **not**
copy this file wholesale into public `arcanum/`. Only rows tiered PUBLIC are cleared for
external framing — and even then, **publishing the public tier is a separate gated step**
(the commercialization / public-disclosure gate, E3 §6), not authorized by this synthesis.

**Tiering rule applied.** A claim is PRIVATE if it names any of: engine algorithm,
attestation internals, moat stack, deterministic-validation SMT validators, private
codenames (cav2 / VSM-S5-as-cav2 / Living-Archive internal), the internal layer-map,
authority-triage internals, the dcb-seam internal doc path, or the 5-line-item ingest-loop
composition. Everything else that is cite-backed and claim≤proof-safe is PUBLIC.

---

## Two-tier claim table

| # | claim (one line) | tier | cites |
|---|---|---|---|
| 1 | Capture writes everything — ungoverned, cheap, complete; not selective (and shouldn't be). | PUBLIC | E1 §1 (read-trivial-via-selective-promotion §1) |
| 2 | Selectivity lives at the promotion gate, not the keystroke — "promote less, not write less." | PUBLIC | E1 §1–2; E2 §1 |
| 3 | Default-deny promotion realized as a closed 9-kind authority set / CAV2-D49. | PRIVATE | E1 §2; E2 §1 |
| 4 | The gate filters on **govern-importance** ("may we rely on / promote this?"), not recall-importance. | PUBLIC | E1 §2 |
| 5 | Recall-importance is already handled by substrate internals (utility_score, JEPA relevance, Self-Model density gate). | PRIVATE | E1 §2 |
| 6 | The write confers a stable, citable, typed referent + a recorded gate: content non-deterministically proposed, authority deterministically conferred+recorded. | PUBLIC | E1 §3 (irreducible-keystone-typed-referent-plus-gate) |
| 7 | The recorded gate is cav2 = the missing VSM System-5. | PRIVATE | E1 §3; E2 §2 |
| 8 | Determinism is a **cost**-optimization (cost-dominance), **not** a governance requirement; the requirement is provenance + a citable referent — auditors attest non-deterministic processes routinely (SOC2). | PUBLIC | E1 §3; E2 §1; E3 §1 (determinism-is-cost-not-requirement) |
| 9 | Determinism **materially reduces** the attestation/provenance surface (direction, not a measured floor) (attestation/moat framing). | PRIVATE | E2 §1; E3 §1 |
| 10 | A conferred decision is non-derivable — decided once and written, not recomputed. | PUBLIC | E1 §3; E3 §2 (ingest-relocation-epoch-scoped) |
| 11 | Read = cheap typed-graph traversal seeded by an already-typed query (query arrives as a node; handed a subgraph, not an embedding to denoise). | PUBLIC | E1 §4; E2 §2 |
| 12 | Holds ONLY under a node-contract boundary; else transitive closure re-inflates to whole-graph RAG (Z1 counterexample). | PUBLIC | E1 §4; E3 §4 |
| 13 | The owning tower (spec-ontology-unification SEED) is **UNEXECUTED**; the 1:1 node→pattern assumption is open residue — build-from-owned ≠ build-from-proven. | PUBLIC | E1 §4; E3 §4 (typed-intent-seed-owned-but-unexecuted) |
| 14 | Comprehension is *intended to be* pre-paid at write and crystallized into typed edges (CQRS / materialized-view); the read loop is designed to need no model inference — **latency unbenchmarked, no speed claimed**. | PUBLIC | E2 §1 (ingest-time-cost-relocation) |
| 15 | The 5-line-item governed write loop (neural extraction · scope-tagging · promotion/governance metadata · provenance · ontology maintenance). | PRIVATE | E1 §3; E2 §1; E3 §2 |
| 16 | "Read trivial" = cost-trivial (pre-paid) + signal-trivial (default-deny → small, high-signal read surface). | PUBLIC | E1 §4; E2 §1 |
| 17 | "Trivial" overclaims — the read is **cheap + high-signal, not zero**; discreteness is conditional on contract-completeness; only cheap **within a stable schema epoch**. | PUBLIC | E1 §4 (honest caveat); E3 §5 |
| 18 | Standard RAG/GraphRAG embeds the query to find its entry node; here grounding is **reduced (a margin remains for un-modeled queries)** and traversal is replaced by direct **KG-retrieval traversal (prior art)** over the frozen post-promotion referent — deterministic **within a stable schema epoch** (the ontology itself is authored non-deterministically). | PUBLIC | E2 §2 (typed-intent-discrete-vector) |
| 19 | Two ontologies: a governed, hand-typed provenance graph vs GraphRAG's LLM-extracted statistical one (structural vs statistical attenuation; Conant-Ashby requisite variety). | PUBLIC | E1 §4; E2 §2 (wrapper-not-algorithm-two-ontologies) |
| 20 | "The regulator's model" is cav2 (the missing S5) that the resonantOS / Living-Archive substrate lacks. | PRIVATE | E2 §2 |
| 21 | Every leg is build-from-owned prior art, no terminal KILLs: traversal = GraphRAG/KG-retrieval; ingest-relocation = CQRS/materialized-view/ETL; gate = VSM-S5 / symbolic-IR-auditability. | PUBLIC | E2 §3 |
| 22 | The genuine contribution is the governance + typed-intent provenance **WRAPPER**, not a novel algorithm; marketing "ontology traversal" as a new retrieval algorithm is a tautological overclaim. | PUBLIC | E2 §3 (wrapper-not-algorithm-two-ontologies) |
| 23 | Retained novelty = two-ontologies split + already-typed query seed — **positioning** novelty, not algorithmic. | PUBLIC | E1 §4; E2 §3 |
| 24 | determinism ≠ correctness: a deterministic read of a bad/stale write fails **silent** (confident-wrong, no variance to signal doubt); stochastic pipelines fail loud. | PUBLIC | E2 §2; E3 §3 |
| 25 | Ashby/Gödel ceiling: you can only economically traverse what you've modeled; the un-modeled margin needs a semantic fallback. | PUBLIC | E2 §2; E3 §3 |
| 26 | Ontology-epoch re-ingestion is **unbounded** — full-corpus re-ingestion per ontology epoch, no sampling/utility bound named; paid per-epoch, not once. | PUBLIC | E1 residue; E3 §2 (ingest-relocation-epoch-scoped) |
| 27 | The dcb-correctness seam (cross-feature ordering / read-set freshness / contract sufficiency) is the single highest-leverage open item — Z1/Z2/Z3 all bottom out here; resolving it gates all three legs at once. | PUBLIC | E1 residue; E3 §6 (dcb-seam-highest-leverage) |
| 28 | The dcb-seam internal component reference (test-engine/HANDOFF.md G2). | PRIVATE | E1 residue; E3 §6 |
| 29 | The engine algorithm / moat stack (engine determinism · attestation · governance-data · vertical) — cite + demonstrate results, never publish. | PRIVATE | E2 PRIVATE flags; machine-map-and-moat-synthesis |
| 30 | Nothing is proven-in-production; the whole thesis is **intended-not-shipped** roadmap; meta-authority is posture, not enforcement; Inventory cannot promote — stays candidate pending DomainSpec-plan execution + commercialization gate. | PUBLIC | E2 footer; E3 §6 |

**Tally:** 30 load-bearing claims — **22 PUBLIC · 8 PRIVATE** (rows 3, 5, 7, 9, 15, 20, 28, 29).

---

## Scaffold sections (one-pager copy; each bullet cites explorer + source)

### WHAT IT DOES
- Turns author intent into a governed, citable knowledge substrate: capture writes everything cheaply, and only the important things get **promoted** to a stable typed referent. [E1 §1–2]
- On the read side, a question that arrives already-typed is handed a discrete subgraph to traverse rather than an embedding to denoise. [E1 §4; E2 §2]
- Net effect: comprehension is *intended to be* paid once at write, so reads **within a schema epoch** are **designed to be** cheap and high-signal. [E2 §1; E1 §4]

### HOW IT WORKS (prior-art level; engine algorithm out of scope)
- Two write surfaces — ungoverned capture (complete) + a default-deny promotion gate (selective): "promote less, not write less." [E1 §1–2]
- The write confers a stable citable typed referent + a recorded gate: content non-deterministically proposed, authority deterministically conferred + recorded. [E1 §3]
- The gate filters on govern-importance ("may we rely on this?"), not recall-importance. [E1 §2]
- Read is typed-graph traversal seeded by the already-typed query — GraphRAG / KG-retrieval as prior art, no novel-algorithm claim. [E1 §4; E2 §3]
- Comprehension is *intended to be* pre-paid at ingest and crystallized into typed edges (CQRS / materialized-view), so the read loop is designed to need no model inference — latency unbenchmarked, no speed claimed. [E2 §1]

### WHY IT MATTERS
- The trade is explicit and asymmetric: pay once, non-deterministically, at write; read cheaply **within a stable schema epoch**. [E2 §1; demotion E1 §4]
- Determinism here is a **cost**-optimization (collapses provenance cost), not a trust precondition — non-deterministic pipelines are routinely attestable (SOC2 analogy). [E1 §3; E3 §1]
- Retained novelty is **positioning, not algorithm**: two ontologies (governed hand-typed vs LLM-extracted statistical) + the already-typed query seed. [E2 §2–3]
- The thesis has already self-corrected once toward humility (governance-requires-determinism demoted; typed-intent-discrete-vector refined to owned-but-unexecuted). [E3 cross-cutting §6]

### TRADE-OFFS
- **determinism ≠ correctness:** a deterministic read of a bad/stale write fails silent — confident-wrong with no variance to signal doubt; stochastic pipelines fail loud. This inverts the intuitive safety story. [E2 §2; E3 §3]
- **Unbounded ontology-epoch treadmill:** cheap reads are purchased at a model-heavy write loop; full-corpus re-ingestion recurs at every ontology epoch with **no sampling/utility bound named** — paid per-epoch, not once. [E3 §2; E1 residue]
- **"Trivial" overclaims:** the read is cheap + high-signal, not zero; the read is **bought, not free**; and only cheap within a stable schema epoch. [E1 §4; E3 §5]
- **build-from-owned ≠ build-from-proven:** the typed-seed tower is UNEXECUTED; the 1:1 node→pattern assumption is open; discreteness holds only under a node-contract boundary or it re-inflates to whole-graph RAG. [E1 §4; E3 §4]
- **The dcb-correctness seam is the single highest-leverage open item** — cross-feature ordering / read-set freshness / contract sufficiency; Z1/Z2/Z3 all bottom out here, so resolving it gates all three legs at once (the cheapest single unlock). [E3 §6; E1 residue]
- **Ashby/Gödel ceiling:** you can only economically traverse what you've modeled; the un-modeled margin still needs a semantic fallback. [E2 §2]
- **"Wrapper not algorithm" is easy to over-read as cheap-to-build:** it composes three separately-hard patterns (retrieval correctness, write-time reconciliation, governance gating) into one seam — exactly where the unresolved cost concentrates. [E3 §5]

---

## Dispatch close — `2026-07-06-write-right-share-substrate`

- **exit_reason:** `resolved`. `final_approver` (Vlachopulos) issued ACCEPT after one bounded repair. P9 citations sound; **boundary sign-off clean — zero leaks** (all 8 PRIVATE rows verified absent from the public scaffold; engine algorithm absent from both tiers). Verdict matrix: **1 KILL** (the "sub-50ms" benchmark — unwitnessed, tower unexecuted), **no novelty-kills** — every leg is build-from-owned prior art.
- **agents_spawned:** 7 across 4 groups — explorers ×3 (Shannon · Porter · Meadows), writer ×1 (Ahrens), skeptics ×2 (Popper precedent · Kahneman non-vacuity), auditor ×1 (Vlachopulos). `loops_used: 1` (auditor→synthesizer feedback repair). Plus 4 init-time **check-tension** gate agents (infrastructure, unregistered; one REJECT→revise cycle before the human confirm).
- **Repair applied (P8-verified by grep):** sub-50ms KILLed ×4 locations → "designed to need no model inference; latency unbenchmarked; no speed claimed"; "deterministic navigation" → KG-retrieval traversal, deterministic within a stable schema epoch; grounding "shrinks-to-zero" → reduced/margin-remains; gate-leg VSM-S5 prior-art anchor added; already-typed-query cross-linked build-from-owned; present-tense → design voice; private "~0" → "materially reduces".
- **Owners (this dispatch promotes nothing):** DomainSpec plan / domainspec-v2 (execute the spec-ontology tower — converts build-from-owned → build-from-proven); cav2 authority owner (the S5 framing); **commercialization / public-disclosure gate — must sign off before the PUBLIC companion is published; this dispatch did NOT authorize publication.**
- **Boundary:** the whole substrate is INTERNAL. `public-onepager-scaffold.md` is cleared PUBLIC-tier *content*, but publishing it to any public surface is a separate gated step.
