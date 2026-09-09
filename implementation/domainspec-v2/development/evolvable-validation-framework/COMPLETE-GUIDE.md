# Evolvable Validation Framework Guide

Status: candidate; not canonical
Owner: DomainSpec v2 EVF construction context (`CTX-DSV2-EVF`)
Authority effect: none

Normative source candidate:
[EVF.md](../../../../authority/definitions/decisions/evolvable-validation-framework-canonical-documentation/candidate/EVF.md).

This guide explains the current EVF construction candidate. It does not define
EVF independently and must follow the selected normative source if that source
is promoted.

## What EVF Does

EVF answers: for this exact product version, did every important path receive
the right kind of evidence, and what is still missing?

It turns that question into a traceable evidence decision:

```text
boundary
  -> paths
  -> desired residues
  -> obligations
  -> required evidence kinds
  -> exact observations
  -> non-inflating joins
  -> path results
  -> candidate readiness and remaining residue
```

In plain terms, EVF lists the paths, says what safe looks like, records what
must be checked, connects each check to the right evidence, and reports every
gap. It does not approve or authorize the product.

## How EVF Works

EVF follows one complete lifecycle:

1. bind the exact product candidate and source hashes;
2. declare the included, excluded, and unknown paths;
3. say what must safely remain on each path;
4. assign an owner to every residue and unknown;
5. create the checks each path must satisfy;
6. require the right evidence kinds for those checks;
7. bind an adequate evidence-producing tool for each obligation;
8. collect exact, claim-limited observations and provider receipts;
9. evaluate each path for complete, current, comparable evidence; and
10. report bounded candidate readiness plus every remaining gap.

The important point is that EVF is the whole evidence lifecycle. TDE, Lean,
Rust tests, and finite explorers participate at particular stages; none of
them is EVF by itself.

## Residuality Specialization

Residuality analysis asks what must safely remain when a system is stressed or
fails. It supplies the resilience questions: what applies stress, what safe
leftover is required, how failure may unfold, which failures share an
underlying weakness, what remains unknown, and how each claim could be checked.
EVF turns those questions into a finite path list, stable path IDs, named
owners, checks, evidence requirements, combined results, and readiness.

The specialization is conceptual provenance only. It creates no runtime,
provider, routing, validation, admission, publication, or deployment authority.

## Evidence Does Not Collapse

Formal proof, implementation tests, bounded exploration, runtime observation,
operational controls, and finalized external observation answer different
questions. EVF preserves each claim ceiling and does not use one kind as a
silent substitute for another.

Provider identity records provenance; requirements are expressed in evidence
kinds. Provider disagreement becomes conflict, not a vote.

## How Tool Output Becomes EVF Evidence

EVF does not automatically run all of these tools. A bounded adapter or
evidence workflow runs a selected tool and wraps its output in an EVF
observation:

```text
obligation
  -> required evidence kind
  -> selected tool and exact configuration
  -> tool result
  -> EVF observation with path, hashes, environment, result, and claim limit
  -> EVF coverage and consistency checks
```

A passing Rust test can therefore support one implementation-test obligation.
It cannot be renamed as a formal proof, runtime observation, or live external
result.

## Results

- `SUPPORTED_BOUNDED`: complete positive evidence for the exact bounded path.
- `NOT_EVALUABLE`: there is not enough trustworthy evidence yet.
- `COUNTEREXAMPLE`: a supported violation exists.
- `CONFLICT`: comparable observations disagree.
- `EXCLUDED_WITH_RATIONALE`: the path is outside the declared boundary.
- `BLOCK`: not every reachable safety path is supported.
- `READY_CANDIDATE_ONLY`: all declared reachable safety paths have the required
  evidence, but no product approval or operational authority follows.

## Selected EVF Tools and Current Status

Now that the EVF lifecycle is clear, these are the selected or proposed tools:

| EVF role | Tool or capability | Current status |
| --- | --- | --- |
| Derive executable obligations | Test Derivation Engine (TDE) | Present in the DomainSpec v9 candidate, but not bound into the current Solana EVF example |
| Check path and evidence structure | EVF residual evaluator and deterministic schema checks | Used now |
| Prove an exact formal proposition | Lean proof assistant | Used now for one theorem observation |
| Test implementation behavior | Rust Cargo test runner | Used now for one implementation-test observation |
| Enumerate the declared finite model | Custom 120-state explorer | Used now for five bounded-exploration observations |
| Search bounded static relationship models | Alloy | Proposed only; sketches are unvalidated |
| Check temporal transitions and bad traces | TLA+ with the TLC checker | Proposed only; sketches are unvalidated |
| Observe runtime behavior | No tool bound | Missing on required paths |
| Exercise operational controls | No tool bound | Missing on the unclassified-input path |
| Observe finalized external effects | No tool bound | No evidence present or inferred |

Lean, Alloy, and TLA+/TLC are not a default bundle. Lean answers a theorem
question. Alloy would answer a separate bounded static relationship question.
TLA+/TLC would answer a separate temporal-sequence question. EVF selects more
than one only when the candidate has more than one of those obligations.

## How TDE Participates in EVF

TDE means **Test Derivation Engine**. It is one EVF-supporting capability, not
the definition of EVF. After EVF identifies a path and evidence requirement,
TDE can turn exact DomainSpec meaning into a provider-neutral executable
obligation.

```text
EVF path and evidence requirement
  -> TDE neutral obligation
  -> EVF provider selection
  -> adapter and exact invocation
  -> provider receipt
  -> EVF observation, path result, and bounded aggregate
```

TDE owns what must be checked. EVF owns which provider binding is adequate and
how the evidence joins. The selected tool owns what happened in the exact run.

Lean theorem checking follows a separate theorem route. TDE classifies the
claim as requiring a proof provider; EVF then binds the FormalClaim, its Lean
translation, theorem request, Lean runtime, and theorem receipt. It is not
disguised as an ordinary generated test.

## Obligation-to-Tool Binding

Every selected route must bind:

1. the neutral obligation or theorem request and exact source hashes;
2. the tool-specific projection and adapter;
3. the provider version and exact command or API invocation;
4. the allowed environment, limits, and network policy;
5. the output parser and result meanings;
6. the provider receipt; and
7. the EVF observation pointing to the same path and obligation.

Missing invocation data remains `NOT_EVALUABLE`; EVF does not guess how a tool
was run because a receipt says it passed.

## Concrete Obligation Consumed by Rust

One current EVF obligation requires the deployment implementation to reject a
second semantic effect or replay:

```text
obligation: reject a duplicate deployment effect
input: an attempt journal where that effect already exists
expected result: reject another submission
evidence kind: implementation test
provider: not selected by TDE
```

EVF selects the Rust binding and invokes:

```text
cargo test --manifest-path cyberAlchemy-v2/product/knowledge-exchange-protocol/runtime/trial-cli/Cargo.toml --locked --offline
```

Cargo consumes the focused tests. The receipt records exact source and
toolchain hashes plus two matching successful runs. EVF connects it to the
duplicate-effect obligation, with a claim limited to the tested Rust behavior.

The current package does not contain the TDE-generated neutral-obligation file.
This is the target handoff backed by current Rust and EVF evidence, not proof
that the entire TDE-to-EVF handoff already runs.

For the theorem requirement—no successor submission while the previous effect
remains uncertain—Lean consumes `DeploymentContinuation.lean` through the
separate theorem route. That result covers the formal model, not the Rust
implementation or a live network.

## Current Worked Example: Safe Solana Deployment Continuation

The Knowledge Exchange Protocol is a Solana-oriented product for granting an
additional person co-ownership of one encrypted knowledge-artifact version,
giving that person a decryptable key envelope, and recording their signed
acknowledgement.

The worked example checks one smaller supporting task: safely continuing
deployment of the Solana program behind that product. It follows a finalized
record of the previous deployment step through preparation, signing,
submission, observation, reconciliation, and recording the next step. It
models failures such as stale network data, uncertain submission results,
duplicate submission, wrong authority, malformed input, and crash recovery.
The repository's internal source label for this snapshot is "Knowledge Exchange
Protocol Candidate 013."

The example has 15 declared paths and 10 reachable safety paths. The
source-bound documentation snapshot records 15 structurally complete paths, 2
fully evidence-supported paths, and aggregate readiness `BLOCK`. See the
candidate source manifest for exact bytes and claim limits.

## Implementation Surfaces

- [Candidate contract describing how TDE obligations reach EVF evidence providers](../../current-candidate-v9/formalization/docs/TDE-EVF-INTEGRATION.md)
- [Candidate schema for joining execution evidence and theorem evidence](../../current-candidate-v9/formalization/schemas/evf-evidence-join.schema.json)
- [Residuality specialization candidate](residuality-specialization-candidate-v1/profile.json)
- [Product Capability candidate](residuality-specialization-candidate-v1/product-capability.json)
- [Receipt schema](residuality-specialization-candidate-v1/contracts/residual-path-evaluation.v1.schema.json)
- [Evaluator](residuality-specialization-candidate-v1/src/evf_residual.py)
- [Adapter that maps the Solana deployment-continuation example into EVF paths](residuality-specialization-candidate-v1/adapters/candidate_013.py)
- [Current EVF receipt for the Solana deployment-continuation example](residuality-specialization-candidate-v1/generated/candidate-013-residual-path-receipt.json)

These are construction and evidence artifacts. They do not become normative by
being linked here.

## Open Questions

Normative open questions are owned by
[the documentation candidate](../../../../authority/definitions/decisions/evolvable-validation-framework-canonical-documentation/candidate/EVF.md#open-questions).
Implementation-specific questions remain in
[the implementation candidate](residuality-specialization-candidate-v1/OPEN-QUESTIONS.md).
