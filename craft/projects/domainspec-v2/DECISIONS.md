# Product decisions

## I07 — Operation value-binding authoring

Recorded: 2026-09-17T22:27:53Z. Resolved: 2026-09-17T22:33:46Z.
Status: owner selected. Selected option: separate declarative Alch realization block.
Decision source: user response, "Separate realization block".
Authority effect: none for admission, release or deployment.

### Question

Should explicit executable value bindings be authored inside each Operation,
or in a separate declarative Alch realization block referring to that Operation?
Both alternatives retain Alch as the user-facing language and use existing
DomainSpec action contracts internally. Neither permits arbitrary imperative
code, new backend meta-types, or inferred business behavior.

### Current evidence

The current Alch `src/application-source.ts` Operation parser (lines 219–238)
accepts only input, output, reads, writes, produces and requires. Those clauses
declare type/relationship coverage; they do not bind read keys, guard arguments,
write values/modes or returned values.

The explicit fixture in `test/fixtures/application-executable-fixture.ts`
(lines 53–62, under the Alch implementation) supplies these separately in backend
selection JSON: read Order using request.id, guard the stored current Order,
replace it with the request, and return the request. Factories and settlement
choices are also explicit. The existing native test intentionally distinguishes
guarding the stored value from guarding the request; see
[executable evidence](development/authoring-to-runtime-v1/EXECUTABLE-LOWERING.md).

The [I07 obligation](development/authoring-to-runtime-v1/IMPLEMENTATION-DAG.md)
requires deriving internal selections from authored choices without asking the
user to write backend JSON. Existing authoring documentation specifies domain
roles and integration paths but does not settle a value-binding authoring form.
Copying the fixture's choices into a generator would silently invent behavior.

### Options

1. **Separate declarative realization block (recommended).** Refer to the named
   Operation and declared Query/Mapping/Rule/Event identities, with explicit
   typed value bindings. Keeps domain contracts distinct from their executable
   realization and permits exact trace links. Costs an additional named authoring
   surface and requires coverage/currentness checks across the two declarations.
   Choose when keeping the intent/realization boundary visible is important.
2. **Bindings inside the Operation declaration.** Keep the same explicit choices
   alongside the Operation contract. Easier local reading, but mixes contract
   relationships with realization details and makes Operations larger. Choose
   when one authoring location is more important than a separate realization view.

Neither option allows runtime/provider profiles to choose business semantics.
Rules continue to reference FormalClaims; Mappings retain their existing role;
Workflows still own composition of multiple Operations. Arrow spelling must be
checked against the canonical relationship model rather than inventing edges.

### Gate and next step

Decision-gate result: PASS for the operation-value authoring ownership choice.
Resolved decisions: one. Remaining blockers for this choice: none.
Rationale: keep Operation contracts separate from explicit executable value
connections, without asking users to write internal backend JSON. The selected
block is application-owned, not part of the provider/runtime profile.

Next: implement the [realization contract](development/authoring-to-runtime-v1/REALIZATION-AUTHORING.md),
derive existing backend contracts, add negative and native semantic tests, and
continue I07. The selection is not evidence that the parser or compiler support
is complete. The full 37-node scope is unchanged; no node is completed or removed.

### Open questions and deferred decisions

The ownership question is resolved by the explicit user selection above.
Exact syntax and lowering are implementation work under the bounded contract;
unsupported backend combinations must remain explicit rather than be narrowed.
Provider composition remains implementation work, not permission to alter domain
meaning. No business acceptance, release or deployment is inferred.
