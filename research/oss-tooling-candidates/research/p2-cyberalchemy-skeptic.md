# P2 — SKEPTIC finder: OSS tooling candidates vs. what CAV2 already owns

Role: adopt-conservative skeptic. Corpus = internal `cyberAlchemy-v2/`. For each
candidate an advocate might raise, the burden is (a) we already do the equivalent
by owner route, or (b) adopting now is premature-formalization / a boundary or
extraction risk. Honest concessions flagged where a tool would genuinely help.

## The four stances, verified in-file (the yardsticks I hold every tool against)

1. **Prose first, tool later.** `DEFINITION-SCHEMAS.md` OQ-1: "keep documentary
   tracking as the baseline; promote a schema to machine-checkable form only when
   an implementation or validation surface needs it." `STABLE-REPOSITORY-CONSTITUTION.md`
   OQ-1: "start with Markdown link checks and source-map field checks before
   writing broader validators." Tracked schemas are explicitly *documentary*, not
   validators (`DEFINITION-SCHEMAS.md` §Purpose).
2. **Schema stable BEFORE validator (AUTHORITY-MODEL OQ-1).** "write a deterministic
   check only after the authority object schema and promotion records are stable
   enough to avoid freezing the wrong shape." The authority-object schema is a
   **candidate, non-executed proposal** (`ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md`,
   status "candidate proposal"); NODE-MODEL is not yet amended; decision-gate has
   not declared it stable; RELATION-MODEL is "still candidate" (drift audit, ledger
   HELD row). **Every schema-freezing tool is premature by CAV2's own precondition.**
3. **Authority moves by owner route, not proximity/usefulness/repetition**
   (`AUTHORITY-MODEL.md` §Authority Rule; 7 Non-Collapse Rules). A tool that lets
   inventory/ontology/a graph store *decide* rather than *model* violates C4/rule 2.
4. **Public/private boundary + downloadable "stable repository" goal**
   (`boundaries.md`; `STABLE-REPOSITORY-CONSTITUTION.md` C5/C10; `CAV2-D1`). Any tool
   that adds a runtime dependency, an external store, or app/plugin state raises the
   extraction bar and the leak surface. Demonstrated concern: the house_project
   import **excluded 21 `.obsidian/` files** precisely because "plugin settings can
   contain local credentials and machine-specific state" (`imports/house_project/IMPORT-MANIFEST.md`).

**Master precedent.** `development/research/2026-06-24-ontology-engineering-precedent/findings.md`
already ran this exact sweep against the ontology field and returned:
*"Almost everything in CAV2's ontology apparatus is already owned by the 30-year-old
field — build-from-owned or already-deployed on ~9 of 11 candidates."* It maps
DL/TBox-ABox, OntoClean, OntoUML Phases, SHACL, RDF+PROV-O, GRADE, TopBraid EDG onto
CAV2's parts. Critically, its verdict is **cite the precedent, do not adopt the tool** —
CAV2 deliberately keeps a *structural signature with no reasoner* (Row 1). So most of
what follows is CAV2 re-confirming a decision it already recorded.

---

## Candidate-by-candidate

### 1. Graph DB / RDF-OWL (triple store, reasoner-backed node/edge model)

**Already done.** The typed node/edge model exists as `NODE-MODEL` (concepts) +
proposed instance layer + `RELATION-MODEL` — all **candidate**, deliberately
"read-only structural signature, no RBox, no reasoner" (precedent findings Row 1).
A working graph layer *already physically exists* but only inside the imported,
un-promoted house_project vault: `imports/house_project/docs/vault/ontology-conventions.md`
defines an `ontology_edges` SQL table storing "both directions as computed rows
derived from the Markdown declarations" with a 14-type edge catalog and
directionality rules. **That is a graph DB already.**

**Why adopting is wrong now.** (a) The `ontology_edges` table lives in an *import
candidate*. Promoting its machinery into CAV2 authority is textbook
promotion-by-proximity — the exact move `AUTHORITY-MODEL` §Authority Rule and C11
(import-before-promotion) forbid. (b) OQ-1: NODE-MODEL/RELATION-MODEL are not stable;
a triple store would freeze the wrong shape. (c) Extraction/boundary: a graph DB is
a runtime dependency a "downloadable stable repository" (`CAV2-D1`, C10) must ship
and a hosted store is a private-evidence leak surface (C5). Markdown+frontmatter
extracts clean; a triple store does not. **Verdict: redundant + premature + extraction risk.**

### 2. SKOS / thesaurus (preferred/alt labels, broader/narrower, concept scheme)

**Already done by owner route.** `DEFINITIONS.md` + `DEFINITIONS-INDEX.md` +
per-term **aliases** are a concept scheme with preferred label (the CAV2-D id/term)
and alt labels (aliases) governed by definitions-governance. SKOS `broader/narrower`
= the **genus/instance** structure the contradiction review found load-bearing
(D48→D43/D46, D29→D22, D11→D14/D15; `2026-07-07-definitions-contradiction-collapse-review/findings.md`
§4). The imported vault's orthogonal 7-label catalog + tag system + edge catalog is
a fuller thesaurus already (`ontology-conventions.md`).

**Why adopting is wrong now.** The relation semantics SKOS would formalize
(`broader`, `related`, `contradicts`) map onto `RELATION-MODEL`, which is **candidate**
and blocks the ledger promotion (drift audit: "v2 relation profile … UNMET"). Freezing
a SKOS scheme now = OQ-1 violation. Also: definitions-governance owns term promotion;
a SKOS auto-suggest that promoted a concept because it fit the hierarchy would be
inventory/ontology promoting itself (C4, non-collapse rule 2). **Verdict: redundant + premature.**

### 3. OPA / CUE (policy-as-code, schema+constraint validation)

**Already scoped, and the answer was "not yet."** Constitution rules CAV2-C1…C17
carry explicit `Validation mode: review | hybrid` and a Validation Adapters table
that names *future* validators ("future edge validator," "future architecture package
validator"). The FOL-validation research (`2026-06-28-constitution-fol-validation-path/agents/04-skeptic-quine.md`)
did the ruthless ownership sweep: cross-rule contradiction/satisfiability checking is
**owned-by-field** (Cedar Analysis SMT — decidable/sound/complete; FORGE/PCAS Datalog;
Alloy/Z3) and, for the permission constitution, **already-deployed in our own Lean**
(`decidePolicy_sound`, sorry-free). The genuinely open residue is *"encoding our A1–A6
governance axioms into formulae,"* **not** the checking engine — "build-state ≠
precedent-state."

**Why adopting is wrong now.** OPA/CUE would demand a frozen policy schema. The policy
*content* (the axiom→invariant→constitution→validator ladder) is mid-promotion:
`CAV2-D53/D54/D55` (axiom/invariant/premise) were promoted only 2026-07-08 and OQ-2
(are invariant/axiom first-class kinds?) is **still open**. Encoding constitutions into
Rego/CUE now freezes a ladder the owner is actively reshaping. And it's a moat-boundary
risk: the deterministic engine (Lean validations, `parse→δ→key→emit`) is the **paid
moat** — never disclosed (`boundaries.md` §Free/Paid). A public OPA bundle of the
governance rules risks leaking mechanism. **Verdict: redundant (Cedar/Lean own the
checking) + premature (schema unstable) + moat-boundary risk.**

### 4. JSON-Schema / frontmatter linting

**Already done, documentary-first by design.** `DEFINITION-SCHEMAS.md` tracks
schema handles (`CAV2-D23-SCHEMA`, `CAV2-D51-SCHEMA`) with an explicit witness column
reading "review; machine validator deferred." The imported vault already runs required
frontmatter with a typed field set (`node_type | layer | nature | status | veracidade |
convicção | tags`, `ontology-conventions.md`). The authority-object-schema proposal
even hand-specifies the instance-node contract fields (§3). So the *schema* exists in
prose; the deliberate choice is not to freeze it into a linter.

**Why adopting is wrong now.** This is the single sharpest OQ-1 collision: a JSON-Schema
validator IS "freezing the shape," and the shape is a candidate proposal whose two-axis
split (`instance status` ↔ `concept candidate_status`) is flagged "must be confirmed by
the ontology route" (proposal §8). The confidence-field rename (`veracidade/convicção`
→ `evidence_confidence/commitment_confidence`) is a *pending decision-gate reversal*
(proposal §4, G7). Lint against today's frontmatter and you hard-fail every grandfathered
legacy node and lock in keys the owner is mid-decision on. **Honest concession:** *once*
NODE-MODEL is decision-gate-stable, a frontmatter linter is the natural first deterministic
gate — but that is precisely the post-OQ-1 world CAV2 says to wait for. **Verdict: premature
(the textbook OQ-1 case); cheap and welcome *after* stabilization.**

### 5. W3C PROV (provenance ontology)

**Already deployed conceptually.** Provenance is a *promoted* definition
(`CAV2-D35` provenance, `CAV2-D24` provenance-first navigation). The authority-movement
record (`lifecycle_log`: append-only `CAV2-D26` events with `event_kind`, `from→to`,
`owner_route`; proposal §4 G9) is a PROV activity chain. The precedent findings Row 8
already ruled: "governed map with receipts **COLLAPSES to RDF+PROV-O with no remainder**"
— PROV-O is cited precedent, not a novelty. The load-bearing Non-Collapse proviso (§3)
*uses PROV as its own justification*: "a node can carry `prov:wasGeneratedBy` an external
activity — it records a verdict produced elsewhere without being the authority for it."

**Why adopting is wrong now.** PROV-O the *concept* is already the design's backbone;
PROV-O the *serialization* means RDF tooling (see #1's extraction/leak cost) to express
a lifecycle_log that a Markdown append-only list already carries losslessly. **Verdict:
already-deployed as design; adopting the RDF stack is redundant + extraction weight.**

### 6. SHACL / reasoner (shape validation + inference over the graph)

**Already scoped as precedent, not tool.** Precedent findings Rows 8/9/11: the
rule/constraint/signal/test four-tuple "= SHACL architecture (W3C 2017)"; per-node
constraints + lifecycle gate + request-changes "already shipped in TopBraid EDG." CAV2's
`forbidden_collapse` = OntoClean subsumption prohibition; `challenge_contract` = challenge
protocol. All **build-from-owned / already-deployed** — the findings' single instruction
is "cite it, drop every 'we invented this'." A reasoner is explicitly *rejected*: CAV2 is
"a structural signature with **no reasoner**" (Row 1) — inference-that-decides would break
Non-Collapse (ontology models, cannot decide authority; rule 2, the load-bearing spine).

**Honest concession — the one contradiction they could not catch by hand.** The
contradiction review's surviving defect **R1/C4** (D29 licenses a bare 4-field
gate/owner-decision as a sufficient relator, contradicting D16's mandatory 7-field typed
relation) **survived two attackers + three verifiers** and was caught only by a
coverage-auditor pressure-test. A SHACL shape over a *formalized* D16 typed-coupling
record — `sh:minCount` on the 7 fields, `sh:class` forcing relation-type ≠
gate/owner-decision — would have flagged it mechanically. This is the real case for a
shape validator. **But the cost is exactly the stances:** (a) SHACL needs D16/D29 frozen
as RDF shapes — OQ-1 says don't, and D16 is on the *backlog* of schema-bearing definitions
"not yet tracked" (`DEFINITION-SCHEMAS.md`), i.e. not even documentary-stable yet; (b) the
defect was a **semantic enumeration mismatch** (is a gate the same *kind* as a typed
relation?), only *partly* structural — a shape checks field count cleanly but the
"different ontological kind" half still needs human judgment; (c) RDF/reasoner extraction
+ leak cost from #1. **Verdict: build-from-owned; a shape validator is the strongest
post-OQ-1 candidate but blocked today by the very schema instability it would police.**

### 7. Vale / lychee (prose linting / link checking)

These are the two lightest tools and the honest split lands here.

**lychee (link checker) — ADOPT; genuine fit, near-zero boundary risk.**
`STABLE-REPOSITORY-CONSTITUTION.md` OQ-1 names "Markdown link checks" as the *first*
deterministic validator to build, and the Validation Adapters table assigns C1 a
"Markdown link check." `AUTHORITY-MODEL.md` §Validation Surface is "review-first and
**link-backed**" — the whole authority spine is a mesh of relative `.md` links
(DEFINITIONS ↔ INDEX ↔ AUTHORITY-MODEL ↔ CANONICAL-KINDS). A broken cross-link silently
breaks traceability (`CAV2-D36`). lychee is deterministic, no schema dependency, no
runtime in the shipped repo, no private-leak surface. **This is the one tool that
matches CAV2's stated readiness exactly — it *is* the OQ-1 answer, not a premature one.**

**Vale (prose/terminology linter) — redundant + weak.** Term drift is already owned:
`DEFINITION-DRIFT-AUDIT.md` runs a manual definitions-governance pass with an "Undefined
Critical Terms" table and per-term drift findings (e.g. it caught "canonical artifact"
prose predating `CAV2-D51`). Vale could enforce *terminology consistency* (flag an
undefined critical term, flag an alias used as canonical) cheaply — a minor honest plus.
But (a) it duplicates the drift audit's manual sweep, which the owner treats as a
governance act, not a lint; (b) it cannot catch **semantic** drift (the C51-vs-prose
sense inversion, the D29/D16 contradiction) — those need judgment; (c) "prose first"
means the prose is the deliverable, and a style linter risks fighting the authorial voice
the definitions-governance contract deliberately carries (normative/plain/domain-context
voices). **Verdict: redundant with the drift audit; adopt only as an optional
undefined-term tripwire, never as a drift authority.**

---

## Summary verdict table

| Candidate | Already do it? (cite) | Adopt now? | Primary reason |
| --- | --- | --- | --- |
| Graph DB / RDF-OWL | NODE/RELATION-MODEL (candidate); `ontology_edges` SQL in imported vault | **No** | proximity-promotion + OQ-1 + extraction/leak |
| SKOS / thesaurus | DEFINITIONS + INDEX + aliases; genus/instance; vault 7-label catalog | **No** | RELATION-MODEL candidate → OQ-1 |
| OPA / CUE | C1–C17 review/hybrid modes; Cedar/Lean own checking (FOL research) | **No** | schema unstable + moat-boundary |
| JSON-Schema / frontmatter lint | DEFINITION-SCHEMAS (documentary); vault frontmatter | **Not yet** | textbook OQ-1 freeze; welcome post-stabilization |
| W3C PROV | CAV2-D35/D24; lifecycle_log; findings Row 8 (=PROV-O) | **No** | already-deployed as design; RDF weight |
| SHACL / reasoner | findings Rows 8/9/11 (=SHACL/EDG); forbidden_collapse | **No (concede)** | *could* catch R1/C4 but needs frozen schema (OQ-1) + reasoner breaks Non-Collapse |
| Vale | DRIFT-AUDIT (manual) | **No / optional** | redundant; can't catch semantic drift |
| **lychee** | C1 adapter + link-backed validation surface | **YES** | matches STABLE-REPO OQ-1 exactly; no boundary cost |

**One-line skeptic position.** CAV2 has *already run the precedent sweep* (the
2026-06-24 ontology-engineering findings) and *already recorded* that its ontology
apparatus is build-from-owned — so the advocate's tools are, with one exception,
re-litigating a settled decision. Six of seven are blocked by the schema-stability
precondition (OQ-1) the owner set deliberately, by the authority-by-owner-route rule,
or by the extraction/moat boundary. The honest exceptions: **lychee is a clean adopt
today** (it *is* the OQ-1 first-validator answer), a **frontmatter/JSON-Schema linter
is the right second step but only after NODE-MODEL is decision-gate-stable**, and a
**SHACL shape is the one thing that would have caught the D29/D16 contradiction humans
nearly missed** — at the price of freezing exactly the schema OQ-1 says isn't ready.
