---
tags: [cyberalchemy-v2, schema, classification, taxonomy, human-view, machine-view, primitive-lifecycle, action-method, definitions-governance, findings]
node_type: findings
is_session: false
layer: knowledge-governance
nature: evidence
status: candidate
created: 2026-06-21
dispatch_id: 2026-06-21-schema-taxonomy-view-primitives
dispatch_type: research
working_folder: cyberAlchemy-v2/development/research/2026-06-21-schema-taxonomy-view-primitives/
sources: [
  cyberAlchemy-v2/development/research/2026-06-21-schema-taxonomy-view-primitives/research.md,
  cyberAlchemy-v2/development/research/2026-06-21-schema-taxonomy-view-primitives/synthesis.md,
  cyberAlchemy-v2/development/research/2026-06-21-schema-taxonomy-view-primitives/review-lakatos-precedent.md,
  cyberAlchemy-v2/development/research/2026-06-21-schema-taxonomy-view-primitives/review-popper-nonvacuity.md,
  cyberAlchemy-v2/development/research/2026-06-21-schema-taxonomy-view-primitives/review-quine-definitional.md
]
---

# Findings - Schema / Classification / View Primitives

Writer: Bourbaki, Nicolas.

## Evidence Boundary

This finding is a research finding only: it does not promote definitions,
constitutions, axioms, disciplines, ontology, schema, or validators. The packet
itself marks `research.md` and `synthesis.md` as non-canonical research
artifacts, not promotions. [R:17-19; S:19-21]

Citation key: `R` =
`cyberAlchemy-v2/development/research/2026-06-21-schema-taxonomy-view-primitives/research.md`;
`S` = `.../synthesis.md`; `L` =
`.../review-lakatos-precedent.md`; `P` =
`.../review-popper-nonvacuity.md`; `Q` =
`.../review-quine-definitional.md`.

## Post-Audit Correction

The accepted audit remains useful, but the operator correction after the audit
widens the root scope: this is not only a promotion-candidate discipline. It is
a basic CyberAlchemy action method. Promotion is the strict downstream case.

The corrected primitive is: every governed CyberAlchemy action must either
instantiate, create, or explicitly residue the four action facets:
classification/taxonomy, schema, human-continuation view, and
machine-checkable view. No action should silently proceed without them.
This correction is now canonicalized locally as
[CAV2-D21: Four-Facet Action Method](../../../authority/definitions/DEFINITIONS.md#cav2-d21-four-facet-action-method).
[ACTION-PRIMITIVE-CORRECTION.md]

## Center Finding

Use `governed action facet obligations` as the repaired center. If shortened to
`governed facets`, define facets as typed action-obligation surfaces required
for governed action, not authority, ontology, or source-of-truth by themselves.
Promotion remains a stricter downstream use case. [Q:23-33; L:62-63; Q:79-82;
ACTION-PRIMITIVE-CORRECTION.md]

Prefer `classification facet` over bare `taxonomy facet`. Retain `taxonomy`
when citing source vocabulary or existing DomainSpec/Arcanum catalogs, but do
not let taxonomy absorb ontology, schema, or relation catalogs. [Q:38-40;
Q:55-57; R:94-99; R:111-118]

## Verdict Matrix

| Candidate | Owner (precedent) | Witnessed? (non-vacuity) | Sound? (definitional) | Verdict |
| --- | --- | --- | --- | --- |
| Schema | Generic Schema is owned by Arcanum; v2 should reference `DEF-ARC-SCHEMA` and add only CAV2 subtypes where authority behavior differs. [L:29-32; L:65-66] | Witnessed by a negative control: accepting a schema-valid artifact as authority evidence would falsify the rule. [P:43-46] | Sound only as `schema facet`: structural shape reference and shape evidence, not authority evidence. [Q:35-36; Q:71] | `build-from-owned`; generic Schema is reference-only; subtype only if needed. |
| Classification / taxonomy | Taxonomy is already owned as DomainSpec typed vocabulary; the candidate classification taxonomy needs owner, scope, authority posture, membership rule, and promotion state. [L:34-37; L:68-69] | Witnessed if the taxonomy/classification facet names the catalog and authority posture; falsified if a taxonomy label counts as promotion. [P:29-31; P:45-46] | Sound as `classification facet`; bare `taxonomy` risks absorbing ontology and relation catalogs. [Q:38-40; Q:55-57; Q:72] | `build-from-owned`; prefer `classification facet` while retaining taxonomy as source vocabulary. |
| Human-continuation view | Human-view precedent is build-from-owned from Craft and framework-unification paired views; it must declare source/projection/freshness/non-authority posture. [L:39-45; L:71-73] | Witnessed if the view exposes status, trust boundary, blockers/residue, next route, and evidence. [P:31-32; P:68-69] | Sound as `human-continuation view`; readability is not canonicity. [Q:42-44; Q:73] | Promotion-ready candidate after repairs; not promoted here. |
| Machine-checkable view | Machine-view precedent is build-from-owned from Craft/framework-unification, but the validator / typed-residue gate is not fully built. [L:39-45] | Witnessed by the current blocker: no global machine-view validator means promotion must block or emit typed residue. [P:36-39; P:70-73] | Sound as `machine-checkable view`; checkability is not authority or proof beyond named checks. [Q:46-48; Q:74] | `build-from-owned` with validator residue. |
| Lifecycle / governed action facet obligations | Precedent supports the four-facet pattern; the operator correction lifts the root scope from promotion-readiness to a basic CyberAlchemy action method. [L:23-25; L:75-86; ACTION-PRIMITIVE-CORRECTION.md] | Witnessed if every governed action either binds, creates, or residues four separately checkable facets with owner route and rationale. [P:25-39; P:60-73; ACTION-PRIMITIVE-CORRECTION.md] | Sound with repaired name `governed action facet obligations`; a facet is an action-obligation surface, not authority. [Q:23-33; Q:79-82] | Accept-with-repairs as a candidate action primitive; promotion gate is a stricter downstream case. |

## Proposals

Definition: `governed action facet obligation` means a typed declaration required
for a governed CyberAlchemy action, naming the action's schema/shape,
classification, human-continuation surface, and machine-checkable
representation, together with owner route, source posture, validation boundary,
and explicit residue when absent. The obligation surface is not authority by
itself. [Q:30-33; L:62-63; ACTION-PRIMITIVE-CORRECTION.md]

Constitution: require each governed CyberAlchemy action to declare
`source_of_truth`, `owner_route`, `authority_posture`, `schema_ref`,
`classification_ref`, `human_view`, `machine_view`, `evidence_links`,
`validation_boundary`, and `residue`; generated views must declare
`generated_from`, freshness, and non-authority posture. [S:61-66; R:210-214;
R:280-283; Q:59-63; ACTION-PRIMITIVE-CORRECTION.md]

Axioms: shape evidence is not authority evidence; classification assignment is
not promotion; human-readable is not canonical; machine-readable is not
authoritative; action facet declaration is a precondition of governed action,
not a promotion verdict; ontology may consume facets, but facets do not replace
ontology. [S:68-73; Q:65-75; ACTION-PRIMITIVE-CORRECTION.md]

Discipline/check implications: wire an action gate with at least
`facet-presence`, `facet-disjointness`, `source-posture`,
`taxonomy-owner` or `classification-owner`, `human-view-minimum`,
`machine-view-envelope`, and `residue-validity`; add a legibility/navigate gate
for human-continuation views; require explicit typed couplings when surfaces
constrain one another. [P:60-73; R:216-223]

## Non-Collapse Laws

1. Schema validates shape; it does not satisfy contract or confer authority.
   [R:38-42; R:67-70]
2. Classification names admissible categories or statuses; it does not become
   ontology, relation catalog, or promotion. [R:103-118; R:131-139; Q:72]
3. A human-continuation view supports human decision and continuation;
   readability does not create canonicity or source-of-truth status.
   [R:181-201; Q:42-44; Q:73]
4. A machine-checkable view supports parsing and checking; proof of one named
   invariant is not total semantic adequacy. [R:261-272; R:285-287; Q:74]
5. Aggregating all facets does not create authority; it creates an action
   obligation surface. Authority still requires
   owner route and promotion rule. [Q:69-75; L:47-50]

## Negative Controls

The rule fails if a validator accepts any of these as sufficient:

- schema-valid artifact as authority evidence
- taxonomy/classification label as promotion
- readable Markdown as canonical source
- generated/indexed machine projection as authority
- `not_applicable` with no typed rationale and owner route
- one prose paragraph reused as all four facets
- a governed action with a missing facet and no residue

Evidence: [P:41-52].

## Next Slice

Next slice: specify the minimal governed-action-facet envelope and typed-residue
grammar, then test it against one ordinary CyberAlchemy action plus one
definition candidate, one constitution candidate, one axiom candidate, and one
discipline/check candidate without promoting any of them. The slice should draft
a `Four-Facet Action Constitution` and the corresponding action axioms.
[P:75-80; L:83-88; R:302-307; ACTION-PRIMITIVE-CORRECTION.md]

Blockers/residue: decide whether CAV2 needs one or two schema subtypes; decide
whether classification is one reusable primitive or several scoped catalogs;
assign or build the global machine-view validator/node envelope/typed-residue
gate; define an objective legibility gate; preserve public/private scrub rules
for human-continuation views. [R:83-88; R:152-163; R:236-242; R:300-307]
