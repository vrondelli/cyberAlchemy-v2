---
node_type: research
title: "Ontology Engineering — Precedent Sweep (collected returns)"
dispatch_id: 2026-06-24-ontology-engineering-precedent
status: collected
created: 2026-06-24
nature: research-raw
---

# Ontology Engineering Precedent Sweep — Collected Explorer Returns (verbatim)

Dispatch: `2026-06-24-ontology-engineering-precedent` (research). Three explorers, pairwise
tensioned on methodology × source-corpus. Returns are recorded verbatim; synthesis +
verdicts live in `findings.md`. Claim ≤ proof: every load-bearing claim in findings cites
the return below it rests on.

---

## Explorer A — Tarski (formal apparatus / open-world inference)

**Scope:** DL TBox/ABox/RBox, OWL/RDF/RDFS semantics, OntoClean meta-properties, foundational
ontologies (BFO/DOLCE/UFO), OntoUML. OWA / entailment side.

### 1. Description Logic: TBox / ABox / RBox
- **Owner:** Baader, Calvanese, McGuinness, Nardi, Patel-Schneider (eds.), *The Description
  Logic Handbook*, CUP, 2003. DL→OWL lineage: W3C OWL 2 Recommendation (2009); OWL 2 DL ≈
  SROIQ(D).
- **CAV2 correspondence:** CAV2's typed node/edge "B-op" schema IS structurally analogous to a
  TBox (typed entity classes, typed relations, constraints on what relations hold between node
  kinds). Instance-level population (filed definitions/decisions/projections) ≈ ABox. CAV2
  deliberately lacks an RBox equivalent (no role transitivity/sub-role chains) — a deliberate
  simplification, not an error.
- **Field correction:** A pure TBox/ABox under OWA ENTAILS conclusions the author does not
  assert. CAV2 never runs a reasoner; it has no DL formal semantics. The "B-op" schema is
  better described as a **structural signature** (typed graph grammar) than a DL TBox, because
  it carries no inference regime. "Read-only" is an **operational** claim (we don't run a
  reasoner), not a **semantic** one (the entailments don't exist).

### 2. OWL / RDF / RDFS Semantics and Entailment
- **Owner:** RDF 1.1 Semantics, W3C Rec (2014); RDF 1.2 Semantics, W3C CR (Apr 2026); OWL 2
  Direct Semantics, W3C Rec (2009).
- **CAV2 correspondence:** Typed edges (is-a, governed-by, promoted-from) resemble RDF
  predicates; Authority-Kinds roster functions like an RDFS class hierarchy **without formal
  entailment rules**. No closure: CAV2 does not derive that "decision" subtypes "evidence".
- **Field correction:** Even RDF (weakest layer) carries RDFS entailments automatically if a
  reasoner is applied. CAV2's "read-only map" is safe only because no inference engine is
  applied — which is exactly CAV2's intent. But without formal semantics, **two Authority-Kind
  assignments can contradict without detection** unless a human audits them.

### 3. OntoClean: Rigidity, Identity, Unity, Dependence
- **Owner:** Guarino, N. & Welty, C. (2002), "Evaluating Ontological Decisions with OntoClean,"
  *Communications of the ACM* 45(2), 61–65; overview in Staab & Studer (eds.), *Handbook on
  Ontologies*, Springer 2004.
- **Meta-properties on TYPES (not instances):** Rigidity (±R), Identity (±I), Unity (±U),
  Dependence (±D). Constraint: anti-rigid classes cannot subsume rigid classes.
- **CAV2 correspondence:** OntoClean meta-properties are annotations ON types — exactly as
  CAV2's Authority-Kinds are type-level annotations on artifacts. Authority-Kinds implicitly
  encode rigidity (a "constitution" is rigid-like; a "residue" is contingent-like) but CAV2 has
  not formalized this.
- **Field correction:** CAV2 may mix rigidity levels in a flat kind-set without acknowledging
  it. "decision" (anti-rigid, supersedable) vs "definition" (rigid) treated as co-equal kinds →
  subsumption-error risk **if a taxonomy is ever built from them**.

### 4. Foundational ontologies: BFO, DOLCE, UFO/OntoUML
- **BFO** (Smith et al.; ISO/IEC 21838-2:2021; Arp/Smith/Spear, *Building Ontologies with BFO*,
  MIT Press 2015): continuant vs occurrent. CAV2's "evidence"/"residue" ≈ occurrents;
  "definition"/"constitution" ≈ continuants — CAV2 hasn't addressed this.
- **DOLCE** (Masolo et al. 2003, WonderWeb D18; Borgo et al. 2022, *Applied Ontology* 17(1)):
  **descriptive** (captures conceptualizations, not mind-independent reality). CAV2's
  "map of meaning" aligns with DOLCE's descriptive stance — BUT DOLCE is still **formally
  axiomatized**; descriptive ≠ informal.
- **UFO / OntoUML** (Guizzardi 2005 PhD, U. Twente; Guizzardi et al. 2021, *Applied Ontology*):
  integrates DOLCE + OntoClean. Kinds (rigid), Roles (anti-rigid), **Phases** (anti-rigid,
  intrinsically defined, must form complete disjoint partitions). CAV2's promotion-states
  (draft/stable/archived) map closely to OntoUML **Phases** — the field would demand: is this a
  complete partition? CAV2 does not formally assert it.

### 5. Non-Collapse claim — formal assessment
- **Sound but imprecisely framed.** (a) True for standard DL/OWL: a reasoner cannot derive
  "who owns this" / "is this legitimate" — authority is a **deontic/institutional** fact
  (Searle 1995, *The Construction of Social Reality*); DL has no deontic semantics. Genuine,
  well-documented gap. (b) "read-only map" understates: any TBox under OWA has latent
  entailments you simply haven't computed. (c) Gruber (1993, *Knowledge Acquisition* 5(2)): "an
  ontology is an explicit specification of a conceptualization" — CAV2's B-op satisfies this;
  but specification ≠ governance. CAV2 is **correct on Non-Collapse**. (d) OntoClean's pointed
  correction: rigidity annotations or an explicit "flat controlled-vocabulary, not a taxonomy"
  disclaimer is needed.

**Key finding:** Non-Collapse is well-founded — standard DL/OWL/RDFS have no deontic semantics;
authority cannot be entailed from a DL KB (institutional fact, Searle 1995). "Read-only" should
be clarified as an engineering choice, not a no-entailments claim.

---

## Explorer B — Simon (development process, lifecycle & governance)

**Scope:** METHONTOLOGY, NeOn, Uschold-King, Grüninger-Fox, On-To-Knowledge; ontology lifecycle;
evaluation (Gangemi O²/oQual, OntoQA, FAIR, PROV-O); collaborative/governed development.

### A. Methodologies
- **METHONTOLOGY** (Fernández-López, Gómez-Pérez, Juristo, AAAI Spring Symp. 1997): lifecycle
  Specification→Conceptualization→Formalization→Integration→Implementation→Maintenance, with
  Management/Support meta-processes. Evaluation sub-activities verify(syntactic) /
  validate(semantic) / assess(fitness) **structurally resemble** CAV2's evidence-vs-approval
  separation — but METHONTOLOGY never formalizes it as a gate or role. **No promotion gate, no
  per-node confidence.**
- **Uschold-King** (Uschold & King 1995, IJCAI-95 wkshp; Uschold & Grüninger 1996, *Knowledge
  Engineering Review* 11(2)): Identify-purpose→Build→Evaluate→Document. "Community agreement" /
  "technical judgment" invoked but not formalized. No gate.
- **Grüninger-Fox** (1995, IJCAI-95 wkshp): motivating scenarios→informal CQs→terminology→
  **formal competency questions (FOL entailments)**→axioms→completeness theorems. **Closest to
  a formal gate** — CQs are passage conditions — but **evidence (derivability) and approval are
  COLLAPSED** (proof IS approval; no human reviewer). Opposite to CAV2's explicit separation.
- **On-To-Knowledge** (Sure, Staab, Studer 2002, *ACM SIGMOD Record* 31(4)): Feasibility→
  Kickoff→Refinement→Evaluation→Application/Evolution. Process **milestones**, not logical
  criteria.
- **NeOn** (Suárez-Figueroa et al. 2012, *Ontology Engineering in a Networked World*, Springer):
  nine combinable scenarios; reuse-centric. No promotion gate, no per-node tracking.
- **Cross-finding:** **None of the five** defines a socially mediated promotion gate separating
  evidence collection from a reviewer's approval, nor per-node confidence. Grüninger-Fox comes
  closest to a gate but collapses evidence+approval into one formal test.

### B. Evaluation frameworks
- **oQual / O²** (Gangemi, Catenacci, Ciaramita, Lehmann, ESWC 2006, LNCS 4011, 140–154, DOI
  10.1007/11762256_13): Structural / Functional / Usability dimensions, user-configurable. No
  stage-gate, no per-node confidence.
- **OntoQA** (Tartir et al., IEEE ICDM Wkshp 2005): schema/KB/class-level density metrics —
  measure population density, not epistemic confidence.
- **FAIR + OBO Foundry** (Wilkinson et al. 2016, *Scientific Data* 3:160018; Jackson et al.
  2021, "OBO Foundry in 2021," *Database* baab069, DOI 10.1093/database/baab069): OBO Foundry
  runs a **two-stage ontology-level gate** — (1) automated technical compliance, (2) human
  Operations Committee review. **"Conforming to all principles is not currently a requirement"**
  → evidence of compliance ≠ acceptance. **Structurally the closest existing operationalization
  of "evidence is not approval,"** though never named as such. No per-term tracking.
- **OQuaRE** (Duque-Ramos et al. 2011; PLOS One 2014): ISO/IEC 25000 adapted; snapshot, no gate.
- **OOPS!** (Poveda-Villalón et al. 2014, *IJSWIS* 10(2), DOI 10.4018/ijswis.2014040102):
  pitfall scanner, 3 severities; rule-based detections, not confidence scores.

### C. Provenance / collaborative governance
- **PROV-O** (Lebo, Sahoo, McGuinness, W3C Rec 30 Apr 2013): Entity/Activity/Agent; derivation
  + attribution. **No lifecycle status, no confidence, no approval property.** Evidence and
  assertion are both Entity nodes — **no epistemic-status distinction**. Does NOT model
  "evidence is not approval."
- **PAV** (Ciccarese, Soiland-Reyes et al. 2013, *J Biomed Semantics* 4:37): adds authoredBy/
  curatedBy/createdBy; `pav:curatedBy` ≈ editorial role but not a governance gate.
- **SEPIO** (Brush, Shefchek et al., ICBO 2016; monarch-initiative/SEPIO-ontology): explicit
  Assertion ← Evidence Line ← Evidence Items separation → evidence recordable independently of
  endorsement. **Strong structural precedent for distinguishing evidence from approval**, but
  stops short of modeling governance approval as a distinct act (no bridging property).
- **OBO Foundry governance** (Smith et al. 2007, *Nature Biotechnology* 25(11):1251–1255;
  Jackson 2021): two-stage gate; Principle 9 requires evidence of user plurality; approval is a
  distinct committee act. Most operationalized "evidence is not approval" found.
- **OWL 2 versioning / OMG ODM:** documentation-only; no gate criteria, no epistemic status.

### D. Mapping to CAV2
- Promotion gate (per-term, human-mediated): closest = OBO Foundry two-stage (but
  ontology-level) + Grüninger-Fox CQ gate (but evidence+approval collapsed). **No published
  framework defines a per-term socially mediated promotion gate.**
- Per-term ownership: OBO Principle 4 assigns per-**ontology** ownership; CAV2's per-**term**
  ownership is novel at that granularity.
- Per-node evidence/confidence/promotion-status: SEPIO is assertion-level, OQuaRE structural —
  **no framework tracks epistemic status per defined term.**
- **"Evidence is not approval" ownership:** NOT owned by PROV-O (conflates derivation +
  endorsement) nor any evaluation framework. Most closely operationalized as **institutional
  practice in OBO Foundry 2021** and structurally implied in **SEPIO**; neither names it. The
  underlying distinction is an older epistemic one (is-ought at the epistemic level, cf. Hume),
  not a novel ontology-engineering invention. **No single citable source owns it as a named
  axiom.**
- Methodology corrections: framing "ontology models but cannot decide authority" consistent
  with all five methodologies (correct); promotion-gate novelty mostly supported; do NOT imply
  PROV-O supports "evidence is not approval" (it doesn't); "governed map with receipts" is an
  accurate informal gloss on a **combined** SEPIO+PROV-O+OBO model whose parts come from
  different communities and are not usually integrated.

---

## Explorer C — Alexander (applied / closed-world validation & business semantics)

**Scope:** conceptual modeling, SHACL, XBRL, semantic interoperability, controlled-vocab vs
ontology. CWA / validation / interoperation side.

### 1. SHACL (W3C Shapes Constraint Language, 2017 Rec; Hogan et al., *Validating RDF Data*, 2017)
- Closed-world validation of RDF against **shapes**; node shapes + property shapes; `sh:closed`
  prohibits undeclared properties.
- **CAV2 correspondence:** A SHACL shapes graph **IS** a "governed map"; a **validation report
  is the receipt**. `sh:closed` is literally a **permission boundary on a node** → matches
  "permission boundaries in nodes" exactly. Constraint components map to
  rule→constraint→signal(severity)→test(`sh:SPARQLConstraint`): the business-philosopher
  four-tuple has a **direct structural analog** in SHACL.
- **Correction:** SHACL's CWA is for **validation**, not the model underneath. Orgs run OWL
  (open-world inference) AND SHACL (closed-world checks) on the same graph as separate concerns.
  CAV2 should say its "governed map" is **shapes-graph-flavored**, not a DL ontology.

### 2. XBRL (XBRL International; CoreFiling 2015; FinRegOnt; Chou et al. 2018, *RAAE* 25(1-2))
- Taxonomy = governed map of business meaning (concepts, presentation/calculation/definition
  linkbases, **dimension constraints**); SEC/FDIC/EBA/EIOPA mandate filing.
- **CAV2 correspondence:** XBRL taxonomy = direct industrial precedent for "governed map." A
  **closed hypercube** = permission boundary on a reporting element (only declared
  concept-dimension combos valid). Two decades at regulatory scale.
- **Correction:** XBRL taxonomies are **jurisdiction-scoped compliance contracts**, not general
  ontologies. The presentation should distinguish descriptive knowledge model vs compliance
  grammar, and **acknowledge the industrial prior** rather than present node-permission as
  origination.

### 3. Conceptual modeling — OntoClean (Guarino & Welty 2002, CACM; 1000+ citations)
- **CAV2 correspondence:** OntoClean annotates each class with a metaproperty vector (`+R+I−U`)
  — the **annotation IS the receipt**. CAV2's `forbidden_collapse` ("a definition is not a
  glossary entry") is structurally identical to OntoClean's subsumption prohibition (anti-rigid
  cannot subsume rigid). CAV2's `challenge_contract` (valid modes: evidence/contradiction/
  owner_review) echoes the OntoClean challenge protocol.
- **Correction:** OntoClean is **structural** (is this subsumption valid?), not business-intent
  (should this rule exist here?). CAV2 **extends** OntoClean with the governance dimension
  (who decides, what evidence) — legitimate but should be positioned as **additive**. OntoClean
  needs deep expertise; the business variant risks underestimating that.

### 4. Controlled vocabularies vs ontologies (governance spectrum)
- Spectrum: list→controlled vocab→taxonomy→thesaurus→ontology (Soergel 1999; Gruber 1993).
  Enterprise governance practice: **Metaphacts (2026)** — lifecycle (development→review→
  published→archived), owner/author roles, provenance hashing, git-versioned states.
- **CAV2 correspondence:** CAV2 authority-kinds + promotion gates ↔ ontology governance
  lifecycle (candidate→reviewed→promoted = development→in-review→published). **CAV2 is
  implementing a known pattern with domain-specific gates**, not inventing it. "Governed map of
  meaning with receipts" sits exactly at the controlled-vocab / full-ontology boundary; "with
  receipts" = the provenance/traceability enterprise platforms implement.
- **Correction:** ontologies in enterprises exist largely for **cross-system alignment**
  (shared conceptualization); CAV2's "governed map" is accurate for **internal** governance but
  should state explicitly if it is **not** intended for external interoperability.

### 5. Semantic interoperability / "semantic obstacles"
- Bergamaschi/Castano/Vincini 1999; Missikoff (ebXML); ontology alignment.
- **CAV2 correspondence:** `forbidden_collapse` = closed-world encoding of a **semantic
  obstacle** (same name ≠ same meaning); promotion gates ≈ alignment validation (evidence,
  confidence, human review before authoritative).
- **Correction:** hardest problems arise at **system boundaries**; "permission boundaries in
  nodes" handles intra-system constraints but not cross-system alignment. Not a flaw in CAV2's
  internal scope, but a **gap to name**.

### Net verdict (applied practice)
Constructs individually **grounded**: "governed map with receipts" (SHACL reports, XBRL
validation, Metaphacts provenance); "permission boundaries in nodes" (`sh:closed`, XBRL closed
hypercubes); four-tuple (= SHACL architecture — cite as such, not novel); Non-Collapse (correct,
well-established); promotion gates (standard governance practice); `forbidden_collapse`
(operationalizes OntoClean + semantic-obstacle catalogs — specific encoding is CAV2-specific,
concept owned by practice). **The novelty is the INTEGRATION**: coupling semantic constraints +
promotion-gate lifecycle + per-node challenge contracts — that combination is not off-the-shelf
in any surveyed tool.
