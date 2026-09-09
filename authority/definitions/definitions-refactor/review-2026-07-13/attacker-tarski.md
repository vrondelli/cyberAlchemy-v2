# Definitions Refactor — Tarski Attacker Return

Date: 2026-07-13  
Role: Tarski, Alfred — formal-vacuity attacker  
Scope: `CAV2-D1` through `CAV2-D56`  
Status: review evidence; not authority  

## Initial Position

Formal notation is justified only when it removes ambiguity, enables
classification or composition, states a checkable normative condition, or maps
to a recognizable structure. Lack of a machine validator does not invalidate an
honest normative rule. Conversely, tuples and equations do not become types or
proofs merely because they use mathematical syntax.

### Key Findings

1. `DEFINITION-SCHEMAS.md` says that only D23 and D51 are tracked schemas, both
   documentary and with validators deferred. Seventeen other tuple-bearing
   definitions are backlog. Documentary status is legitimate, but it does not
   establish field types, identity, conformance, or machine validation.
2. The schema registry is semantically stale, not merely incomplete. It records
   D34 as Constitution, D35 as Discipline, D36 as Decision, and D37 as Spec,
   while the current definitions source assigns those IDs to Authority,
   Provenance, Traceability, and Gate. The registry cannot witness the current
   tuples.
3. Some formalizations buy real discriminating power: D26 gives the standard
   event-sourcing fold; D28 gives a boolean forbidden combination; D37 closes a
   verdict enumeration; D49 gives membership plus default-deny.
4. D51 is contradicted by its primary consumer. Its identity requires
   `origin(a) = process(kind(a))`, while `CANONICAL-KINDS.md` records kinds with
   zero producers, a kind with multiple producers, and explicitly concludes that
   process is a property rather than a membership condition.
5. D56 universalizes `Schema = (K,C,R,N)`, but real repository schemas express
   different structures directly: JSON Schema objects and constraints,
   DomainSpec typed relationship signatures, and Craft YAML enums/row families.
   They can be projected retrospectively into `K/C/R/N`, but none depends on that
   decomposition.

### Complete Initial Matrix

Legend: **Useful** buys a classification, composition, or checkable boundary;
**Dispensable** restates prose; **Inconsistent** conflicts with its prose,
consumer, or its own symbol use; **No formalism** is neutral.

| ID | Initial assessment | Formal-semantics finding |
| --- | --- | --- |
| D1 | No formalism | Repository target state is prose-only. |
| D2 | No formalism | Consolidation practice is prose-only. |
| D3 | No formalism | The short authority-surface distinction needs no tuple. |
| D4 | No formalism | Source selection is expressed directly. |
| D5 | No formalism | Its verdict vocabulary should reuse D37 rather than gain another notation. |
| D6 | No formalism | Recurring practice in prose. |
| D7 | No formalism | Concrete manifest schema should own structure. |
| D8 | No formalism | Candidate posture is directly stated. |
| D9 | No formalism | Project description, not a formal object. |
| D10 | No formalism | Local grouping/routing concept. |
| D11 | No formalism | Container metaphor. |
| D12 | No formalism | Concrete Craft files carry the structure. |
| D13 | No formalism | Calls itself ordered without defining queue operations. |
| D14 | No formalism | Spatial/source classification. |
| D15 | No formalism | Spatial/project classification. |
| D16 | Useful; simplify | `R(A,B)` identifies endpoints, direction, owner, evidence, and effect, but relation kinds and applicability need owners. |
| D17 | Dispensable | `R_n -> seed(L_n+1)` redraws the metaphor; closure, altitude, and increased residue remain undefined. |
| D18 | Inconsistent | `F:A->B` and preservation condition help, but “part of A not preserved by B” cannot cover absent justification, validation, or never-present information. |
| D19 | Dispensable | `O_U=(N,E,B,R,C,P,G)` is a lettered list without edge signatures, laws, or cardinalities. |
| D20 | Dispensable | `L_S=(C,B,E,D,G,A,N,R)` renames ledger sections; the YAML schema is more precise. |
| D21 | Inconsistent | A four-facet method has a five-element tuple, and routing every absence to residue makes satisfaction nearly vacuous. |
| D22 | Inconsistent | Derivability, unique operational distinction, mutual information, and retrieval precision are different mathematical registers. |
| D23 | Inconsistent | The tuple mixes kind, status, confidence, provenance, owner, and residue as if they were homogeneous axes; field names drift from consumers. |
| D24 | Dispensable | A selector ladder that may skip arbitrary empty layers is guidance, not a necessary formal structure. |
| D25 | Useful; simplify | Separates amendment, compatibility, and witness, though accepting an absent witness as residue weakens completion. |
| D26 | Useful | `P(E)=fold(apply,initial,E)` maps event sourcing and gives correction/idempotency consequences. |
| D27 | Useful when narrowly scoped | Shannon/Boltzmann equations buy calculation only for the declared finite probability/coarse-graining settings. |
| D28 | Useful | `not(value_constraining(E) and cycle_permitted(E))` exactly identifies the blocked combination. |
| D29 | Useful; simplify | Non-implication unless an explicit bridge exists states the governance rule; “orthogonal” must not imply an inner product or statistical independence. |
| D30 | Dispensable | `P_hn(a_n) -> a_(n+1)` does not define altitude, ordering, stopping, or recomposition. |
| D31 | Inconsistent | `primitive_type(t)` is decided by owner/documentation rather than semantic primitiveness; “not derived from narrower source” is unstable. |
| D32 | Dispensable | The eleven-field tuple is an arbitrary checklist, not a discriminator for methodhood. |
| D33 | Useful as a record shape | It can audit CAV2 definition cards, but it formalizes the editorial record, not the essence of Definition. |
| D34 | Inconsistent | Eight fields are declared, only five are required for admissibility, and none has a type; the tuple overstates its contract. |
| D35 | Useful | `Prov(x)` as a typed path enables lineage composition and distinguishes provenance from a flat link list. |
| D36 | Useful | `trace_q(x)` makes traceability query-relative and requires a path or explicit break. |
| D37 | Useful | Decision function plus `{pass,flag,block,defer}` has an operational codomain and should own the shared verdict enum. |
| D38 | Formal equation dispensable; rule useful | `S(c) <= strength(P(c))` suggests an order that is nowhere defined; the prose rule is stronger and more honest. |
| D39 | Dispensable | The proposed intent tuple is not the shape used by artifact admission. |
| D40 | Useful but incomplete | The tuple distinguishes challenge protocol from confidence and verdict, but required/optional fields and types are unspecified. |
| D41 | Useful as a model projection | The routing tuple can summarize the authority-model table, but must be derived from it rather than compete with it. |
| D42 | Useful | The tuple maps closely to the artifact-admission record fields. |
| D43 | Dispensable | A narrative lifecycle was turned into a tuple without transitions, optionality, or admissible skips. |
| D44 | Inconsistent | `owner_route(c)` and similar values are used as booleans without predicates of existence or validity. |
| D45 | Dispensable | Heterogeneous UX lanes are aggregated without types or relations. |
| D46 | Dispensable | Another lifecycle represented as a record rather than a transition system. |
| D47 | Inconsistent | “claim class matches evidence kind” lacks a compatibility relation, and the classes mix verdict, method, and automability. |
| D48 | Useful; simplify | `(stages,gates,owner,stop)` is a plausible minimal lifecycle contract; the asserted instance set/default are separate claims. |
| D49 | Useful | Closed-set membership plus default-deny is discriminating and directly applicable. |
| D50 | Useful as a record shape | Steward, recurrence evidence, maturity, and hardening move distinguish a governed discipline card. |
| D51 | Inconsistent | Producer-origin identity is refuted by the kind table; the tier subset claim and declared/inherited field rules also conflict. |
| D52 | Inconsistent | The enum is useful, but lifespan does not imply contradiction policy; “orthogonal” is not formalized. |
| D53 | Inconsistent | Axiom does not entail high veracity or a fixed fan-out; assumption and truth are conflated. |
| D54 | Inconsistent | The universal must-hold clause is useful, but mandatory axiom grounding is not constitutive and D34 is misidentified as Constitution. |
| D55 | Inconsistent | Premise does not entail low-veracity/high-conviction, and evidence does not generically promote a premise into an axiom. |
| D56 | Inconsistent | `K,C,R,N` is not universal; constraints may be contextual/cross-occupant and conformance cannot always be characterized as interpretation-free inspection. |

### Gaps or Inconsistencies

- `scope`, `effect`, `strength`, `altitude`, `posture`, `owner_route`, and
  `residue` repeatedly appear as if they were types but lack domains and equality.
- Tuples generally omit cardinality, optionality, identity, and field types.
- Arrows alternately mean functions, transformations, lifecycle transitions,
  provenance edges, or merely narrative sequence.
- “Orthogonal” shifts between non-implication, non-redundancy, lifecycle
  independence, and mathematical independence.
- D53/D54 cite D34 as Constitution although D34 is Authority.
- `DEFINITION-SCHEMAS.md` carries obsolete D34-D37 identities and cannot be
  mechanically synchronized.

### Local Tensions

- `DEFINITIONS.md` presents tuples as normative; the registry calls them
  documentary.
- Arcanum's canonical schema constitution requires `.schema.yml` for new
  machine-readable schemas; CAV2 uses Markdown tuples under the same word
  “schema”. Documentary and machine-schema maturity must stay separate.
- D56 imposes a theoretical decomposition that actual schemas do not use.
- D51 makes producer origin constitutive while its consumer says producer is
  merely a property and may be absent or multi-valued.
- D38 is a strong epistemic norm wrapped in a mathematically empty inequality.

### Questions for Synthesis

1. Should a formal section be admitted only when it declares a predicate, enum,
   relation signature, or record shape that a consumer can classify?
2. Should documentary tuples be called `contract shape` rather than `schema`
   until subject and conformance semantics exist?
3. Can D26, D28, D35, D37, and D49 form the first small set of genuinely useful
   formal structures?
4. Should D27 remain in its mathematical/research owner rather than the general
   spine?
5. Should D33/D40/D42/D50 reference owner schemas rather than duplicate fields?
6. Should the stale registry be archived with the old definitions instead of
   synchronized into the rebuilt spine?

## Robot-Talks Confrontation

Simon argued that real referents support rewriting/renaming D51 and that D56
should reference or specialize Arcanum's `DEF-ARC-SCHEMA`; absence of
implementation does not invalidate a rule. Wittgenstein argued that D51 must
remove `process_origin` from identity, D56 should center the
specification/subject-of-conformance relation, and definition cards must split
semantic essence, record shape, and enforcement posture.

### Position Changes

| Topic | Initial position | Final position | Change |
| --- | --- | --- | --- |
| D51 | Current formalism inconsistent | Current formalism remains inconsistent; concept may survive as renamed/rebuilt recognized artifact-kind instance | Accepted Simon's referent argument without accepting the refuted identity. |
| D56 | `(K,C,R,N)` inconsistent as universal | Reference `DEF-ARC-SCHEMA`; specialize only subject/applicability/conformance when CAV2 needs a local contract | Accepted Simon and Wittgenstein with a stricter applicability domain. |
| D38 | Equation dispensable, rule useful | Same | No change; remove the inequality unless an order is defined. |
| Documentary records | Useful only when fields buy classification | Separate semantic essence, normative record shape, and enforcement posture; lack of validator is not disqualifying | Terminology and layering clarified. |

### Accepted and Rejected Critiques

- **Accepted:** a normative record can be useful before deterministic validation.
  D25, D40, and D49 illustrate review-checkable structures.
- **Rejected:** real referents do not make D51's current identity true.
  `CANONICAL-KINDS.md` directly refutes producer-origin as membership.
- **Accepted:** remove `process_origin` from D51 identity until producer relation,
  cardinality, and owner are resolved. `creates/created-by` suggests provenance,
  not an intrinsic identity field.
- **Accepted:** D56 should define schema relative to a subject class and declared
  conformance predicates. A binary relation alone is insufficient without
  applicability and pass/fail semantics.
- **Accepted:** definition cards must not collapse semantic essence, editorial
  record shape, and enforcement maturity.

## Final Position

### Minimum Formal Core for D51

Rename provisionally to avoid the established authoritative-version meaning of
“canonical”, for example `Recognized Artifact Kind Instance` or `Governed Typed
Artifact`:

```text
ArtifactKinds = enumerated kinds owned by the applicable catalog
kind_of(a) = k
recognized_instance(a) iff k in ArtifactKinds
                         and conforms(a, instance_contract(k))
recognized_instance(a) =/=> authoritative(a)
```

If `instance_contract(k)` does not exist, membership is candidate/undetermined,
not true. `process_origin`, producer, durability, authority kind, and authority
state are separate properties or relations. They are not constituents of
identity.

### Minimum Formal Core for D56

Reference Arcanum's schema definition and specialize only if CAV2 demonstrates a
local distinction:

```text
schema S specifies admissible structure for subject class X
subject(S) = X
conforms_S : X -> {pass, fail}
conforms_S(x) reports only the declared predicates of S
conforms_S(x) =/=> true(x) or authoritative(x) or promoted(x)
```

`conforms_S` may be review-based or deterministic; an implemented validator is
not required for the normative relation. Kinds, fields, relations,
multiplicities, and path equations are optional components of particular
schemas, not a universal four-part decomposition.

### Documentary Record Policy

Every surviving definition card should separate:

1. **Semantic essence** — the normative meaning and boundary.
2. **Record shape** — fields, required/optional status, types, cardinality, and
   identity when a shared record exists.
3. **Enforcement posture** — documentary, review, hybrid, or deterministic,
   with owner and witness.

Use tuple notation only when the record shape actually defines those elements.
Otherwise use an ordinary list. Call a structure a schema only when its subject
class and conformance meaning are declared; serialization and enforcement are
separate dimensions.

### Unreconciled Tensions for Synthesis

- D51 has a real design referent but zero conforming corpus instances. Whether it
  belongs in the spine now or remains a local candidate is unresolved.
- D51 must be renamed, but the replacement name is not selected.
- Producer may be a property, a `created-by` relation, or admission evidence; the
  definition must not decide this prematurely.
- CAV2 may need only an alias/reference to `DEF-ARC-SCHEMA`; a local D56 may
  duplicate authority.
- Reuse of the stable D56 ID is a governance defect independent of schema
  semantics.
- D38's inequality is memorable but suggests an order that does not exist.
- The stale schema registry should not be synchronized mechanically before
  surviving record shapes and IDs are adjudicated.

Final vector: bad formalism calls for simplification or reconstruction, not
automatic retirement of a real concept. Real use, however, cannot make a formal
identity true when its own consumers refute it.
