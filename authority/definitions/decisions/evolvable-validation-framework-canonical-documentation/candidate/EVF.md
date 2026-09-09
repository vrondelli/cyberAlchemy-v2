# Evolvable Validation Framework

Status: canonical-documentation candidate; not promoted
Candidate ID: `CAV2-EVF-CANONICAL-DOC-CANDIDATE-V1`
Meaning owner: DomainSpec v2 product owner
Candidate steward: `CTX-DSV2-EVF`
Definitions route: `CA2-ROUTE-DEFINITIONS`
Proposed promoted target: `cyberAlchemy-v2/specs/evolvable-validation-framework/EVF.md`
Authority effect: none

## Authority Posture

This document proposes one normative source for EVF meaning. It is not yet that
source. Until an explicit owner promotion decision binds exact bytes, existing
canonical definitions retain their authority and EVF implementation, research,
ontology, receipts, and guides remain evidence or consumers.

The candidate specializes, but does not redefine:

- `CAV2-D18` residue;
- `CAV2-D38` claim-proof bound;
- `CAV2-D51` canonical artifact;
- `CAV2-D65` prototype-first DomainSpec construction invariant; and
- `CAV2-D67` product capability.

## EVF in One Minute

EVF is a way to answer a simple question honestly:

> For this exact version of the product, have we checked every important path
> with the right kind of evidence, and what is still missing?

The product model says what should happen. Residuality analysis asks what must
safely remain when the product is stressed or fails; this makes failure paths
and safe leftovers visible. Evidence tools check different parts of that
story. EVF then connects each tool result to the path and obligation it
actually supports. It reports what is supported, what failed, and what cannot
yet be evaluated.

EVF does not turn a passing test into a proof, or a proof into proof that the
running product behaves correctly. It also does not approve or authorize the
product.

## Normative Definition

The **Evolvable Validation Framework (EVF)** is a tool-neutral validation
framework. It starts with an exact, limited set of paths to check. For each
path, it records the safe result we want, who owns any leftover problem, what
must be verified, what kind of evidence is required, and which exact tool
results supply that evidence. It combines only results that can honestly be
compared and produces path results plus one bounded candidate-readiness result.

EVF answers:

> For the exact declared scope and source bytes, which obligations are supported
> by which evidence, which paths remain unresolved or contradicted, and what is
> the strongest candidate-readiness claim those results permit?

EVF does not determine product meaning, approve products, admit ontologies,
authorize implementations, choose operational effects, or grant publication,
release, or deployment authority.

## Plain-Language Intuition

EVF is the evidence accountant for a product candidate. It keeps a checklist of
important paths, records which exact proof, test, exploration, or observation
supports each item, and leaves every missing or conflicting item visible.

It does not ask, "Did some tests pass?" It asks, "Did every required path receive
the right kinds of current evidence, and what still prevents us from claiming
readiness?"

## Domain-Context Voice

Inside the current private DomainSpec v2 workspace, EVF sits above the tools
that produce evidence. DomainSpec prototypes and compiled graphs say exactly
what is being checked and what must hold. Proof assistants, test runners,
bounded explorers, runtime harnesses, and operational checks each produce a
limited result. EVF checks where each result came from, which obligation it
covers, and whether it is still current. It then issues a candidate receipt
tied to the exact input files.

The current Residuality specialization adds explicit failure paths, groups of
failures with the same underlying weakness, desired safe leftovers, and
unknown cases that must stop rather than guess. The Solana
deployment-continuation example exercises that specialization but does not
constrain EVF to Solana, deployment continuation, Lean, Rust, or any named
provider.

## Boundary and Non-Goals

EVF is not:

- the product's meaning owner;
- a universal proof system;
- a provider brand registry;
- a mechanism for converting bounded evidence into unbounded truth;
- an ontology admission or governance runtime;
- a product-approval mechanism;
- an execution, release, publication, or deployment authority; or
- evidence that unmodeled paths do not exist.

Finite path completeness always means completeness for the exact declared
universe. Unknown or surprising stress must remain representable as a reachable
fail-closed path or an explicit open question.

## How EVF Works: Complete Lifecycle

EVF performs ten connected jobs. This is the complete framework before any
particular tool is selected:

1. **Bind the subject.** Name the exact product candidate, source files,
   configuration, environment assumptions, and validation boundary.
2. **Declare the path universe.** Give every included path a stable identity;
   justify every excluded path; keep an explicit path for unclassified stress.
3. **Describe the required safe residue.** For each reachable path, say what
   must safely remain after success, failure, uncertainty, or degradation.
4. **Assign ownership.** Name who owns each residue and unresolved question.
5. **Create verification obligations.** State the exact checks that must hold
   for each path without yet pretending that evidence exists.
6. **Require evidence kinds.** Decide which distinct questions need structural
   closure, formal proof, implementation tests, bounded exploration, runtime
   observation, operational control, or finalized external observation.
7. **Bind evidence production.** Select an adequate tool route for each
   obligation and bind exact inputs, adapter, invocation, environment, limits,
   and result meanings.
8. **Collect current observations.** Preserve provider receipts and wrap them
   in EVF observations tied to the same path, obligation, source hashes, and
   claim limit.
9. **Evaluate each path.** Check completeness, currency, comparability,
   counterexamples, conflicts, and missing evidence without allowing one
   evidence kind to substitute for another.
10. **Report candidate readiness and residue.** Aggregate the path results and
    publish the strongest bounded conclusion plus every remaining gap.

EVF therefore covers more than running validators. Its core product is a
traceable answer from declared product scope to evidence-bounded readiness.
Tool choice is one stage inside that lifecycle, not the definition of EVF.

## Formal Interpretation

For one exact validation epoch, let:

```text
P       finite declared path set
R       reachable safety-relevant paths, R subset-of P
X       excluded paths, X subset-of P
rho(p)  desired residue for path p
owner(p) residue owner for path p
O(p)    required verification obligations for path p
K(p)    required evidence kinds for path p
E(p)    current digest-bound evidence observations for path p
J(E(p)) non-inflating join over comparable observations
```

Specification closure holds when:

```text
for every p in R:
  stable_id(p)
  and rho(p) exists
  and owner(p) exists
  and O(p) is non-empty
  and K(p) is non-empty

for every p in X:
  exclusion_rationale(p) exists
```

Evidence support for one reachable path holds only when:

```text
supported(p)
  iff every obligation in O(p) has current positive evidence
  and every evidence kind in K(p) is represented by current positive evidence
  and J(E(p)) = supported
  and no structural, digest, comparison, or authority defect exists
```

Aggregate candidate readiness is bounded by:

```text
ready_candidate_only
  iff specification_closure
  and for every p in R: supported(p)
```

`ready_candidate_only` is evidence about a candidate. It is not product
approval and has `authority_effect = none`.

## Minimum EVF Flow

```text
declared boundary
  -> stable finite paths
  -> attractors and desired residues
  -> residue owners and verification obligations
  -> required evidence kinds
  -> digest-bound evidence observations
  -> comparability checks and non-inflating joins
  -> per-path results
  -> aggregate candidate readiness plus explicit residue
```

In plain terms: choose the exact area, list its important paths, say what safe
looks like, state what must be checked, collect the right evidence, and report
both the result and every remaining gap.

Every step must remain inspectable. A later document may explain the flow, but
it cannot silently replace the original owner or source.

## Residuality Specialization

EVF may specialize a Residuality-style conceptual model as follows:

| Residuality-owned concept | EVF-owned specialization |
| --- | --- |
| Target scope | Exact finite path universe and boundary |
| Normal intent | Expected safe and live validation behavior |
| Stressor | Adversarial or degraded path class |
| Desired residue | Owned safe state or explicit fail-closed unknown |
| Degradation behavior | Allowed transition and effect behavior |
| Attractor | Cross-path vulnerability cluster |
| Spec implication | Verification obligation |
| Open unknown | Reachable unknown sink or justified exclusion |
| Verification idea | Provider-neutral evidence requirement |

Residuality continues to own the stressor, residue, degradation, attractor,
unknown, and verification-idea concepts. EVF owns reachability, stable path
identity, obligation closure, evidence adequacy, exact digests, joins, path
results, and aggregate readiness.

This specialization inherits no repository routing, implementation, runtime,
validation, provider-selection, acceptance, admission, publication, release,
deployment, or external-effect authority.

## Evidence Kinds and Claim Limits

Evidence kinds answer different questions. They are not levels on one ladder.
This table defines the question first; tool selection comes later.

| Evidence kind | Question it answers | Does not establish by itself |
| --- | --- | --- |
| Specification closure | Did we describe every declared path, safe residue, owner, obligation, and required evidence kind? | Implementation or runtime behavior |
| Formal proof | Does an exact proposition follow from an exact formal model? | That the implementation preserves the model |
| Implementation test | Did the code behave as expected for these inputs and this environment? | Exhaustive behavior or live-system behavior |
| Bounded exploration | Does the property hold across this declared finite state space? | Correctness outside the explored boundary |
| Runtime observation | What happened in this named execution? | Universal correctness or future behavior |
| Operational control | Did the system stop, reconcile, retain, alert, or escalate as required? | Internal code correctness or proof of every path |
| Finalized external observation | Did the named external effect reach its required final state? | Product approval or future reliability |

One kind cannot silently substitute for another. A formal proof does not close
an implementation-test requirement. A runtime observation does not prove every
formal path. Multiple weak observations do not vote themselves into a stronger
claim.

## How a Tool Result Enters EVF

EVF does not automatically run every evidence tool. A bounded adapter or
evidence-producing workflow may run the tool; EVF consumes the resulting
observation or receipt.

```text
path obligation
  -> required evidence kind
  -> suitable tool and bounded configuration
  -> raw result
  -> EVF observation with subject, path, obligation, result, exact hashes,
     environment, and claim limit
  -> replay and structure checks
  -> path-level evidence decision
```

For example, `cargo test` may report that one Rust behavior passed. The EVF
observation records which test ran, which source and configuration were used,
which obligation it addresses, and the largest claim that result permits. EVF
can then count it as implementation-test evidence for that obligation. It
cannot relabel the same result as formal proof or live external evidence.

The exact invocation is part of the evidence contract. A receipt that records
only "Lean passed" or "the explorer passed" is incomplete for replay if it
does not also bind the invocation through a runtime or provider binding.

## Tool and Provider Neutrality

EVF requirements name the question to answer and the evidence kind needed, not
a preferred brand. A tool or provider result is adequate only when it:

1. addresses a declared path and obligation;
2. has the required evidence kind;
3. binds exact source, adapter, configuration, and result bytes where relevant;
4. carries a claim ceiling and `authority_effect = none` unless a separate
   authority source explicitly says otherwise; and
5. passes the applicable provider and EVF replay checks.

Tool and provider identity remain part of the receipt trail. A famous tool does
not make unrelated or incomplete evidence adequate.

## Reference Clarity

A reader-facing EVF document must not use a project-local ID as if the ID
explains the thing. At first use, say in ordinary language:

1. what the thing is;
2. what product or problem it belongs to;
3. what role it plays in the EVF example; and
4. what it does not represent.

The internal ID may follow in parentheses or a later sentence so a reader can
find the exact source. For example, first explain the bounded Solana deployment
safety example; only then say that its repository label is "Knowledge Exchange
Protocol Candidate 013." The same rule applies to tool names: say what kind of
tool it is and what its result can show instead of presenting a brand name as
an explanation.

## Non-Inflating Join

"Non-inflating" means that combining evidence must not make the claim stronger
than its inputs. EVF combines only results about the same subject, boundary,
property or obligation, relevant source versions, and compatible evidence kind.

The minimum join behavior is:

| Inputs | EVF result |
| --- | --- |
| Complete comparable positive evidence | `SUPPORTED_BOUNDED` |
| Missing, unknown, stale, or incomplete evidence | `NOT_EVALUABLE` (not enough trustworthy evidence yet) |
| A supported counterexample | `COUNTEREXAMPLE` |
| Positive and counterexample observations disagree | `CONFLICT` |
| Excluded path with a current boundary rationale | `EXCLUDED_WITH_RATIONALE` |

Disagreement is never resolved by counting providers. Results about different
questions are kept separately as an unresolved leftover instead of being
forced into one answer.

## Digests, Epochs, and Receipts

An EVF receipt must identify the exact validation run and record hashes for
every input whose change could alter the result. Depending on the evaluation,
that includes:

- path model and boundary;
- specialization profile;
- obligations and evidence-kind requirements;
- evaluator, schema, adapter, and configuration;
- evidence observation set and referenced provider receipts; and
- claim ceiling and open-question owner.

If any result-bound file changes, the old receipt remains evidence only for the
old files. The changed candidate needs a new evaluation; the old receipt cannot
be silently relabeled as current.

## Readiness and Authority Boundary

EVF may report only the strongest state supported by current evidence:

- `SUPPORTED_BOUNDED` for one fully supported bounded path;
- `NOT_EVALUABLE` for incomplete or unknown evidence;
- `COUNTEREXAMPLE` for a supported violation;
- `CONFLICT` for unresolved comparable disagreement;
- `BLOCK` when aggregate candidate readiness is not satisfied; or
- `READY_CANDIDATE_ONLY` when every reachable safety path is fully supported.

No EVF result grants product approval. Under the prototype-first DomainSpec
construction rule (`CAV2-D65`), an exact tested product candidate must receive
a separate product approval before any authority request becomes eligible.
Product approval itself grants no admission, activation, cutover, publication,
release, deployment, credential use, or external effect.

## Who Does What

Only after the EVF lifecycle and evidence requirements are known do we assign
work to tools and supporting capabilities.

| Part | Responsibility inside EVF |
| --- | --- |
| Product and DomainSpec | Supply the intended behavior and exact typed subject. |
| Residuality specialization | Supply stress paths, desired safe residues, failure clusters, and explicit unknowns. |
| EVF path model | Bind paths, owners, obligations, required evidence kinds, and exclusions. |
| Test Derivation Engine (TDE) | Derive stable, provider-neutral executable obligations and test cases from admitted product meaning. |
| Formalization | Own exact FormalClaims and theorem translations where mathematical proof is required. |
| Provider adapter | Translate one neutral obligation or theorem request into one selected tool's exact input and invocation. |
| Evidence tool | Execute the exact bounded check and issue a provider-owned result or receipt. |
| EVF evaluator | Check currency, coverage, comparability, conflicts, and claim limits; then issue path and aggregate results. |
| Product and authority owners | Make separate approval and authority decisions after evidence review. |

## Selected Tools and Current Status

This is the actual selection posture for the current EVF candidate. “Selected”
means evidenced or explicitly bound; it does not mean universally mandatory.

| EVF job or evidence need | Selected capability or tool | What it consumes | What it returns | Current status |
| --- | --- | --- | --- | --- |
| Derive executable obligations | Test Derivation Engine (TDE) | Exact DomainSpec meaning, FormalClaim or executable rule, capability assessment, and optional executable projection | Provider-neutral obligations and cases | Implemented in the historical DomainSpec v9 candidate, but no TDE obligation artifact is bound into the current Solana EVF example |
| Check structural closure | EVF residual evaluator plus deterministic structure and schema checks | Declared path model, specialization, evidence requirements, bindings, and observations | Specification-closure and structural-issue results | Used by the current example |
| Prove one exact theorem | Lean proof assistant | Owned Lean translation, pinned Lean source, theorem request, and toolchain | Machine-checked bounded theorem result | Used by the current example |
| Test Rust implementation behavior | Rust Cargo test runner | Focused Rust tests, exact source, manifest, lockfile, and offline toolchain | Test results and refinement receipt | Used by the current example |
| Explore one small finite state space | Custom finite-state explorer | Five effect states, four revision states, six journal states, and five predicates | Results across all 120 declared states | Used by the current example |
| Search bounded static relationship models | Alloy bounded model finder | A relational obligation translated into an Alloy model and finite scope | Instance or counterexample within that scope | Proposed only; sketches are unvalidated and Alloy is not used by the current example |
| Check temporal state transitions | TLA+ specification checked by TLC | A temporal obligation translated into states, transitions, invariants, and finite bounds | Finite-state result or invariant-violation trace | Proposed only; sketches are unvalidated and TLA+/TLC is not used by the current example |
| Observe assembled runtime behavior | No tool currently bound | Runtime obligation, executable system, environment, fixtures, and observation policy | Named runtime observation | Missing on required paths |
| Exercise operational controls | No tool currently bound | Stop, retain, reconcile, alert, or escalation obligation plus operational environment | Operational-control observation | Missing on the unclassified-input path |
| Observe finalized external effects | No tool currently bound | External-effect obligation, network identity, transaction or operation identity, and finality policy | Finalized external observation | No evidence is present and none is inferred |

We do not automatically run Lean, Alloy, and TLA+/TLC together. Lean is used
for an exact theorem. Alloy would be selected for a separate bounded static
relationship obligation. TLA+/TLC would be selected for a separate temporal
transition obligation. They run together only when EVF requires all of those
different evidence questions for the same candidate.

## How TDE and EVF Work Together

TDE is one derivation capability inside EVF's tool architecture. It does not
define EVF and it does not decide readiness.

```text
EVF path and evidence requirement
  -> exact DomainSpec rule or FormalClaim
  -> TDE capability assessment
  -> TDE provider-neutral obligation, when the route is executable
  -> EVF selects an adequate provider binding
  -> adapter creates the tool-specific input and exact invocation
  -> tool executes and returns its own receipt
  -> EVF maps the receipt back to the path and obligation
  -> EVF evaluates coverage, currency, comparability, and claim limit
```

The ownership split is:

- TDE owns derivation: obligation identity, normalized inputs, expected
  relation or oracle, provenance, evidence requirement, residue, and claim
  limit.
- EVF owns routing and joining: provider selection, exact binding, evidence
  currency, result semantics, comparison, path status, and aggregate status.
- The selected provider owns execution for the exact input, configuration,
  environment, and invocation.

TDE must not emit a Lean-, Alloy-, TLA+-, Rust-, or Python-shaped obligation.
It emits the question independently of the tool. A provider adapter performs
the tool-specific translation only after EVF selects the route.

### The theorem route is separate

When an exact mathematical proposition already has an owned Lean translation,
TDE's capability assessment identifies that a proof provider is required. EVF
then binds the FormalClaim, Lean translation, theorem request, Lean runtime,
and theorem receipt. An ordinary TDE obligation set is not required for that
theorem route.

This keeps formal proof separate from implementation tests while allowing EVF
to require both evidence kinds for one product path.

## Obligation-to-Tool Contract

Every tool handoff has four parts:

| Part | Required content | Owner |
| --- | --- | --- |
| Neutral obligation | Stable ID, exact subject and source hashes, property kind, normalized inputs, expected result semantics, required evidence kind, provenance, residue, and claim limit | TDE |
| Provider binding | Provider identity and version, tool-specific projection, adapter identity, exact invocation or API call, environment allowlist, resource limits, network policy, and output parser | EVF-selected adapter |
| Provider receipt | Input and configuration hashes, invocation identity, exit or result status, raw-output hashes or witness, environment, and provider claim limit | Evidence tool or runner |
| EVF observation | Path and obligation IDs, evidence kind, receipt reference, current or stale decision, normalized outcome, and EVF claim ceiling | EVF |

If any required part is absent, EVF reports missing or not evaluable. It does
not infer an obligation from a tool name or infer an invocation from a passing
receipt.

## Concrete Obligation Consumption

### Execution example: reject a duplicate deployment effect

One current EVF obligation requires the Rust deployment prototype to reject a
second semantic effect or replay after that effect is already recorded. The
target neutral TDE artifact is:

```yaml
obligation_id: test-duplicate-effect-rejection
subject: Solana deployment-continuation command-line implementation
property_kind: executable-behavior
normalized_input: an attempt journal in which the semantic effect already exists
expected_result: a second submission is rejected
required_evidence_kind: implementation-test
claim_limit: this exact implementation behavior under the bound test environment
provider: null
```

`provider: null` is intentional: TDE states the check without selecting the
tool. EVF selects the Rust binding for this Rust implementation. The adapter
binds exact source and toolchain inputs and invokes:

```text
cargo test --manifest-path cyberAlchemy-v2/product/knowledge-exchange-protocol/runtime/trial-cli/Cargo.toml --locked --offline
```

Cargo consumes the focused tests. The provider receipt records two successful
runs. EVF maps that receipt to `test-duplicate-effect-rejection` as
implementation-test evidence. The conclusion covers only the tested Rust
behavior.

The current package does not bind an actual TDE-generated neutral-obligation
artifact. This shows the intended handoff using current Rust and EVF evidence;
it does not prove that the end-to-end TDE handoff already runs.

### Theorem example: stop after an uncertain submission result

Another requirement says that no successor submission may occur while the
previous submission's effect remains unknown. The theorem route is:

```text
formal requirement
  -> proof-provider-required capability assessment
  -> exact Lean translation in DeploymentContinuation.lean
  -> EVF theorem request and pinned Lean toolchain
  -> Lean machine-checks the theorem
  -> theorem receipt: PASS_BOUNDED in two matching runs
  -> EVF observation EVF-OBS-013-LEAN-AMBIGUITY-STOPS
```

Lean consumes the formal translation, not the English sentence. EVF may
conclude only that the proposition holds in that exact bounded Lean model.
Separate implementation and runtime evidence remain required. The current Lean
receipt binds source and toolchain hashes but omits the exact invocation, so
invocation-level replay remains incomplete.

## Worked Example: Safe Solana Deployment Continuation

The Knowledge Exchange Protocol is a Solana-oriented product for giving an
additional person co-ownership of one encrypted knowledge-artifact version,
delivering a decryptable key envelope to that person, and recording their
signed acknowledgement.

This EVF worked example checks a smaller supporting task: safely continuing
deployment of the Solana program behind that product. It starts from a
finalized record of the previous deployment step and covers preparation,
signing, submission, observation, reconciliation, and recording the next step.
It checks failure paths such as stale network data, an uncertain submission
result, an accidental second submission, a wrong signing authority, malformed
input, and recovery after a crash.

The repository internally labels this development snapshot "Knowledge Exchange
Protocol Candidate 013." The label identifies this exact example; it is not a
description of the Knowledge Exchange Protocol as a whole and it is not part
of EVF's general definition.

At the source-manifest snapshot:

```text
declared paths:                  15
specification-closed paths:      15
reachable safety paths:          10
fully evidence-supported paths:   2
aggregate readiness:          BLOCK
```

The receipt retains formal proof, implementation-test, and bounded-exploration
observations while leaving incomplete runtime, operational-control, and other
path-specific evidence visible. This demonstrates the intended behavior: EVF
keeps earned evidence without inflating partial closure into readiness.

The bound observation set currently uses:

| Evidence kind | Tool used by this Solana deployment example | Current status in the bound set |
| --- | --- | --- |
| Specification closure | EVF residual evaluator over the declared model and binding, with structural checks | Receipt reports 15 of 15 declared paths specification-closed |
| Formal proof | Lean, a proof assistant that machine-checks a precise logical statement | 1 supported observation |
| Implementation test | Focused Rust tests for the command-line deployment prototype | 1 supported observation |
| Bounded exploration | A custom program that checks every combination in the example's declared finite input set | 5 supported observations |
| Runtime observation | None | No bound observation; still required on named paths |
| Operational control | None | No bound observation; still required on the unclassified-input path |
| Finalized external observation | None | No bound observation and no external result is inferred |

This table reports what the source-bound example actually contains. It does not
recommend those providers for every EVF use.

The current Lean receipt binds the exact Lean source, toolchain configuration,
result hashes, and two matching successful runs, but it does not itself record
the exact invocation command. The finite-explorer receipt binds the explorer,
model, 120-state universe, and five obligation results, but also omits an exact
invocation. Those invocation bindings therefore remain documentation-visible
gaps rather than facts EVF may infer.

The Rust refinement receipt is more complete at this boundary. It records the
same exact command shown in the concrete execution example:

```text
cargo test --manifest-path cyberAlchemy-v2/product/knowledge-exchange-protocol/runtime/trial-cli/Cargo.toml --locked --offline
```

and records two matching successful runs.

Finally, this worked example currently supplies observations directly to the
EVF residual-path evaluator. Its bound receipt does not contain a TDE neutral
obligation artifact or an end-to-end TDE-to-provider binding. It demonstrates
EVF evidence coverage, but it does not yet prove the complete TDE-to-EVF flow
described in this candidate contract.

## Promotion Requirements

Promotion of this candidate requires an owner decision over one immutable
digest and must, at minimum:

1. confirm EVF's meaning owner and promoted location;
2. accept or revise the formal interpretation and status vocabulary;
3. confirm the Residuality/EVF ownership split;
4. review conflicts against DomainSpec v2 definitions and existing EVF guides;
5. bind a canonical-kind and allowed process origin if the promoted document is
   to be a `CAV2-D51` canonical artifact;
6. synchronize the definitions index or spec lookup surface selected by the
   owner; and
7. rerun source, link, structure, and downstream drift validation.

Validation of this candidate is evidence for review. It is not promotion.

## Open Questions

1. Should promoted EVF meaning live as one CyberAlchemy v2 spec, a DomainSpec v2
   definition package, or a typed pair with one explicit authority relation?
2. Should evidence requirements be path-level dual coverage or exact
   obligation-to-evidence-kind pairs?
3. Which owner controls the admitted status vocabulary and comparability rules?
4. Which downstream v9 references should remain historical rather than be
   synchronized after promotion?
