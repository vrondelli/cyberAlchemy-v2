# OSS Tooling Sweep — Portfolio Findings (final synthesis)

**Role:** Final synthesizer. Merges the three reviewer-hardened (v2) lane syntheses into one
portfolio verdict. **No re-research** — adjudication and cross-cutting resolution only.
**Rule inherited from every lane:** adopt-conservative (a genuine tie tiers down; the tool
carries the burden). Every row below traces to a v2 lane table — P1 (domainspec), P2
(cyberAlchemy-v2 authority spine), P3 (orchestration).

Sources:
- `synthesis/p1-domainspec-synthesis-v2.md`
- `synthesis/p2-cyberalchemy-synthesis-v2.md`
- `synthesis/p3-orchestration-synthesis-v2.md`

---

## 1. Headline verdict

Both target projects deliberately hand-roll, and **both had already run their own precedent
sweeps before this one** — domainspec's frozen 2026-07-02 finding ("No DSL, no FOL/SMT/Lean";
Datalog/Cedar admitted cross-graph-only and quarantined) and cyberAlchemy's 2026-06-24 posture
("cite the precedent, don't adopt"). So this portfolio sweep mostly **confirms incumbent-fit**:
across ~35 candidates in three lanes, the honest yield is **one ADOPT-NOW** (lychee, and even
that is adopt-on-OQ-1-ratification and tool-agnostic), **five PILOTs**, and **two SEQUENCED
PILOTs** — every one of them native-first or discipline-safe, none inverting control off the
turn, breaking byte-determinism, or crossing the public/private boundary. Everything
framework-, reasoner-, graph-, policy-, solver-, or store-shaped stays REJECT or DEFERRED
behind an existing owner precondition (schema-stable-before-validator, Non-Collapse rule 2,
turn-driven-not-daemon, single-system-of-record). The sweep's real product is not new
adoption; it is a small set of boundary-safe seams plus a corrected residue ledger.

**Survivors: 1 ADOPT-ON-RATIFICATION (lychee) · 5 PILOT · 2 SEQUENCED PILOT (8 total). Zero
*unconditional* adopt-now** — the one "immediate" win is gated on an OPEN constitution question
(OQ-1), so it behaves like a sequenced item until that OQ is ratified.

---

## 2. Unified candidate table

Sorted by tier. Every row from all three v2 tables is preserved; none dropped.

| Tool | Lane | What | Why it helps | Where (seam) | Are we already doing something similar? | Tier |
|---|---|---|---|---|---|---|
| **lychee** (link-check capability, tool-agnostic) | P2 | Fast async Markdown/HTML link checker | Spine is a mesh of relative `.md` links; a broken cross-ref silently breaks traceability (CAV2-D36). Deterministic, no schema dep, no runtime, no leak surface | Index/cross-ref integrity · STABLE-REPOSITORY-CONSTITUTION OQ-1 first-validator; C1 Validation-Adapter | Manual link discipline only — no deterministic gate | **ADOPT-ON-RATIFICATION** (OQ-1 is OPEN, not yet a ratified gate — see §5 OQ-4; adopt the link-check *capability*, not a specific binary) |
| **fast-check** (RE-SCOPED) | P1 | MIT property-based testing for TS; shrinking + stateful | Pinned-seed metamorphic value-law oracle over the exact-rational evaluator (eval(a+b)=eval(b+a), sum≡manual fold, count-cap/empty-fold boundaries) | Formal-cell evaluator (not emit path) · eval.ts:116-172 (evalRational) | Golden fixtures sample value-correctness sparsely; no printer exists (old round-trip framing was vacuous) | **PILOT** (narrow; off the emit path, in-grammar generators, asserts equalities never golden bytes) |
| **frontmatter-lint — STABLE-SLOT subset** | P2 | Validate a subset of YAML frontmatter against schema | id-format + required-slot presence are stable now, independent of the freeze; partial ≠ full-schema | Definition-template conformance · DEFINITION-SCHEMAS.md | Yes — schemas tracked documentary-first by design | **PILOT** (scoped; contested slots stay DEFERRED) |
| **native INDEX GENERATOR** (script, not LinkML) | P2 | Regenerate DEFINITIONS-INDEX from already-stable slots (id/term/one-liner) | Index is a projection of stable slots; closes manual index-sync gap without LinkML's schema/RDF/OWL block | Synced-index maintenance · DEFINITIONS-INDEX.md | Synced index exists; sync is by hand | **PILOT** (native task; caveat: no index-drift failure on record → book-keeping relief, not proven pain. Piloted despite that caveat — vs the P3 derived-view's DEFERRED — because the burden is met *differently*: a deterministic projection of already-stable slots at near-zero cost, whereas the derived-view's cited payoff metrics are degenerate today) |
| **markdownlint** | P2 | Markdown style/structure linter | Structural MD hygiene so the frontmatter layer isn't defeated by malformed Markdown | Structural MD conformance · Seam G | No explicit equivalent | **PILOT** (near-zero cost, complements lychee; does NOT own template conformance) |
| **OTel-GenAI / OpenLLMetry semantic conventions** | P3 | Emit the native read-model in OTel-GenAI wire shape | Free option-value: any later backend becomes drop-in; standard span/attribute names. Wire format, not a store | Telemetry/eval (wire format) | No — currently bespoke YAML shape | **PILOT** (rider on whichever read-model work lands; zero egress/daemon/second-record) |
| **SHACL + pySHACL — D16 REGRESSION-LOCK** (one shape) | P2 | Closed-world shape over the D16 relator enum *established by the R1 fix* (no such enum exists today — the fix creates it) | Cold-catching R1 was semantic/hard; regression-locking after the fix is trivially structural (sh:in enum + sh:minCount on 7 fields). The D29↔D16 relator/field divergence went unreconciled through 2 attackers + 3 verifiers → manual/LLM review is a weak backstop here | R1/C4 fix freeze · contradiction-collapse-review findings | Precedent-owned mapping exists; no gate deployed | **SEQUENCED PILOT** (fires only after the R1 fix lands and freezes D16's enum) |
| **native append-only per-group PROGRESS MARKER** | P3 | One append-only field on the existing YAML recording per-group completion so re-run skips done groups | No native resume-from-last-completed-group; re-run silently re-spawns completed groups = wasted budget + partial state | Durable re-runs (crash-recovery) — GENUINE GAP | Record: yes; per-group progress: no | **SEQUENCED PILOT** (build now; arm on first max_loops≥2 multi-group dispatch. Every Temporal disqualifier attaches to the daemon, not the one-field marker) |
| **Apalache** | P1 | Apache-2.0 symbolic (Z3-backed) TLA+ checker | Symbolic checking beats TLC state-explosion on freshness | Temporal/freshness · alloy-tla-modeling | tla2tools installed & run; Alloy-6/TLAPS parked future-work | **DEFERRED** (revisit only if TLC actually blows up on the one .tla freshness model) |
| **Lean 4 + Mathlib** | P1 | Apache-2.0 dependent-type prover + library | Mechanize μF/νF duality + catamorphism folds as permanent machine-checked assets | Deeper-proofs seam | Repo already owns Lean assets; "Defer Lean" is a dated decision | **DEFERRED** (dated gate: unblocks on a stable public theorem; gated future asset, not a duplicate) |
| **DCB spec + dcb-eventstore** | P1 | Open Dynamic Consistency Boundary spec + reference types | Conform the freshness ledger to published append-condition/read-set semantics | Freshness ledger · dcb-correctness SYNTHESIS | Yes — DCB already the adopted vocabulary; impl is flat JSONL ledger | **DEFERRED** (conform to semantics, not a store, as the ledger matures) |
| **frontmatter-lint — full schema** | P2 | Same, over the whole def template | Natural second gate after the schema freezes | Same cite | Same | **DEFERRED** (NODE-MODEL candidate + confidence-rename pending decision-gate) |
| **SHACL + pySHACL — new shapes (global)** | P2 | Authoring new constraint shapes over the def graph | Broad structural constitution checks | Kind-enumeration scan | Same | **DEFERRED** (OQ-1 forbids shapes over unstable defs; distinct from the D16-only lock) |
| **sentence-transformers (SBERT/NLI)** | P2 | Semantic similarity / NLI-contradiction pre-screen | Reproducible near-dup + contradiction shortlist | Candidate intake · Seam E | Contradiction hunt is LLM-subagent dispatch | **DEFERRED** (was PILOT: feeds a gated gate; skeptic-untested; torch/weights leak surface; NLI is stochastic) |
| **LinkML** | P2 | One YAML schema → JSON-Schema/SHACL/OWL/SQL/docs | Would generate index + downstream shapes | Definition template · Seams A/B/E | Synced index + template exist | **DEFERRED** (inherits OQ-1 freeze + OWL/RDF stack; index-sync slice now met natively) |
| **DVC / Frictionless** | P2 | Hash-pinned data/pipeline versioning | Source-vault drift by hash | Import-manifest pinning · Seam F | Manual hash-pin covers single-import scale | **DEFERRED** (pipeline runtime unwarranted at current scale) |
| **Native read-only derived view** over the dispatch ledger YAML | P3 | Deterministic in-repo script → queryable read-model | Ledger is a complete structured trace but write-optimized/query-hostile | Telemetry/eval (read side) | Capture: yes; read/query: no | **DEFERRED** (trigger-gated: v1 payoff metrics degenerate — loops_used uniformly 1, error ~0.7%; build when a real variance-bearing query over multi-group DAG topology arises) |
| **Self-hosted Langfuse / Phoenix** | P3 | Self-hosted trace/eval platforms (ClickHouse UI) | Rich trace exploration + eval scoring | Telemetry/eval (store + UI) | Capture: yes (ledger is the store) | **DEFERRED** (reasoning corrected: NOT egress — self-hosted; defer on second-store-outside-hook + ClickHouse weight vs single-operator repo) |
| **MCP (Model Context Protocol)** | P3 | Open tool/context server protocol; native to Claude Code | Serve a dispatch agent a bounded external source without inverting execution | Orthogonal (agent↔tool) | Yes — already native; touches neither ledger nor gates | **AVAILABLE** (opportunistic note; no named consumer; out-of-scope for orchestration) |
| **Z3** | P1 | MIT SMT solver | Turn coverage_gap into SAT/UNSAT + unsat-core | Formal-cell evaluator | Closed decidable grammar + total BigInt-rational evaluator; answer is a fold not a solve | **REJECT** (emit-path posture (b) dead: model non-determinism breaks byte-stability; posture (a) CI-oracle logged as open question, not adopted) |
| **cvc5** | P1 | BSD SMT solver; strings + SyGuS | Second SMT oracle; string theory | Formal-cell evaluator (2nd) | Same as Z3 — no seam needs a solver | **REJECT** (inherits Z3 rejection; optional GPL-link flag) |
| **Quint** | P1 | Apache-2.0 TS-native spec over TLA logic | Lower authoring friction than raw SANY/TLC | Temporal (authoring front-end) | Both models already ran; the gap is content, not ergonomics | **REJECT** (was DEFERRED: pure duplicate of installed tla2tools; PILOT rests on unverified ergonomic-stall premise) |
| **Rocq (Coq)** | P1 | LGPL-2.1 proof assistant; native (co)inductive | Alt prover for μF/νF; verified extraction | Same seam as Lean | Lean is the owned prover | **REJECT** (advocate itself says pick Lean; split-brain + LGPL-on-extraction flag) |
| **Hypothesis** | P1 | MPL-2.0 Python PBT; state machines | Stateful blueprint for νF stream semantics | νF design reference (Python) | No Python in engine; fast-check is primary | **REJECT** (no Python surface; at most a design blueprint fast-check covers) |
| **EventSourcingDB / Marten** | P1 | DCB-native event stores (Marten MIT/Postgres) | Battle-tested append-condition/optimistic-concurrency | Freshness ledger (backing store) | Stays a JSONL file by decision; store gated on unmet toy-proof | **REJECT** (importing a store risks rule-5 circular self-validation the Authority Model forbids) |
| **Langium** | P1 | MIT TS DSL framework; grammar→AST+LSP | Replace regex validators with typed AST + editor tooling | Feature-pack parser | Validation is a decidable schema table-walk; closed grammar | **REJECT** (prior finding "DSL — NO"; general grammar widens the accepted surface) |
| **Tree-sitter** | P1 | MIT error-tolerant parser + query DSL | Robust partial-parse over imperfect Markdown | Feature-pack parsing (alt) | Surface deliberately closed | **REJECT** (error-tolerance = accepting more input, breaks determinism) |
| **JSON Schema + Ajv** | P1 | MIT declarative JSON validation + TS types | Lowest-effort regex→declarative swap for frontmatter | Feature-pack field validation | .schema.yml table-walk is already the minimal validation language | **REJECT** (was DEFERRED: null-delta lateral swap; changes no verdict, adds a dep for parity) |
| **Xtext** | P1 | EPL JVM/Eclipse DSL framework | Mature ancestor of Langium | Feature-pack (N/A) | Off-toolchain JVM dep | **REJECT** (listed only to confirm Langium is the TS-native pick) |
| **RDF + SHACL** | P1 | W3C typed-graph + shape-constraint stack | Make spec↔code↔ontology one queryable typed graph + drift invariants | spec↔code↔ontology map | Prose-side enforced in v2 spine; the "one typed graph" is aspirational, not built | **REJECT** (was DEFERRED: proof-mass before the artifact; revisit only if the graph is actually built) |
| **Vale** | P2 | Markup-aware prose/terminology linter | Tripwire an undefined critical term in CI | Terminology consistency · Seam G | Yes — DEFINITION-DRIFT-AUDIT is a manual owner-owned governance sweep | **REJECT** (was DEFERRED: redundant with the drift audit; can't catch semantic drift; friction vs prose-first voice) |
| **OWL reasoner** (HermiT/ELK/Openllet) | P2 | Prove ontology (in)consistency; explain conflicts | Open-world contradiction surfacing | Contradiction gate · R1/C4 | Rejected by design — CAV2 is "a structural signature with no reasoner" | **REJECT** (inference-that-decides breaks Non-Collapse rule 2) |
| **OPA/Rego + conftest, or CUE** | P2 | Policy-as-code pass/deny/warn | Run the constitution DAG check | Constitution enforcement · Seam D | Checking owned — Cedar SMT + sorry-free Lean decidePolicy_sound | **REJECT** (redundant engine; schema mid-promotion; public Rego risks leaking the paid moat) |
| **W3C PROV-O / PROV-DM** | P2 | Standard provenance ontology | Standardizes import manifests | Import manifests · Seam F | Already the design backbone — precedent Row 8 | **REJECT** (concept already owned; RDF serialization is redundant weight) |
| **SKOS** (+VocBench/TemaTres) | P2 | W3C thesaurus model + vocab platforms | broader/narrower/related for the index | Vocabulary model · Seam C | DEFINITIONS + INDEX + aliases ≈ a concept scheme | **REJECT** (freezes candidate RELATION-MODEL; auto-suggest = inventory deciding authority; runtime/leak) |
| **Graph DB** (TerminusDB/Neo4j) | P2 | Git-for-data / property graph + DAG procs | Lifecycle + acyclicity gate | Ontology store · Seam B | Graph layer only in un-promoted import | **REJECT** (import-before-promotion; unstable NODE/RELATION-MODEL; runtime store + leak) |
| **TBX (ISO 30042)** | P2 | XML terminology interchange | Export target if CAV2 interoperates | Definition interchange · Seam C | No current interop need | **REJECT** (speculative interop) |
| **LangGraph / CrewAI / AutoGen (AG2)** | P3 | Stateful agent-graph frameworks | StateGraph+checkpointer ≈ group-graph-with-loops; conditional edge ≈ zig-zag | graph scheduling · messaging | Yes fully — typed connections DAG + role enum + robot_talks + supervisor | **REJECT** (inverts execution off the turn, bypasses ledger, re-solves the 20% while dropping the 80% human gate) |
| **Google ADK / Mastra / SK / Pydantic-AI / DSPy** | P3 | Framework peers; typed forms; prompt optimization | Mine as patterns; DSPy makes angle-sets versionable | graph scheduling · prompt versioning | Yes as patterns — dials, form schema, check-tension already occupy these seams | **REJECT** (mine, don't adopt; same execution-inversion + ledger-bypass) |
| **Temporal / Restate** | P3 | Daemon-based durable workflow engines | group=Activity, graph=Workflow, replayed after crash | durable re-runs · scheduling | Record durability: yes (durable git-tracked rows) | **REJECT** (persistent worker daemon opposite of turn-driven; second system of record; mid-loop resume closed natively) |
| **DBOS / Inngest / Prefect / Dagster / Argo** | P3 | Lower-friction durable execution | DBOS-as-library resumes from last completed group | durable re-runs · telemetry | Partially — dispatch_id dedup already idempotent | **REJECT** (fallback-note only: with loops_used uniformly 1 the crash-resume gap never bites; nothing defers to it) |
| **Ray / Modal / E2B / Firecracker** | P3 | Distributed compute / sandboxed microVM | per-branch microVM isolation; distributed robot_talks | sandboxed execution · scheduling | Yes for our scale — Agent worktree gives FS isolation | **REJECT** (wrong scale + wrong threat model: governed Claude subagents, not untrusted code) |
| **A2A (Agent2Agent protocol)** | P3 | Open agent↔agent wire protocol | Formalizes inter-group zig-zag as a checkable protocol | inter-agent messaging | Yes inside the boundary — typed zig-zag/feedback edges | **REJECT** (redundant inside boundary; premature+un-gated outside; open bus fights the single human-confirm gate + public/private boundary) |
| **(Runner split — not a tool)** | P1 | vitest + node:test coexist under one impl/ | — | impl/package.json; make-it-green G2/D2 | Real accidental complexity from v1→v2 fork | **NO ADOPTION** (fix is converging on one runner, a discipline not a tool) |

---

## 3. Cross-cutting resolution

Resolved once so no tool is double-counted or contradictorily tiered. The recurring principle:
**the same tool earns a different tier because it sits on a different seam under a different
discipline** — tier tracks the seam, not the tool's abstract merit.

- **SHACL / pySHACL** — appears in P1 (REJECT) and P2 (SEQUENCED PILOT). **Not a
  contradiction.** In P1 the target seam is a *typed spec↔code↔ontology graph that does not
  exist* → building a shape stack for a nonexistent artifact is proof-mass before the artifact,
  REJECT. In P2 the seam is a *single already-mandated D16 relator-enum fix*; regression-locking
  a fix that is already required is trivially structural (sh:in + sh:minCount), and manual/LLM
  review has been falsified on exactly this defect → SEQUENCED PILOT. Different graph,
  different discipline, opposite verdict — correctly. (Within P2, SHACL also sits at a third
  tier: *new global shapes* stay DEFERRED — OQ-1 forbids authoring shapes over still-unstable
  defs — which is distinct from the D16-only lock, whose enum the required R1 fix freezes first.)

- **JSON-Schema / frontmatter validation** — P1 REJECT (Ajv) vs P2 PILOT (stable-slot
  frontmatter-lint). In P1 the field validator is a *null-delta lateral swap*: .schema.yml +
  table-walk is already the minimal declarative validation language, so Ajv changes no verdict and
  only adds a dependency → REJECT under adopt-conservative. In P2 there is *no deterministic gate
  at all* over frontmatter, and a stable subset (id-format + required-slot presence) can be
  enforced today without touching the frozen schema → PILOT. One lane already has the capability;
  the other lacks it — hence the split.

- **Event-sourcing / append-only ledger** — three lanes, three different ledgers, never one
  adoption. P1: the DCB freshness ledger conforms to *published append-condition semantics* (a
  vocabulary refinement — DEFERRED; a durable store is REJECT to avoid rule-5 circular
  self-validation). P2: the drift-audit / definitions ledger is an *owner-owned governance sweep*,
  not a store. P3: the dispatch progress marker is an append-only field for crash-recovery
  (SEQUENCED PILOT). The pattern is shared; the seam and the winning implementation differ, so
  they resolve independently and none imports a third-party event store.

- **W3C PROV (P2)** — provenance is **already the design backbone** of import manifests
  (precedent Row 8), so PROV-O/PROV-DM adds only redundant RDF serialization weight → REJECT.
  Recorded here so it is not mistaken for an open provenance gap.

---

## 4. Try-this-first ordering

Ranked by clearance-over-cost; each carries its precondition. Confirmed against the v2 tables —
nothing invented.

1. **lychee** (P2, ADOPT-NOW) — the *only* immediate win. Precondition: OQ-1 ratification
   (it is the recommended first-validator, not yet a ratified gate); adopt the link-check
   *capability*, tool-agnostic, not a specific Rust binary.
2. **fast-check re-scoped metamorphic oracle** (P1, PILOT) — no gate. Precondition: generate
   *in-grammar* ASTs and assert value-laws on evalRational; never touch the emit path, never
   write golden byte values; pin the seed.
3. **frontmatter-lint stable-slot subset + native index generator** (P2, PILOT) — no gate;
   both project already-stable slots. Precondition: lint **only** id-format + required-slot
   presence; index generator ships as low-priority book-keeping (no index-drift failure is on
   record). markdownlint rides alongside as generic MD hygiene.
4. **cyberAlchemy D16 SHACL regression-lock** (P2, SEQUENCED PILOT) — strictly gated.
   **Precondition-zero: the owner confirms R1/C4 is still live (§5 OQ-2) and authorizes the
   fix.** Then order: **fix R1/C4 in DEFINITIONS.md → freeze D16's relation-type enum → add the
   single sh:in+sh:minCount shape.** Never author the shape first (premature validator over an
   unstable def; OQ-1 forbids it).
5. **Orchestration native progress marker (+ OTel-GenAI emit-schema rider)** (P3, SEQUENCED
   PILOT + PILOT) — build the one-field append-only marker **now**; **arm it on the first
   max_loops≥2 multi-group dispatch**. Shape whatever read-model/telemetry output lands in
   OTel-GenAI wire format (free backend-portability; a wire format, not a store).

---

## 5. Residual open questions (carried forward)

1. **domainspec Z3 posture-(a) — CI-only differential oracle.** A solver used *purely in CI*
   to differentially validate the BigInt-rational arithmetic (asserting evalRational agrees
   with an SMT model, never inlining solver output into golden bytes) was **not rebutted, only
   not adopted** under adopt-conservative + the frozen 2026-07-02 "SMT — NO" finding. PLAUSIBLE.
   Revisit requires **first reopening the frozen SMT-NO finding**; not a standing DEFERRED.
2. **cyberAlchemy R1/C4 (D29↔D16) divergence — is it still live?** Two reviewers verified that
   in `DEFINITIONS.md`, D29's relator enumeration lists "gate / validator / owner decision" as
   sufficient, whereas D16 mandates a 7-field typed relation — an **unreconciled relator/field
   divergence, still live and unfixed** (D29 does textually defer to D16, so it is a soft tension
   not a hard logical contradiction — but the divergent enumeration is real and un-collapsed).
   Note the sh:in enum the lock would enforce **does not exist yet**; the R1 fix creates it. The
   entire SHACL D16 sequencing hangs on this. **Flag for owner confirmation** before scheduling
   the fix → freeze → shape order.
3. **orchestration post-hoc anti-bias realization eval.** check-tension is pre-flight only;
   the ledger stores angles/prompts/exit_reason but **not full findings**, so "did the agents
   actually diverge, or collapse into agreement despite the gate?" is currently unanswerable.
   Genuine residual gap but low-value; the proportionate close is a **future native eval**
   (persist findings + score divergence), **not** Langfuse. Flag only — no tier change.
4. **cyberAlchemy OQ-1 ratification state — gates the one "adopt" (lychee).** The
   STABLE-REPOSITORY constitution's OQ-1 ("start with Markdown link checks before broader
   validators") is status **OPEN**, not ratified. Until the owner ratifies it, lychee is a
   *recommended-but-unratified* first validator — which is why its tier is ADOPT-ON-RATIFICATION,
   not adopt-now. Surface OQ-1's state before treating lychee as immediately adoptable.
