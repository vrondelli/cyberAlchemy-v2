# Candidate obligation derivation for the 13 backend meta-types

Date: 2026-09-22. Route: `CA2-ROUTE-RESEARCH`. Status: candidate research
synthesis. Authority effect: none. This is not a canonical Research record, a
definition change, a TDE rule-set admission, or evidence that generated tests
ran. It does not create a Project or Goal identity.

## Question and scope

How can an exact FormalClaim, typed DomainSpec graph relations, and the semantics
of each currently implemented backend meta-type determine a finite, accountable
set of obligations for an AlchLang `application-v1` source?

The denominator is the 13 backend types in the frozen catalog, not the UI
candidate types or the superseded Saga. This report covers derivation, required
oracles and bindings, case selection, and explicit stopping conditions. It does
not implement the algorithm, generate a runnable test suite, operate a provider,
or assert runtime guarantees.

## Source and method

Repository sources inspected:

- `craft/projects/domainspec-v2/definitions/meta-types/meta-types.md` and the
  13 machine criteria under `craft/projects/domainspec-v2/impl/spec/meta-types/`;
- `craft/projects/domainspec-v2/impl/cli/src/meta-types/frozen-catalog.generated.ts`
  and `craft/projects/domainspec-v2/impl/cli/src/relationships/frozen-authority.generated.ts`;
- `craft/projects/domainspec-v2/formalization/docs/FORMALCLAIM-AND-PROFILES.md`;
- `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/application-source.ts`,
  `formal-claim.ts`, `application-domain-lowering.ts`, and
  `application-rule-projection.ts`;
- `craft/projects/domainspec-v2/impl/test-derivation-engine/README.md`,
  `SFOL-TEST-CLOSURE.md`, `src/rules/index.ts`, `src/keys/index.ts`, and
  `src/emit/tests.ts`.

External methodological checks: IBM Research, *Plannable test selection
criteria for FSMs extracted from operational specifications*
<https://research.ibm.com/publications/plannable-test-selection-criteria-for-fsms-extracted-from-operational-specifications>
and NASA, *A Practical Tutorial on Modified Condition/Decision Coverage*
<https://ntrs.nasa.gov/citations/20010057789>. They support guard/update and
Boolean-decision case selection; they do not establish DomainSpec authority.

## Shared derivation contract — proposal

Let `G` be the exact AlchLang source graph **including node bodies and ordered
declarations**, not merely its edges. Let `C` be exact FormalClaim identities,
`I` selected interpretation contexts, `M` meta-type criteria, `R` relationship
signatures, and `Δ` a versioned obligation-rule registry. Derive in bounded
strata:

1. `S0`: validate source identities, 13 type criteria, relation endpoints,
   multiplicity and scope; record every declaration and relation in the
   denominator.
2. `S1`: emit local obligations from each declared meta-type, preserving source
   line, type criterion and required observations.
3. `S2`: emit pair obligations for admitted, directed relations with their
   exact role and field/argument bindings.
4. `S3`: emit only explicitly registered composed motifs, such as
   `FormalClaim → Rule —enforces→ Operation —produces→ Event`.
5. Partition each behavioral obligation only over declared finite domains,
   solver-supported bounds, or explicit witnesses. Keep unknown, infeasible,
   unsupported and unbound cases in the denominator.

Do not infer execution from reachability. An edge says that two typed concepts
are related; behavior comes from their node contracts plus an admitted `Δ`
rule. Do not derive a negative transition from a missing edge unless the
relevant state/event universe and closed-world rejection rule are explicit.

Each emitted record should include `obligation_id`, `rule_id` and version,
source/claim/graph identities, meta-type and relation role, precondition,
expected predicate, observation point, case partition, required binding,
status, and claim ceiling. Evidence freshness must separately fingerprint the
selected interpretation and its version, preservation projection, finite
bound, case-domain partition, and witness set. A context-only change should
invalidate dependent evaluation evidence without changing immutable claim
identity; a changed rule set or source meaning should invalidate derivation.
The expected predicate must come from source
semantics or a separately admitted reference model, never from running the
implementation being tested. Rule-set identity must participate in obligation
identity. The TDE repair candidate now versions keys with a rule-set version
and authored semantic-source fingerprint, including incident typed edges and
linked neighbor meaning. Legacy ID-map keys are now detected stale and
tombstoned in a bounded test; other persisted evidence consumers and failed
rederivation still require qualification before calling this general freshness
contract implemented.

Statuses: `structural-ready`, `behavior-ready`, `needs-interpretation`,
`needs-runtime-binding`, `unsupported`, `unknown-with-limit`, and
`infeasible-within-bound`. `unknown-with-limit` retains the solver/runner
reason, timeout/resource limit and selected bound; it is not evidence of
infeasibility. `infeasible-within-bound` requires a completed, independently
checkable bounded unsatisfiability result. Neither status is silently dropped.
`behavior-ready` means an oracle and observation contract exist, **not** that a
test passed. An unsupported case is counted, not deleted. For every profile
below, structural checks and runtime observations remain different evidence
classes.

## Individual profiles

### 1. Entity (`DS-D1.1`; [criterion](../../craft/projects/domainspec-v2/impl/spec/meta-types/structural/entity.schema.yml))

- **Source semantics:** an identity-bearing, lifecycle-tracked object with at
  least one declared identity field and typed fields. AlchLang authors fields
  and one selected identity; an Entity may, but need not, link a State Machine.
- **Derive:** one structural obligation per identity and typed field; an
  identity-distinction obligation for equal non-identity values with different
  IDs; one state-preservation obligation per declared write or transition that
  targets this Entity. `Operation —creates→ Entity` adds creation/identity
  obligations; `Entity —contains→ Value Object` adds field-value preservation.
- **Case denominator:** declared fields and identity fields; each authored
  writer/creator; each linked State Machine transition. Two distinguishable
  instances are needed for the identity case. Do not create a lifecycle case
  where no lifecycle is declared.
- **Required oracle/stop:** typed field and identity criteria support static
  checks. Persisted identity, creation uniqueness, and update behavior require
  exact storage and runtime observation. Neither an `owns` edge nor prose
  establishes persistence semantics.
- **Current TDE:** normalized-spec concept/field rows can yield structural
  obligations; there is no general Entity runtime derivation from AlchLang.

### 2. Value Object (`DS-D1.2`; [criterion](../../craft/projects/domainspec-v2/impl/spec/meta-types/structural/value-object.schema.yml))

- **Source semantics:** In AlchLang `application-v1`, a Value Object has typed
  fields and no designated identity field; its candidate equality is the full
  declared field tuple. The separate DomainSpec Value Object criterion may
  carry an authored Equality clause. These are distinct profiles: do not
  pretend `application-v1` authored a clause it cannot express or silently
  replace an authored DomainSpec clause with tuple equality.
- **Derive:** no-identity and typedness checks; for `application-v1`, reflexive,
  symmetric and equal-tuple/different-tuple cases against the exact field-tuple
  representation; for the DomainSpec Equality-clause profile, derive cases
  from the authored clause and require an interpretation for it;
  `Entity —contains→ Value Object` adds round-trip preservation of the embedded
  value. Immutability is a separate runtime obligation when a target claims it.
- **Case denominator:** every field in the selected profile's equality rule; one
  equal pair and one pair differing in each independently variable field,
  subject to valid finite witnesses.
- **Required oracle/stop:** tuple equality in `application-v1` is a candidate
  source rule, while a DomainSpec Equality clause is a declaration, not a
  proved implementation. A field omitted from the selected equality contract or
  an unbounded field without witnesses remains unresolved; do not silently
  compare serialized bytes.
- **Current TDE:** normalized concept/field checks only for this general shape.

### 3. Enum (`DS-D1.3`; [criterion](../../craft/projects/domainspec-v2/impl/spec/meta-types/structural/enum.schema.yml))

- **Source semantics:** a nonempty, finite, named value set; no identity or
  typed field table. AlchLang lists variants with source meanings.
- **Derive:** exact-set and unique-variant checks; each admitted variant
  round-trips through each exact generated language binding. Rejection of an
  unknown value is behavioral only if the boundary declares rejection semantics.
- **Case denominator:** every declared variant, plus each declared consumer
  branch. Unknown-value probes are boundary-specific, not an infinite set.
- **Required oracle/stop:** use the authored closed set, not runtime enum
  reflection, as oracle. A new variant changes the denominator and invalidates
  prior exhaustive receipts.
- **Current TDE:** `domain-enum` and normalized structural rules exist, but
  cross-language or consumer-branch closure is separate.

### 4. Operation (`DS-D1.4`; [criterion](../../craft/projects/domainspec-v2/impl/spec/meta-types/behavioral/operation.schema.yml))

- **Source semantics:** state-changing action with declared input/output,
  reads, writes, produced Events and exactly one current AlchLang guard Rule.
  The selected DomainSpec realization requires guard-before-mutation,
  declared-effect confinement, atomic state/outbox behavior and explicit
  failure continuation.
- **Derive:** guard-false implies no declared write or effect; guard-true
  permits attempting the Operation but does not imply success; successful
  outcomes satisfy postconditions, write/effect sets and output shape; each
  declared failure follows its continuation. `produces`, `creates`, `reads`,
  incoming `enforces`, and Workflow membership add pair/trace obligations.
- **Case denominator:** guard outcome; each declared success/failure class;
  each read, write, event, and postcondition; relevant provider-fault and
  rollback cases only when the integration contract declares them.
- **Required oracle/stop:** an executable Rule projection, exact operation
  input binding, target artifact and pre/post-state observation are required.
  Source formation alone cannot prove atomicity or absence of undeclared I/O.
- **Current TDE:** postcondition and error-row rules exist; no general
  FormalClaim-to-Operation-to-runtime closure is implemented.

### 5. Query (`DS-D1.5`; [criterion](../../craft/projects/domainspec-v2/impl/spec/meta-types/behavioral/query.schema.yml))

- **Source semantics:** read-only retrieval over a declared Entity source,
  input/output shape and Rule. The same inputs against the same state should
  return the same view without mutation.
- **Derive:** projected result and filtering condition; unchanged state and
  absence of effects; `Query —reads→ Entity` and incoming `Interface —exposes→
  Query` add source and boundary obligations.
- **Case denominator:** each declared output field and filter branch, finite
  result partitions (empty, one, multiple) where feasible, and repeated reads
  against one frozen state.
- **Required oracle/stop:** exact Rule interpretation and projection plus
  pre/post-state or write-channel observation. Repeating against different
  snapshots does not establish determinism.
- **Current TDE:** emits one broad `query-behavior` obligation per Query; it
  does not automatically produce all field and no-side-effect checks.

### 6. Calculation (`DS-D1.6`; [criterion](../../craft/projects/domainspec-v2/impl/spec/meta-types/behavioral/calculation.schema.yml))

- **Source semantics:** pure deterministic value derivation. Current
  `application-v1` expression is numeric `UInt64` with declared inputs and
  rounding (`floor`, `ceil`, or `reject`).
- **Derive:** exact value for each supported expression partition, repeatability
  on equal inputs, and no state/effect change. `Calculation —calculates→
  Operation` requires the Operation to use the selected result, not merely to
  declare a relation. A Policy target remains selection, not invocation.
- **Case denominator:** expression operators and branches; zero, boundary,
  maximum and rounding-sensitive witnesses that are valid under the numeric
  profile. Division by zero or overflow requires an explicit result contract.
- **Required oracle/stop:** an independent evaluator of the authored AST and
  exact numeric semantics. Unsupported arithmetic or missing overflow behavior
  is residue, never a guessed value.
- **Current TDE:** recognizes some closed-form formulas and ternary branches;
  opaque calls become `needs-formal`. It is not the whole AlchLang numeric AST.

### 7. Rule (`DS-D1.7`; [criterion](../../craft/projects/domainspec-v2/impl/spec/meta-types/behavioral/rule.schema.yml))

- **Source semantics:** Boolean guard, not strategy selection. In AlchLang a
  Rule binds one FormalClaim; the claim fixes proposition, signature, accepted
  definitions, profile and ceiling. The evaluation interpretation is separate.
- **Derive:** exact-claim/currentness checks; true and false result obligations
  under an exact interpretation; for feasible compound Boolean decisions,
  independent-condition pairs; each `Rule —enforces→ Operation` or consumer
  binding adds a guard-use obligation.
- **Case denominator:** each claimed predicate/condition and each declared
  consumer, plus finite truth partitions supported by the interpretation.
- **Required oracle/stop:** exact sort, constant, predicate/function and
  argument bindings. Current ground projection rejects quantifiers, functions,
  non-unary predicates and non-scalar equality; these remain unsupported, not
  narrowed to a convenient test. A true Rule is not execution permission.
- **Current TDE:** its older Formal-cell classifier emits bounded classes or
  `needs-formal`; it is not a general FormalClaim evaluator.

### 8. Policy (`DS-D1.8`; [criterion](../../craft/projects/domainspec-v2/impl/spec/meta-types/behavioral/policy.schema.yml))

- **Source semantics:** ordered conditional strategy selection, distinct from
  Boolean Rule and from target execution. AlchLang cases reference declared
  Rules, a default target, and typed exact argument bindings.
- **Derive:** each case selects its declared target when its Rule is true and
  all preceding Rules are false; default selects only when all cases are false;
  the result belongs to the declared `applies` targets; selection itself causes
  no target effect.
- **Case denominator:** one feasible first-match witness per case, one default
  witness, and overlaps needed to prove ordering. Infeasible branches stay
  counted with a solver/bound reason.
- **Required oracle/stop:** exact Rule interpretations and ordered cases are
  required. The unordered `applies` edges alone cannot recover first-match
  semantics. Do not turn a Policy output into an Operation result.
- **Current TDE:** derives rows from a policy decision table; it does not
  generally derive AlchLang first-match/overlap coverage.

### 9. Workflow (`DS-D1.9`; [criterion](../../craft/projects/domainspec-v2/impl/spec/meta-types/behavioral/workflow.schema.yml))

- **Source semantics:** ordered multi-Operation coordination with admitted
  intra- or cross-feature scope. AlchLang retains ordered steps, direct Rules
  and typed bindings. Recovery intent, planning and invocation are distinct.
- **Derive:** each step starts only after its declared predecessor condition;
  each step's own guard is respected; success trace has the declared order;
  each authored failure continuation/compensation has its own obligation.
- **Case denominator:** each step, adjacent ordered pair, direct and step Rule,
  and each explicitly declared failure/recovery branch. Independent concurrent
  reorderings need a declared concurrency model before inclusion.
- **Required oracle/stop:** trace observer, exact step Operation bindings and
  failure contract. An `orchestrates` edge is ordered in the authority, but
  graph edge enumeration alone is not an invocation trace. Never infer a
  compensation from absence of one.
- **Current TDE:** emits a success obligation per documented step and a
  failure obligation only for a concrete authored outcome.

### 10. Interface (`DS-D1.11`; [criterion](../../craft/projects/domainspec-v2/impl/spec/meta-types/connective/interface.schema.yml))

- **Source semantics:** external/internal logical boundary exposing Operations
  or Queries. AlchLang authors version, compatibility, contracts, members and
  request/result types.
- **Derive:** each member has request/result shape preservation, target binding
  and declared error mapping; `Interface —exposes→ Operation/Query` adds
  boundary-to-domain equivalence obligations. Compatibility cases follow the
  authored version policy, not a guessed protocol.
- **Case denominator:** each member and contract field, required/optional
  partition, and every documented response/error class.
- **Required oracle/stop:** exact boundary transport or callable binding and
  mapping. A logical Interface does not imply HTTP, authentication, or public
  network behavior unless those are separately authored.
- **Current TDE:** endpoint/response-row obligations exist; they do not prove
  arbitrary AlchLang Interface exposure or transport semantics.

### 11. Event (`DS-D1.12`; [criterion](../../craft/projects/domainspec-v2/impl/spec/meta-types/connective/event.schema.yml))

- **Source semantics:** past-tense notification of a completed state change.
  AlchLang requires event type, version, occurrence identity, occurred-at
  policy and typed payload.
- **Derive:** payload/identity/version checks; one production obligation per
  declared producer and relevant outcome; distinct publication, transport,
  consumption and business-completion obligations only when exact integration
  bindings declare those stages. `Event —transitions→ State Machine` is a
  trigger role only when the typed transition projection confirms it.
- **Case denominator:** each payload field and declared producer/consumer;
  each authored transport/failure stage. Duplicate/retry cases require an
  explicit delivery and deduplication policy.
- **Required oracle/stop:** event capture and stage-specific observation. An
  emitted Event is not evidence of broker acceptance, transport delivery or
  consumer completion; a synthetic join is not live runtime proof.
- **Current TDE:** distinguishes producer and declared consumer obligations,
  but its generic emitter may leave both as coverage gaps.

### 12. Mapping (`DS-D1.13`; [criterion](../../craft/projects/domainspec-v2/impl/spec/meta-types/connective/mapping.schema.yml))

- **Source semantics:** directional field-by-field transformation, not a
  boundary. AlchLang authors input fields, target, `total` and target-field
  source paths.
- **Derive:** one correspondence per target field; target shape and declared
  totality checks; invalid/missing path behavior only where specified;
  `Mapping —maps→ Entity/Value Object/Interface` adds exact target-type
  preservation. Bidirectionality needs two authored directions or an admitted
  inverse, not an inferred reversal.
- **Case denominator:** each source path and target field, valid value
  partitions and declared optional/missing cases; all target variants where a
  closed sum is mapped.
- **Required oracle/stop:** exact source/target schemas and independently
  computed expected values. A `maps` edge does not encode a field transform.
- **Current TDE:** emits one broad mapping-section obligation; field-level
  closure needs additional source and rule support.

### 13. State Machine (`DS-D1.14`; [criterion](../../craft/projects/domainspec-v2/impl/spec/meta-types/lifecycle/state-machine.schema.yml))

- **Source semantics:** finite declared states, initial state, transitions,
  guards, trigger Events and possible output Events for an Entity lifecycle.
- **Derive:** initial-state check; one success obligation per transition under
  matching source/trigger/true guard; one guard-false preservation obligation;
  one role-correct output intent; and forbidden-move obligations only within an
  explicit closed state/event universe. Linked Entity state must agree.
- **Case denominator:** states, transitions, guards, trigger Events, output
  intents, and (only under a closed-world rule) missing state/event pairs.
  Transition coverage alone is insufficient to challenge guard/update faults.
- **Required oracle/stop:** typed transition projection, exact Rule argument
  bindings and pre/post-state plus Event observations. Initial formation edges
  do not distinguish trigger from result Event; the later typed Rule projection
  replaces them with trigger-only edges and explicit output intents. Use that
  role-preserving projection or equivalent source data.
- **Current TDE:** emits valid transitions and a Cartesian set of invalid
  state/event pairs from aspect documents. Its convention must not be applied
  automatically to an AlchLang machine without matching closed-world meaning.

## Cross-profile checks and current gaps

The minimum independent challenge set for this proposal is: missing/extra
declaration; wrong edge direction or endpoint; stale FormalClaim or definition
binding; swapped trigger/result Event; omitted Policy case or reordered cases;
unguarded Operation mutation; Query write; wrong Mapping field; Workflow step
reorder; and an unchanged test result after an intentionally wrong target
implementation. These are proposed detection tests, not tests run here.

The current TDE has useful deterministic rules and content-addressed keys, but
its normalized `SPEC.md` adapter explicitly limits itself to structural
obligations. Its generic test emitter produces `it.todo`; hybrid mode skips
cases without bindings or a supported oracle. AlchLang's FormalClaim v4 source
is candidate; current TDE intake is v2 and requires an exact projection. The
current AlchLang ground Rule projection is deliberately narrower than the
full sorted first-order proposition language. ORODI observations and EVF
evidence joins occur downstream of obligation derivation.

The repository also contains an E05 evidence-obligation matrix for 32 fixed
qualification checks. It is evidence accounting for those tasks, not the
general source-to-obligation rule registry proposed here.

## Counterevidence and limitations

- A valid graph can be behaviorally wrong; endpoints and multiplicity do not
  provide an oracle.
- A FormalClaim can be well formed without an executable interpretation.
- A bounded exhaustive result proves only the selected finite denominator.
- A source-derived expected result cannot establish that the generated target
  was actually called, persisted, delivered or observed.
- A test suite that simply reproduces generated implementation behavior is
  not independent specification-based verification.
- This report inspected sources and methodology; it did not run code or
  validate the proposed rule set against a full application.

## Claim ceiling

These 13 profiles are candidate derivation rules and stopping conditions for a
future engine. They do not establish complete test coverage, executable
semantics for every FormalClaim, runtime conformance, `runtime_guarantees_observed`,
provider availability, product admission, or release readiness.

## Open Questions

1. Which exact AlchLang artifact is the authoritative input to derivation:
   parsed source, formation graph, typed Rule projection, or a lossless joined
   envelope? The trigger/result distinction requires the later typed role.
2. What versioned semantic rule registry and obligation-key algorithm should
   replace the current unversioned TDE rule argument/key coupling?
3. Which closed-world rules are authored for invalid State Machine transitions,
   unknown Enum values, and undeclared Operation effects?
4. Which independently executable interpretation profiles cover quantified or
   function-bearing FormalClaims without implicit narrowing?
5. What exact observation contract lets ORODI distinguish application commit,
   provider acceptance, delivery and business completion for each derived
   obligation?
6. Which small application will serve as the first exact denominator and
   hostile-mutation fixture before any general coverage claim?
