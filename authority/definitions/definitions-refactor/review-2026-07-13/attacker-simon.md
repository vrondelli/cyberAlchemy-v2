# Attacker Report — Herbert Simon

Dispatch: `2026-07-13-definitions-refactor-review`  
Role: explorer / precedent and referent attacker  
Mutation posture: review evidence only; no target mutation  

## Evaluation Vector

This review separates five questions for every `CAV2-D*` card:

1. Does the term name a concrete repository referent or a distinction on which
   repository work depends?
2. Is a canonical rule needed for that referent?
3. Has the proposed rule been adopted?
4. What enforcement exists: documentary, owner/review, or deterministic?
5. Is conformity to that rule actually observed?

An artifact, producer, consumer, recognizable structure, decision, or gate is
required as evidence. Incidental mention is not enough. Lack of literal use of
the current formal model is not evidence that the referent does not exist.

## Initial Position

### Key Findings

1. **The definition authority state is contradictory.** The canonical file
   declares 56 active cards, including `CAV2-D56` at
   `authority/definitions/DEFINITIONS.md:3908`, while the active index says every
   ID other than six entries is retired and reserved at
   `authority/definitions/DEFINITIONS-INDEX.md:27`. The drift audit also says the
   56-card corpus was archived and only six terms remain active at
   `authority/definitions/DEFINITION-DRIFT-AUDIT.md:415-423`. Therefore a card's
   `Status: active` is not sufficient evidence of stable adoption.

2. **Schema has real referents and real enforcement.** DomainSpec maintains
   per-meta-type `*.schema.yml` criteria, human companions that identify those
   files as machine criteria loaded by validators, fixtures, an edge-signature
   authority, and validators. For example,
   `projects/domainspec-v2/impl/spec/meta-types/structural/entity.md:15-16`
   identifies `entity.schema.yml` as the checked machine contract, and
   `projects/domainspec-v2/impl/governance/tags/CODE-TAG-SCHEMA.md:49-50`
   requires canonical meta-types and relationship labels from those authority
   surfaces. The concept must not be removed.

3. **CyberAlchemy v2 should not redefine generic Schema.** Arcanum already owns
   `DEF-ARC-SCHEMA` at `arcanum/definitions/DEFINITIONS.md:77`. CyberAlchemy v2
   can reference that definition and, if necessary, define a genuinely local
   specialization without claiming generic semantics again.

4. **Canonical Artifact names real artifact families but its current meaning
   collides with Arcanum and does not describe the corpus.**
   `ontology/canonical-kinds/CANONICAL-KINDS.md:43` enumerates discovery, research, findings,
   ledger, definition, constitution, decision, spec, discipline, runtime
   contract, projection, residue, and other kinds. The same file says the
   enumeration is a candidate seed, is not closed, and no file currently carries
   `canonical_kind:` (`CANONICAL-KINDS.md:43-46,115-116`). Arcanum defines
   canonical artifact as an authoritative source artifact at
   `arcanum/definitions/DEFINITIONS.md:340-378`; CAV2-D51 instead uses canonical
   for typed/process-born independently of authority. The underlying artifact
   distinction should survive, but its name and definition need repair.

5. **Operationalization is partial and heterogeneous.** Promotion gate is used
   by promotion policy and constitutions. Challenge contract has a structured
   candidate shape in `ontology/NODE-MODEL.md:42-53`. Canonical artifact and
   durability have an admission schema, but the validator surface explicitly
   says `validator not implemented` at
   `validation/artifact-admission/README.md:3`. Rule adoption, review
   enforcement, deterministic enforcement, and observed conformance must remain
   separate claims.

### Complete Preliminary Matrix

Enforcement legend:

- **D** — documentary or modeled;
- **R** — applied by review, owner, or gate;
- **M** — machine-checkable;
- **N** — no enforcement demonstrated.

| ID | Referent and need for rule | Adoption / enforcement | Preliminary recommendation |
| --- | --- | --- | --- |
| CAV2-D1 Stable Repository | Real extraction/readiness target | D/R | REWRITE as a target-state criterion |
| CAV2-D2 Source-Ledgered Amalgamation | Import manifests and source map realize the practice | D/R | REWRITE/LOCALIZE as discipline |
| CAV2-D3 Authority Layer | Authority surfaces and separation rules exist | R; candidate constitution | KEEP/REWRITE |
| CAV2-D4 Source Spine | `SOURCE-MAP.md` realizes the selection | D; source map candidate | LOCALIZE to source map |
| CAV2-D5 Promotion Gate | Promotion policy, owner routes, and constitutions depend on it | R; no generic engine | KEEP/REWRITE |
| CAV2-D6 Stable Repository Stewardship | Discipline card and maintenance practice exist | D/R through discipline route | REFERENCE as a D50 instance |
| CAV2-D7 Authority Import | Definition and constitution manifests exist | D/R | REWRITE/LOCALIZE to import contract |
| CAV2-D8 Import Candidate | Concrete manifest rows exist | D/R | LOCALIZE to import schema |
| CAV2-D9 CyberAlchemy v2 | Project exists; card mainly describes identity | N as rule | LOCALIZE to README |
| CAV2-D10 Definition Tower | Tower map and Craft context exist | D | LOCALIZE to definitions method |
| CAV2-D11 Tower Space | Classification is primarily used by tower map | D | LOCALIZE |
| CAV2-D12 Craft Execution Surface | Ledger, index, and human view exist | M structural/R operational | REFERENCE/SPECIALIZE Craft |
| CAV2-D13 Authority Promotion Queue | Queues and candidate states exist | D/R | REWRITE/LOCALIZE |
| CAV2-D14 Source Space | Routing distinction exists | D | LOCALIZE to source model |
| CAV2-D15 Project Space | Folders and role templates exist | D | LOCALIZE to project-space contract |
| CAV2-D16 Typed Coupling Invariant | Typed edges, rollups, and endpoint checks exist | M in DomainSpec; D/R generically | REWRITE/SPECIALIZE |
| CAV2-D17 Reflection Tower Method | Research and Craft use the idea; no uniform process shown | D/N | DEFER/LOCALIZE |
| CAV2-D18 Residue | Craft, task results, and admission preserve unresolved output | R; some M schemas | KEEP/REWRITE minimum |
| CAV2-D19 Ontology | Ontology package, node/edge models, and projections exist | D/R; mostly candidate | REWRITE |
| CAV2-D20 Craft Method | Skill, ledger, and recurring execution exist | R/M local | REFERENCE/SPECIALIZE Craft |
| CAV2-D21 Four-Facet Action Method | Rule occurs in research and schemas, not across all governed actions | D/N globally | DEFER or future constitution |
| CAV2-D22 Orthogonal Classification | Redundant-axis problem is real | R locally; no general checker | REWRITE/LOCALIZE |
| CAV2-D23 Authority Lifecycle Axis | Kind/status/evidence/commitment/provenance/owner appear in models | D/R; documentary schemas | REWRITE |
| CAV2-D24 Provenance-First Navigation | Index/manifests and navigation sequence exist | R procedural | LOCALIZE as navigation method |
| CAV2-D25 Schema Amendment Witness | Schema changes and witnesses are real needs | R precedents; no uniform contract | DEFER/LOCALIZE to constitution |
| CAV2-D26 Append-Only Event Ledger | Telemetry, Craft/event precedents, and ledgers exist | M on local surfaces | REWRITE/LOCALIZE |
| CAV2-D27 Residue Entropy | Lean and formal research provide mathematical referents | M in formal domain; not general spine | LOCALIZE to formal/research |
| CAV2-D28 Value-Cycle Edge Guard | Edge-law and acyclicity risk are real | R/candidate constitution | LOCALIZE as constitution/invariant |
| CAV2-D29 Axis Orthogonality Invariant | Independence between authority axes is repeatedly used | R; no general validator | REWRITE |
| CAV2-D30 Bounded Recursive Self-Application | Craft and recursive contexts exist | R procedural | REWRITE/LOCALIZE |
| CAV2-D31 Primitive Type | Mainly organizes the definition tower itself | D/N | LOCALIZE or RETIRE |
| CAV2-D32 Method | Concrete methods exist; the genus has semantic work | D/R | REWRITE/REFERENCE framework |
| CAV2-D33 Definition | Canonical source, IDs, voices, index, and drift depend on it | R/M partial | KEEP/REWRITE |
| CAV2-D34 Authority | Authority model, decisions, and imports depend directly on it | R | KEEP/REWRITE |
| CAV2-D35 Provenance | Manifests, decisions, Craft, and admission contain records | R/M partial | KEEP with local schema fields |
| CAV2-D36 Traceability | Handoffs, source links, and continuation paths exist | R; no general checker | REWRITE |
| CAV2-D37 Gate | Promotion, decision, validation, and admission gates exist | R/M local | KEEP/REWRITE |
| CAV2-D38 Claim-Proof Bound | Decisions and reports narrow claims to evidence | R | KEEP |
| CAV2-D39 Intent | Invoke, Craft, and work artifacts begin from intent | R in capabilities | REFERENCE/SPECIALIZE |
| CAV2-D40 Challenge Contract | Structured node model and admission fields exist | D/M shape; divergent consumers | KEEP/REWRITE |
| CAV2-D41 Authority Model | Active owner-facing artifact exists | R | REWRITE; avoid duplicating the model |
| CAV2-D42 Governed Artifact Tree | Architecture inventory and admission use the interface | D/R; validator candidate | REWRITE |
| CAV2-D43 Pattern Promotion Lifecycle | Architecture governance uses the route | D/R local | LOCALIZE to architecture |
| CAV2-D44 View-Bearing Concept | Ontology and architecture views exist | D; threshold not applied | LOCALIZE/DEFER |
| CAV2-D45 UX/UI Knowledge Governance | UX governance artifact exists | D/R local | LOCALIZE |
| CAV2-D46 Experience Evidence Lifecycle | UX lesson and validator handoffs realize the route | R local | LOCALIZE |
| CAV2-D47 Interface Evidence Boundary | Claim classes are used by UX validator | M/R local | LOCALIZE to UX constitution/contract |
| CAV2-D48 Authority Promotion Lifecycle | Promotion policy and specific lifecycles exist | R | REWRITE |
| CAV2-D49 Closed Authority-Kind Enumeration | Catch-all row and owner decision exist | R; deterministic scan pending | KEEP |
| CAV2-D50 Discipline | Cards, catalog, owner route, and maturity exist | R | KEEP/REFERENCE Arcanum |
| CAV2-D51 Canonical Artifact | Artifact kinds exist; process/origin and name are problematic | D/R forward-looking; no conforming corpus | REWRITE/RENAME, not retire |
| CAV2-D52 Artifact Durability | Kind table and admission use ephemeral/perennial | D/R candidate | REWRITE after D51 |
| CAV2-D53 Axiom | AXIOMS and source corpora exist | R by owner; world-only split unsettled | REWRITE |
| CAV2-D54 Invariant | Specific invariants, constitutions, and validators exist | R/M local | REWRITE |
| CAV2-D55 Premise | Premise corpora exist; active CAV2 use is weak | D/N | DEFER/REFERENCE |
| CAV2-D56 Schema | Schemas, instances, fixtures, and validators are abundant | M in Arcanum/DomainSpec | REFERENCE/SPECIALIZE `DEF-ARC-SCHEMA`, never retire |

### Gaps and Inconsistencies

- D5 admits `pass`, `flag`, and `block`; D37 and Authority Model include
  `defer`. The gate verdict vocabulary lacks one owner.
- D34 requires eight authority components, but the minimal refactor explains
  only six. `surface` and `challenge_route` lack stable independent semantics.
- D40 has at least two shapes: a structured object in the node model and free
  text in the admission schema. The referent exists, but conformance is not
  uniform.
- D51 is blocked by `process_origin`: functional versus multiple producers and
  declared versus attested origin.
- D53/D54 point to `CAV2-D34` as constitution even though D34 is Authority. This
  is a dependency error, not merely missing enforcement.
- D56 reuses an ID that the index and drift audit declare permanently reserved
  after its historical use for `process`.
- Many current cards are constitution rules, local methods, or artifact
  descriptions rather than definitions. A valid referent does not prove the
  central definition spine is the correct owner.

### Local Tensions

- **Existence versus name:** discovery, research, ledger, and spec exist. That
  supports a rule for artifact kinds, but not the name `canonical artifact`.
- **Future rule versus present claim:** `canonical_kind` can be a legitimate
  forward-looking rule, but cannot be described as a classification already
  adopted by the corpus.
- **Definition versus constitution:** a definition can state what an invariant
  is; the obligation that every invariant must trace or be enforced likely
  belongs to a constitution.
- **Reference versus specialization:** Schema must remain visible to CAV2, but
  generic ownership already belongs to Arcanum.

### Questions for Synthesis

1. Should the CAV2-D51 distinction be renamed `typed artifact`, `governed
   artifact`, `recognized artifact`, or `enumerated artifact`, preserving the
   Arcanum meaning of canonical artifact?
2. Can the new file preserve IDs that the index and drift audit declared
   permanently retired, or must the owner explicitly revoke the reservation?
3. Should the refactor contain reference cards such as `Schema — see
   DEF-ARC-SCHEMA`, or only an external dependency section?
4. What is the threshold for a rule to remain definitional rather than move to
   a constitution, schema, or local method?
5. Does adoption require owner approval alone, or also index synchronization and
   absence of contradiction across audit and consumer surfaces?

Initial conclusion: the previous removal criterion was invalid. Schema and the
canonical-artifact/kinds family pass the referent test. Their ownership, names,
completeness, and enforcement posture need repair; lack of current conformance
does not justify removal.

## Robot-Talks Confrontation

### Rival Positions Considered

Wittgenstein argued that only D38 was close to `KEEP`; D51 should survive as
`REWRITE`, but `process_origin` must leave its identity until it has semantics;
D56 should be the relation between a specification of admissible structure and
a subject of conformance, not the theoretical tuple `K,C,R,N`; and every card
must separate definition, normative rule, and enforcement posture.

Tarski argued that D51's `origin = process(kind)` contradicts the producer
registry; D56's `K,C,R,N` is a theoretical projection rather than an essence;
formalism survives only when it purchases reproducible decisions;
`DEFINITION-SCHEMAS.md` is stale or corrupted; D26, D28, D35, D37, and D49
contain potentially useful formal cores, while many other records are only
symbolized checklists.

## Position Changes

The referent test did not change, but the confrontation exposed places where the
initial matrix conflated survival of the concept with preservation of the exact
card.

- **D35 Provenance:** `KEEP` became **REWRITE**. The referent is strong, but the
  path tuple does not by itself provide resolvability, link identity, or
  verifiability.
- **D49 Closed Authority-Kind Enumeration:** `KEEP` became **REWRITE**. The rule
  is enacted in review mode, but the card retains contradictory historical
  statements about C16 and enactment.
- **D26 Append-Only Event Ledger:** `REWRITE/LOCALIZE` became **REWRITE with its
  formal core preserved**. Fold/replay semantics, idempotency, and corrective
  events buy reproducible distinctions.
- **D28 Value-Cycle Edge Guard:** `LOCALIZE` became
  **REWRITE/SPECIALIZE**. The two predicates yield a reproducible admission
  decision. The definition may name the guard; a constitution or gate owns the
  obligation to block.
- **D37 Gate:** the mixed `KEEP/REWRITE` became an explicit **REWRITE**, while
  preserving a declared verdict set and recorded transition effect.
- **D51** remains **REWRITE/RENAME**.
- **D56** remains **REFERENCE/SPECIALIZE**, but `K,C,R,N` is no longer accepted
  as its essence.

For the exact wording of the 56 active cards, Simon now accepts Wittgenstein's
text-level verdict: only D38 is close to `KEEP` without substantial rewriting.
This does not imply that only D38 has a real referent or deserves definition.

## Accepted Rival Critiques

1. **Remove `process_origin` from D51 identity for now.** The card itself records
   the one-versus-many producer contradiction and declared-versus-attested fork.
   Until origin semantics and evidence are settled, it may be optional provenance
   or a future obligation, not an identity condition.

2. **Do not define every schema as `K,C,R,N`.** DomainSpec proves that kinds,
   constraints, relation signatures, and connection rules are schema components
   in some graph-shaped schemas. It does not prove those four parts are
   universally constitutive. JSON Schema, frontmatter, dispatch records, and
   row schemas need not expose the categorical decomposition.

3. **Use a relational minimum for Schema.** A schema specifies admissible
   structure for a subject, and an instance may conform to it:

   ```text
   schema_for(S, X)
   conforms(x, S)
   ```

   Kinds, constraints, relations, and connection rules are possible schema
   content, not universal essence.

4. **Separate definition, normative rule, and enforcement posture.** A card
   must not turn an identity statement into an obligation or turn `active` into
   a deterministic-enforcement claim.

5. **Formalism must buy a reproducible decision.** Preserve narrow formal cores
   of D26, D28, D35, D37, and D49 only where a consumer can use them to classify,
   route, validate, or distinguish cases.

6. **A tuple that repeats headings is a checklist, not formalization.** Symbols
   without additional discriminating or compositional power should be removed.

## Accepted with Reservation

`DEFINITION-SCHEMAS.md` must be treated as stale or untrusted during the
refactor. The D56 ID reuse and disagreement between canonical source, index, and
drift audit support that caution. Simon does not endorse the stronger word
`corrupted` as an established fact because this attacker did not perform a
complete independent audit of that specific registry.

## Rejected Rival Inference

Simon rejects the inference that only D38 should survive as a concept. Promotion
gate, authority, provenance, challenge contract, schema, artifact kinds,
discipline, and several other terms have concrete artifacts, decisions, and
consumers. Semantic failure of their current cards supports `REWRITE`, not
erasure of their referents.

Simon also rejects removing a formal statement merely because no global
validator exists. A documentary formal rule can establish a reproducible review
decision before automation, provided it states `review-mode` honestly.

## Final Position on D51

The underlying concept should survive as:

> An artifact instance whose kind belongs to a governed artifact-kind
> enumeration.

A minimum candidate predicate is:

```text
recognized_artifact(a) iff kind(a) in GovernedArtifactKinds
```

The initial identity must not include:

- `process_origin`;
- authority state;
- durability;
- a rollup asserted by the artifact instance.

Those may be governed properties or relations. The artifact can carry a kind
key; type-level facts should be looked up from the kind registry.

The name remains a blocker. Arcanum uses canonical artifact for authoritative
source truth, while CAV2 uses it for a typed artifact that may have no authority.
The CAV2 concept should therefore be renamed, preferably `recognized artifact`,
`typed governed artifact`, or `enumerated artifact`. Keeping the same name would
create an explicitly incompatible local redefinition across an authority
boundary that repository policy says should be handled by reference.

## Final Position on D56

Schema must remain available to CyberAlchemy v2, but not as a duplicate generic
definition. The refactor should reference Arcanum `DEF-ARC-SCHEMA` and explain
local examples non-normatively.

If CAV2 needs an additional rule, it should receive a distinct term and ID, such
as `schema conformance relation` or `CAV2 structural schema specialization`.
Its minimum content is:

```text
schema_for(S, X)
conforms(x, S)
```

with the local rule that conformance is evidence of form, not evidence of truth,
authority, execution, ownership, or promotion. `K,C,R,N` may be documented as a
useful composition for graph-shaped schemas, never as the universal definition.

## Final Position on Reference Cards

Reference cards are appropriate where another authority owns the generic term.
They should contain:

- the external canonical ID and link;
- why CAV2 depends on it;
- local examples marked non-normative;
- a local specialization only when a distinct rule is demonstrated;
- no duplicate generic normative definition.

If the specialization is normative, it receives a distinct term and stable ID.

## Unreconciled Tensions for Synthesis

1. **D51 name:** preserve `canonical artifact` or respect Arcanum ownership and
   rename the CAV2 distinction?
2. **Enumeration authority:** `CANONICAL-KINDS.md` is candidate and does not
   describe the corpus. Which owner and gate can make it governing?
3. **Artifact membership:** is kind-enumeration membership sufficient, or will
   production provenance become mandatory later?
4. **D56 ID integrity:** restoring Schema under D56 conflicts with permanent ID
   reservation in the index and drift audit.
5. **Reference-card boundary:** how much local explanation can be added before a
   reference silently becomes a redefinition?
6. **Definition versus constitution:** D28 and similar cards can define a guard,
   but the blocking obligation and enforcement owner must live elsewhere.
7. **Adoption vocabulary:** owner approval, index synchronization, review
   enforcement, deterministic enforcement, and observed conformance still lack
   one explicit status model.
8. **Schema registry trust:** `DEFINITION-SCHEMAS.md` requires a dedicated audit
   before any historical handle is reused.

## Final Attacker Conclusion

D51 and D56 fail as current cards, not as necessary concepts. D51 needs a
smaller identity and probably a new name. D56 needs an owned reference plus, at
most, a distinct local specialization. Across the corpus, demonstrated
referents support survival or rewriting; they never excuse semantic
inconsistency, ornamental formalism, false enforcement claims, or ownership
collisions.
