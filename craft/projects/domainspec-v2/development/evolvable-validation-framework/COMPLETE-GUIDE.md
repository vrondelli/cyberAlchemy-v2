# Evolvable Validation Framework User Guide (Pre-release)

## Start here

The Evolvable Validation Framework, or EVF, helps a team answer:

> What exact evidence supports this claim, and where does that evidence stop?

Suppose a game specification says:

> A player can open a door only when the player has the required key.

That is a claim, not evidence. EVF connects the claim to an exact obligation, the
responsible implementation, an executable check, deliberately broken cases, observed
results, and a receipt.

```text
OnlyKeyHolder -- enforces --> OpenDoor
       |
       v
formal obligation
       |
       v
exact code binding -> check -> observed result -> receipt
```

The receipt says what was checked. It does not approve the feature, release the
application, or make a broad correctness claim.

For stable design, see [ARCHITECTURE.md](ARCHITECTURE.md). For current streams and
blockers, see [THREAD-MAP.md](THREAD-MAP.md).

## What EVF does

EVF helps a team:

1. preserve the source claim and its owner;
2. state the exact condition that must hold;
3. bind that condition to exact implementation bytes;
4. run a suitable test, model, proof tool, or observation;
5. check that deliberately wrong variants fail;
6. keep each provider's native result and limitations;
7. combine results only when their scopes are genuinely comparable; and
8. issue a replayable receipt with an explicit claim ceiling.

Its core rule is:

```text
claim <= evidence
```

EVF may narrow a claim when evidence is incomplete. It may not make a claim stronger
than the evidence.

## What EVF does not do

EVF does not:

- invent business meaning absent from DomainSpec;
- turn every statement into an executable test;
- treat a passing test as a theorem;
- treat a bounded model as an unbounded proof;
- hide a timeout, unsupported construct, or disagreement;
- approve its own evidence; or
- promote, release, or deploy a system.

## Learn one idea at three levels

The invariant stays the same:

> Bind one declared claim to exact evidence and state what that evidence does not
> prove.

### Level 1: one rule and one operation

```text
OnlyKeyHolder -- enforces --> OpenDoor
```

The obligation says `OpenDoor` may succeed only when `OnlyKeyHolder` is true. A
positive case uses the right key. A negative control changes the rule or bypasses it
and must fail.

This demonstrates one causal evidence chain. It does not prove every door rule or the
whole application.

### Level 2: repeat the method on another feature

```text
EligibleForPayout -- enforces --> CreatePayout
CreatePayout      -- produces --> PayoutCreated
```

This chain includes a rule, operation, ordered write, and event. EVF must keep the
obligation IDs, runtime binding, observation order, mutations, and receipt identity
stable.

This demonstrates repeatability on a richer slice. It does not prove all settlement
behavior or every relationship kind.

### Level 3: compare one property across providers

EVF can freeze one graph fact set and ask Souffle and Alloy to evaluate the same
bounded reachability property.

```text
frozen facts
  -> Souffle -> native result --\
                                -> exact-comparability join
  -> Alloy   -> native result --/
```

Before joining, EVF compares the request, facts, universe, property, mapping, scope,
and claim ceiling. Agreement supports only that property over those facts.
Disagreement, `unknown`, or a scope mismatch blocks the join.

This demonstrates bounded cross-provider consistency. It does not prove the entire
graph correct or establish provider equivalence.

## The evidence chain

```text
source claim
  -> normalized representation
  -> formal obligation
  -> implementation binding
  -> generated or selected check
  -> positive execution
  -> negative mutation execution
  -> evaluator verdict
  -> digest-bound receipt
  -> bounded claim
```

| Stage | Question | Key-and-Door example |
| --- | --- | --- |
| Source | What did the specification say? | Only the correct key may open the door. |
| Representation | What exact meaning is selected? | One `enforces` edge with stable IDs. |
| Obligation | What must hold? | Opening succeeds only if the rule is true. |
| Binding | Which implementation is responsible? | One exact rule and operation. |
| Check | How is it evaluated? | Invoke the operation with selected fixtures. |
| Positive run | Does the expected case work? | Correct key opens the door. |
| Negative control | Can the check detect a fault? | Wrong key or bypassed rule is rejected. |
| Receipt | Which bytes support the result? | Digests, tools, results, and residue. |
| Ceiling | What may be concluded? | This exact slice passed this exact evaluation. |

## Walk through one EVF proof

### 1. Keep meaning upstream

DomainSpec owns the meaning. EVF consumes a selected semantic source or admitted
projection. A validator may not invent what counts as the right key merely because it
would be easy to test.

### 2. Create the obligation

An obligation states the condition independently of its evaluator:

```text
id:        key-door/enforces/only-key-holder/open-door
condition: OpenDoor succeeds only when OnlyKeyHolder is true
source:    exact relationship and predicate references
ceiling:   selected feature and predicate only
```

### 3. Bind exact implementation

A binding connects the obligation to an exact fixture, runtime target, source lineage,
and invocation. Missing, duplicate, ambiguous, or stale bindings fail before execution.
A similarly named function elsewhere is not a substitute.

### 4. Execute the positive case

```text
input:    player has matching key
expected: predicate true; operation succeeds; door becomes open
observed: exact ordered observations
```

A valid JSON shape is insufficient. Values and behavior must match the obligation.

### 5. Run negative controls

Useful controls change a predicate result, bypass the rule, change source bytes, alter
an expected observation, or remove a relationship fact. If a required mutant survives,
EVF withholds the positive receipt. A check that cannot fail is not useful evidence.

### 6. Issue and verify the receipt

The receipt binds exact source, obligation, binding, fixture, runtime, provider,
positive result, negative results, diagnostics, residue, and claim ceiling. Changing a
bound byte changes its digest. The old receipt remains historical evidence for the old
bytes; it does not certify the new bytes.

## Understand the roles

| Role | Owns | Must not do |
| --- | --- | --- |
| DomainSpec | Domain meaning | Claim runtime evidence |
| Projection admission | Whether one representation may execute | Treat structure as proof |
| TDE | Deterministic obligations and cases | Execute providers or redefine meaning |
| Binding layer | Exact obligation-to-runtime correspondence | Select ambient targets |
| Provider | One tool invocation and native result | Broaden its result |
| Normalizer | Common result vocabulary and ceiling | Hide native uncertainty |
| Composer | Exact comparability and non-inflating joins | Majority-vote truth |
| Receipt verifier | Integrity, currentness, and replay | Use mutable ambient state |
| Consumer | Independent use of EVF handles | Rewrite EVF evidence |
| Owner gate | Admission, promotion, or release | Pretend evidence made the decision |

## Choose the right evidence

| Question | Suitable lane | Limit |
| --- | --- | --- |
| Did bound code behave as expected? | Test or runtime observation | Selected inputs and runtime only. |
| Does a property hold in a finite scope? | Bounded model | Not an unbounded theorem. |
| Does a theorem follow from assumptions? | Formal proof | Not current code conformance by itself. |
| Do tools agree on frozen facts? | Comparability join | Shared property and scope only. |
| Did another system use the evidence? | Consumer-owned receipt | Must be independently authored. |

Different lanes can support one decision, but their results are not interchangeable.

## Read results without overclaiming

Ask separately:

1. Was the source exact and current?
2. Was the obligation created without invented meaning?
3. Was the binding exact and unambiguous?
4. Did the provider complete?
5. Did required negative controls fail as expected?
6. Is the receipt intact and replayable?
7. Are multiple receipts genuinely comparable?
8. Did an independent consumer use the result?
9. Did the responsible owner make a separate decision?

| Evidence | Safe conclusion | Unsafe conclusion |
| --- | --- | --- |
| One test passed | The selected case matched. | The feature is correct. |
| Mutants were killed | Those faults were detected. | Every fault is detectable. |
| No bounded counterexample | None appeared in the scope. | None exists anywhere. |
| A theorem checked | It follows under its assumptions. | Running code conforms. |
| Providers agreed | They agreed on exact shared inputs. | They are generally equivalent. |
| A receipt verified | It is intact for bound bytes. | The system is approved. |

## Work with the repository

```text
development/evolvable-validation-framework/
  README.md          short overview
  COMPLETE-GUIDE.md  practical guide
  ARCHITECTURE.md    stable boundaries and decisions
  THREAD-MAP.md      current streams and blockers
  GLOSSARY.md        short vocabulary
  contracts/         requests and receipt schemas
  semantic-source/   selected semantic inputs
  runtime/           bounded runtime material
  x-ray/             visual explanation

impl/test-derivation-engine/src/
  minted-project/    causal and graph-property EVF code
  sfol/              logic, cases, evaluators, and provider contracts
```

The current physical form is private repository-local TypeScript and evidence
material. It is not an EVF network service, database, production control plane, or
public release.

## Two layer scales

EVF uses two different scales. Do not merge them.

| EVF evidence layer | Question |
| --- | --- |
| L0 | Can one claim produce a trustworthy causal receipt? |
| L0C | Can an independent consumer use it without drift? |
| L1 | Can the method repeat on another admitted slice? |
| L2 | Can one graph property be compared across providers? |
| L3 | Can EVF absorb broader backend evidence reversibly? |

| Validation-roadmap layer | Question |
| --- | --- |
| L0 | Can one claim cross the complete source-to-consumer path? |
| L1 | Is that complete path reproducible? |
| L2 | Can languages and providers expand safely? |
| L3 | Can broad BTE behavior move into EVF reversibly? |
| L4 | Does evidence support a separate promotion decision? |

An EVF-internal L2 result does not imply roadmap L2 or a complete roadmap L0 path.

## Troubleshooting

### A receipt is stale

Compare source, binding, fixture, runtime, and provider digests. Re-run against the new
bytes and issue a new receipt; never edit the old one into currentness.

### A provider returned `unknown` or timed out

Preserve the native result and report non-pass. Missing evidence is not `false`, zero,
or PASS.

### Two providers passed but the join failed

Compare request identity, facts, universe, property, mapping, scope, and ceiling. Two
valid results can still be incomparable.

### The positive case passed but no receipt appeared

Check negative controls, binding cardinality, currentness, and integrity. EVF requires
the complete acceptance vector, not one green step.

### A consumer claim remains blocked

The consumer must independently show that it used the exact immutable EVF handles.
EVF cannot author that proof for it.

## Extend EVF carefully

For a new predicate, property, or provider:

1. identify the upstream semantic owner;
2. version the source or admitted projection;
3. define a neutral obligation and exact ceiling;
4. add positive and meaningful negative fixtures;
5. bind exact runtime and provider identities;
6. preserve native results and typed residue; and
7. add replay and tamper checks.

For evidence composition, define exact comparability before writing the join. Never
use majority vote as a substitute for semantic comparability.

## Current status

EVF has bounded candidate-local evidence for one causal relationship slice, selected
Financial Settlement repetitions, one reachability property across Souffle and Alloy,
and protocols for additional providers. It also has explicit consumer and authority
boundaries.

No current receipt proves the complete vertical:

```text
DomainSpec claim
  -> admitted projection
  -> TDE obligations
  -> provider execution
  -> EVF evidence handle
  -> independent consumer receipt
  -> separate owner decision
```

Do not infer external release, deployment, or production readiness from local code,
fixtures, plans, or bounded passing tests.

## Source map

| Need | Start here |
| --- | --- |
| Short explanation | [README.md](README.md) |
| Stable architecture | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Current progress | [THREAD-MAP.md](THREAD-MAP.md) |
| Historical first design | [DESIGN.md](DESIGN.md) |
| Vocabulary | [GLOSSARY.md](GLOSSARY.md) |
| Visual explanation | [x-ray/ARCHITECTURE-AND-DESIGN.html](x-ray/ARCHITECTURE-AND-DESIGN.html) |
| TDE guide | [../../impl/test-derivation-engine/COMPLETE-GUIDE.md](../../impl/test-derivation-engine/COMPLETE-GUIDE.md) |

## Glossary

| Term | Plain meaning |
| --- | --- |
| Claim | A statement that should or does hold. |
| Obligation | The exact condition required to support a claim. |
| Binding | The connection to exact implementation and runtime material. |
| Provider | A bounded tool that produces one kind of evidence. |
| Negative control | A deliberate fault the checking path must detect. |
| Native result | The provider's own outcome and diagnostics. |
| Residue | Missing, stale, unsupported, or conflicting evidence. |
| Receipt | A digest-bound record of inputs, execution, results, and ceiling. |
| Claim ceiling | The strongest conclusion the evidence supports. |
| Consumer receipt | Independent evidence that another system used exact EVF handles. |

## Four questions before trusting a claim

1. Which exact source meaning and implementation bytes were checked?
2. Which positive and negative evidence supports the verdict?
3. What residue and claim ceiling does the receipt record?
4. Which separate owner, if any, made the following decision?
