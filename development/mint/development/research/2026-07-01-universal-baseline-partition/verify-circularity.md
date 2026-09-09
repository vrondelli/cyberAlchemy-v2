---
node_type: research-finding
is_session: false
status: candidate
boundary: INTERNAL — cav2-native; circularity gate only, no promotion enacted
created: 2026-07-01
authored_by: research subagent (SKEPTIC — circularity / type-level re-fusion gate, "Russell, Bertrand")
angle: CIRCULARITY GATE — for each candidate-inherit, does seeding hand the minted domain cav2's OWN object rows/instances (re-fusing meta and object), or is it a repo-independent method FORM the domain applies to its own content?
gate_verdicts: KEEP-inherit | KEEP-with-strip | DEMOTE-localize
corpus:
  - authority/definitions/DEFINITIONS.md (CAV2-D#, read per candidate)
  - development/mint/SPEC.md (disclosed non-seeds #14/#19; SPLIT rule; circularity guardrail SPEC.md:69-100)
  - classify-universality.md, classify-coupling.md (the two prior classifiers)
lean: DEMOTE on doubt — a definition that only makes sense with cav2's specific rows re-fuses the two System-5 levels; only a strippable-instance FORM survives.
claim: claim ≤ proof (CAV2-D38); this is a candidate gate result, enacts no promotion. Paths repo-root-relative from domainspec-core/.
note: The re-fusion TEST asks "seed → does the domain hold cav2's rows?" not "did cav2 author it".
---

# Circularity / type-level re-fusion gate — the candidate-inherit set

## The test (one probe, applied per candidate)

> **Re-fusion test.** Substitute the domain for cav2. Does the definition's
> *normative content, formal interpretation, or substance-bearing consumers*
> still name **cav2's own rows / tree / model / spaces / capabilities** — such
> that seeding hands the minted domain cav2's populated object? **YES → the mold
> is casting itself → DEMOTE-localize.** If only the *illustrative* voice or an
> *instance count / consumer link* is cav2-specific and the normative FORM
> quantifies over `any` action/artifact/scope → **KEEP** (strip the binding).

`SPEC.md:100` states the guardrail I enforce: *never inherit cav2's object kinds
as a governing base — that re-fuses meta and object.* `SPEC.md:99` gives the
disposition for the survivors: *seed the empty contract / slot / declaration /
route, never cav2's populated rows/instances.*

---

## Part A — AGREED-27 spot-check (the 3 coupling flagged strippable)

The other 24 AGREED terms are FORM-with-example (normative sentence quantifies
over `any`, cav2 only in the Domain-Context Voice) — safe KEEP-inherit; both
classifiers concur and I found no re-fusion (D16/D21/D30 read as pure invariants
over `any action/object`; D3/D10/D13/D14 quantify over `a scope`, cav2 only in
example). The 3 coupling-flagged ones I confirm below.

| D# | form-or-object | gate verdict | re-fusion test (one line) |
|---|---|---|---|
| D11 Tower Space | form + strippable wiring | **KEEP-with-strip** | Normative def quantifies over "a project, source, or execution area" for "one or more definition towers" (DEFINITIONS.md:443) — repo-independent space-typing. Op-Interp + Domain-Context name cav2's `inventory/ontology/authority/research/ops/` spaces → **STRIP: cav2's space enumeration** (DEFINITIONS.md:449-462); seed the typing rule, domain lists its own. |
| D31 Primitive Type | form + hardcoded instance bindings | **KEEP-with-strip** | Normative def is a meta-admission rule over "a base semantic kind" — repo-independent. But Formal Interp **hardcodes** `authority_scope(t)=CAV2` and `owner(t)=definitions-governance` (DEFINITIONS.md:1986-1987) → **STRIP/SUBSTITUTE: the CAV2 scope + definitions-governance owner bindings** with the domain's own scope/owner; seed the FORM. |
| D40 Challenge Contract | form + cav2 node-model consumers | **KEEP-with-strip** | The 8-tuple `ChallengeContract` schema (DEFINITIONS.md:2578-2582) attaches to "any node, candidate, claim, or authority artifact" — separable protocol. Consumers wire it to cav2's `ontology/NODE-MODEL.md`, `PACKAGE-MODEL.md`, `LIFECYCLE-MODEL.md` + imported house_project vault (DEFINITIONS.md:2623-2627) → **STRIP: the cav2 ontology-node-model consumers** (the #14 package); seed the protocol FORM only. |

**Note on the D40/D19 boundary:** D40's FORM is separable *because* it is the
schema of the challenge field, not the ontology package that carries it. This is
the exact split SPEC.md:73 licenses ("seed the *empty* record-shape … not the
package"). D40 survives; D19 (the package) does not — see Part B.

---

## Part B — CONTESTED 12 (the gate's real work)

| D# | form-or-object | gate verdict | re-fusion test (one line) |
|---|---|---|---|
| D12 Craft Execution Surface | **object** | **DEMOTE-localize** | Normative def is generic ("the project-local Craft ledger…"), but the card names cav2's OWN contexts `CTX-CAV2-DEF-TOWERS / -AUTHORITY-IMPORTS / -CONSTITUTION-TOWERS` and cav2's `.craft/ledger.yml` as its content (DEFINITIONS.md:501-503,515). Seed → domain holds cav2's ledger rows. The method is D20 (already KEEP); D12 is cav2's instance of it. |
| D15 Project Space | **object** | **DEMOTE-localize** | Normative def enumerates cav2's OWN folders as its substance (`authority/ research/ architecture/ specs/ validation/ ops/ inventory/ ontology/ .craft/`, DEFINITIONS.md:618-620) and says "navigable while staged inside `domainspec-core`" (DEFINITIONS.md:628-629) — the room-list IS cav2's tree. Contrast D14 (source space) which quantifies over "an area outside the authority surface": D14 KEEPs, D15 DEMOTEs. |
| D19 Ontology | **object** | **DEMOTE-localize** | The *method* is universal, but this card is welded to cav2's OWN ontology model: it normalizes "Operational Ontology" against cav2's D23 (DEFINITIONS.md:969-971), cites cav2's `.arcanum/ontology-vault/` map and future `ontology/` package (DEFINITIONS.md:942-953). **This is Mint's motivating non-seed #14** ("cav2's own self-model … seeding re-fuses the two System-5 levels", SPEC.md:71-74). Domain authors its own ontology. |
| D27 Residue Entropy | **object** | **DEMOTE-localize** | *(Not in my AGREED set — coupling already localized it; universality inherited. I confirm DEMOTE.)* Normative def opens "a **CyberAlchemy v2** primitive observable" (DEFINITIONS.md:1624); Primary Consumers are cav2's embedded Lean sources `Residue.lean / EntropyAsFFResidue.lean / SecondLawDiscrete.lean` (DEFINITIONS.md:1706-1709). A minted domain has no such carrier; seeding hands it cav2's Lean-backed object. Domain adds its own measures if any. |
| D41 Authority Model | **object (format is SPLIT-inherited elsewhere)** | **DEMOTE-localize** | The routing-function FORM `A(x)=(kind,posture,owner_route,…)` is generic, but the card is cav2's OWN model: authored in cav2's `AUTHORITY-MODEL.md`, coordinating cav2's `ontology/AUTHORITY-KINDS.md` + `AUTHORITY-POSTURES.md` (DEFINITIONS.md:2684-2707). **SPEC already inherits the Authority-Kinds-table *format* as machinery** (SPEC.md:95); the *definition as written* is the populated instance → DEMOTE. (Format ≠ definition: format already covered, so no loss.) |
| D42 Governed Artifact Tree | **object** | **DEMOTE-localize** | The `GAT(T)` interface obligation is generic, but the card wires it to cav2's OWN trees: `architecture-pattern-inventory` as "the architecture-facing producer," cav2's `architecture/ARCHITECTURE-KNOWLEDGE-GOVERNANCE.md` (DEFINITIONS.md:2769-2790). Part of the #14/#15/#16 artifact-package non-seed (SPEC.md:71). Domain declares its own trees. |
| D43 Pattern Promotion Lifecycle | **object (instance of D48)** | **DEMOTE-localize** | Self-identifies as an **instance of D48** (DEFINITIONS.md:3198 names D43 an instance); it is cav2's architecture-pattern path wired to cav2's `architecture-pattern-inventory` (DEFINITIONS.md:2853,2866-2873). The GENUS (D48) is already-inherited; seeding this instance hands the domain cav2's architecture lifecycle. Domain instantiates D48 for its own kinds. |
| D44 View-Bearing Concept | **object** | **DEMOTE-localize** | Threshold-rule FORM exists, but the card is wired to cav2's OWN ontology views (`ontology/BRANCH-AS-VIEW.md`, `views/ontology-view / system-view / bridge-view`) + cav2's architecture view interface (DEFINITIONS.md:2923-2946). Carries cav2's ontology/architecture object structure (the #14 package). Overlaps D42 (also DEMOTEd). Domain decides its own view thresholds. |
| D45 UX/UI Knowledge Governance | **object** | **DEMOTE-localize** | Normative def opens "**CyberAlchemy v2** lens-specific governance interface" (DEFINITIONS.md:2956); wired to cav2's `ux-lessons / ux-evidence-validator / ui-prototyping-studio` capabilities + cav2's `ux-ui/` tree (DEFINITIONS.md:3010-3030). A domain with no UI needs none of this; the UX cluster is a disclosed-lens non-seed. |
| D46 Experience Evidence Lifecycle | **object (instance of D48 for UX)** | **DEMOTE-localize** | A named **instance of D48** for UX (DEFINITIONS.md:3198 lists D46 as an instance), wired to cav2's ux capabilities (DEFINITIONS.md:3089-3107). Same class as D43/D45. Genus D48 inherits; this instance re-fuses. |
| D47 Interface Evidence Boundary | **object** | **DEMOTE-localize** | Normative def is cav2's UX evidence-honesty rule; imports the model from cav2's `ux-evidence-validator` (DEFINITIONS.md:3162-3163) and consumers are cav2's `UX-EVIDENCE-CLAIM-MAP.md` + `UX-PLAYWRIGHT-VALIDATOR-SPEC.md` (DEFINITIONS.md:3181-3182). Domain-specific to cav2's UI lens; same cluster as D45/D46. |
| D50 Discipline | **object (genus overlaps inherited machinery)** | **DEMOTE-localize** | GENUS FORM exists ("recurring cross-capability practice promoted via discipline-governance"), but the card is wired to cav2's OWN discipline cards (`stable-repository-stewardship`, `provisional-model-stewardship`) + cav2's `disciplines/` + ontology `concept.discipline` (DEFINITIONS.md:3354-3376). **Mint disclosed non-seed #19**: "no recurring practice exists at mint-time — seed only the Growth-Rule + card schema, later" (SPEC.md:75). Domain authors its own disciplines. |

---

## Where I split from the universality classifier (and why the gate demotes)

The universality lens read the *normative sentence's quantifier* and stopped
there — correct for FORM detection, but the re-fusion gate must also read the
**Formal Interpretation, Domain-Context substance, and Primary Consumers**,
because that is where cav2's object leaks in. Twelve terms universality called
`inherit-baseline` carry cav2 rows *in their body*, not merely their voice:

- **D12/D15/D19/D41/D42/D44/D50** — the FORM exists but the definition's
  *substance* (its enumerated folders, contexts, ontology package, authority
  model, artifact trees, discipline cards) IS cav2's object. Seed → re-fusion.
- **D43/D46** — self-declared **instances** of the already-inherited genus D48;
  seeding the instance is redundant AND hands cav2's architecture/UX lifecycle.
- **D27/D45/D47** — normative def literally opens "a CyberAlchemy v2
  primitive/interface/rule"; consumers are cav2's Lean / ux capabilities.

For all twelve, the **generic FORM they carry is already inherited by another
route** (D20 for D12; D14 for D15; D48 for D43/D46; the Authority-Kinds *format*
for D41; the empty record-shape option SPEC.md:73 for D19/D42/D44; the
Growth-Rule + card schema SPEC.md:75 for D50). So DEMOTE loses **no** method —
it only refuses cav2's populated instance. This is the guardrail's whole point:
the domain grows its own rows on the inherited mold.

## Guardrail on my own gate (did I over-demote a genuine universal?)

I demoted **only** where cav2's rows/tree/model/capabilities appear in the
normative body, formal interp, or substance-bearing consumers — never for a mere
cav2 mention in the illustrative voice. The 3 strippable-wiring terms
(D11/D31/D40) I **kept** precisely because their FORM survives instance-removal
cleanly (a space-typing rule; a meta-admission rule with substitutable
scope/owner; an 8-tuple schema detachable from the node-model). If a term's FORM
could not survive stripping its cav2 substance, it demoted. claim ≤ proof: every
verdict cites the DEFINITIONS.md line where the object content or the strippable
binding lives.
