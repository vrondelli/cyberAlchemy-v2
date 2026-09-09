# P2 — cyberAlchemy-v2 OSS Tooling: SYNTHESIS v2 (post-adversarial, zig-zag R2)

**Role:** Synthesizer, revising v1 after two adversarial reviewers. Adjudication only — no
re-research. **Rule (adopt-conservative):** on a genuine tie the skeptic/inflation side
wins and the tier drops.

**What R2 changed.** Two attackers hit v1 from opposite sides. The **inflation-hunter**
broke the SBERT PILOT and trimmed inflated rationales; the **gap-hunter** confirmed
R1/C4 (D29↔D16) is *still live and unfixed* in `DEFINITIONS.md` (D29 relator enumeration
lists "gate / validator / owner decision" as sufficient, contradicting D16's mandatory
7-field typed relation) and carved three *scoped* subsets out of blanket DEFERRALs. Both
survive: over-recommendation and under-recommendation were each real in v1. The single
most important correction is **SHACL** — it is no longer one undifferentiated DEFERRED but
a split: global-DEFERRED for authoring new shapes over unstable defs, **plus a sequenced,
D16-only regression-lock PILOT** that activates *only after* the required R1 fix lands.

---

## Candidate table (revised)

| Tool | What | Why it would help | Where (seam + file cite) | Already doing something similar? | Tier |
| --- | --- | --- | --- | --- | --- |
| **lychee** (link-check *capability*, tool-agnostic) | Fast async Markdown/HTML link checker | Authority spine is a mesh of relative `.md` links; a broken cross-ref silently breaks traceability (`CAV2-D36`). Deterministic, no schema dep, no shipped runtime, no leak surface. | Index/cross-ref integrity · `STABLE-REPOSITORY-CONSTITUTION.md` OQ-1 ("Markdown link checks" = *first* validator); C1 Validation-Adapter; `AUTHORITY-MODEL.md` §Validation Surface ("link-backed") | Manual link discipline only — no deterministic gate | **ADOPT-NOW** — both agents agree; it *is* the OQ-1 first-validator answer. **Caveat (inflation-hunter):** OQ-1 is an OPEN recommendation, not a ratified gate, and only the *capability* (any link checker) is endorsed — not a specific Rust binary. Read as **adopt-on-ratification, tool-agnostic.** *(adv Seam G; skep §7)* |
| **frontmatter-lint — STABLE-SLOT subset** (remark-lint-frontmatter-schema / CUE) | Validate a *subset* of Markdown YAML frontmatter against schema | `id`-format + required-slot *presence* are stable **now** and independent of the freeze; enforcing them is partial, not full-schema. | Definition-template conformance · `DEFINITION-SCHEMAS.md`; vault frontmatter in `ontology-conventions.md` | Yes — `DEFINITION-SCHEMAS.md` tracks schemas documentary-first, by design | **PILOT (scoped)** — gap-hunter carve: partial enforcement ≠ full-schema freeze. Lint **only** id-format + required-slot presence. Contested slots (NODE-MODEL, confidence-field rename) **stay DEFERRED** below. *(adv Seam A; skep §4; GAP-HUNTER)* |
| **frontmatter-lint — full schema** | Same, over the whole def template | Natural second deterministic gate *after* the schema freezes | Same cite | Same | **DEFERRED** — NODE-MODEL is candidate, confidence-rename is a pending decision-gate reversal (OQ-1). Welcome *after* decision-gate stabilization. |
| **SHACL + pySHACL — D16 REGRESSION-LOCK** (one shape, scoped) | Closed-world shape over the *already-fixed* D16 relator enum | Cold-catching R1 was hard/semantic; **regression-locking it after the required R1 fix is trivially structural** — an `sh:in` enumeration on D16's relation-type, `sh:minCount` on the 7 fields. Not a premature validator: a lock on a fix already mandated. | R1/C4 fix freeze · `2026-07-07-…-contradiction-collapse-review/findings.md` R1/C4 (LIVE, unfixed); precedent Rows 8/9/11 map rule/constraint onto SHACL | Precedent-owned mapping exists; no gate deployed | **PILOT — SEQUENCED** (gated). Fires **only after** the R1 fix lands and freezes D16's relator enum. R1 was missed by 2 attackers + 3 verifiers *and left unresolved* → manual/LLM review is **falsified twice**; a one-shape structural lock is the proportionate backstop. See sequencing note. *(adv Seam E; skep §6; GAP-HUNTER)* |
| **SHACL + pySHACL — new shapes (global)** | Authoring new constraint shapes over the def graph | Would enforce structural constitution checks broadly | Kind-enumeration scan · blocked by `DEFINITION-SCHEMAS.md` (most defs not RDF-stable) | Same | **DEFERRED** — OQ-1 forbids authoring shapes over unstable defs; distinct from the D16-only lock above. Adopt-conservative keeps everything beyond the single R1-lock shape parked. |
| **native INDEX GENERATOR** (deterministic script, **not** LinkML) | Regenerate `DEFINITIONS-INDEX` from already-stable slots (id / term / one-liner) | The index is a *projection* of stable slots; a minimal native generator closes the manual index-sync gap **without** inheriting LinkML's schema/RDF/OWL block. | Synced-index maintenance · `DEFINITIONS-INDEX.md`; sync is manual | The synced index exists; sync is by hand | **PILOT (native task)** — gap-hunter carve, separable from OQ-1. **Caveat (claim≤proof):** *no demonstrated index-drift failure is on record* → book-keeping relief, not a proven-pain fix. Tier reflects that: a low-cost native task, not an urgent adopt. *(GAP-HUNTER)* |
| **markdownlint** | Markdown style/structure linter | Structural MD hygiene (well-formed lists/headings/tables) so the frontmatter layer isn't defeated by malformed Markdown. | Structural MD conformance · adv Seam G | No explicit equivalent | **PILOT** — near-zero cost, no boundary risk, complements lychee. **Rationale corrected (inflation-hunter):** it does **not** own *template conformance* — that is the frontmatter-linter's job. markdownlint is generic MD hygiene only; no readiness cite pins it to *now*, so below ADOPT. *(adv Seam G)* |
| **sentence-transformers (SBERT / NLI)** | Semantic similarity / NLI-contradiction pre-screen over def text | Would give a reproducible near-dup + contradiction shortlist | Candidate intake · contradiction pre-screen · adv Seam E | Contradiction hunt is LLM-subagent dispatch (the R1/C4 miss) | **DEFERRED** (was PILOT) — inflation-hunter wins three ways: (1) it pre-screens *into* SHACL, but SHACL is DEFERRED/gated below it — piloting the on-ramp above an OQ-1-forbidden gate; (2) **skeptic never tested it** — advocate-only silence ≠ concurrence; (3) pulls `torch` + hundreds-of-MB weights, a shipped-runtime/leak surface the downloadable-repo boundary (`CAV2-D1`, C10) protects — and NLI-contradiction is itself **stochastic**, not the deterministic backstop OQ-1 wants. *(adv Seam E)* |
| **Vale** | Markup-aware prose/terminology linter | Could tripwire an undefined critical term cheaply in CI | Terminology consistency · adv Seam G | Yes — `DEFINITION-DRIFT-AUDIT.md` runs a **manual owner-owned** governance sweep (caught "canonical artifact" pre-`CAV2-D51`) | **REJECT** (was DEFERRED) — inflation-hunter: **redundant** with the owner-owned drift audit (a governance act, not a lint), can't catch semantic drift, and creates **friction against the deliberate prose-first authorial voice**. Not a drift authority. *(adv Seam G; skep §7)* |
| **LinkML** | Author one YAML schema; generate JSON-Schema / SHACL / OWL / SQL / docs | Would generate index + all downstream shapes | Definition template · feeds Seams A/B/E | Synced index + template exist; sync manual | **DEFERRED** — inherits the OQ-1 freeze (it *generates* the premature JSON-Schema/SHACL) and pulls in the rejected OWL/RDF stack. **The index-sync slice is now met natively** (row above) *without* this block. *(adv Seam A; skep §4/§6)* |
| **OWL reasoner** (HermiT / ELK / Openllet) | Prove ontology (in)consistency; explain conflicting axioms | Open-world contradiction surfacing | Contradiction gate · R1/C4 cite | Explicitly rejected by design — CAV2 is "a structural signature with **no reasoner**" (precedent Row 1) | **REJECT** — inference-that-decides breaks Non-Collapse rule 2. Held. *(adv Seam E; skep §6)* |
| **OPA/Rego + conftest, or CUE** | Policy-as-code pass/deny/warn over structured files | Would run the constitution DAG check | Constitution enforcement · adv Seam D | Checking is **owned** — Cedar SMT + sorry-free Lean `decidePolicy_sound` | **REJECT** — redundant engine, schema mid-promotion (D53/54/55, OQ-2 open), public Rego risks leaking the paid moat (`boundaries.md`). Held. *(adv Seam D; skep §3)* |
| **W3C PROV-O / PROV-DM** | Standard provenance ontology | Standardizes import manifests | Import manifests · adv Seam F | Already the design backbone — precedent Row 8 | **REJECT** — concept already owned; RDF serialization is redundant weight. Held. *(adv Seam F; skep §5)* |
| **SKOS** (+ VocBench / TemaTres) | W3C thesaurus model + vocab-editing platforms | broader/narrower/related for the index | Vocabulary model · adv Seam C | `DEFINITIONS` + `INDEX` + aliases ≈ a concept scheme | **REJECT** — freezes `RELATION-MODEL` (candidate, OQ-1); auto-suggest = inventory deciding authority (rule 2); platforms add runtime + leak surface. Held. *(adv Seam C; skep §2)* |
| **Graph DB** (TerminusDB / Neo4j) | Git-for-data / property graph with DAG procedures | Lifecycle + acyclicity gate | Ontology store · adv Seam B | Graph layer exists only in **un-promoted** house_project import | **REJECT** — proximity/import-before-promotion (C11), unstable NODE/RELATION-MODEL (OQ-1), runtime store defeats downloadable-repo goal + leak surface. Held. *(adv Seam B; skep §1)* |
| **DVC / Frictionless** | Hash-pinned data/pipeline versioning | Source-vault drift by hash | Import-manifest pinning · adv Seam F | Manual hash-pin already covers single-import scale | **DEFERRED** — pipeline runtime is weight the boundary doesn't yet warrant. Held. *(adv Seam F)* |
| **TBX (ISO 30042)** | XML terminology interchange | Export target if CAV2 ever interoperates | Definition interchange · adv Seam C | No current interop need | **REJECT** — speculative interop. Held. *(adv Seam C)* |

---

## Net verdict

One clean **ADOPT-NOW** survives — the link-check *capability* (lychee), adopt-on-OQ-1-
ratification and tool-agnostic. The R2 correction is not a new adoption but a **precise
re-scoping**: three blanket DEFERRALs each hid a small, boundary-safe slice that is stable
today — a **D16-only SHACL regression-lock** (sequenced behind the mandatory R1 fix), a
**stable-slot frontmatter lint**, and a **native index generator** (no LinkML block, with an
explicit no-proven-pain caveat). Adopt-conservative simultaneously *killed* an over-reach:
SBERT drops PILOT→DEFERRED (torch/leak surface + skeptic-untested + it feeds a gate that
isn't open) and Vale drops to REJECT (redundant with the owner's drift audit). Everything
schema-heavy or reasoner/graph/policy-shaped stays blocked by the owner's deliberate
prose-first / schema-stable-before-validator precondition or by Non-Collapse rule 2.

## Sequencing note — what must happen before SHACL / frontmatter-lint activate

1. **SHACL D16 regression-lock is strictly gated.** It does **nothing** until the **R1/C4
   fix lands in `DEFINITIONS.md`** — i.e. D29's relator enumeration is corrected to require
   D16's 7-field typed relation, and D16's relation-type enum is **frozen**. Only then does
   the one-shape pySHACL gate (`sh:in` over the frozen enum + `sh:minCount` on the 7 fields)
   become a trivial structural lock. **Order: fix R1 → freeze D16 enum → add the single
   regression shape.** Never author the shape first (that would be a premature validator over
   an unstable def, which OQ-1 forbids).
2. **frontmatter-lint activates in two stages.** The **stable-slot subset** (id-format +
   required-slot presence) can pilot **now** — those slots do not move under the freeze. The
   **full-template** lint waits on the **decision-gate resolution** of the NODE-MODEL
   candidate status and the confidence-field rename; it stays DEFERRED until then.
3. **Native index generator has no gate** — it projects already-stable slots (id / term /
   one-liner) — but ships as low-priority book-keeping relief, since no index-drift failure
   is yet on record.
4. **Everything else** (LinkML, full SHACL authoring, graph/RDF/reasoner/policy/SKOS) stays
   parked behind the same OQ-1 freeze or the Non-Collapse invariant; do not reopen on the
   strength of the three scoped carve-outs above.
