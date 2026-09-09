# P2 — cyberAlchemy-v2 OSS Tooling: SYNTHESIS (advocate ⋈ skeptic)

**Role:** Synthesizer. Reconciles `p2-cyberalchemy-advocate.md` (external-OSS *for* case)
and `p2-cyberalchemy-skeptic.md` (internal-owned-route *against* case) into one candidate
table. Adjudication only — no re-research.

**Adjudication rule (adopt-conservative):** on a genuine tie the skeptic wins and the tier
drops. The skeptic carries a live master precedent —
`development/research/2026-06-24-ontology-engineering-precedent/findings.md`: *"cite the
precedent, do not adopt"* on ~9 of 11 ontology candidates — plus three blocking stances:
prose-first / schema-stable-before-validator (**OQ-1**), authority-by-owner-route
(AUTHORITY-MODEL §Authority Rule + 7 Non-Collapse Rules), and the public/private +
downloadable-repo boundary (`boundaries.md`; STABLE-REPO C5/C10; `CAV2-D1`). Both agents
converge on exactly two things: **lychee is a clean adopt-now** (it *is* the STABLE-REPO
OQ-1 first-validator answer), and a **SHACL shape / OWL reasoner is the one tool that would
have mechanically caught the D29↔D16 contradiction** that survived hand-review — but it is
blocked by OQ-1 (schema not frozen) and is only *partly* structural.

---

## Candidate table

| Tool | What | Why it would help | Where (seam + file cite) | Already doing something similar? | Tier |
| --- | --- | --- | --- | --- | --- |
| **lychee** | Fast async Markdown/HTML link checker | Authority spine is a mesh of relative `.md` links; a broken cross-ref silently breaks traceability (`CAV2-D36`). Deterministic, no schema dep, no runtime in shipped repo, no leak surface. | Index/cross-ref integrity · `STABLE-REPOSITORY-CONSTITUTION.md` OQ-1 ("Markdown link checks" = *first* validator); C1 Validation-Adapter "Markdown link check"; `AUTHORITY-MODEL.md` §Validation Surface ("link-backed") | Manual link discipline only — no deterministic gate exists yet | **ADOPT-NOW** — both agents agree; it *is* the OQ-1 answer, not a premature one. *(advocate Seam G; skeptic §7)* |
| **JSON-Schema / frontmatter lint** (remark-lint-frontmatter-schema, or CUE) | Validate Markdown YAML frontmatter against a schema in CI/editor | Enforces the fixed def template deterministically; natural *second* deterministic gate after links. | Definition-template conformance · `DEFINITION-SCHEMAS.md` (schema handles tracked "review; machine validator deferred"); vault frontmatter in `ontology-conventions.md` | Yes — `DEFINITION-SCHEMAS.md` tracks schemas **documentary-first, by design** | **DEFERRED** — textbook OQ-1 freeze: NODE-MODEL is candidate, confidence-field rename is a pending decision-gate reversal. Skeptic concedes it is welcome *after* decision-gate stabilization. *(advocate Seam A; skeptic §4)* |
| **SHACL + pySHACL** | Closed-world shape/constraint validation over an RDF graph | The tantalizing gap: a shape over a *formalized* D16 (`sh:minCount` on the 7 fields, `sh:class` forcing relation-type ≠ gate/owner-decision) **would have flagged R1/C4 (D29↔D16) mechanically** — the defect that survived two attackers + three verifiers. | Kind-enumeration scan · structural constitution checks · `2026-07-07-…-contradiction-collapse-review/findings.md` R1/C4; blocked by `DEFINITION-SCHEMAS.md` (D16 on the "not yet tracked" backlog) | Precedent-owned: findings Rows 8/9/11 map the rule/constraint/signal/test tuple onto SHACL; `forbidden_collapse` = OntoClean prohibition | **DEFERRED** — real gap, real block. Needs D16/D29 frozen as RDF shapes (OQ-1 forbids; D16 not even documentary-stable), and the defect is a semantic-kind mismatch only *partly* structural. Adopt-conservative → below PILOT. *(advocate Seam E; skeptic §6)* |
| **OWL reasoner** (HermiT / ELK / Openllet / Konclude) | Prove ontology (in)consistency; explain the conflicting axioms | Open-world complement to SHACL: disjointness axioms + explanation routines would surface D29↔D16 the LLM hunt missed. | Contradiction/consistency gate · same R1/C4 cite; `AUTHORITY-MODEL` reasoner stance | Explicitly **rejected by design**: CAV2 is "a structural signature with **no reasoner**" (precedent Row 1) | **REJECT** — inference-that-decides breaks Non-Collapse rule 2 (ontology models, cannot decide authority). The one advocate tool the skeptic's core invariant structurally forbids. *(advocate Seam E; skeptic §6)* |
| **LinkML** | Author one YAML schema; generate JSON-Schema / SHACL / OWL / SQL / docs | Advocate's keystone: treat defs as data, generate the index + all downstream shapes, collapse the manual sync. | Definition template · synced index · feeds Seams A/B/E · advocate Seam A | The synced index + fixed template exist (`DEFINITIONS-INDEX.md`); sync is manual | **DEFERRED** — inherits the OQ-1 freeze (it *generates* the very JSON-Schema/SHACL that are premature) and pulls in the rejected OWL/RDF stack. Highest-leverage *if* schema were stable; it isn't. *(advocate Seam A ranked #1; skeptic via §4/§6 preconditions)* |
| **OPA/Rego + conftest, or CUE** | Declarative policy-as-code; pass/deny/warn over structured files | Would turn the 16+ constitutions "pointing at a future validator" into a running one with pass/flag/block/defer verdicts; expresses the DAG check. | Constitution enforcement · promotion-gate verdicts · C1–C17 `Validation mode`; advocate Seam D | Yes — checking is **owned/deployed**: Cedar SMT + our own sorry-free Lean `decidePolicy_sound` (FOL research `…04-skeptic-quine.md`) | **REJECT** — redundant (Cedar/Lean own the checking; open residue is *encoding axioms*, not the engine), schema mid-promotion (D53/D54/D55 promoted 2026-07-08, OQ-2 open), and public Rego bundle risks leaking the paid deterministic moat (`boundaries.md` §Free/Paid). *(advocate Seam D; skeptic §3)* |
| **W3C PROV-O / PROV-DM** | Standard provenance ontology (Entity/Activity/wasDerivedFrom) | Standardizes import manifests + source-clusters; `derives-from` *is* `prov:wasDerivedFrom`. | Import manifests · source-clusters · advocate Seam F; `CAV2-D35/D24`; `lifecycle_log` | **Already deployed as design** — precedent Row 8: governed-map-with-receipts "COLLAPSES to RDF+PROV-O with no remainder"; Non-Collapse proviso cites `prov:wasGeneratedBy` | **REJECT** — the *concept* is already the backbone; adopting the *RDF serialization* is redundant + extraction weight over a lossless Markdown append-only list. *(advocate Seam F; skeptic §5)* |
| **SKOS** (+ VocBench / TemaTres) | W3C thesaurus model + governed vocab-editing platforms | broader/narrower/related + prefLabel/altLabel + scopeNote for the index; VocBench = promotion-lifecycle-as-shipped-software. | Vocabulary model · candidate/canonical status · advocate Seam C | Yes — `DEFINITIONS` + `INDEX` + aliases = a concept scheme; genus/instance is load-bearing; vault 7-label catalog is a fuller thesaurus | **REJECT** — the relations SKOS would freeze map onto `RELATION-MODEL`, which is **candidate** and blocks ledger promotion (OQ-1); auto-suggest promotion = inventory deciding authority (C4 / rule 2). VocBench/TemaTres add runtime + leak surface. *(advocate Seam C; skeptic §2)* |
| **Graph DB** (TerminusDB / Neo4j+APOC/GDS) | Git-for-data graph store / property graph with DAG + cycle procedures | TerminusDB branch/merge ≈ candidate→canonical lifecycle; GDS topological-sort = the DAG gate. | Ontology store · promotion lifecycle · acyclicity gate · advocate Seam B | Yes — a graph layer **physically exists** as `ontology_edges` SQL, but only inside the **un-promoted** house_project import (`imports/house_project/docs/vault/ontology-conventions.md`) | **REJECT** — promoting import machinery into authority is textbook proximity-promotion (C11 import-before-promotion forbids); NODE/RELATION-MODEL unstable (OQ-1); a runtime store defeats the downloadable-repo goal (`CAV2-D1`, C10) and is a leak surface (C5). *(advocate Seam B; skeptic §1)* |
| **sentence-transformers (SBERT/NLI)** | Deterministic-scored semantic similarity / NLI-contradiction over def text | Thresholded near-duplicate + contradiction pre-screen; reproducible vs ad-hoc subagent dispatch. | Candidate intake · contradiction pre-screen · advocate Seam E | Contradiction hunt is currently LLM-subagent dispatch (the R1/C4 miss) | **PILOT** — the one *net-new* capability with no owned equivalent and low boundary cost (offline, no shipped runtime, scores not decisions → doesn't touch Non-Collapse). A ranked shortlist for humans/SHACL to confirm. Advocate-only; skeptic silent → pilot, not adopt. *(advocate Seam E)* |
| **Vale** | Markup-aware prose/terminology linter (YAML rules) | Could tripwire an undefined critical term or an alias used as canonical, cheaply in CI. | Terminology consistency · superseded-term bans · advocate Seam G | Yes — `DEFINITION-DRIFT-AUDIT.md` runs a **manual** definitions-governance sweep (caught "canonical artifact" pre-`CAV2-D51`) | **DEFERRED** — redundant with the drift audit (a governance act, not a lint), can't catch semantic drift, risks fighting the deliberate authorial voice. Optional undefined-term tripwire only, never a drift authority. *(advocate Seam G; skeptic §7)* |
| **markdownlint** | Markdown style/structure linter | Enforces the structural regularity the fixed template assumes so the frontmatter layer isn't defeated by malformed MD. | Template structural conformance · advocate Seam G | No explicit equivalent | **PILOT** — near-zero-cost, no boundary risk, complements lychee; but no stated readiness cite pins it to now, so below ADOPT. *(advocate Seam G)* |
| **DVC / Frictionless** | Hash-pinned data/pipeline versioning; drift by hash mismatch | `dvc.lock`-style hashing makes source-vault drift detectable and re-import reproducible. | Import-manifest pinning · source-drift detection · advocate Seam F | Import manifests already pin source commit hashes by hand (`imports/house_project/IMPORT-MANIFEST.md`) | **DEFERRED** — the manual hash-pin already covers today's single-import scale; a pipeline runtime is weight the downloadable-repo boundary doesn't yet warrant. *(advocate Seam F)* |
| **TBX (ISO 30042)** | XML interchange format for terminological data | A standardized export target *if* CAV2 ever interoperates with terminology tooling. | Definition interchange · advocate Seam C | No current interop need | **REJECT** — solves a problem CAV2 does not have; speculative interop. *(advocate Seam C)* |

---

## Net verdict + genuine gaps

**Net:** exactly one clean adopt — **lychee** — where both agents and CAV2's own stated
readiness (STABLE-REPO OQ-1) coincide; everything schema-shaped is blocked by the
owner's deliberate prose-first / schema-stable-before-validator precondition (OQ-1), and
the heavier graph/RDF/reasoner/policy stack is either already-owned precedent, a
Non-Collapse violation, or an extraction/moat-boundary risk. The frontmatter linter and
the SHACL shape are the correct *second and third* steps, parked at DEFERRED until
NODE-MODEL and D16/D29 are decision-gate-stable — real capability waiting on a real
precondition, not a rejection.

**The two genuine gaps no owned route yet closes:** (1) **manual index/schema sync** — the
`DEFINITIONS-INDEX` and drift audit are hand-maintained projections that LinkML/JSON-Schema
would automate the day the schema freezes; and (2) **LLM-only contradiction detection** —
the D29↔D16 defect proved the subagent hunt is not a backstop, and the deterministic tool
that would catch it (SHACL over a formalized D16, optionally SBERT-triaged) is exactly the
one OQ-1 currently forbids. Adopt-conservative holds: bank lychee now, pilot the
zero-boundary offline aids (SBERT pre-screen, markdownlint), and let the schema-freezing
tools wait on the decision gate rather than freeze the wrong shape.
