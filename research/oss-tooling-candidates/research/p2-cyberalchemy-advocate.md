# OSS Tooling Candidates for cyberAlchemy-v2 — ADVOCATE Report

**Role:** Advocate finder. Corpus = external OSS ecosystem. Stance = argue FOR
adoption, mapped to CAV2's hand-rolled governance seams. A separate skeptic owns
the internal-codebase counterargument (integration cost, prose-first culture,
build-vs-buy). This report is deliberately the *for* case.

**Date:** 2026-07-08

---

## Thesis

Nearly every seam CAV2 hand-rolls in Markdown — the synced index table, the drift
ledger, the "future validator," the 14 typed edges, the DAG check, the import
manifests, the LLM-dispatched contradiction hunt — has a mature, permissively
licensed OSS analogue that has already solved the *mechanical* half of the problem
deterministically. CAV2's genuinely novel contribution (the promotion lifecycle,
authority semantics, the domain vocabulary itself) is not what these tools replace;
they replace the **book-keeping** that CAV2 currently does by hand and by LLM,
freeing the prose layer to be prose. The strongest single move is to treat the
canonical definitions as **data with a schema** (LinkML) and generate the index,
JSON Schema, SHACL shapes, and OWL from one source — collapsing the manual sync.

Candidates are grouped by seam. Each: (1) tool + one-line what · (2) license ·
(3) why it helps · (4) where (which seam).

---

## Seam A — Definitions as data + the manually-synced index

The 52 CAV2-D* defs are a fixed template with a hand-maintained index table. This is
the highest-leverage seam: it is a schema + a projection, done manually.

### LinkML — author a schema in YAML, generate JSON Schema / SHACL / OWL / SQL DDL / Pydantic / GraphQL from one source
- **License:** Apache-2.0 (metamodel CC0). <https://linkml.io/> ·
  <https://github.com/linkml/linkml>
- **Why:** This is the keystone candidate. The CAV2-D* template *is* a LinkML class:
  slots for id, term, definition, examples, non-examples, selectors, provenance.
  From that single schema LinkML's generator framework emits JSON Schema (frontmatter
  validation), SHACL/ShEx (consistency shapes), OWL (reasoner input), SQL DDL (the
  ontology_edges table), and Markdown docs. The "manually-synced index" stops being
  maintained — it becomes a generated artifact. LinkML was built exactly for
  community-governed, evolving controlled schemas (biomedical GA4GH/OBO ecosystem),
  which is structurally the same problem as a governed authority spine.
- **Where:** definition template · synced index · frontmatter validation ·
  feeds every downstream seam (SHACL, OWL, SQL).

### JSON Schema + remark-lint-frontmatter-schema — validate Markdown YAML frontmatter against a schema, in-editor and in CI
- **License:** MIT (remark ecosystem). <https://github.com/JulianCataldo/remark-lint-frontmatter-schema>
  · <https://github.com/remarkjs/remark-lint>
- **Why:** If defs keep living as Markdown-with-frontmatter, this enforces the fixed
  template deterministically at author time (VS Code) and in CI — no def can be
  merged missing a slot or with a malformed ID. Draft-2019-09, `$ref` reuse across
  schemas. Pairs with LinkML (LinkML *generates* the JSON Schema; remark *enforces* it).
- **Where:** definition template conformance · candidate intake gate.

---

## Seam B — The ontology (nodes + 14 typed edges, O_U = (N,E,B,R,C,P,G))

CAV2 already has a SQL `ontology_edges` table from the imported vault. The edge
types (derives-from, validates, contradicts, supersedes, depends-on…) are exactly
RDF predicates; the model is already a graph in all but name.

### RDF/OWL + Protégé — W3C standard graph data model + the reference ontology editor
- **License:** Protégé BSD 2-clause (Stanford); RDF/OWL are open W3C standards.
  <https://protege.stanford.edu/>
- **Why:** The 14 edge types become named object properties with declared domain,
  range, and characteristics — `supersedes` and `derives-from` as transitive,
  `contradicts` as symmetric, `depends-on` as the DAG relation. Directionality is
  native. Protégé gives a governed, visual authoring surface and plugs directly into
  reasoners (Seam E). Turns "14 edge types described in prose" into a machine-checkable
  schema with formal semantics.
- **Where:** ontology model O_U · edge typing/directionality · reasoner input.

### TerminusDB — document graph database with Git-for-data: branch, diff, merge, time-travel on a schema-enforced graph
- **License:** Apache-2.0. <https://terminusdb.com/> · <https://github.com/terminusdb/terminusdb>
- **Why:** This is the most direct structural match to CAV2's *lifecycle*. TerminusDB's
  git-like branching maps almost one-to-one onto candidate→canonical: a candidate is a
  branch, promotion is a reviewed merge, the 7 rungs are merge gates, and every change
  is an immutable delta layer — which is *exactly* the append-only event semantics CAV2
  wants for the drift audit, but for free and query-able. Schema is enforced on write
  (no malformed edge). Time-travel = "what did the authority say at import commit X."
  GraphQL + a datalog engine for cross-graph queries. If CAV2 ever outgrows flat files,
  this is the platform whose native model already encodes its governance model.
- **Where:** ontology store · promotion lifecycle (branch/merge) · append-only drift
  audit · provenance time-travel.

### Neo4j + APOC / GDS — property-graph database with cycle-detection and topological-sort procedures
- **License:** Community Edition GPLv3; APOC Apache-2.0; GDS has an open core.
  <https://neo4j.com/docs/graph-data-science/current/algorithms/dag/topological-sort/>
  · <https://neo4j.com/docs/apoc/current/overview/apoc.nodes/apoc.nodes.cycles/>
- **Why:** Directly answers the "acyclic-edge (DAG) check" the constitutions want.
  GDS topological sort *is* the DAG test — "running topological sort is the best way to
  make sure the graph is a DAG"; nodes in a cycle are omitted, so the omitted set is
  precisely the cycle report. `apoc.nodes.cycles` detects cycles explicitly. This is a
  deterministic, production-grade replacement for hand-checking that `depends-on` /
  `derives-from` never loop.
- **Where:** acyclicity/DAG gate · dependency-cycle detection among defs.

---

## Seam C — Controlled vocabulary / thesaurus governance

CAV2 is, formally, a controlled vocabulary with a promotion workflow. The library-science
world has standardized this for decades.

### SKOS — W3C standard model for thesauri: broader/narrower, related, prefLabel/altLabel, scopeNote
- **License:** W3C Recommendation (open standard). <https://www.w3.org/TR/skos-reference/>
- **Why:** SKOS gives ready-made, interoperable predicates for exactly what CAV2
  hand-models: `skos:definition`, `skos:scopeNote` (the "intuition" slot),
  `skos:example`, `skos:broader/narrower/related`, and `skos:historyNote` for the drift
  ledger. `skos:Concept` vs candidate status maps to the lifecycle. Adopting SKOS means
  CAV2's vocab is portable to every thesaurus tool below and validatable by standard
  SKOS quality checkers (Skosify, SKOS testing).
- **Where:** vocabulary model · index semantics · candidate/canonical status.

### VocBench — web platform for collaborative editing of SKOS(-XL) / OWL / lexicons with workflow & roles
- **License:** Mozilla Public License (MPL). <https://op.europa.eu/en/web/eu-vocabularies/vocbench>
- **Why:** Purpose-built for *governed* vocabulary editing — it has a validation/publication
  **workflow with roles and states**, which is the candidate→canonical promotion lifecycle
  as shipped software. Used by the EU Publications Office to govern official vocabularies at
  scale. Multilingual, history-tracked. This is the closest off-the-shelf analogue to
  CAV2's governance surface.
- **Where:** promotion lifecycle UI · role-gated editing · drift history.

### TemaTres — lightweight web tool to manage controlled vocabularies/thesauri, exports SKOS/RDF/etc.
- **License:** GPL. <https://vocabularyserver.com/>
- **Why:** Much lighter than VocBench — a pragmatic middle rung if a full RDF platform is
  overkill. Manages term relations, exports to SKOS, gives a browsable published vocabulary.
- **Where:** vocabulary hosting/publication · lightweight index alternative.

### TBX (TermBase eXchange, ISO 30042) — XML standard for terminological data interchange
- **License:** ISO/open standard. <https://www.tbxinfo.net/>
- **Why:** If CAV2 ever needs to interoperate with terminology-management tooling, TBX is
  the interchange format with slots for definition, context, usage notes, and admin
  metadata — a standardized target for the fixed template.
- **Where:** definition interchange · template standardization.

---

## Seam D — Constitutions as policy-as-code (the "future validator")

16+ modular rule sets with glob Selectors, Validation mode, Examples/Non-examples,
"nearly all pointing at a future validator." This is textbook policy-as-code.

### Open Policy Agent (OPA) + Rego, via conftest — declarative policy engine; conftest runs Rego against structured config/text files
- **License:** Apache-2.0 (CNCF graduated). <https://www.openpolicyagent.org/> ·
  <https://github.com/open-policy-agent/conftest>
- **Why:** This *is* the "future validator," already built. Each constitution becomes a
  Rego package; the glob Selector picks the files; conftest evaluates and returns
  pass/deny/warn — which maps cleanly onto CAV2's pass/flag/block/defer gate verdicts.
  Rego's Examples/Non-examples are literally OPA's test fixtures (`_test.rego`). Even the
  DAG check is expressible: encode edges as facts, write a Rego rule that flags any node
  reachable from itself. Deterministic, CI-native, versioned. Stop describing a validator
  and run one.
- **Where:** constitution enforcement · promotion gate verdicts · kind-enumeration scan ·
  DAG check (alternative to Neo4j).

### CUE — configuration language that unifies schema + constraints + data in one type system
- **License:** Apache-2.0. <https://cuelang.org/>
- **Why:** CUE unifies "schema" and "validation" into one lattice — a natural fit for the
  fixed def template *plus* its constraints in a single file, with no separate schema/data
  split. Composes with conftest. Strong where constraints are structural rather than
  logical.
- **Where:** template + constraint unification · frontmatter validation alternative.

---

## Seam E — Consistency / contradiction detection (replacing the LLM subagent hunt)

CAV2 currently finds contradictions by dispatching LLM subagents — and a real D29↔D16
contradiction *survived* hand-review. That is the strongest evidence for a deterministic
layer: the LLM missed it; a reasoner over disjointness axioms would not.

### OWL reasoners — HermiT / ELK / Openllet / Konclude: prove ontology (in)consistency and explain the conflict
- **License:** HermiT LGPL; ELK Apache-2.0; Openllet AGPL; Konclude free (research).
  <http://www.hermit-reasoner.com/> · <https://github.com/liveontologies/elk-reasoner>
- **Why:** If `contradicts` and `supersedes` and disjointness are declared as OWL axioms,
  a reasoner *mechanically proves* whether the def set is consistent and, crucially, has
  **explanation routines that point at the exact conflicting axioms** — i.e., it would have
  surfaced D29↔D16 deterministically instead of relying on an LLM that missed it. Konclude
  and HermiT are top performers on consistency benchmarks. This is the deterministic
  backstop the LLM hunt lacks.
- **Where:** contradiction detection · consistency gate · supersede/contradict logic.

### SHACL + pySHACL — constraint language for RDF graphs; pySHACL validates in pure Python
- **License:** SHACL is a W3C Rec; pySHACL Apache-2.0. <https://github.com/RDFLib/pySHACL>
  · <https://www.w3.org/TR/shacl/>
- **Why:** SHACL is the closed-world "shape" check to complement the reasoner's open-world
  logic: "every canonical def MUST have ≥1 provenance edge," "a `supersedes` edge MUST point
  to a canonical (not candidate) node," "no node may both `validates` and `contradicts` the
  same target." pySHACL runs these in CI with a machine-readable violation report. LinkML
  can *generate* these shapes (Seam A), closing the loop. This directly implements the
  "deterministic kind-enumeration scan."
- **Where:** kind-enumeration scan · structural constitution checks · provenance-completeness.

### sentence-transformers (SBERT) — semantic similarity / near-duplicate / NLI-contradiction over text
- **License:** Apache-2.0. <https://github.com/huggingface/sentence-transformers> ·
  <https://sbert.net/>
- **Why:** A *deterministic-scored* (not free-form LLM) triage layer: cosine similarity over
  def embeddings flags near-duplicate terms (two defs converging on one concept) and
  redundant candidates before they're minted. NLI-tuned cross-encoders score
  entailment/contradiction between def pairs, giving a ranked contradiction shortlist that a
  reasoner or human then confirms — reproducible, thresholded, cheap, and auditable, unlike
  ad-hoc subagent dispatch. (Mutual-information / statistical co-occurrence over the edge
  graph is a lighter complementary signal for spotting under-connected or anomalous nodes.)
- **Where:** near-duplicate/redundancy detection · contradiction pre-screen · candidate intake.

---

## Seam F — Provenance (import manifests, source-clusters, commit pinning)

Import manifests pin source commit hashes; source-clusters map source concept → term.

### W3C PROV-O / PROV-DM — standard ontology for provenance: Entity, Activity, Agent, wasDerivedFrom, wasGeneratedBy
- **License:** W3C Recommendation (open). <https://www.w3.org/TR/prov-o/>
- **Why:** CAV2's provenance is ad-hoc; PROV-O is the standard vocabulary for exactly it.
  A source concept is a `prov:Entity`, an import is a `prov:Activity`, the source vault is a
  `prov:Agent`, and `prov:wasDerivedFrom` *is* the source-cluster edge. `derives-from` in the
  14 edges is literally `prov:wasDerivedFrom`. Adopting PROV-O makes the provenance layer
  standard, query-able, and reasoner-checkable rather than manifest-file-specific.
- **Where:** import manifests · source-clusters · `derives-from` edge semantics.

### DVC — Git-based data/pipeline versioning; dvc.lock records content hashes and pins inputs
- **License:** Apache-2.0. <https://dvc.org/>
- **Why:** The import-manifest problem (pin a source commit + hash, know when to re-import)
  is DVC's `dvc.lock`: it records a hash of each stage's output and pins inputs, so drift in
  a source vault is *detected by hash mismatch* deterministically, and re-import is a
  reproducible pipeline stage rather than a manual manifest edit. Frictionless Data Package
  (MIT) is a lighter alternative for pure manifest+checksum descriptors.
- **Where:** import-manifest pinning · source-drift detection · reproducible re-import.

---

## Seam G — Docs-as-data (the Markdown surface itself)

CAV2 is Markdown-native today; these harden that surface without changing the model.

### Vale — markup-aware prose linter; YAML-defined rules for terminology consistency
- **License:** MIT. <https://vale.sh/>
- **Why:** Enforce *terminology discipline* in the prose: flag use of a non-canonical synonym
  where a CAV2-D* term exists, ban deprecated/superseded terms, require defined-term casing.
  Rules are plain YAML, run in CI and VS Code. Turns "use the canonical term" from a norm
  into a gate.
- **Where:** terminology-consistency enforcement across all prose · superseded-term bans.

### lychee — fast async link checker for Markdown/HTML
- **License:** Apache-2.0 / MIT. <https://github.com/lycheeverse/lychee>
- **Why:** The index table, SOURCE-MAP, and cross-references are a link graph; lychee catches
  broken internal refs (a def pointing at a moved/deleted ID) deterministically in CI —
  cheap insurance for a heavily cross-linked authority spine.
- **Where:** index/cross-reference integrity · SOURCE-MAP link health.

### markdownlint — style/structure linter for Markdown
- **License:** MIT. <https://github.com/DavidAnson/markdownlint>
- **Why:** Enforces the structural regularity the fixed template assumes (heading levels,
  table shape), so the frontmatter/JSON-Schema layer isn't defeated by malformed Markdown.
- **Where:** template structural conformance.

---

## Recommended adoption arc (advocate's ranked bet)

1. **LinkML** as the schema spine — model the CAV2-D* template once; generate the index,
   JSON Schema, SHACL, and OWL. Kills the manual-sync seam and feeds every other tool. *(Highest leverage.)*
2. **pySHACL + OWL reasoner (HermiT/ELK)** — the deterministic consistency backstop that
   would have caught D29↔D16. Directly answers the failure the dispatch was scoped around.
3. **conftest/OPA (Rego)** — turn the 16+ constitutions from "pointing at a future validator"
   into a running validator with pass/flag/block/defer verdicts, plus the DAG check.
4. **PROV-O + DVC** — standardize and hash-pin provenance; make source drift detectable.
5. **TerminusDB** — the strategic option if CAV2 outgrows flat files: its git-for-data
   branch/merge model *is* the candidate→canonical lifecycle, natively append-only.
6. **Vale + lychee + markdownlint** — near-zero-cost CI hardening of the existing Markdown surface, adoptable today.

**Fallback framing for the skeptic:** even rejecting the databases (TerminusDB/Neo4j)
wholesale, the file-native subset — LinkML + JSON Schema + pySHACL + conftest + Vale +
lychee — layers onto the current Markdown repo without migrating data, all Apache/MIT,
all CI-runnable. The adoption floor is low; the manual-sync and LLM-contradiction seams
are the two where OSS most clearly beats the status quo.
