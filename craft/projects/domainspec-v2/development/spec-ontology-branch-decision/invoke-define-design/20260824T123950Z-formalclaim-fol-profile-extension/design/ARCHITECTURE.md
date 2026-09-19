---
candidate_id: dsv2-formalclaim-fol-profile-extension@1
status: candidate-design
evidence_state: authored-complete
authority_effect: none
updatedAt: 2026-08-24
docType: architecture-bundle
---

# Architecture — FormalClaim Expressive FOL Profile Extension

## Design Intent

Preserve one exact owner-authored claim meaning while letting downstream tools
state, independently and immutably, which bounded capabilities apply. The
architecture must be expressive at the source, conservative at every
projection, and fail closed at every evidence boundary.

## Inputs

- `define/SPEC.md`
- `define/GLOSSARY.md`
- `define/TEMPLATE-SELECTION.json`
- `context/CONTEXT-PACK.md`
- closed scope at `design/DESIGN-SCOPE-MANIFEST.json`
- selected Design result at `design/DESIGN-SELECTION-RESULT.json`

## 1. Context View

```text
business-source-owner
        |
        v
 BusinessMeaning
        ^ formalizes
        |
 FormalClaimSourcePayload/v1 <----- formal-claims-owner
        |
        | exact ref + source digest
        v
 FormalClaimCapabilityAssessment/v1 <----- validation-governance-owner
       /                 |                    \
      v                  v                     v
 TDE owner             EVF owner          proof-provider owner
 executable              | evidence route
 projection              v
                    SMT-provider owner
```

The source contract answers “what does the claim mean?” The assessment answers
“what may this exact tool profile soundly do with this exact claim?” Neither
answer implies the other.

## 2. High-level Structure / Capability View

### Formal-claims semantic capability

- owns `FormalClaimSourcePayload/v1` and its semantic supersession;
- declares standard many-sorted FOL with equality;
- binds the formula AST, signature, theory requirements, domain assumptions,
  business-meaning reference, owner, currentness, and claim ceiling;
- does not own decidability, executable classification, solver evidence, proof,
  discharge, or lifecycle state.

### Validation-governance capability

- owns `FormalClaimCapabilityAssessment/v1`;
- classifies an exact claim against exact executable, solver, and proof profiles;
- delegates deterministic executable-slice classification to TDE under the
  exact validation-governance policy, preserving TDE's decidability-map role;
- may issue `ExecutableProjectionBinding/v1` only with a declared preservation
  obligation and exact source digest;
- preserves typed `needs_formal` reasons;
- does not rewrite source meaning or execute a solver.

### Execution and evidence capabilities

- TDE consumes only an admitted executable projection.
- EVF owns optional verification/witness routing and evidence joins.
- The SMT provider executes only a pinned admitted theory/runtime profile.
- A proof provider owns proof evidence for separately routed obligations.
- System-evidence records retain producer ownership and cannot become meaning.

## 3. Low-level Components / Concept-Type View

### `FormalClaimSourcePayload/v1`

The payload has four semantic blocks:

1. Identity: claim id, statement version, owner, currentness, supersession,
   payload digest, source-meaning reference, and claim ceiling.
2. Signature: sorts, variables, constants, total function symbols, and
   predicates with exact typed arities.
3. Formula: immutable typed AST using equality, Boolean connectives, and
   arbitrarily nested first-order quantifiers.
4. Assumptions: theory requirements, equality semantics, nonempty-sort policy,
   domain closure, unique names, and any finite-domain declarations.

Standard FOL defaults remain visible: distinct names may denote the same value,
and domains may contain unnamed values, unless the claim explicitly changes
those assumptions.

### `FormalClaimCapabilityAssessment/v1`

The assessment has five blocks:

1. Binding: assessment identity, policy identity, exact source ref and digest,
   version, currentness, supersession, and authority effect.
2. Total primary classification: `executable-bounded`, `solver-admissible`,
   `proof-provider-required`, `unsupported`, or `indeterminate`.
3. Independent states: executable projection, solver profile, and proof-provider
   requirement, so overlapping capability is not collapsed into one label.
4. TDE surface: `needs_formal` and one or more typed reason codes.
5. Optional bindings: an exact executable projection or admitted solver profile
   reference. Provider output is never embedded.

### `ExecutableProjectionBinding/v1`

The binding records source and projection digests, selected executable profile,
projection purpose, preservation kind and implication direction, exact domain,
assumptions, preservation evidence, producer owner, validator owner,
currentness, and claim ceiling.

Allowed preservation claims are scoped rather than universal:

- `exact-equivalent-under-declared-domain` for exact equivalence only inside the
  named finite/bounded domain and assumptions;
- `counterexample-preserving` when a projected counterexample maps to a source
  counterexample under the declared direction;
- `witness-preserving` when a projected witness maps to a source witness;
- `implication-only` with the exact `source-implies-projection` or
  `projection-implies-source` direction and no converse claim.

Preservation may be syntactic-by-construction under an exact admitted rule, or
it needs a separately owned certificate/receipt. This architecture does not
claim a general full-FOL equivalence checker. Without admissible preservation
evidence, no projection is emitted and `needs_formal` stays true. A bounded or
narrowed projection proves only its declared boundary, never the global source
claim.

### Evidence records

EVF request and provider execution receipts remain system-evidence records. A
provider receipt can report `sat`, `unsat`, `unsupported`, `unknown`, `timeout`,
or `error` under a pinned profile. Only a separately defined EVF interpretation
contract may turn supported `sat` or `unsat` evidence into its bounded witness
result. None is proof or discharge by itself.

## 4. Workflow Process / Operation-Flow View

```text
1. Formal-claims owner authors a source payload.
2. Source validator checks signature, sorts, AST, assumptions, digest, and owner binding.
3. Exact-byte owner/verifier admission occurs only in a future separately authorized route.
4. Validation governance assesses the admitted source against exact profiles.
5. TDE applies the exact validation-governance policy to the deterministic
   executable slice and returns its decidability/profile result; other profile
   owners contribute their separately scoped states.
6. Assessment emits one total primary class, independent capability states, and
   typed needs_formal reasons.
7a. If an executable projection is admitted, TDE may derive bounded tests from it.
7b. If a solver profile is admitted, EVF may issue an exact evidence request.
7c. If proof is required, a separate ProofObligation routes to a proof provider.
8. A pinned provider returns bounded evidence; unsupported/unknown/timeout/error never passes.
9. EVF joins exact source, assessment, profile, request, provider, and currentness digests.
10. Lifecycle owners separately decide whether any evidence affects an obligation.
```

No step can skip from source expressiveness to execution. No downstream result
can flow backward and mutate source meaning.

## 5. Decision Flow / State and Routing View

```text
structured source statement present?
  no  -> needs_formal(missing-formal-statement)
  yes -> source semantics valid under declared profile?
          no  -> reject source candidate; no assessment pass
          yes -> admitted TDE projection with preservation evidence?
                  yes -> primary executable-bounded; needs_formal false for that projection
                  no  -> needs_formal(outside-executable-profile or typed cause)
                admitted solver profile for exact theory?
                  yes -> solver state admitted; EVF route may be requested
                  no  -> solver state unsupported/not-requested
                separate admitted proof provider required?
                  yes -> proof-provider-required when no higher-priority admitted class applies
                no admitted capability matches the exact language/theory?
                  yes -> unsupported + typed outside-profile/unsupported-theory reasons
                classification evidence complete, current, and consistent?
                  no  -> indeterminate + needs_formal(indeterminate-classification)
```

The primary label is for routing convenience. The independent states are the
actual non-collapsing contract. TDE's `needs_formal` can remain true while an EVF
solver route is admitted because solver evidence is not deterministic test
derivation.

The classification is total: a valid but unmatched claim is `unsupported`, not
mislabelled as proof-required or indeterminate. `proof-provider-required` needs
an exact admitted proof route. `indeterminate` needs a classification-evidence
defect or inconclusive result.

## 6. Dependency Interface View

| Producer | Contract | Consumer | Allowed use | Forbidden inference |
| --- | --- | --- | --- | --- |
| formal-claims-owner | `FormalClaimSourcePayload/v1` | validation governance | assess exact source meaning | tool capability, proof, discharge |
| validation governance | exact classification policy | TDE | execute deterministic decidability/profile classification for its slice | own source meaning or solver operation |
| TDE | executable-slice classification result | validation governance | contribute exact assessment input | broaden policy or admit a solver |
| validation governance | `FormalClaimCapabilityAssessment/v1` | TDE | read projection state and typed reasons | infer a projection from source FOL |
| validation governance | `ExecutableProjectionBinding/v1` | TDE | derive only for its exact purpose, preservation direction, profile, domain, and assumptions | global source executability or equivalence |
| validation governance | exact solver profile ref | EVF | route an evidence request | provider or runtime admission by implication |
| EVF | provider request | SMT provider | execute exact query under pinned limits | reinterpret claim meaning |
| SMT provider | execution receipt | EVF | consume bounded provider evidence | pass from unsupported/unknown/timeout/error |
| proof bridge | `ProofObligation` | proof provider | attempt separately scoped proof | owner acceptance or lifecycle discharge |
| any evidence producer | system-evidence record | lifecycle owner | inform a separately governed decision | self-discharge or promotion |

### Dependency direction guardrails

- TDE, EVF, provider, and proof results cannot modify the source payload.
- Provider admission cannot modify assessment policy.
- Generated ontology views cannot become canonical semantic input.
- @4 owner responses cannot accept successor bytes.

## Significant Behavior Scenario

### Stimulus

The owner authors `price >= 0` with `price: Int`. Validation governance assesses
it against the current QF_LIA profile.

### Ordered response

1. Source validation accepts the typed quantifier-free FOL formula.
2. Assessment binds the exact source digest.
3. The executable and solver states may be admitted independently.
4. TDE consumes only an exact executable projection if one exists.
5. EVF may request a counterexample from the pinned QF_LIA provider.
6. A provider timeout returns `timeout`; EVF records non-pass evidence and does
   not reinterpret the claim.

### Acceptance owner and evidence

The formal-claims owner accepts meaning only in a future exact-byte route.
Validation governance accepts assessment policy separately. Planned witnesses
`PW-PRICE-QF` and `PW-PROVIDER-NONPASS` cover the design contract but are not
implemented or executed.

## Plain-language Boundary Examples

- `price >= 0`: source FOL and current QF candidate.
- `forall account exists owner`: source FOL, but outside current QF_LIA and TDE
  executable profiles.
- `every request eventually completes`: temporal, therefore not this FOL.
- unbounded graph acyclicity: needs closure/fixed point or a separately declared
  finite bound; plain FOL does not provide uniform reachability.

## Triggered Design Extensions

### Authority and trust

Source semantics, assessment, provider execution, evidence interpretation, and
lifecycle decisions have distinct accountable owners. Exact digest bindings and
future owner/verifier receipts prevent one role from silently accepting another
role's statement.

### Integration and versioning

Every cross-owner interface is versioned and digest-bound. A change to source,
assessment policy, executable profile, solver profile, provider runtime, or
evidence request makes prior downstream bindings non-current without rewriting
their historical bytes.

### Validation contracts

Positive and negative planned witnesses cover source syntax, semantic
exclusions, assessment routing, projection preservation, typed reasons,
currentness, and provider non-pass results. They remain Design contracts, not
executed Plan evidence.

## Completion Ceiling

The six views and local selection can reach `design-validator-pass`. That means
only that this exact Design is closed and selected consistently. The domain gate
remains blocked pending successor owner and verifier admission and future Plan
evidence.
