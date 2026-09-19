# Source and Interface Contracts

Status: candidate Design contracts, unimplemented and unadmitted

## Contract 1 — `FormalClaimSourcePayload/v1`

Owner: `formal-claims-owner`

### Required fields

| Field | Meaning |
| --- | --- |
| `claim_ref`, `statement_version`, `payload_digest` | stable identity and exact bytes |
| `formal_claims_owner_ref` | current semantic owner binding |
| `source_meaning_ref` | exact business-meaning/formalization source binding |
| `logic_semantics_profile_ref` | standard many-sorted FOL-with-equality semantics, not an execution profile |
| `signature.sorts` | declared nonempty sorts unless an exact alternate policy is separately defined |
| `signature.variables` | typed bound/free variable declarations |
| `signature.constants` | typed constant symbols |
| `signature.total_function_symbols` | typed argument/result signatures with total denotation |
| `signature.predicate_symbols` | typed predicate arities |
| `formula_ast`, `formula_ast_digest` | immutable typed source formula |
| `theory_requirements` | exact background theories needed to interpret symbols |
| `semantic_assumptions` | equality, domain closure, unique names, finite-domain declarations |
| `claim_ceiling_ref` | exact meaning only, no execution/proof/discharge implication |
| `record_currentness_ref`, `supersedes_refs` | immutable lifecycle lineage |

### Formula AST boundary

Allowed source constructors are typed terms, equality, predicate application,
`not`, `and`, `or`, implication, equivalence, `forall`, and `exists`. Quantifier
nesting and alternation are unrestricted at the source-semantic layer.

Not allowed by this profile: quantification over predicates/functions,
modal/temporal operators, fixed-point operators, or native transitive closure.
If needed, those meanings require a separately owned logic profile and a new
source statement; they are not encoded as misleading FOL predicates.

### Source validation

- every symbol resolves to one declared typed signature;
- equality operands have the same sort;
- function application is total and arity-correct;
- bound variables are scoped; free variables have explicit interpretation;
- every theory and domain assumption is explicit and digest-bound;
- AST digest, owner binding, currentness, and supersession are current;
- no assessment, solver result, proof result, or discharge field is accepted.

## Contract 2 — `FormalClaimCapabilityAssessment/v1`

Owner: `validation-governance-owner`

### Required fields

| Field | Meaning |
| --- | --- |
| `assessment_id`, `assessment_version`, `assessment_digest` | immutable assessment identity |
| `claim_ref`, `claim_payload_digest` | exact source binding |
| `assessment_policy_ref`, `assessment_policy_digest` | classifier policy identity |
| `primary_classification` | executable-bounded, solver-admissible, proof-provider-required, unsupported, or indeterminate |
| `executable_projection_state` | admitted, not-admitted, or indeterminate |
| `solver_profile_state` | admitted, unsupported, not-requested, or indeterminate |
| `proof_provider_state` | required, not-required, unsupported, or indeterminate |
| `needs_formal` | preserved TDE surface |
| `needs_formal_reasons` | nonempty typed reason set when `needs_formal` is true |
| `executable_projection_ref` | optional exact projection binding |
| `solver_profile_refs` | zero or more separately admitted exact profile refs |
| `claim_ceiling`, `authority_effect` | assessment only; no meaning/proof/discharge effect |
| `record_currentness_ref`, `supersedes_ref` | assessment lineage independent from source lineage |

### Classification rules

1. Missing structured source statement produces `needs_formal` with
   `missing-formal-statement`; it cannot produce an executable or solver pass.
2. A valid source outside every executable profile produces
   `outside-executable-profile` even if a separate solver or proof route exists.
3. An expected result dependent on the implementation produces
   `implementation-oracle-dependence`; no projection is admitted.
4. A missing exact theory/profile match produces `unsupported-theory`.
5. Stale, incomplete, contradictory, or unclassifiable inputs produce
   `indeterminate-classification` and fail closed.
6. TDE performs deterministic decidability/profile classification for its
   executable slice under the exact validation-governance policy. TDE owns that
   map and result; validation governance owns the policy and assessment. EVF
   still owns operational solver routing.
7. `primary_classification` follows the first admitted routing capability in
   this order: executable projection, solver profile, proof provider.
8. When the source is valid but no exact admitted executable, solver, or proof
   profile matches its language or theory, the result is `unsupported`.
9. `proof-provider-required` is legal only with an exact separately admitted
   proof route. `indeterminate` is legal only for missing, stale,
   contradictory, or inconclusive classification evidence. Independent states
   preserve overlap and residue.

## Contract 3 — `ExecutableProjectionBinding/v1`

Owner: `validation-governance-owner`

Required fields include projection id/version/digest, exact source ref/digest,
executable profile ref/digest, projection AST/digest, `projection_purpose`,
`preservation_kind`, `implication_direction`, exact declared domain,
assumption mapping, preservation evidence kind/ref/digest, evidence owner,
producer owner, independent validator owner, currentness, supersession, and
claim ceiling.

Allowed `projection_purpose` values are bounded test derivation,
counterexample search, witness search, or another separately admitted exact
purpose. Allowed preservation kinds and their ceilings are:

| Preservation kind | Required direction | What it may claim |
| --- | --- | --- |
| `exact-equivalent-under-declared-domain` | `bidirectional-within-declared-domain` | same result only for every environment inside the exact domain and assumptions |
| `counterexample-preserving` | `projection-counterexample-implies-source-counterexample` | a mapped projected counterexample falsifies the source under the exact assumptions |
| `witness-preserving` | `projection-witness-implies-source-witness` | a mapped projected witness satisfies the source under the exact assumptions |
| `implication-only` | exact `source-implies-projection` or `projection-implies-source` | one direction only; the converse is forbidden |

Preservation evidence is either:

1. `syntactic-by-construction`, bound to an admitted construction rule and
   digest whose local proof obligation is decidable; or
2. a separately owned certificate/receipt bound to the source, projection,
   purpose, kind, direction, domain, assumptions, and validator identity.

This contract does not require or claim a general full-FOL equivalence decision
procedure. If neither evidence form is admissible, the assessment emits no
projection and TDE retains `needs_formal`. A finite or narrowed projection proves
only its declared domain and must not be reported as the global source claim.

## Contract 4 — EVF evidence request and provider receipt boundary

EVF may issue a request only when claim, assessment, profile, encoding, provider
runtime, resource limits, and currentness are exact and mutually compatible.
The provider owns process execution and returns one typed outcome with exact
inputs and runtime identity.

| Provider outcome | EVF interpretation ceiling |
| --- | --- |
| `sat` | candidate witness under the exact encoding and profile |
| `unsat` | no model under the exact encoding and profile |
| `unsupported` | non-pass; route/profile mismatch |
| `unknown` | non-pass; no verdict |
| `timeout` | non-pass; bounded run did not conclude |
| `error` | non-pass; invalid or failed execution |

No provider outcome is automatically proof, obligation discharge, source
meaning, owner acceptance, or lifecycle promotion.

## Current profile compatibility

The current EVF profile admits QF_LIA over `Bool` and `Int`. It forbids
quantifiers, uninterpreted functions, arrays, nonlinear arithmetic, floating
point, strings, bit vectors, and full FOL. The Z3 5.0.0 runtime admission is
candidate-local and does not grant a query result or release admission.

Therefore:

- `price >= 0` may be assessed as a QF_LIA candidate;
- `forall account exists owner` is valid source FOL but not current QF_LIA;
- temporal eventual completion is outside this source FOL profile;
- unbounded graph acyclicity needs closure/fixed-point semantics or a separately
  stated finite bound.
