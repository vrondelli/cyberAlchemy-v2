# Wittgenstein Definitional Attack

Dispatch: `2026-07-13-definitions-refactor-review`  
Role: explorer / definitional attacker  
Mutation scope: review artifact only

## Initial Position

### Key Findings

1. **The corpus has no coherent canonical posture.** The active source contains 56
   cards marked active, while `DEFINITIONS-INDEX.md:27` says only six are active
   and every other ID is retired and reserved. No card outside those six can be
   accepted as `KEEP` until source and index agree about what governs.
2. **Many cards collapse a concept into its record schema.** Authority, Gate,
   Governed Artifact Tree, and UX/UI Knowledge Governance define a semantic object
   by requiring a long field list. The concept's identity, its minimum record, and
   its admission rule need separation.
3. **Some active definitions declare their own incompleteness.** D51 depends on
   `process_origin`, explicitly marked an undefined referent, and leaves both
   producer arity and attested-versus-declared origin open. Its owning enumeration
   is also candidate. This defeats `KEEP`, not the underlying artifact-kind concept.
4. **Schema has real referents but the current card universalizes one model.** D56
   requires `(K,C,R,N)`, reduces constraints to decidable predicates over a single
   occupant, requires conformance by inspection without interpretation, and makes
   level declaration universal. DomainSpec meta-type and edge schemas prove the
   referent, not those universal conditions.
5. **Several cards oscillate between defining and enacting a rule.** D48 calls
   itself the single authority path, then says naming it does not enact a binding
   rule. D49 similarly defines a closed invariant while disclaiming enactment.
   Definition, adoption, enforcement, and observed conformance must be distinct.

### Gaps or Inconsistencies

- D3 assumes a surface is “allowed to define” but does not say how that right is
  recognized; it is circular with D34.
- D5 identifies a promotion gate with an owner route, while D37 treats a gate as
  transition logic/checkpoint. Route, decision maker, rule, and record differ.
- D21 lets every absent facet be discharged into residue without defining when
  that residue permits continue, defer, or block; its admissibility rule is nearly
  tautological.
- D23 calls a bundle of six dimensions one axis and conditions their separation on
  “when they matter,” without a relevance decision rule.
- D25 permits residue saying enforcement is absent to count as a witness. That is a
  record of missing witness, not a witness of enforcement.
- D47 mixes effects (`hard gate`, `soft flag`), evidence modes (`screenshot review`,
  `human study`), and a limitation (`not automatable`) in one classification.
- D53 requires axiom fan-out while leaving axiom species, authority kind, and the
  axiom/premise threshold open.
- D54 says an invariant without an axiom is unjustified and one without a validator
  is unenforceable, while the authority model admits diagnostic invariants and
  `none-yet` validation.
- `DEFINITIONS-VICTOR.md` is useful editorial evidence, not the normative baseline:
  its admission rule equates useful formalism with already checked/executed
  notation, which is stricter than the owner's current criterion.

### Local Tensions

- A real referent can justify preserving a concept but never the current wording.
- A definition may establish a rule before automation, but must label whether it is
  adopted, review-enforced, validator-enforced, or unrealized.
- The eight Authority components may form a useful validity rule without all being
  parts of the lexical essence of authority.
- Method, Discipline, Craft, and generic Schema may be Arcanum-owned even when CAV2
  needs a local specialization.
- D51 deliberately uses `canonical` opposite to the established “authoritative
  version” sense, creating permanent cross-repository ambiguity.

### Questions for Synthesis

1. Will a card only define a concept, or may it also enact a rule? If both, must it
   mark semantic definition, normative rule, and enforcement posture separately?
2. Are all eight Authority components mandatory for every exercise of authority,
   or do some belong to an `authority_claim` schema?
3. Does artifact-kind membership suffice for D51, or must origin be attested?
4. Can candidate `CANONICAL-KINDS.md` normatively determine membership?
5. Can generic Schema be defined by a subject/conformance relation, leaving record,
   meta-type, and edge constraints to owned specializations?

### Complete Initial Matrix

| ID | Definitional failure | Initial recommendation |
|---|---|---|
| D1 | Target qualities have no satisfaction boundary; kind and project target mix. | REWRITE |
| D2 | Defined mainly by contrast; source cohort/posture unstable. | REWRITE/LOCALIZE |
| D3 | Authority of surface is presupposed; overlaps D34. | REWRITE |
| D4 | Selected/minimal/orient are relative without selector. | REWRITE/LOCALIZE |
| D5 | Collapses owner route, gate, and decision. | REWRITE/SPECIALIZE D37 |
| D6 | Practice bundle overlaps Discipline. | REFERENCE/SPECIALIZE |
| D7 | Oscillates between capture act, record, and ledger. | REWRITE |
| D8 | Restricts candidate to a path although candidates include claims/rules. | REWRITE |
| D9 | Project description and aspiration, not a stable distinction. | LOCALIZE |
| D10 | Cluster combines altitude, posture, routing, and action without identity test. | REWRITE/LOCALIZE |
| D11 | Own/supply/consume/route makes almost every area a tower space. | RETIRE/LOCALIZE |
| D12 | Clear local bundle but depends on Craft ownership. | REFERENCE/SPECIALIZE |
| D13 | Ordered set has no ordering rule; queue and decisions mix. | REWRITE |
| D14 | Outside-authority boundary does not distinguish source/evidence surfaces. | REWRITE/LOCALIZE |
| D15 | Enumerates nearly every folder function; weak discrimination. | LOCALIZE |
| D16 | Relation identity and governance metadata are fused. | REWRITE |
| D17 | Higher layer/local repair/missing schema lack criteria. | DEFER/REWRITE |
| D18 | Good referent; field bundle exceeds essence. | REWRITE |
| D19 | Ontology becomes governance package, mixing meaning and lifecycle record. | REWRITE |
| D20 | Arcanum genus mixed with local ledger rules. | REFERENCE/SPECIALIZE |
| D21 | Universal rule plus residue escape is nearly tautological. | REWRITE/DEFER |
| D22 | Redundancy, independence, and co-change are treated as equivalent. | REWRITE/ABSORB D29 |
| D23 | One “axis” is six axes; relevance condition is indeterminate. | REWRITE |
| D24 | Search sequence rule, not a spine-level lexical distinction. | LOCALIZE/CONSTITUTION |
| D25 | Absence of enforcement may count as witness. | REWRITE |
| D26 | Useful particular pattern; essence and record schema mix. | REWRITE LIGHT |
| D27 | Multiple incompatible entropy registers; no common observable identity. | DEFER/LOCALIZE |
| D28 | Value, cycle participation, and obstruction review are underdefined. | DEFER/REWRITE |
| D29 | Valid non-implied-movement core; independent variability overclaims. | REWRITE |
| D30 | Self-application is not distinguished from reprocessing; metadata becomes essence. | REWRITE/LOCALIZE |
| D31 | Primitive is defined by metadata/dependence, nearly circular. | RETIRE/RADICAL REWRITE |
| D32 | Genus is over-governed; exclusions are arbitrary. | REFERENCE |
| D33 | Semantic unit and required canonical card are conflated. | REWRITE |
| D34 | Real referent/eight-part rule; surface undefined and claim schema conflated. | REWRITE |
| D35 | Clear chain; relevant posture precision is indeterminate. | REWRITE LIGHT |
| D36 | Traceability is defined through traceable links and “enough.” | REWRITE |
| D37 | Checkpoint, logic, record, and effect are collapsed. | REWRITE |
| D38 | Norm, intuition, and boundary agree. | KEEP/EDITORIAL |
| D39 | Coherent referent; universal obligations and Requirement boundary need alignment. | REWRITE LIGHT/REFERENCE DS |
| D40 | Real distinction; required schema contains undefined terms and no resolution effect. | REWRITE |
| D41 | Model identity is replaced by a content checklist. | REWRITE |
| D42 | Load-bearing undefined; tree identity replaced by obligations. | LOCALIZE/REWRITE |
| D43 | Single sequence over-specified; intermediate stages undefined. | LOCALIZE/REWRITE |
| D44 | Circular threshold: prose is “not safe enough.” | DEFER/RETIRE |
| D45 | Lens-specific lane bundle rather than stable genus. | LOCALIZE |
| D46 | Over-fixed pipeline with open evidence classes. | LOCALIZE |
| D47 | Evidence, effect, and automation limitation share one enum. | REWRITE/LOCALIZE |
| D48 | Single path conflicts with varied instances and evidence posture. | REWRITE |
| D49 | Active invariant disclaims enactment. | REWRITE |
| D50 | Public Arcanum genus is locally reauthored. | REFERENCE/SPECIALIZE |
| D51 | Real kinds; candidate registry and undefined process origin block identity. | REWRITE |
| D52 | Binary not proved complete; contradiction tolerance does not follow from lifespan. | REWRITE |
| D53 | World-only and fan-out are idiosyncratic; boundaries remain open. | REWRITE/DEFER |
| D54 | Good must-hold core; axiom/constitution/validator obligations exceed essence. | REWRITE |
| D55 | Good defeasible proposition core; axis posture and promotion path overclaim. | REWRITE |
| D56 | Real referent; `(K,C,R,N)`, inspection-decidability, and levels not universal. | REWRITE |

Initial conclusion: only D38 approached `KEEP`; this did not imply that the other
55 referents should disappear. D51 and D56 were explicit cases where the concept
should survive a bad card.

## Robot-Talks Confrontation

Rival inputs:

- Simon argued that D56 has real referents/enforcement but its generic semantics
  are already Arcanum-owned, so CAV2 should reference/specialize. He also argued
  that D51 collides with Arcanum's authoritative sense of canonical artifact and
  may need renaming; real local referents can still be localized.
- Tarski found D51's `origin = process(kind)` contradicted by the registry, D56's
  `(K,C,R,N)` non-universal, D38's equation empty, and useful formal content in
  D26/D28/D35/D37/D49. He also found the schema registry stale.

## Position Changes

| ID | Initial | Final | Change |
|---|---|---|---|
| D26 | REWRITE LIGHT | KEEP/REWRITE LIGHT | Preserve identity, idempotency, and replay formalism where it buys reproducibility. |
| D35 | REWRITE LIGHT | KEEP/REWRITE LIGHT | Preserve a typed transformation chain if its relation kinds have stable owners. |
| D37 | REWRITE | REWRITE, PRESERVE TRANSITION MODEL | Useful formal transition semantics do not cure category collapse. |
| D38 | KEEP/EDITORIAL | KEEP, REMOVE EQUATION STATUS | `claim <= proof` remains mnemonic; no normative order/measure is defined. |
| D49 | REWRITE | REWRITE, PRESERVE DEFAULT-DENY FORMALISM | Closed enumeration is operationally useful; adoption/enactment posture remains contradictory. |
| D51 | REWRITE | RENAME + REWRITE | Preserve the referent, remove canonical-name collision and undefined origin predicate. |
| D56 | REWRITE | REFERENCE/SPECIALIZE | Arcanum owns the genus; CAV2 may own only demonstrated local obligations. |

No change for D28: potentially useful notation cannot compensate for undefined
`value`, cycle scope, or obstruction condition.

## Final Position

### Accepted Critiques

- A real referent does not imply central ownership. D24 and D42-D47 are clear
  localization candidates despite concrete use.
- D56 implementations prove the referent but not CAV2 ownership of the genus.
- D51's own boundary admits two opposed meanings of canonical; stating the
  collision does not resolve it.
- D51's producer equation presumes a single producer while its registry contains
  alternations/compositions and its origin field has no defined referent.
- D56's four-part model is a possible relational specialization, not the essence
  of every schema.
- D38's rule is meaningful but its inequality is formally empty without a support
  order.
- A stale/candidate registry does not prevent proposing a rule, but prevents a
  definition from presenting membership as settled and decidable.

### Rejected or Qualified Critiques

- Useful formalism in D26/D35/D37/D49 is worth preserving, but does not grant
  `KEEP` to semantically inconsistent cards.
- Rename alone cannot repair D51; its membership, conformance, provenance, and
  authority predicates must also be separated.
- Simple reference is insufficient for D56 when CAV2 needs owned conformance and
  authority-non-collapse rules; `REFERENCE/SPECIALIZE` is the right posture.
- D28 should not survive merely because a future formal guard could be useful.
  Its current operands and stopping condition are not sufficiently defined.

### D56: Reference/Specialize

CAV2 should reference `DEF-ARC-SCHEMA` for generic schema semantics. A local card
may specialize only demonstrated obligations: schema as a shape/conformance
surface; structural conformance does not imply truth, authority, or promotion;
local schemas may define record, meta-type, and edge constraints; enforcement
posture is declared as proposed, review-checked, or validator-checked. `(K,C,R,N)`
may appear in a narrower relational-schema specialization, never as a universal.

### D51: Rename + Rewrite

The concept to preserve is an artifact whose kind belongs to a governed artifact
kind registry. Candidate names include `governed-kind artifact`, `registered-kind
artifact`, or `typed governed artifact`. Keeping `canonical artifact` would
institutionalize cross-repository polysemy: authoritative version in one surface,
typed but potentially non-authoritative artifact in another.

The rewritten concept should separate:

- membership: its kind is registered;
- conformance: it satisfies that kind's schema;
- provenance/attestation: its origin is evidenced;
- authority: its independent lifecycle posture.

`process_origin` must not be part of identity until its referent and attestation
rule are resolved.

### Unreconciled Tensions for Synthesis

1. Owner preference for `canonical artifact` versus the unresolved semantic
   collision. My recommendation remains rename, not removal of the concept.
2. How much D56 can specialize without reauthoring `DEF-ARC-SCHEMA`; this requires
   clause-by-clause ownership comparison.
3. Whether D49 is an adopted review-enforced rule or only a proposed definition.
4. Where D26/D35/D37 definitions end and their separate record schemas begin.
5. Tarski sees possible operational value in D28; I still find its operands
   semantically incomplete.
6. D38 may retain `claim <= proof` as intuition/alias, but not as normative
   mathematics without a defined ordering relation.

Final definitional stance: demonstrated referents block premature deletion, not
critical rewriting; useful notation does not repair inconsistent identity; and
owner boundaries determine reference/specialization independently of use.
