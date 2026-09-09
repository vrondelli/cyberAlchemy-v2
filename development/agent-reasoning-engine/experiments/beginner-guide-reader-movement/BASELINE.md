---
title: Agent Reasoning Engine Beginner's Guide
status: draft
audience: new private-project contributor
source_state_as_of: 2026-08-13
authority_effect: none
---

# Agent Reasoning Engine: a beginner's guide

This guide is for a teammate who can read JavaScript but has not worked on this
project before. Its goal is to get you from “what is this?” to “I can trace a
case, run the tests, and discuss a bounded change without overstating what the
system does.”

The shortest useful description is:

> The Agent Reasoning Engine is a private, pre-action design that turns frozen,
> traceable inputs into typed advice. Advice is never permission to act.

That last sentence is the central rule. The design deliberately separates:

1. whether a bounded reasoning run may start;
2. what a finite set of rules says under captured inputs; and
3. whether one exact effect is independently allowed.

## Start with the current truth

The directory is larger than the implemented runtime. Do not mistake the amount
of design and lifecycle evidence for a complete engine.

| Surface | Current posture |
|---|---|
| Whole Agent Reasoning Engine | Candidate architecture. It is not admitted as a general reasoning engine. |
| `semantic-judgment-evaluator@1` | Implemented private finite reducer and promoted bounded L0 witness. It has no real effect adapter or actor runtime. |
| `intent-route-resolver` | Implemented private standalone L0 package. It returns advisory route dispositions and has no authority to approve, dispatch, or execute. It is not installed in a product host. |
| ACI-integrated runtime | Planned but blocked. External maturity and conformance evidence are missing. |
| Next engine implementation unit | None selected. `implementation_authorized=false`. |
| Public release or deployment | None. This is private CAV2 material. |

The scoped [Craft ledger](.craft/ledger.yml) is the declared lifecycle
authority, and [CRAFT.md](CRAFT.md) is its generated human-readable projection.
There is currently visible synchronization drift: both still say the next move
is to author the ACI-subordinate plan revision, while the newer
[whole-engine work-pack](planning/WORK-PACK.md#current-state-and-next-move) says
that revision is already authored and that execution remains blocked. The
work-pack also names a closeout-sync blocker that is absent from the ledger.
The ledger also does not index the completed child intent resolver; the current
evidence does not establish whether that is intentional scope separation or a
missing refresh.
Treat this as an open governance inconsistency, not permission to choose either
future route. For any mutation, stop until the lifecycle owner synchronizes the
sources and selects an exact SWU.

As a live sanity check on 2026-08-13, the evaluator suite passed 16 tests and the
intent-route-resolver suite passed 34 tests under Node `v22.13.0`. That proves
the checked behavior of those bytes; it does not promote the whole engine or
authorize new work.

## A concrete mental model

Imagine a careful claims desk handling a refund request.

- The desk first checks whether this particular review is allowed to run.
- It uses a frozen policy version and a frozen set of facts.
- It can recommend the refund, defer because evidence is missing, reject because
  a defeater applies, or escalate an owner conflict.
- It writes down exactly how it reached that result.
- Even a positive recommendation cannot issue a refund. A separate owner must
  authorize that exact action.

The implemented evaluator proves this pattern with a local refund fixture. It
does not prove that the policy facts are true, that the policy is globally
authoritative, or that a real refund may be sent.

The intent route resolver answers a different earlier question: “Which
capability appears to fit this typed intent?” It may return one candidate, an
ambiguity and one clarifying question, no match, or an invalid-input result. A
candidate is still only advice.

## The two implemented slices

The slices live under
[`cyberAlchemy-v2/implementation/agent-reasoning-engine/`](../../implementation/agent-reasoning-engine/).
They are siblings, not a currently integrated end-to-end engine.

### 1. Semantic judgment evaluator

The evaluator reduces a finite, frozen request to one of eight outcomes. The
runtime path implemented by `executeWitness` is:

```text
persist entry gate
        |
        +-- non-pass --> stop with zero evaluation/effect calls
        |
       pass
        v
evaluate frozen catalog + observations + challenge state
        v
assemble and persist reasoning receipt
        |
        +-- non-recommendation --> stop with zero effect calls
        |
RecommendedUnderSnapshot
        v
build and persist one exact-effect gate decision
        |
        +-- non-pass --> stop with zero effect attempts
        |
       pass
        v
fixed in-memory effect test double, idempotently
```

The eight terminal evaluator outcomes are:

- `InvalidInput`
- `UnauthorizedCatalog`
- `OutOfDomain`
- `Ineligible.Defeated`
- `Deferred.Insufficient`
- `EscalateOwner`
- `RecommendedUnderSnapshot`
- `Invalidated`

Only `RecommendedUnderSnapshot` may reach the exact-effect gate, and even then
the result does not authorize the effect.

Useful code landmarks:

| File | Responsibility |
|---|---|
| [`index.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/index.mjs) | Package export surface. |
| [`src/outcomes.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/outcomes.mjs) | Frozen outcome vocabulary. |
| [`src/reducer.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/reducer.mjs) | Input checks, authority/catalog checks, applicability, defeat, insufficiency, conflict, and recommendation. |
| [`src/execute.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/execute.mjs) | Persisted ordering, gate separation, receipt-first behavior, and effect-test-double boundary. |
| [`src/receipt.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/receipt.mjs) | Deterministic reasoning-receipt assembly. |
| [`src/store.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/store.mjs) | In-memory and atomic-file record stores. |
| [`src/replay.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/replay.mjs) | Historical deterministic replay; no fresh provider or effect calls. |
| [`test/evaluator.test.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/test/evaluator.test.mjs) | Outcome, counterfactual, ordering, replay, and gate/effect invariants. |
| [`fixtures/evaluator-v1/refund-eligibility.json`](../../implementation/agent-reasoning-engine/fixtures/evaluator-v1/refund-eligibility.json) | Easiest first rule-family example. |

### 2. Intent route resolver

The resolver is a pure typed-input relation:

```text
RoutableIntentEnvelope + frozen CapabilityRouteCatalogSnapshot
        v
validate request and catalog
        v
evaluate exclusions and required predicates
        v
reduce only through owner-declared dominance edges
        v
candidate | ambiguous | no-match | invalid
```

It uses no model confidence, embedding score, repository discovery, network,
filesystem, dispatch, or effect call in its core. Its result always carries
`authority_effect: none`.

Useful code landmarks:

| File | Responsibility |
|---|---|
| [`index.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/index.mjs) | Package export surface. |
| [`src/request.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/src/request.mjs) | JSON-only request admission and intent field posture. |
| [`src/catalog.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/src/catalog.mjs) | Catalog ownership, version, digest, predicate, identity, and graph validation. |
| [`src/eligibility.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/src/eligibility.mjs) | Exclusion-first route traces and explicit dominance reduction. |
| [`src/resolve.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/src/resolve.mjs) | Exhaustive disposition classification and one-question ambiguity. |
| [`src/json-port.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/src/json-port.mjs) | Stable JSON transport diagnostics around the pure resolver. |
| [`src/selected-local.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/src/selected-local.mjs) | Explicit compatibility mapping from the current private intent record; missing values stay unresolved. |
| [`test/fixtures/witness/cases.json`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/test/fixtures/witness/cases.json) | Compact examples of unique, unresolved, overlapping, and dominated routes. |
| [`addon-manifest.json`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/addon-manifest.json) | Runtime-neutral entrypoints and the zero-permission boundary. |

## How the larger design fits around them

The candidate whole-engine flow is broader than either package:

```text
source intent
  -> problem frame
  -> frozen authority and rule/catalog state
  -> entry gate
  -> effort and technique selection
  -> bounded actors/tools and journal
  -> admitted observations
  -> semantic evaluator and reasoning receipt
  -> exact-effect gate
  -> future effect adapter
```

Most of this flow is still design or blocked plan, not runtime. The
[specification](spec/SPEC.md) defines the ownership boundaries, the
[six-view architecture](design/ARCHITECTURE.md) shows the whole shape, and the
[decision/effect flow](design/DECISION-AND-EFFECT-FLOW.md) describes the desired
ordering. The newer [work-pack](planning/WORK-PACK.md) records which units are
complete, planned, blocked, superseded, or unselected; its disagreement with the
declared Craft authority remains the synchronization issue described above.

The chosen target is ACI-subordinate: a future integration must use ACI-owned
journal facts, acceptance identity, replay cursor, and effect intents. This
project retains semantic derivation and reasoning-receipt content. That
architecture choice is accepted, but runtime compatibility is not established.

## Directory map

```text
cyberAlchemy-v2/
├── development/agent-reasoning-engine/       # intent, design, plans, gates
│   ├── .craft/ledger.yml                     # scoped lifecycle authority
│   ├── CRAFT.md                              # derived human view
│   ├── spec/                                 # candidate whole-engine contract
│   ├── design/                               # architecture and component boundaries
│   ├── planning/                             # tasks, SWUs, waves, gates, current block
│   ├── decisions/                            # owner decisions and receipts
│   ├── intent-route-resolver/                # child capability's define/design/plan
│   ├── experiments/                          # bounded evidence work
│   ├── receipts/                             # historical lifecycle evidence
│   └── refresh/                              # past synchronized lifecycle changes
└── implementation/agent-reasoning-engine/    # executable private bytes
    ├── packages/
    │   ├── semantic-judgment-evaluator/
    │   └── intent-route-resolver/
    ├── fixtures/evaluator-v1/
    └── generated/runs/                       # immutable evidence from exact past runs
```

`projects/cyberalchemy-orchestrator/` is a separate control-plane project. Its
ACI contracts are an integration dependency; it is not the reasoning engine
implementation.

## Which source answers which question?

No single document owns every kind of truth.

| Question | Start here |
|---|---|
| What work is selected or blocked now? | Compare [`.craft/ledger.yml`](.craft/ledger.yml) with [`planning/WORK-PACK.md`](planning/WORK-PACK.md); their current drift means no mutation route may be inferred. |
| What should the whole system mean? | [`spec/SPEC.md`](spec/SPEC.md) and [`spec/GLOSSARY.md`](spec/GLOSSARY.md) |
| How are components meant to remain separate? | [`design/ARCHITECTURE.md`](design/ARCHITECTURE.md) and [`design/COMPONENT-CONTRACTS.md`](design/COMPONENT-CONTRACTS.md) |
| What do the current packages actually do? | Implementation source plus current tests |
| What did one historical governed run prove? | The exact receipt and generated run named by that claim |
| What does a passing receipt not prove? | Read its claim ceiling and residue; never infer promotion, compatibility, or permission |

## Your first 90 minutes

### 1. Verify the runtime and tests

From the repository root:

```bash
cd /home/vrondelli/projects/domainspec-core
node --version

node --test \
  cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/test/*.test.mjs

node --test \
  cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/*.test.mjs
```

Use Node 22 or newer. The packages have no third-party runtime dependencies, so
you should not need to install a repository-local dependency tree merely to run
these suites. They are libraries, not services: neither package defines a
`start` script or launches a daemon.

### 2. Trace one semantic case

Open the
[refund fixture](../../implementation/agent-reasoning-engine/fixtures/evaluator-v1/refund-eligibility.json),
then follow it through the fixture builder, `evaluateSemanticJudgment`, and the
counterfactual tests.

Retell the behavior in plain language:

- required support present -> `RecommendedUnderSnapshot`;
- required support removed -> `Deferred.Insufficient`;
- fraud hold or another grounded defeater -> `Ineligible.Defeated`;
- irrelevant agent consensus -> no change;
- positive result plus non-pass effect gate -> zero effect attempts.

### 3. Trace one routing case

Open the resolver's
[witness cases](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/test/fixtures/witness/cases.json),
then follow one request through `request.mjs`, `catalog.mjs`,
`eligibility.mjs`, and `resolve.mjs`.

Retell the behavior:

- exactly one eligible, non-dominated route -> `candidate`;
- unresolved material field or overlapping routes -> `ambiguous` plus one question;
- valid resolved intent with no eligible route -> `no-match`;
- bad shape, version, digest, owner, ID, operator, or graph -> `invalid`.

### 4. Read the current boundary last

Once the code makes sense, read the [Craft view](CRAFT.md), the
[definition posture](spec/SPEC.md#definition-posture), and the
[current state and next move](planning/WORK-PACK.md#current-state-and-next-move).
This order makes the governance language easier to understand because you have
already seen the behavior it is trying to bound.

## How to approach a first contribution

Exploration and running tests are safe. Product mutation requires an exact
authorized task boundary. At the time of this guide, no downstream engine SWU is
selected.

Before changing code:

1. Confirm whether the task targets the evaluator, the intent resolver, or a
   future ACI integration seam. They are not interchangeable.
2. Check the live ledger and work-pack for the exact selected SWU, write scope,
   gate, and done criteria. “Planned” is not “authorized.”
3. Name the claim ceiling: what may this change prove, and what must it not be
   used to claim?
4. Start with one fixture or test that changes one condition at a time.
5. Keep unknowns visible and fail closed; do not invent owners, intent values,
   catalog authority, facts, or fallback routes.
6. Run the focused test, then the complete package suite.
7. Check the exact diff and whitespace before asking for review.

Useful focused commands include:

```bash
node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/test/evaluator.test.mjs

node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/resolve.test.mjs

git diff --check -- \
  cyberAlchemy-v2/development/agent-reasoning-engine \
  cyberAlchemy-v2/implementation/agent-reasoning-engine
```

Do not hand-edit generated run receipts. A generated receipt proves the exact
inputs, code, environment, and harness captured by that run; it is not a golden
snapshot to adjust after code changes. Only materialize a new witness when the
task explicitly calls for one and owns its output path and validation.

## Invariants worth protecting

These rules are more important than any one module name:

- Advice is not authority.
- Entry permission is not effect permission.
- Schema validity is shape evidence, not semantic truth.
- A receipt records a derivation; it is not proof, approval, or promotion.
- More agents, agreement, tokens, or tests do not create authority.
- Unknown or missing material input never becomes a positive default.
- Historical replay uses retained facts and makes no fresh calls.
- Current revalidation is a new run; it never rewrites history.
- Canonical bytes and digests are behavior, not formatting trivia.
- Private CAV2 material must not leak into public Arcanum.

## Common newcomer traps

| Tempting conclusion | Correct reading |
|---|---|
| “There is a folder called reasoning engine, so the whole engine exists.” | Only bounded slices exist; the whole-engine runtime is candidate and blocked. |
| “The resolver returned one candidate, so run it.” | A candidate is advisory and carries `authority_effect: none`. |
| “The evaluator recommended it, so the action is allowed.” | An independent exact-effect gate must pass for the identical envelope. |
| “The JSON validates, so the facts are correct.” | Validation establishes shape only. Evidence admission and semantic reduction are separate. |
| “Replay passed, so the result is still valid now.” | Replay checks retained historical bytes. Current validity requires revalidation. |
| “A receipt passed, so the next task is authorized.” | Receipts and promotions have explicit claim ceilings and do not auto-select successors. |
| “The orchestrator repository is the engine.” | It is a separate control plane and future integration dependency. |
| “All document status lines describe today.” | Many artifacts preserve their lifecycle stage. Check the ledger, current work-pack, live bytes, and fresh tests together. |

One concrete documentation example: the intent-route-resolver
[README](intent-route-resolver/README.md) still says its authoring package
supplies no implementation, while its later
[work-pack](intent-route-resolver/planning/WORK-PACK.md) records a completed L0
frontier and the implementation package exists. Preserve that history; do not
silently use the earlier sentence as current runtime status.

Another example: the root [glossary](spec/GLOSSARY.md) still labels
`semantic-judgment evaluator@1` as unwitnessed, while the newer specification,
promotion receipt, implementation, and current 16-test suite support only the
more precise “promoted bounded L0 witness” posture. Some historical files also
link to an old `open-blockers--owner-decisions` heading; the current section is
[Open blockers and residue](spec/SPEC.md#open-blockers-and-residue). These are
navigation/status defects, not evidence that the broader engine is ready.

## Small glossary

- **Authority snapshot:** frozen record of who owns what, for which scope and
  time, including expiry or revocation posture.
- **Catalog:** finite, versioned, digest-bound set of rules or routes. Membership
  does not authorize the member.
- **Gate:** separate recorded decision with `pass`, `flag`, `block`, or `defer`.
- **Disposition:** the intent resolver's advisory routing result.
- **Semantic outcome:** the evaluator's typed result under captured inputs.
- **Reasoning receipt:** canonical derivation and residue record; not permission.
- **Defeater:** grounded condition that prevents a positive recommendation.
- **Historical replay:** deterministic rerun over retained immutable facts.
- **Current revalidation:** fresh evaluation against current authority,
  catalog, evidence, and time.
- **SWU:** Smallest Working Unit, the bounded unit admitted for one execution
  path. A listed SWU is not automatically selected.
- **L0:** the smallest witnessed layer here, not a synonym for complete,
  integrated, production-ready, or released.
- **ACI:** the external communication/runtime authority the future integrated
  engine is designed to remain subordinate to.

For the canonical linked vocabulary—authority, provenance, traceability, gate,
claim <= proof, intent, challenge contract, authority model, and schema—use the
[project glossary](spec/GLOSSARY.md), which points to the private CAV2 definition
owners.

## You are oriented when you can explain these five things

1. Why a semantic recommendation and an effect permission are different.
2. How one refund fixture reaches three different outcomes when one fact changes.
3. Why an unresolved routing discriminator returns ambiguity instead of a guess.
4. Which claims the two implemented packages support—and which whole-engine or
   product claims they do not.
5. Why the next code change still needs a selected, authorized boundary even
   when every current test passes.

If you can run both suites, trace one fixture in each package, and retell those
five points, you have the right mental model to join a scoped task review.
