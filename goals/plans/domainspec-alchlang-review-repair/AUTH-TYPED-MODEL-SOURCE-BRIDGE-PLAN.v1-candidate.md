# Auth typed model source and qualifier bridge — candidate subunit

Status: implementation plan under the reviewed Auth typed-definition DAG.
This subunit does not accept a revised BusinessMeaning, prove a full
InterpretationModel, or admit a FormalClaim.

## Target and evidence

The previous logical IR checker validates typed formulas, and the model IR
checker validates occurrence-model shape, but the latter still trusts its own
Context field declaration and has no link from a qualifier definition to its
membership predicate. The selected Auth typed-record source is the seven-node
closure read and pinned by `auth-v2-typed-subject.mjs`; its generated Lean
projection is `AuthGeneratedSubject.lean`. The existing occurrence Lean proof
and old six-clause FOL translation are comparison evidence, not outputs of
the new IR.

## DAG

1. Extend each model occurrence with an exact `qualifier_definition_id`.
   Require that ID to be a checked logical root with exactly two parameters
   of `(Context, occurrence sort)`. After checked macro expansion, its body
   must contain the matching member predicate on those same parameters as a
   direct top-level conjunct. This proves only the structural implication
   `qualifier => member`. An `or true` around membership, a mismatched witness,
   or a qualifier not reachable as a root must fail.
2. Add an Auth-specific source binder. Read and validate all seven selected
   typed data nodes; derive the complete four-field Context closure using one
   closed source-to-Lean rename/type table. Compare it bijectively with the
   model's field declarations, including record/list kind and row type. Also
   byte-compare current `AuthGeneratedSubject.lean` with the renderer applied
   to the pinned current Rule/Operation and typed-record nodes.
3. Test positive and hostile synthetic logical/model combinations, missing or
   duplicate fields, changed kinds or row types, source mutation, generator
   drift, and qualifier membership bypasses. Preserve all unrelated dirty
   work and the old candidate definition/translation files.
4. Independently review the code and tests, then synchronize status with the
   exact proof ceiling.

## Exit and claim ceiling

The exit check is a source-bound **shape** result and a checked
qualifier-implies-membership relation. It does not establish exact QA/QR field
semantics, all ten definitions, six-clause FOL equivalence, generated Lean
model obligations, normal completion, all-native no-call, TDE/F5/EVF, or
`runtime_guarantees_observed`. The existing selected typed subject is a
candidate projection; byte equality to its renderer is not authority.

## Open Questions

- How will all ten revised inline definitions be authored and compared to a
  new exact-ref six-clause FOL translation?
- Can Lean carrier/occurrence theorems be generated from this model IR rather
  than checked only against a pinned hand-authored bridge?
- Which proof binds every QA/QR field condition and total projection to the
  selected typed Context while keeping normal completion separate?
