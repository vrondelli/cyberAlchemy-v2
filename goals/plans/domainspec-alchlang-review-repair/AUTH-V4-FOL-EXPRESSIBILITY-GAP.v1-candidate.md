# Auth v4 FOL expressibility check — candidate finding

Status: candidate contract analysis and bounded AlchLang checker, not a v4 claim,
owner decision, formal proof, or admission. The selected Auth v2 definitions
and occurrence model remain drafts.

## Candidate checker checkpoint (2026-10-03)

`language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/formal-claim-source-check.ts`
now checks an independently supplied v4 JSON proposition only when its exact
selected `fol-core/1-candidate` profile semantics match the pinned AlchLang
binding and its media type is `text/x-alchlang-fol`. It verifies the source
digest, parses and typechecks the entire proposition against its signature,
and recomputes the typed AST identity and digest. Focused hostile tests pass
5/5; the surrounding formal-claim tests pass 23/23 and TypeScript typecheck
passes. This is candidate *formation* evidence, not a DomainSpec-wide v4
validator or an admitted claim. The caller must still bind the selected
profile to its exact reference and validate the full v4 schema/cross-artifact
contract. Historical Auth `text/vnd.domainspec.fol-core` explicitly returns
`unsupported`, not `checked`; its grammar and theory identity remain open.

## Selected obligation

The accepted Auth meaning requires a well-formed many-sorted proposition over
all complete finite-list contexts. Equal rows at two positions must remain two
occurrences; every qualifier and same-row provenance equality must be stated;
the outcome must be READY exactly for that condition and DENY otherwise. Any
scope or qualifier abbreviation must be expanded or accompanied by exact
defining axioms that are part of the claim identity.

## Observed contract boundary

- `craft/projects/domainspec-v2/formalization/schemas/formal-claim-source-v4-candidate.schema.json`
  checks the shape of `formal_signature` and requires nonempty proposition
  strings. It does not parse the proposition, resolve names, check arity or
  sorts, or require an exact theory/axiom object.
- `craft/projects/domainspec-v2/formalization/schemas/formal-claim-definition-binding.schema.json`
  binds accepted definition nodes and edges, but explicitly does not assign a
  model-theoretic interpretation or turn prose definitions into FOL axioms.
- `craft/projects/domainspec-v2/formalization/profiles/formal-language-profiles.json`
  lists `fol-core/1-candidate` constructs, but does not select a concrete
  validator or exact theory serialization for arbitrary v4 source JSON.
- AlchLang already implements `parseFormalProposition` in
  `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/formal-claim.ts`.
  It checks syntax, symbols, arity, sorts, variable scope, and unused declared
  symbols for **authored AlchLang claims**. Its lowering emits
  `text/x-alchlang-fol`; existing Auth v4 uses
  `text/vnd.domainspec.fol-core` and different syntax (including grouped
  quantifiers). No selected current v4 JSON validator calls this parser or
  declares the two media types and grammars equivalent. The checker should be
  reused or extended only through an explicit compatibility contract, not
  copied under an assumed identity.
  Directly passing the existing Auth v4 proposition and signature to the
  AlchLang parser fails with `FOL_DUPLICATE_SYMBOL`: Auth uses `DecisionTime`
  as both a sort and a function, while the AlchLang parser uses one shared
  namespace. An in-memory sort rename then fails with `FOL_UNKNOWN_SORT` at
  `AuthorizationRequest.` because the older dot-terminated quantifier syntax
  is not AlchLang's colon syntax. This is a concrete compatibility failure,
  not evidence that the existing Auth claim is semantically false.

A separate in-memory AlchLang parser probe successfully parsed a 172-byte
formula with a typed `Context` universal quantifier, a READY biconditional,
nonempty request-ID equality negation, an existential authentication
occurrence, and universal occurrence-identity uniqueness. This shows the
existing grammar can express that **structural fragment**. It did not expand
all Auth qualifiers, establish position interpretation, prove the formula,
or choose the new claim's canonical representation.
- The Auth v4 identity-input schema has an `assumptions` string array. A digest
  binds those strings, but no selected parser or checker makes them FOL
  premises. Existing exact-reference checks do not fill that semantic gap.
- `craft/projects/domainspec-v2/impl/cli/src/formalization/condition-binding.ts`
  explicitly limits its check to exact identity and source-byte joins, not
  proposition validation.

A local Draft 2020-12 schema probe built a structurally valid v4 claim with
only the `Context` sort declared and no predicates. It accepted both
`forall c:Context. Undeclared(c)` and `not a formula at all` as canonical
proposition representations. This demonstrates a schema-level gap; it does
not prove that every downstream consumer accepts those claims.

## Required repair before V3 currentness

Review whether the existing AlchLang typed parser can become the exact v4
checker through a declared grammar/media-type compatibility binding, or
whether v4 needs a separately governed grammar. Then add a source-bound
checker that parses the canonical proposition, rejects malformed
tokens and undeclared or wrong-sort symbols, checks quantifier scope and
arity, and verifies all declared defining axioms are included in the exact
claim/theory identity. It must reject an uninterpreted `InScopeNormal` escape
or instead quantify directly over the fixed complete Context carrier. For
Auth, verify that the occurrence membership interpretation is explicit and
that the final proposition expands or exactly constrains QA and QR. Include
negative controls for equal duplicate positions, empty lists, wrong-row
provenance, invalid-context READY, valid-context DENY, undeclared symbols,
wrong arity/sort, and malformed syntax. A schema pass alone must never be
reported as V3 exit or claim admission.

## Open Questions

- Should v4 adopt and extend AlchLang's existing typed text grammar, retain
  the older Auth `text/vnd.domainspec.fol-core` syntax with a separate checker,
  or use a typed structured AST? These have different media-type and identity
  effects and need review before contract mutation.
- Where should the exact Context-to-occurrence interpretation live in the
  external EvaluationContext, and which checker will prove its completeness
  without making it a second canonical claim?
