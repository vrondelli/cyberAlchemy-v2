# CyberAlchemy v2 Definitions — Refactor Proposal

Status: proposal / non-canonical  
Owner: definitions-governance  
Review basis: [review-2026-07-13/findings.md](review-2026-07-13/findings.md)  
Canonical source remains: [../DEFINITIONS.md](../DEFINITIONS.md)

## Authority and scope

This file proposes a smaller definition set for the CyberAlchemy v2 authority
spine. It does not replace the canonical source, reactivate retired IDs, amend
the index, promote candidate models, or assert that repository artifacts already
conform to these proposals.

The retained IDs provide review traceability. They become authoritative only
through an owner-approved promotion that resolves the source/index/drift
conflict recorded by the review.

## Admission rule

A term belongs in the v2 definitions spine only when:

1. it names a referent or distinction evidenced by artifacts, producers,
   consumers, structures, decisions, or gates in the repository;
2. a canonical rule about that referent prevents ambiguity, drift, invalid
   promotion, or cross-surface disagreement;
3. its normative meaning is consistent and complete enough to classify cases
   and state the consequence of classification;
4. every formal element earns its place by supporting classification,
   composition, review, or validation; and
5. adoption, enforcement, and observed conformance are reported separately.

The absence of a validator or conforming instance does not make a referent
nonexistent. Conversely, the existence of a referent does not make its current
definition sound.

## Status vocabulary

- `proposed`: semantic wording is ready for owner review, not yet authority.
- `reference`: another owner defines the term; v2 does not redefine it.
- `owner-gated`: the referent survives, but a named decision blocks a complete
  definition.
- `deferred`: evidence is insufficient for a spine definition.
- `retire`: do not carry the old card into the refactor.

Enforcement posture is stated per term as `documentary`, `review`,
`deterministic`, or a combination. It describes current evidence, not desired
maturity.

---

## Proposed local definitions

## CAV2-D1: Stable Repository

Status: proposed  
Term: stable repository

### Normative voice

A stable repository is a repository whose current authority, source
provenance, validation posture, unresolved residue, and operating routes can be
located and evaluated without hidden conversation context, and whose declared
base can be extended without rediscovering which rules govern it.

### Plain-language voice

It is a repository someone can understand, trust within stated limits, and
build on without guessing what counts.

### Domain-context voice

For CyberAlchemy v2, stability is the readiness condition for extraction from
the umbrella repository. It requires navigable authority and explicit blockers;
it does not require every planned capability to be finished.

### Boundary and posture

Stable does not mean public, complete, defect-free, or permanently unchanged.
Satisfaction is review-enforced until an extraction/readiness contract defines
deterministic checks.

### Open Questions

- Which minimum conditions distinguish a stable repository from a merely
  navigable repository?
- Which artifact owns the extraction/readiness criteria consumed by this
  definition?
- Which conditions can be checked deterministically, and which require an owner
  judgment?

## CAV2-D3: Authority Surface

Status: proposed  
Term: authority surface  
Replaces proposed wording: authority layer

### Normative voice

An authority surface is a repository artifact or bounded artifact set that an
applicable authority model, constitution, or owner decision recognizes as able
to state normative semantics or rules for a declared scope.

### Plain-language voice

It is a place the repository has explicitly allowed to say what counts.

### Domain-context voice

CyberAlchemy v2 uses separate surfaces for definitions, constitutions,
decisions, disciplines, and promoted specifications. Research, generated
indexes, runtime evidence, and implementation may support those surfaces but do
not become authority by proximity.

### Boundary and posture

A folder is not an authority surface merely because it contains important
material. Recognition and scope must be explicit. Enforcement is currently by
owner review and repository instructions.

### Open Questions

- What constitutes valid recognition of an authority surface: an authority-model
  row, a constitution, an owner decision, or another mechanism?
- How is the applicability boundary of an authority surface represented without
  relying on the currently undefined term `scope`?
- Which check detects a narrative or generated artifact acting as an undeclared
  authority surface?

## CAV2-D5: Promotion Gate

Status: proposed specialization of `CAV2-D37`  
Term: promotion gate

### Normative voice

A promotion gate is a gate whose decision changes, preserves, or refuses the
authority posture of a candidate relative to a named target authority surface.
It must identify the candidate, target, decision owner, admissible evidence,
decision criteria, verdict, rationale, and challenge route.

Its verdict vocabulary is inherited from `CAV2-D37`: `pass`, `flag`, `block`,
or `defer`.

### Plain-language voice

It decides whether this candidate is allowed to count here, now, and under what
conditions.

### Domain-context voice

Definition, constitution, artifact, and repository-extraction promotion in v2
are specializations of this gate.

### Boundary and posture

The gate is not the owner, the route to the owner, or the promoted artifact.
Its verdict has only the effect granted by the owning promotion policy.
Enforcement is review-based unless a specific gate supplies a validator.

### Open Questions

- Which promotion-gate specializations currently conform to this minimum record?
- Must every promotion gate support all four verdicts, or may an owning policy
  define a strict subset?
- How should a promotion gate reference its decision authority and challenge
  mechanism while those concepts remain incomplete?
- What evidence demonstrates that a gate verdict produced its declared effect?

## CAV2-D16: Typed Coupling

Status: proposed local specialization  
Term: typed coupling

### Normative voice

A typed coupling is a declared relation between two governed objects whose
relation kind determines admissible endpoint kinds, direction, and semantic
effect. A coupling record must name its source, target, relation kind, owner,
and evidence or unresolved residue.

### Plain-language voice

It is a connection that says what connects, in which direction, and what that
connection means.

### Domain-context voice

V2 uses typed couplings for provenance, implementation, validation, rollup,
succession, and other governed links. Individual relation catalogs own their
allowed endpoint combinations.

### Boundary and posture

Calling a link typed does not prove that its endpoints or claim are valid. This
definition supplies the shared relation minimum; owner schemas and validators
may specialize it.

### Open Questions

- Which relation catalog owns the shared vocabulary of coupling kinds?
- What are the minimum types and cardinalities for source, target, owner, and
  evidence or residue?
- Which current edge records instantiate this definition, and which merely use
  similar prose?
- Should invalid endpoint combinations be review findings or deterministic
  validation failures?

## CAV2-D18: Residue

Status: proposed  
Term: residue

### Normative voice

Residue is an unresolved, excluded, conflicting, or not-yet-justified part of a
governed transformation or decision that remains relevant to the result and is
therefore recorded with an owner or route for later treatment.

### Plain-language voice

It is what the work could not honestly settle but must not silently discard.

### Domain-context voice

Craft ledgers, reviews, promotion decisions, and task results use residue to
preserve blockers, dissent, deferred evidence, and non-selected material.

### Boundary and posture

Residue is not a universal escape from required evidence. Recording residue
does not turn a failed admission condition into a pass; the owning gate decides
whether the residue permits continuation, requires deferral, or blocks.

### Open Questions

- What minimum information makes residue actionable rather than an unowned note?
- Which residue kinds permit continuation, require deferral, or force a block?
- How are owner, next route, resolution condition, and supersession recorded?
- Which consumers currently enforce residue handling rather than merely storing
  residue text?

## CAV2-D19: Ontology

Status: proposed  
Term: ontology

### Normative voice

An ontology is a governed meaning model that declares the kinds of things a
scope recognizes, the relations it permits among them, and the constraints
needed to interpret those kinds and relations consistently.

### Plain-language voice

It is the shared map of what exists in a domain and how those things may relate.

### Domain-context voice

The v2 ontology describes repository knowledge objects and their relations.
Its node models, edge catalogs, projections, lifecycle records, and validators
are artifacts that implement or govern the ontology; they are not all part of
the term's essence.

### Boundary and posture

An ontology is not automatically authoritative, complete, or machine-enforced.
Each ontology surface must state its owner and posture.

### Open Questions

- Which components are constitutive of an ontology, and which are implementation
  artifacts of a particular ontology surface?
- What minimum semantics must relation constraints provide beyond naming an edge?
- How should ontology authority and confidence be represented without collapsing
  them into one status?
- Which v2 ontology projections are conforming read models, and how is drift from
  their source detected?

## CAV2-D22: Independent Classification Dimension

Status: proposed rewrite  
Term: independent classification dimension  
Replaces proposed wording: orthogonal classification

### Normative voice

A classification dimension is independent of another when assigning a value
on either dimension does not, by itself, determine the value on the other. Any
allowed dependency or derivation must be stated by an explicit rule.

### Plain-language voice

Two labels are independent when knowing one does not secretly answer the other.

### Domain-context voice

This rule prevents authority kind, maturity, confidence, durability, ownership,
and similar classifications from collapsing into one overloaded label.

### Boundary and posture

Independence here means non-determination, not geometric orthogonality,
statistical independence, or zero mutual information. Enforcement is by review
unless a classification schema supplies a non-collapse validator.

### Open Questions

- What evidence is sufficient to establish that two dimensions are genuinely
  non-determining?
- Which explicit derivation rules are currently allowed between classification
  dimensions?
- Which schemas should reject a value that implicitly determines another field?
- Should this remain a definition, or should its normative requirement move to
  a constitution after the dimensions are stabilized?

## CAV2-D23: Authority Classification Dimensions

Status: proposed rewrite  
Term: authority classification dimensions  
Replaces proposed wording: authority lifecycle axis

### Normative voice

Authority-bearing and authority-adjacent records may require distinct
dimensions for semantic kind, lifecycle status, evidence confidence,
commitment confidence, provenance, and ownership. A record must not use a value
from one dimension as a substitute for another unless an owner rule explicitly
defines that derivation.

### Plain-language voice

What something is, how mature it is, how well supported it is, how strongly it
is adopted, where it came from, and who owns it are different questions.

### Domain-context voice

V2 schemas and authority reviews use these dimensions where relevant. A local
record may omit a dimension only when its owning schema declares it
inapplicable, rather than silently folding it into another field.

### Boundary and posture

This is a family of dimensions, not one mathematical axis and not a universal
record tuple. Enforcement depends on the consuming schema.

### Open Questions

- Which dimensions are required for each authority-record kind, and which are
  optional or inapplicable?
- Are provenance and ownership classification dimensions or separate relations
  attached to the record?
- What are the allowed values and owners for evidence confidence and commitment
  confidence?
- Which current records conflate these dimensions and require migration?

## CAV2-D26: Append-Only Event Ledger

Status: proposed  
Term: append-only event ledger

### Normative voice

An append-only event ledger is an ordered sequence of immutable event records
from which a current projection can be reproduced by applying the events in
order. Corrections are recorded by later events; earlier events are not edited
or deleted.

For a ledger `E = [e1, ..., en]` and initial state `s0`:

```text
project(E) = fold(apply, s0, E)
```

The ledger must define event identity, ordering, replay behavior, and the
meaning of correction or supersession events.

### Plain-language voice

The history stays intact; the present is rebuilt from what happened.

### Domain-context voice

Dispatch telemetry and other repository ledgers use append-only records so
later correction does not erase earlier evidence.

### Boundary and posture

An append-only Markdown or YAML file is not necessarily event-sourced. The fold
applies only where the owner defines event semantics and projection.

### Open Questions

- Which repository ledgers actually define event identity, total or partial
  ordering, replay, and projection semantics?
- Must projection be deterministic, and how are incompatible event versions
  handled during replay?
- What distinguishes correction, supersession, compensation, and ordinary new
  information?
- Which validator proves append-only behavior without treating historical
  correction as mutation?

## CAV2-D29: Authority-Dimension Non-Collapse Rule

Status: proposed rewrite  
Term: authority-dimension non-collapse rule  
Replaces proposed wording: axis orthogonality invariant

### Normative voice

No authority classification dimension may be inferred solely from another
independent dimension. In particular, semantic kind, lifecycle status,
evidence confidence, commitment confidence, provenance, ownership, and
durability remain distinct unless an explicit owner rule authorizes a specific
derivation.

### Plain-language voice

Being a certain kind does not automatically make something mature, trusted,
authoritative, durable, or owned by a particular actor.

### Domain-context voice

This rule governs v2 authority records and protects candidate, evidence, and
artifact classifications from hidden promotion.

### Boundary and posture

The rule asserts non-implication, not mathematical orthogonality. It is
review-enforced until the relevant schemas encode forbidden derivations.

### Open Questions

- What is the authoritative list of dimensions governed by this rule?
- Which derivations are forbidden, and which are legitimate when explicitly
  declared by an owner?
- Can a validator detect collapse from records alone, or does the check require
  comparison with consuming behavior?
- Is this rule better owned as a constitution after its input dimensions are
  defined?

## CAV2-D30: Bounded Recursive Self-Application

Status: proposed rewrite  
Term: bounded recursive self-application

### Normative voice

Bounded recursive self-application occurs when a governed method applies to an
artifact produced by that same method under a declared scope, stopping
condition, and validation rule. Each recursive pass must preserve the method's
ordinary evidence and owner requirements.

### Plain-language voice

A method may work on its own output, but only with a clear boundary and a way to
stop.

### Domain-context voice

Craft contexts, definition reviews, and governance maintenance loops may
re-enter their own outputs to refine them.

### Boundary and posture

Reprocessing alone is not recursive self-application. An unbounded instruction
to “keep improving” does not satisfy this definition.

### Open Questions

- What makes a later pass an application of the same method rather than a new
  method or ordinary rework?
- Which stopping conditions are admissible: fixed rounds, convergence criteria,
  owner decision, or evidence thresholds?
- How is degradation or semantic drift across recursive passes detected?
- Which current Craft or governance loops satisfy this definition end to end?

## CAV2-D33: Definition

Status: proposed  
Term: definition

### Normative voice

A definition is a scoped normative statement that fixes the meaning of a term
well enough to identify its referent, distinguish included from excluded cases,
and state the consequence of using the term within that scope.

A v2 definition card must colocate:

1. normative meaning;
2. plain-language intuition;
3. current v2 domain context;
4. a boundary;
5. owner and status; and
6. enforcement posture when the definition creates a rule.

### Plain-language voice

A definition says what a term means here, what it does not mean, and why the
distinction matters.

### Domain-context voice

Only the promoted v2 definitions source may define canonical v2 semantics.
Indexes, reviews, schemas, and narrative documents reference or test those
semantics.

### Boundary and posture

A definition is not identical to its Markdown card or record schema. Formal
notation is optional and must include its interpretation when used.

### Open Questions

- What minimum inclusion, exclusion, and consequence tests make a definition
  complete enough for promotion?
- When may a definition create a normative rule, and when must that rule be
  owned by a constitution or contract instead?
- Which fields belong to a definition record schema rather than to the semantic
  essence of Definition?
- What validator can check the three voices and detect contradiction among them?

## CAV2-D34: Authority

Status: owner-gated / incomplete  
Term: authority

### Normative voice

Authority is a recognized normative power to determine whether something
counts or which normative consequence follows in a governed context.

The structure required to substantiate an authority claim remains unresolved.
The earlier eight-field tuple is not adopted by this proposal. `scope`,
`owner`, `surface`, and `challenge_route` remain undefined.

The descriptions below are retained as partial working vocabulary. They do not
form a complete authority-claim schema.

| Field | Definition |
|---|---|
| `object` | The artifact, term, rule, state, relation, or other governed thing affected by the claim. |
| `operation` | The action the claim permits, requires, refuses, or constrains with respect to the object. |
| `basis` | The constitution, decision, contract, owner mandate, or other authority source that justifies the claim. |
| `effect` | The normative consequence produced when the claim is validly exercised. |

### Plain-language voice

Authority is the recognized ability to make a normative determination in a
governed context. The exact claim structure is still unsettled.

### Domain-context voice

V2 uses authority claims to keep definitions, constitutions, decisions,
promotion, and validation from inheriting force merely from file location or
agent assertion.

### Boundary and posture

Authority is not expertise, evidence, ownership alone, or the artifact that
records a claim. Recording a claim does not prove that its basis is valid; that
remains reviewable. Current enforcement is owner/review based.

### Open Questions

- What is the minimum semantic core of Authority independent of an
  authority-claim record?
- Are `object`, `operation`, `basis`, and `effect` themselves well-defined and
  constitutive, or are they also provisional record fields?
- What should replace or precisely define the currently unresolved `scope`,
  `owner`, `surface`, and `challenge_route` concepts?
- Which authority claims exist in the repository as complete instances, and
  what observable consequence demonstrates their authority?
- Which parts of authority validity can be checked structurally, and which
  require an owner decision about the cited basis?

## CAV2-D35: Provenance

Status: proposed  
Term: provenance

### Normative voice

Provenance is a typed path that records the origin of a claim or artifact and
the material transformations by which it reached its current form.

Each path step must identify a source, relation or operation, and resulting
object. When a transformation cannot be reconstructed, that gap must be
recorded as residue rather than replaced by an unsupported origin claim.

### Plain-language voice

Provenance tells where something came from and what happened to it along the
way.

### Domain-context voice

Import manifests, decisions, promotion patches, research findings, and artifact
admission records use provenance to preserve source posture across movement.

### Boundary and posture

A list of nearby links is not necessarily provenance. Provenance does not, by
itself, prove truth, authority, or conformance.

### Open Questions

- What relation vocabulary distinguishes source, transformation, decision,
  import, and supersession steps?
- What makes a provenance reference resolvable and stable across repository
  moves or generated projections?
- How should missing or conflicting path segments be represented?
- Which current consumers can reconstruct provenance rather than merely display
  source links?

## CAV2-D36: Traceability

Status: proposed  
Term: traceability

### Normative voice

Traceability is the ability to answer a declared question about an artifact,
claim, rule, or decision by following explicit relations to the evidence and
authority needed for that question, or by reaching an explicit residue that
states why the answer is unresolved.

### Plain-language voice

Something is traceable when a specific question can be followed to an answer or
an honest recorded gap.

### Domain-context voice

V2 uses traceability for questions such as source origin, promotion basis,
implementation target, validation evidence, and supersession.

### Boundary and posture

Traceability is question-relative. One provenance path does not make an
artifact traceable for every purpose.

### Open Questions

- Which trace questions are mandatory for each governed artifact kind?
- What counts as a sufficient terminal answer for source, authority, validation,
  implementation, or supersession questions?
- How is a trace query represented so conformance can be tested repeatedly?
- When should an unresolved trace become residue, a warning, or a blocking
  defect?

## CAV2-D37: Gate

Status: proposed  
Term: gate

### Normative voice

A gate is an owned decision function that evaluates a declared subject against
named inputs and criteria and returns one of four verdicts:

- `pass`: the subject may cross the governed boundary;
- `flag`: it may cross with named risk and required follow-up;
- `block`: it may not cross while the blocking condition holds;
- `defer`: no crossing decision is made until named missing evidence or owner
  input is supplied.

A gate record must preserve subject, owner, inputs, criteria, verdict,
rationale, effect, and challenge route.

### Plain-language voice

A gate is a named checkpoint that makes a reviewable decision instead of
letting a transition happen silently.

### Domain-context voice

Promotion, decision, validation, artifact-admission, and release checks are
gate specializations.

### Boundary and posture

A gate is not merely a route, checklist, validator, or human approver. Those may
implement parts of a gate. The owning contract determines whether its verdict
has review or deterministic enforcement.

### Open Questions

- What is the minimum distinction between gate logic, decision owner, validator,
  gate record, and resulting effect?
- Must `flag` permit crossing, and which artifact records its mandatory
  follow-up?
- How are conflicting gate results composed when several gates govern the same
  transition?
- Which existing gates conform to the proposed record and verdict vocabulary?

## CAV2-D38: Claim-Proof Bound

Status: proposed; retained semantic core  
Term: claim-proof bound  
Mnemonic: claim must not exceed proof

### Normative voice

A claim-proof bound is the rule that a claim may assert no more than its
admissible evidence and validation establish for the claim's declared scope.
Unverified remainder must be narrowed, qualified, deferred, or recorded as
residue.

### Plain-language voice

Do not say more than the evidence can carry.

### Domain-context voice

V2 applies this rule to reviews, research, promotion decisions, validation
reports, implementation claims, and repository-readiness claims.

### Boundary and posture

The mnemonic is not a mathematical inequality unless a consumer defines an
order over claims and proof strength. Enforcement is currently by review.

### Open Questions

- What makes evidence admissible for a particular claim class and scope?
- How should reviewers compare claim strength with proof without pretending a
  universal numeric scale exists?
- Which recurring overclaim patterns can be checked deterministically?
- Where should qualified, deferred, or rejected claim residue be recorded?

## CAV2-D40: Challenge Contract

Status: proposed  
Term: challenge contract

### Normative voice

A challenge contract is a structured agreement that defines how a governed
claim, decision, rule, or authority exercise may be contested and resolved. It
must identify:

- the challengeable subject and admissible grounds;
- who may raise and who must answer the challenge;
- required evidence and submission channel;
- the decision owner and procedure;
- possible effects, including uphold, amend, supersede, withdraw, or defer;
- closure, escalation, or appeal conditions; and
- the record that preserves the outcome.

### Plain-language voice

It is the rulebook for disputing a decision without improvising the process
after the dispute begins.

### Domain-context voice

The `challenge_route` field of an authority claim or gate points to an
applicable challenge contract or to an owner route that must resolve to one.
V2 node and admission models are consumers that require later conformance work.

### Boundary and posture

A free-text complaint channel is not a complete challenge contract. A contract
may be documentary and review-enforced before a deterministic validator exists,
but its posture must be explicit.

### Open Questions

- What is the minimum typed shape of a challenge contract and which fields are
  required for every challenge class?
- Is a `challenge_route` a reference to a challenge contract, a routing record,
  or a projection of the contract, and how is that reference resolved?
- What governs the subject while a challenge remains unresolved?
- Which current node and admission records can migrate to one shared contract
  without losing owner-specific rules?
- Which closure and appeal outcomes require append-only evidence?

## CAV2-D41: Authority Model

Status: proposed rewrite derived from [../../AUTHORITY-MODEL.md](../../AUTHORITY-MODEL.md)  
Term: authority model

### Normative voice

An authority model is the governed arrangement that identifies authority
surfaces and kinds, the scopes they own, the allowed relations and transitions
among authority states, and the gates by which authority is created, changed,
challenged, or withdrawn.

### Plain-language voice

It is the map of where authority lives and how it is allowed to move.

### Domain-context voice

The detailed v2 tables, routes, and classifications remain owned by
`AUTHORITY-MODEL.md`; this card supplies only the shared semantic minimum.

### Boundary and posture

The model is not authority merely because it describes authority. Its own
status and owner must be explicit. Current v2 enforcement is primarily review
based.

### Open Questions

- Which portions of `AUTHORITY-MODEL.md` are normative model content versus
  explanatory navigation?
- How does an authority model acquire, change, or lose its own authority without
  circular self-authorization?
- Which transitions and relations must be common across authority kinds, and
  which belong to kind-specific lifecycles?
- What validation can detect drift between the model, constitutions, definitions,
  and operational consumers?

## CAV2-D42: Governed Artifact Tree

Status: proposed  
Term: governed artifact tree

### Normative voice

A governed artifact tree is an artifact hierarchy whose load-bearing nodes and
relations have declared roles, ownership, source boundaries, admission or
validation expectations, and challenge routes sufficient for the tree's stated
purpose.

A node is load-bearing when removing or changing it can alter a governed rule,
consumer contract, validation result, promotion route, or required navigation
path.

### Plain-language voice

It is a folder or artifact hierarchy whose important parts are governed, not
just arranged.

### Domain-context voice

Architecture inventories, ontology branches, validation packages, definition
trees, and other artifact sets may specialize this minimum through their own
admission schemas.

### Boundary and posture

Not every node needs identical metadata. Cosmetic organization is not a
governed artifact tree. Current cross-surface admission remains candidate and
review-based.

### Open Questions

- What exact consequence makes a node or relation load-bearing?
- Which metadata belongs to the shared semantic minimum and which belongs only
  to artifact-admission schemas?
- How should governance work for DAGs, generated projections, and linked artifact
  sets that are not literal trees?
- Which existing artifact trees conform, and what evidence demonstrates their
  admission or validation?

## CAV2-D48: Authority Promotion Lifecycle

Status: proposed rewrite  
Term: authority promotion lifecycle

### Normative voice

An authority promotion lifecycle is the owner-governed set of authority states,
allowed transitions, gates, evidence requirements, and stop conditions through
which a candidate may gain, change, lose, or fail to gain authority for a
declared scope.

### Plain-language voice

It describes the allowed ways something may become authoritative—or stop being
authoritative—without pretending every kind follows one identical path.

### Domain-context voice

Definitions, constitutions, disciplines, specifications, and other authority
kinds may specialize the lifecycle with different gates and evidence.

### Boundary and posture

Evidence artifacts are inputs to promotion, not automatically lifecycle-bearing
authority. No single universal stage sequence is asserted here.

### Open Questions

- What is the smallest shared state vocabulary across authority kinds?
- Which transitions require gates, and which are merely descriptive status
  changes?
- How are demotion, supersession, withdrawal, rejection, and deferral
  distinguished?
- Which artifact owns the lifecycle for each authority kind, and how is
  conformance checked?

## CAV2-D49: Closed Authority-Kind Enumeration

Status: proposed rewrite; review-enforced rule  
Term: closed authority-kind enumeration

### Normative voice

A closed authority-kind enumeration is an owner-controlled list of the kinds
that may bear authority in a declared authority model. A value is an authority
kind only if it is present in the applicable enumeration.

```text
is_authority_kind(k) iff k is a member of AuthorityKinds
```

Unlisted values are denied authority-kind status by default until an owner gate
amends the enumeration.

### Plain-language voice

If the recognized list does not contain the kind, it cannot claim authority by
inventing a new label.

### Domain-context voice

The v2 enumeration and rollups are owned by
[../../AUTHORITY-MODEL.md](../../AUTHORITY-MODEL.md). Review currently applies
the default-deny rule; deterministic scanning remains separate work.

### Boundary and posture

Membership makes a value an eligible authority kind; it does not promote any
artifact or instance.

### Open Questions

- Which artifact is the sole owner of the authority-kind enumeration and its
  amendments?
- What evidence is required before a new kind can enter the closed set?
- How are aliases, deprecated kinds, and rollups represented without bypassing
  default-deny?
- Which deterministic scan can verify all live authority-bearing artifacts
  without misclassifying historical evidence?

## CAV2-D53: Axiom

Status: proposed rewrite  
Term: axiom

### Normative voice

An axiom is a proposition explicitly adopted as a starting rule for reasoning
or governance within a declared scope. Within that scope, dependent rules may
rely on it without re-proving it, subject to the axiom's owner, challenge route,
and revision policy.

### Plain-language voice

It is a starting rule the scope has chosen to accept.

### Domain-context voice

CyberAlchemy and DomainSpec axiom corpora may adopt different axioms and
different authority postures. Fan-out to constitutions, validators, or designs
is a consequence to record, not part of axiomhood itself.

### Boundary and posture

An axiom is not necessarily a truth about the external world, high-confidence
evidence, or an invariant. Adoption must be explicit.

### Open Questions

- What owner action is sufficient to adopt an axiom for a declared context?
- How is the axiom's applicability boundary represented while `scope` remains
  undefined in D34?
- What distinguishes an axiom from a premise, constitution rule, invariant, or
  design assumption in existing corpora?
- How are challenges, revisions, and downstream dependencies recorded without
  making fan-out part of axiomhood?

## CAV2-D54: Invariant

Status: proposed rewrite  
Term: invariant

### Normative voice

An invariant is a condition required to remain true for a declared subject
through the states, operations, or transitions named by its scope while the
invariant is applicable.

An invariant definition must identify its subject, condition, applicability
scope, and violation consequence or unresolved enforcement posture.

### Plain-language voice

It is something the system says must keep holding while specified changes
happen.

### Domain-context voice

V2 constitutions, validators, relation rules, and authority checks may establish
or enforce invariants. Their grounding and enforcement paths vary by owner.

### Boundary and posture

An invariant need not be derived from an axiom, embedded in a constitution, or
already validator-enforced in order to be stated honestly. Those relations must
be recorded separately.

### Open Questions

- What subject and transition model is required before an invariant can be
  evaluated?
- How are applicability, temporary suspension, exception, and violation
  consequences represented?
- Which invariants are documentary, review-enforced, or deterministic today?
- What evidence distinguishes a true invariant from an aspiration or unchecked
  requirement?

## CAV2-D56: Schema

Status: proposed import from active CAV2-D56
Term: schema
Aliases: structural declaration, admissible-structure declaration, shape declaration, schema facet
Promoted source: active `CAV2-D56` in `../DEFINITIONS.md`

### Normative Definition

A schema is an explicit declaration of **admissible structure**. It names four
things:

- **kinds** - the sorts of thing that may occur;
- **constraints** - what may occupy a kind: a decidable predicate over a *single*
  occupant's structure;
- **relations** - the connections that may hold *between* kinds;
- **connection rules** - how those relations may be formed: which kinds they may
  connect, with what multiplicity, and which composite paths must agree.

Constraints and connection rules are **separate parts and do not reduce to one
another**: a constraint on allowed values says nothing about how two kinds may
relate, and a rule on relating says nothing about what may fill a slot.

A schema is stated **independently of any particular occupant**, so that
conformance is decidable **by inspection alone** - without executing the thing,
populating it, or interpreting what it means. Conformance is therefore **shape
evidence**, and never by itself authority: a schema-valid artifact has proved its
form, not its truth, its ownership, or its promotion.

### Formal Interpretation

```text
schema S = (K, C, R, N)
  K = kinds              the sorts of thing that may occur
  C = constraints        C_k : occupant -> Bool     decidable, per kind k in K
  R = relations          r : k -> k'                k, k' in K
  N = connection rules   endpoint typing + multiplicity + path equations
                         (which r may connect which k; how many; which composites agree)

conforms(x, S)   decidable by inspection of x against S
                 -- no execution of x, no population of x, no interpretation of x

conforms(x, S)  =/=>  authoritative(x)   (CAV2-D34)
conforms(x, S)  =/=>  promoted(x)        (CAV2-D48)
conforms(x, S)  =/=>  true(x)            (CAV2-D53 / CAV2-D54)
```

The parts are independent. A schema may carry connection rules and no constraints
(a bare category of kinds and arrows holds no values); or constraints and no
relations (a single record type). `C` and `N` are orthogonal (`CAV2-D29`).

A schema is **relative to a level**: it constrains the level below it, and may
itself conform to a schema above it. Every use must declare *relative to which
level* it is the schema - a kind that is an occupant at one level is a schema at
the next.

### Operational Interpretation

Use "schema" when asking whether an artifact, record, ledger row, ontology node,
event, or route has the **required form**. Three tests:

1. Can a machine decide conformance by *looking*? If deciding requires running the
   thing, populating it, or reading it for meaning, it is not schema - it is
   validator, execution, or interpretation.
2. Does a pass confer any authority? If it appears to, the coupling is untyped and
   must be typed (`CAV2-D16`) - shape never promotes.
3. Is the rule about **one occupant** or about **how occupants connect**? Those are
   different parts (`C` vs `N`); do not merge them.

### Plain-Language Intuition

The form the evidence must fit. A schema says what kinds of thing there may be,
what may go inside them, and how they may be wired together - and nothing at all
about whether any of it is true, owned, or approved.

### Domain-Context Voice

In CyberAlchemy v2, schema is the **schema facet** of `CAV2-D21` four-facet action
method - the structural shape a governed action must bind, create, or carry as
typed residue. Its *change* is governed by `CAV2-D25` schema amendment witness;
that definition governs amendment, this one governs content. It is the shape layer
*beneath* the `axiom -> invariant -> constitution -> validator` chain: a validator
may **use** a schema to check an invariant (`CAV2-D54`), but the schema is not the
invariant. Across the umbrella it is instantiated by DomainSpec's per-meta-type
formal criterion (the `C` part) and edge-participation signature (the `N` part),
and by Arcanum's dispatch, ledger, and frontmatter schemas.

### Boundary

A schema is **not a law**: an axiom (`CAV2-D53`) and an invariant (`CAV2-D54`) are
separate kinds. A schema may rule on *form*; it can never state what must be
**true** of the world or of the system's behavior. A schema is not authority
(`CAV2-D34`), not promotion (`CAV2-D48`), and not execution proof. It is not a
**contract**: a contract says what the structure *means*, who owns it, and what it
proves - the schema says only what it must look like. It is not the
**classification facet** (`CAV2-D22`): naming a kind is not declaring its shape. It
is not a `CAV2-D31` primitive type, and not a DomainSpec `DS-D1` meta-type - those
are kinds *within* a schema, not the schema itself.

### Primary Consumers

- [`CAV2-D21` Four-Facet Action Method](../DEFINITIONS.md#cav2-d21-four-facet-action-method)
- [`CAV2-D25` Schema Amendment Witness](../DEFINITIONS.md#cav2-d25-schema-amendment-witness)
- [`DEFINITION-SCHEMAS.md`](../DEFINITION-SCHEMAS.md)
- [`DEFINITIONS-INDEX.md`](../DEFINITIONS-INDEX.md)
- Ontology node schemas, inventory entry schemas, event catalogs, ledger row identity

### Open Questions

- Does every actual repo schema cleanly instantiate all four parts `K`, `C`, `R`,
  and `N`, or are some valid schemas intentionally partial?
- Is "conformance decidable by inspection alone" true for documentary schemas,
  review-enforced schemas, and schemas whose constraints depend on cross-file
  context?
- What exactly counts as a "single occupant" for constraints that span fields,
  records, or artifacts?
- Where should each schema declare its level, and which validator or reviewer
  checks that the level declaration is present?
- Which consumers enforce schema mechanically today, and which only use schema as
  review guidance?
- Should warning, partial, and unknown outcomes remain outside schema conformance,
  or does the conformance model need non-binary result states?
- How should this refactor record the active D56 ancestry while avoiding a new
  dependency on the rejected public schema wording?

---

## Owner-gated semantic core

## Replacement for CAV2-D51: Artifact-Kind Instance

Status: owner-gated; final term, ID, catalog owner, and admission rule unresolved  
Rejected inherited name: `canonical artifact` for this semantic role

### Preserved referent

Discovery, research, ledger, specification, and other artifact kinds are real
repository categories. The rule needed by v2 is a way to identify an artifact
as an instance of a kind recognized by an applicable governed catalog without
confusing that recognition with authority.

### Minimum semantic separation

- `kind membership`: which recognized artifact kind the artifact instantiates;
- `schema conformance`: whether the artifact satisfies that kind's applicable
  structure or contract;
- `provenance`: how the artifact was produced or transformed;
- `durability`: its intended lifespan;
- `authority posture`: whether it is candidate, authoritative, superseded, or
  otherwise governed.

None of these properties is inferred solely from another.

### Candidate core

```text
kind_of(a) = k
recognized_kind_instance(a) only if k is governed by the applicable catalog
recognized_kind_instance(a) does not imply authoritative(a)
```

The owner must still decide whether catalog membership alone is sufficient or
whether an instance contract is required for admission.

### Naming and migration boundary

Arcanum already defines `DEF-ARC-CANONICAL-ARTIFACT` as an authoritative
source-of-truth artifact. V2 must not use the same term for a possibly
non-authoritative typed artifact without an explicit cross-owner decision.
`process_origin` is not part of the proposed identity until producer
cardinality, attestation, and relation semantics are resolved.

Any replacement requires the governed cutover specified by review finding F-08:
prepare an occurrence inventory and patches; approve replacement identity/name/
ID; establish a resolvable replacement and supersession or temporary alias;
migrate and validate live consumers and generated surfaces; retire the old live
meaning only after zero unresolved live dependencies. Historical and append-only
evidence remains verbatim.

### Open Questions

- What final term avoids collision with Arcanum's authoritative meaning of
  `canonical artifact` while remaining understandable to repository users?
- Does governed catalog membership establish artifact-kind membership, or must
  the artifact also conform to an instance contract?
- Which artifact owns the kind catalog, and what gate admits or removes kinds?
- How are kind membership, conformance, provenance, durability, and authority
  posture represented as independent properties or relations?
- Which live consumers must participate in the governed cutover, and what
  evidence proves zero unresolved incoming dependencies?

---

## External definitions and owned dependencies

External terms remain visible here because v2 consumes them. A reference entry
does not create a new CAV2 definition or ID.

### Canonical Artifact

Status: reference  
Canonical definition: `DEF-ARC-CANONICAL-ARTIFACT` in
[Arcanum Definitions](../../../../arcanum/definitions/DEFINITIONS.md#def-arc-canonical-artifact-canonical-artifact)

V2 does not redefine the Arcanum meaning: a canonical artifact is authoritative
source for its declared scope. The different artifact-kind referent formerly
placed under D51 remains owner-gated above.

#### Open Questions

- Which v2 consumers currently use `canonical artifact` in the conflicting
  typed-but-not-authoritative sense?
- Does the Arcanum definition apply directly to private v2 authority artifacts,
  or is an explicit import/adoption decision required?
- What migration or alias policy prevents the two meanings from recurring?

### Contract

Status: reference  
Canonical definition: `DEF-ARC-CONTRACT` in
[Arcanum Definitions](../../../../arcanum/definitions/DEFINITIONS.md#def-arc-contract-contract)

V2 challenge, schema, admission, and handoff contracts specialize the public
contract meaning only through their owning surfaces.

#### Open Questions

- Which v2 artifacts are genuine contract specializations rather than schemas,
  policies, or narrative agreements?
- What common obligations must every local contract inherit from
  `DEF-ARC-CONTRACT`?
- How is contract conformance evidenced when enforcement is review-based?

### Discipline and Stable Repository Stewardship

Status: external owner reference; formal Arcanum definition ID not yet present

`CAV2-D6` names a local discipline instance. `CAV2-D50` attempted to define the
Arcanum-wide genus. Until Arcanum formally defines Discipline, v2 references
the discipline-governance capability and local discipline catalog; it does not
redefine the genus here.

#### Open Questions

- When will Arcanum formally define Discipline and assign its canonical ID?
- Which properties belong to the Discipline genus versus the Stable Repository
  Stewardship instance?
- What evidence demonstrates that the local discipline is active, maintained,
  and following its hardening route?

### Craft and Craft Method

Status: external owner reference; no new CAV2 definition

`CAV2-D12` and `CAV2-D20` describe local uses of the Arcanum-owned Craft
capability. Its skill, ledger contract, and project-local records own their
operational meaning.

#### Open Questions

- Which exact Arcanum artifact owns the canonical semantics of Craft?
- What distinguishes the Craft method, its ledger, its projections, and a
  project-local Craft execution surface?
- Which v2 records conform to the current Craft contract, and how is drift
  detected?

### Method

Status: external owner reference; formal Arcanum definition ID not yet present

The generic term formerly carried by `CAV2-D32` is not redefined by v2. Local
methods must name their owner and contract.

#### Open Questions

- Does Arcanum need a formal definition of Method, or can concrete method
  contracts remain sufficient?
- What minimum distinction separates a method from a workflow, process,
  discipline, capability, or checklist?
- Which existing v2 uses require a shared genus rather than a local contract?

### Intent

Status: external owner reference; no new CAV2 definition

The generic term formerly carried by `CAV2-D39` is owned by its consuming
Invoke, DomainSpec, or Arcanum contract. V2 may define a local intent record
only as a named specialization with demonstrated fields and consumers.

#### Open Questions

- Is there one shared meaning of Intent across Invoke, DomainSpec, Craft, and v2,
  or are these distinct owner-local concepts?
- Which fields and consequences are common across actual intent records?
- What evidence would justify a v2 specialization rather than another external
  reference?

---

## Deferred terms

The following IDs name intelligible or observed material but do not yet have a
complete, correctly owned spine definition. They remain absent from the proposed
definition set until the recorded blocker is resolved.

| ID | Former term | Open question / blocker |
|---|---|---|
| D2 | Source-Ledgered Amalgamation | Which promoted import or discipline owner should define this practice, and what distinguishes it from ordinary source-ledgered import? |
| D4 | Source Spine | Which source-map contract owns selection, minimality, and authority-posture rules, and how is compliance checked? |
| D7 | Authority Import | Is the term an import act, an import record, or an append-only ledger, and which owner defines each role? |
| D8 | Import Candidate | What makes a proposition, artifact, or path an import candidate, and which import schema owns that identity? |
| D10 | Definition Tower | What stable identity and consequence distinguish a definition tower from a topic cluster or review queue? |
| D11 | Tower Space | Does the term have an independent governed consequence that justifies preservation, or should it remain local vocabulary of the candidate tower map? |
| D13 | Authority Promotion Queue | What ordering, enqueue/dequeue, ownership, and terminal-decision semantics make this a queue rather than a candidate list? |
| D14 | Source Space | How should source origin, external evidence posture, and local authority posture be separated and owned? |
| D15 | Project Space | Which promoted project-space contract gives this term a discriminating rule or consequence? |
| D17 | Reflection Tower Method | What are altitude, closure, transition, and stopping conditions, and which existing run instantiates the complete method? |
| D21 | Four-Facet Action Method | Can the action-admission rule be made non-vacuous without letting residue satisfy every missing facet, and which constitution should own it? |
| D24 | Provenance-First Navigation | Which navigation or constitution owner will absorb the procedure, migrate consumers, and define enforcement? |
| D25 | Schema Amendment Witness | What evidence constitutes a witness of a schema amendment, and which contract governs compatibility, migration, and enforcement posture? |
| D27 | Residue Entropy | Which mathematical carrier, distribution, measure, and owner make each entropy interpretation valid, and should any interpretation remain in the shared spine? |
| D28 | Value-Cycle Edge Guard | What precisely are value constraint, cycle scope, and blocking effect, and which relation constitution owns the guard? |
| D31 | Primitive Type | Is primitiveness relative to a declared basis independently useful, and who decides that basis without relying on circular editorial metadata? |
| D43 | Pattern Promotion Lifecycle | Which promoted architecture authority should own the lifecycle, and what shared semantics remain in the central spine? |
| D44 | View-Bearing Concept | What observable threshold makes a view necessary without defining the threshold as “when prose is insufficient”? |
| D45 | UX/UI Knowledge Governance | Which promoted UX authority surface owns this term, and what distinguishes its semantic core from a bundle of local lanes? |
| D46 | Experience Evidence Lifecycle | Which stages and transitions are necessary across real UX evidence runs, and which are merely one workflow's sequence? |
| D47 | Interface Evidence Boundary | How should evidence kind, gate effect, and automability be separated, and which consumers must migrate to the corrected model? |
| D52 | Artifact Durability | Is durability a complete binary classification, who owns overrides, and how does it remain independent from the unresolved D51 replacement? |
| D55 | Premise | What distinguishes premise, assumption, evidence, and axiom without fixing truth, conviction, or promotion posture by definition? |

## Retired from the definition set

| ID | Former term | Disposition | Open question |
|---|---|---|---|
| D9 | CyberAlchemy v2 | Project identity and aspiration belong in the project README, not in the canonical vocabulary. | Which README section should own the current project identity and extraction objective, and which definition links must be migrated away from D9? |

## Promotion blockers

This proposal must not replace the canonical source until an owner decision:

1. resolves which definitions corpus is active and synchronizes source, index,
   drift audit, and schema registry;
2. preserves or deliberately supersedes stable IDs without silent reuse;
3. resolves the D51 replacement name, identity, ID, catalog owner, admission
   rule, and governed migration;
4. resolves the historical D56 ID conflict and validates the proposed Schema
   definition against representative repository schemas and consumers;
5. adjudicates the D11 and D31 reviewer dissents;
6. validates every live consumer affected by renamed, referenced, deferred, or
   retired terms; and
7. runs structure, link, and definition-drift validation on the promoted target.
