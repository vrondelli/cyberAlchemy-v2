# Alch semantic definitions

These are candidate definitions for the bounded Alch product and business
ontology. They do not allocate canonical CAV2 definition IDs.

## ALCH-D01 — Alch

**Normative.** Alch shall be a product language for expressing governed domain
meaning as typed, owner-qualified declarations before deterministic system
construction.

**Formal.** `Alch = (construct contracts, declarations, references, owners,
authority limits, residue)`.

**Operational.** An Alch source is accepted only when declarations conform to
their selected contracts and all required references resolve.

**Plain language.** Alch lets people describe a domain precisely enough for
software to be built without flattening everything into data records.

**Boundary.** Alch is not DomainSpec, a compiler, generated code, a runtime, or
permission to act.

## ALCH-D02 — Governed Domain Description

**Normative.** A Governed Domain Description shall keep its bounded context,
terms, relations, rules, behavior, examples, sources, owners, authority limits
and unresolved required meaning explicit.

**Formal.** `GDD = (context, terms, edges, rules, states, transitions, events,
actions, permissions, examples, owners, boundaries, residue)`.

**Operational.** Required unresolved meaning blocks acceptance and lowering.

**Plain language.** It is the reviewed description of one world and how it may
behave.

**Boundary.** It is not arbitrary prose, an ontology admission, or system code.

## ALCH-D03 — Ontology Term

**Normative.** An Ontology Term shall name one concept with bounded meaning,
context, owner, provenance and disposition.

**Formal.** `Term = (id, name, meaning, context, owner, sources, disposition)`.

**Operational.** Repeated spelling does not imply shared identity; the term ID
and context establish the reference.

**Plain language.** It says exactly what one important idea means here.

**Boundary.** A term is not automatically a type, record, entity or canonical
definition.

## ALCH-D04 — Ontology Edge

**Normative.** An Ontology Edge shall be a typed, directional, owner-qualified
relationship between two resolved terms and shall carry a business sentence.

**Formal.** `Edge = (id, source, relationType, target, meaning, owner, sources)`.

**Operational.** Unknown types, missing endpoints or ambiguous direction reject
closure.

**Plain language.** It explains how two ideas are connected.

**Boundary.** It is not an implementation dependency or generated graph edge.

## ALCH-D05 — Domain Rule

**Normative.** A Domain Rule shall state a named condition, invariant or
business constraint over declared domain facts.

**Formal.** `Rule : Facts -> true | false | unresolved`.

**Operational.** Evaluation uses only declared inputs and semantics; unresolved
facts fail according to the selected rule contract.

**Plain language.** It says what must be true in the domain.

**Boundary.** A rule is not a record, permission, runtime enforcement proof or
unrestricted program.

## ALCH-D06 — Domain State

**Normative.** A Domain State shall name one meaningful condition in the
lifecycle of a declared subject.

**Formal.** `State belongsTo SubjectLifecycle`.

**Operational.** A state is referenced by transitions and behavior; it does not
change itself.

**Plain language.** It says which meaningful condition something is in.

**Boundary.** A state is not a status field merely because a record stores its
name.

## ALCH-D07 — Domain Transition

**Normative.** A Domain Transition shall identify source state, target state,
trigger or guard, and subject lifecycle.

**Formal.** `Transition = (subject, from, to, trigger?, guard?)`.

**Operational.** A transition is eligible only from its declared source state
and under its declared guard.

**Plain language.** It says how and when something may move between states.

**Boundary.** A transition is not an assignment, event or action.

## ALCH-D08 — Domain Event

**Normative.** A Domain Event shall describe a named domain fact that has
occurred, with its subject, payload contract and authority boundary.

**Formal.** `Event = (id, subject, payloadType, boundary)`.

**Operational.** Events are emitted by declared behavior and may trigger other
behavior; declaration alone emits nothing.

**Plain language.** It records that something meaningful happened.

**Boundary.** An event is not a command, action, mutable entity or transport.

## ALCH-D09 — Domain Action

**Normative.** A Domain Action shall describe requested behavior through its
actor, subject, inputs, preconditions, permission, boundary and possible events.

**Formal.** `Action = (actor, subject, input, requires, permission, boundary,
emits)`.

**Operational.** Execution requires a separate runtime binding and explicit
authority grant.

**Plain language.** It says what someone or something wants the domain to do.

**Boundary.** An action declaration is not an invocation or authorization.

## ALCH-D10 — Domain Permission

**Normative.** A Domain Permission shall bind an actor and action to a condition
and authority boundary.

**Formal.** `Permission(actor, action, facts, boundary) -> allow | deny`.

**Operational.** Permission eligibility is checked separately from action
execution and does not create a grant.

**Plain language.** It says who may request an action under which conditions.

**Boundary.** It is not a role record, blanket access grant or proof of
enforcement.

## ALCH-D11 — Domain Example

**Normative.** A Domain Example shall describe a positive, negative, boundary
or missing-information situation and its expected semantic result.

**Formal.** `Example = (kind, facts?, expected, referencedRules)`.

**Operational.** Examples test interpretation and remain traceable to the
meaning they illustrate.

**Plain language.** It shows how the domain should behave in a concrete case.

**Boundary.** An example is not a complete proof or general rule.

## ALCH-D12 — Open Domain Question

**Normative.** An Open Domain Question shall preserve required meaning that is
unknown, disputed or owner-unresolved.

**Formal.** `Question = (subject, uncertainty, owner, blocking, nextEvidence)`.

**Operational.** A blocking question prevents the affected semantic closure.

**Plain language.** It keeps an important unknown visible instead of guessing.

**Boundary.** It is not a placeholder answer or user-facing product decision.

## ALCH-D13 — Domain Authority Boundary

**Normative.** A Domain Authority Boundary shall identify the owner and scope
within which a decision or effect may be authorized.

**Formal.** `Boundary = (id, owner, scope, allowedDecisionKinds)`.

**Operational.** Language, compiler and runtime representations preserve the
boundary without acquiring its authority.

**Plain language.** It says who is allowed to decide what.

**Boundary.** It is not a permission, policy result or technical sandbox.

## ALCH-D14 — Domain Owner

**Normative.** A Domain Owner shall be the person or owner group entitled to
settle one bounded domain meaning or decision.

**Formal.** `owns(owner, subject, decisionKind, context)`.

**Operational.** Owner references are explicit and do not transfer through
authorship, compilation or implementation.

**Plain language.** It names who can decide the meaning.

**Boundary.** An owner is not automatically an actor, operator or effect
authorizer outside the named scope.

## ALCH-D15 — Language Construct Contract

**Normative.** A Language Construct Contract shall define one declaration kind
through required information, reference and type rules, semantics, failure
behavior and authority limits.

**Formal.** `Contract = (kind, fields, wellFormedness, semantics, failures,
limits)`.

**Operational.** Each declaration selects exactly one primary contract.

**Plain language.** It is the rulebook for writing one kind of Alch statement.

**Boundary.** A contract is not a declaration instance or proof of compiler
support.

## ALCH-D16 — Domain Construct Declaration

**Normative.** A Domain Construct Declaration shall bind one construct contract
to a bounded domain identity, owner, operands and references.

**Formal.** `Declaration = (id, domain, owner, contract, operands, refs)`.

**Operational.** Missing required meaning or unsupported contract blocks
lowering; the declaration never changes kind to make compilation succeed.

**Plain language.** It is one actual Alch instruction in a particular domain.

**Boundary.** It is not a runtime invocation or generic compiler capability.

## ALCH-D17 — Record Declaration

**Normative.** A Record Declaration shall define only a named, closed data shape
composed of typed fields and field constraints.

**Formal.** `Record = product(fieldName_i : Type_i, constraints_i)`.

**Operational.** Records type inputs, outputs, payloads or stored data. A
compiler rejects a record used as a substitute for a non-data semantic role.

**Plain language.** A record says which fields a piece of data contains.

**Boundary.** A record is not an entity, value object, enum, rule, state,
transition, event, action, permission, boundary, capability or ontology.

## ALCH-D18 — Compiler Capability Description

**Normative.** A Compiler Capability Description shall state supported construct
contracts, accepted inputs, outputs, rejection rules and limits.

**Formal.** `CompilerCapability = (contracts, inputs, outputs, rejections,
limits)`.

**Operational.** It is compared against declarations before a concrete compiler
binding is selected.

**Plain language.** It says what a compiler can translate.

**Boundary.** It is not a Mapping, Policy, domain declaration or proof of
working implementation.

## ALCH-D19 — Compiler Binding

**Normative.** A Compiler Binding shall bind exact Alch source and a supported
profile to one identified compiler version and its generated evidence.

**Formal.** `Binding = (sourceDigest, profile, compilerIdentity, version,
outputs, evidence)`.

**Operational.** Changed source, profile or compiler identity invalidates the
binding.

**Plain language.** It identifies exactly which compiler translated which Alch
source.

**Boundary.** It does not own business meaning or establish adoption,
correctness, release or effect authority.

## ALCH-D20 — Product Capability

**Normative.** A Product Capability shall describe a stable user-valued ability
of a product independently of its replaceable implementation.

**Formal.** `ProductCapability = (product, users, jobs, inputs, outcomes,
constraints)`.

**Operational.** Product evidence evaluates the capability outcome separately
from compiler or runtime conformance.

**Plain language.** It says what useful thing Alch lets a user accomplish.

**Boundary.** It is not a feature record, compiler command, ontology node type
or implementation binding.
