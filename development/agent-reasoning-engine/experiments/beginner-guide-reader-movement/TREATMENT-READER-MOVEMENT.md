---
title: Agent Reasoning Engine Beginner's Guide
status: draft
audience: new private-project contributor
source_state_as_of: 2026-08-13
authority_effect: none
---

# Agent Reasoning Engine: a beginner's guide

This guide is for a teammate who can read JavaScript but has not worked on this
project before. By the end, you should be able to trace one case through each
implemented package, run both test suites, and discuss a bounded change without
mistaking advice for authority.

The shortest useful description is:

> The Agent Reasoning Engine is a private, pre-action design that turns frozen,
> traceable inputs into typed advice. Advice is never permission to act.

That final sentence is the rule that makes the rest of the project intelligible.

## Start with one refund decision

Imagine a careful claims desk reviewing a refund request.

- Before reviewing anything, the desk checks whether this particular review may
  run.
- It uses one frozen policy version and one frozen set of facts.
- It can recommend the refund, defer because evidence is missing, reject because
  a defeater applies, or escalate an owner conflict.
- It records exactly how it reached that result.
- Even a positive recommendation cannot issue a refund. A separate owner must
  authorize that exact action.

The implemented semantic evaluator demonstrates this pattern with a local refund
fixture. It does not prove that the policy facts are true, that the policy is
globally authoritative, or that a real refund may be sent.

This gives you the project's three separate decisions:

1. **Run admission:** may this bounded reasoning run start?
2. **Semantic result:** what do the frozen rules and admitted observations say?
3. **Effect permission:** may this one exact action occur?

A pass at one boundary never silently passes the next.

## Meet the two sibling slices

The project currently implements two different questions, not one integrated
pipeline:

```text
typed intent
  -> intent route resolver
  -> advisory route disposition

frozen judgment request
  -> semantic judgment evaluator
  -> typed semantic outcome
  -> independent exact-effect gate
  -> fixed in-memory effect test double
```

The **intent route resolver** asks an earlier question: “Which capability appears
to fit this typed intent?” The **semantic judgment evaluator** asks: “What does
this frozen rule set recommend under these admitted observations?”

They live together under
[`implementation/agent-reasoning-engine/`](../../implementation/agent-reasoning-engine/),
but neither package calls the other. They are siblings, not a currently
integrated end-to-end engine.

That distinction sets the current claim ceiling:

| Surface | What exists now | What does not follow |
|---|---|---|
| Whole Agent Reasoning Engine | Candidate architecture and governed design material | A general admitted runtime |
| `semantic-judgment-evaluator@1` | Private finite reducer, promoted as a bounded local witness—L0, the smallest witnessed layer here | A real effect adapter, actor runtime, or complete engine |
| `intent-route-resolver` | Private standalone L0 package returning advisory dispositions | Authority to approve, dispatch, execute, or install itself in a product host |
| Future control-plane integration | Accepted architectural direction with a blocked conformance plan | Demonstrated runtime compatibility |
| Next implementation unit | No selected Smallest Working Unit (SWU); `implementation_authorized=false` | Permission to infer or begin the next change |
| Public release or deployment | None; this is private `cyberAlchemy-v2` material | A shipped product or public Arcanum capability |

As a live sanity check on 2026-08-13, the evaluator suite passed 16 tests and the
resolver suite passed 34 tests under Node `v22.13.0`. Those results prove the
checked behavior of those bytes. They do not promote the whole engine, select
new work, or authorize an effect.

## Follow the semantic evaluator

Start with the plain-language question:

> Given one frozen catalog, one admitted observation set, and one challenge
> state, what is the finite semantic result?

The implemented `executeWitness` path keeps every permission boundary visible:

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

The evaluator always ends in one of eight outcomes:

- `InvalidInput`
- `UnauthorizedCatalog`
- `OutOfDomain`
- `Ineligible.Defeated`
- `Deferred.Insufficient`
- `EscalateOwner`
- `RecommendedUnderSnapshot`
- `Invalidated`

Only `RecommendedUnderSnapshot` may reach the exact-effect gate. Even then, the
recommendation itself does not authorize the effect.

Trace this behavior where each decision is owned:

| Need | Code landmark |
|---|---|
| See the public package surface | [`index.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/index.mjs) |
| Learn the finite vocabulary | [`src/outcomes.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/outcomes.mjs) |
| Follow input, authority, applicability, defeat, insufficiency, conflict, and recommendation | [`src/reducer.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/reducer.mjs) |
| Inspect persisted ordering and separate gates | [`src/execute.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/execute.mjs) |
| See deterministic receipt assembly | [`src/receipt.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/receipt.mjs) |
| Inspect in-memory and atomic-file storage | [`src/store.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/store.mjs) |
| Compare historical replay with a fresh run | [`src/replay.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/src/replay.mjs) |
| Read the behavioral and ordering checks | [`test/evaluator.test.mjs`](../../implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/test/evaluator.test.mjs) |
| Begin with the smallest example | [`fixtures/evaluator-v1/refund-eligibility.json`](../../implementation/agent-reasoning-engine/fixtures/evaluator-v1/refund-eligibility.json) |

Historical replay reruns retained immutable facts without fresh provider or
effect calls. Current revalidation is different: it creates a fresh evaluation
against current authority, evidence, catalog, and time.

## Follow the intent route resolver

Now ask the earlier routing question:

> Given one typed intent and one frozen, owner-declared route catalog, which
> capabilities remain eligible?

Only after that question is clear do the implementation names help:

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

A **dominance edge** is an owner-declared statement that one eligible route takes
precedence over another. The resolver does not invent that ordering.

Its four dispositions are intentionally exhaustive:

- `candidate`: exactly one eligible, non-dominated route remains;
- `ambiguous`: a material field is unresolved or routes still overlap, so the
  result includes one clarifying question;
- `no-match`: the intent is valid and resolved, but no route is eligible;
- `invalid`: the request or catalog violates its required shape or invariants.

The core uses no model confidence, embedding score, repository discovery,
network, filesystem, dispatch, or effect call. Every result carries
`authority_effect: none`.

Trace the relation through these landmarks:

| Need | Code landmark |
|---|---|
| See the package surface | [`index.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/index.mjs) |
| Understand JSON-only request admission | [`src/request.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/src/request.mjs) |
| Inspect catalog ownership, version, digest, predicates, IDs, and graph checks | [`src/catalog.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/src/catalog.mjs) |
| Follow exclusion-first eligibility and dominance reduction | [`src/eligibility.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/src/eligibility.mjs) |
| See disposition classification and the one-question ambiguity rule | [`src/resolve.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/src/resolve.mjs) |
| Inspect stable transport diagnostics | [`src/json-port.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/src/json-port.mjs) |
| See the private intent compatibility mapping | [`src/selected-local.mjs`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/src/selected-local.mjs) |
| Compare unique, unresolved, overlapping, and dominated cases | [`test/fixtures/witness/cases.json`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/test/fixtures/witness/cases.json) |
| Confirm runtime-neutral entrypoints and zero permission | [`addon-manifest.json`](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/addon-manifest.json) |

Missing values remain unresolved. Unknowns never become guessed owners, intent
fields, predicates, or fallback routes.

## Place the slices inside the candidate whole

Once both package jobs are clear, the larger design has a reason to exist:

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

Most of this chain remains design or blocked plan, not runtime. The
[specification](spec/SPEC.md) defines ownership boundaries, the
[six-view architecture](design/ARCHITECTURE.md) shows the candidate whole, and
the [decision/effect flow](design/DECISION-AND-EFFECT-FLOW.md) states the desired
ordering.

The accepted target is **ACI-subordinate**. ACI is the external
communication/runtime authority: a future integration must use ACI-owned
journal facts, acceptance identity, replay cursor, and effect intents. This
project retains semantic derivation and reasoning-receipt content. The
architecture choice is accepted; runtime compatibility is not established.

`projects/cyberalchemy-orchestrator/` is that separate control-plane project. It
is an integration dependency, not the reasoning engine implementation.

## Spend your first 90 minutes on tests and two package traces

### 1. Run the current suites

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
you should not need a repository-local install merely to run these suites. They
are libraries, not services: neither package defines a `start` script or
launches a daemon.

### 2. Change one refund fact at a time

Open the
[refund fixture](../../implementation/agent-reasoning-engine/fixtures/evaluator-v1/refund-eligibility.json),
then follow it through the fixture builder, `evaluateSemanticJudgment`, and the
counterfactual tests.

Retell the transitions:

- required support present -> `RecommendedUnderSnapshot`;
- required support removed -> `Deferred.Insufficient`;
- fraud hold or another grounded defeater -> `Ineligible.Defeated`;
- irrelevant agent consensus -> no change;
- positive result plus non-pass effect gate -> zero effect attempts.

### 3. Change one route condition at a time

Open the resolver's
[witness cases](../../implementation/agent-reasoning-engine/packages/intent-route-resolver/test/fixtures/witness/cases.json),
then follow one request through `request.mjs`, `catalog.mjs`,
`eligibility.mjs`, and `resolve.mjs`.

Retell the transitions:

- one eligible, non-dominated route -> `candidate`;
- unresolved material field or overlapping routes -> `ambiguous` plus one question;
- valid resolved intent with no eligible route -> `no-match`;
- bad shape, version, digest, owner, ID, operator, or graph -> `invalid`.

### 4. Read the mutation boundary last

After the behavior makes sense, read the [Craft view](CRAFT.md), the
[definition posture](spec/SPEC.md#definition-posture), and the
[current state and next move](planning/WORK-PACK.md#current-state-and-next-move).
The lifecycle terms now name boundaries you have already observed instead of
interrupting your first mental model.

## Read the current boundary before changing code

Exploration and test execution are safe. Product mutation requires an exact,
authorized task boundary, and none is currently selected.

The scoped [Craft ledger](.craft/ledger.yml) is the declared lifecycle
authority. [CRAFT.md](CRAFT.md) is its generated human-readable projection.
There is visible synchronization drift as of 2026-08-13:

- the ledger and Craft view still say the next move is to author the
  ACI-subordinate plan revision;
- the newer [whole-engine work-pack](planning/WORK-PACK.md#current-state-and-next-move)
  says that revision is already authored and execution remains blocked;
- the work-pack names a closeout-sync blocker that is absent from the ledger;
- the ledger does not index the completed child intent resolver, and current
  evidence does not establish whether that is intentional separation or a
  missing refresh.

Do not choose the newest sentence and proceed. Treat the disagreement as an open
governance inconsistency. Mutation stops until the lifecycle owner synchronizes
the sources and selects an exact Smallest Working Unit (SWU).

Historical documents can also preserve an earlier posture:

- The intent resolver
  [README](intent-route-resolver/README.md) says its authoring package supplies
  no implementation, while its later
  [work-pack](intent-route-resolver/planning/WORK-PACK.md) records a completed L0
  frontier and implementation bytes now exist.
- The root [glossary](spec/GLOSSARY.md) calls
  `semantic-judgment evaluator@1` unwitnessed, while the newer specification,
  promotion receipt, implementation, and current 16-test suite support only the
  narrower “promoted bounded L0 witness” posture.
- Some historical files link to an old `open-blockers--owner-decisions` heading;
  the current section is
  [Open blockers and residue](spec/SPEC.md#open-blockers-and-residue).

Preserve the history, but do not use an old status line as current runtime
truth. These are navigation or synchronization defects, not evidence that the
broader engine is ready.

## Find the source that owns your question

The private design and executable bytes are separated deliberately:

```text
cyberAlchemy-v2/
├── development/agent-reasoning-engine/       # intent, design, plans, gates
│   ├── .craft/ledger.yml                     # scoped lifecycle authority
│   ├── CRAFT.md                              # derived human view
│   ├── spec/                                 # candidate whole-engine contract
│   ├── design/                               # architecture and boundaries
│   ├── planning/                             # tasks, SWUs, waves, gates, current block
│   ├── decisions/                            # owner decisions and receipts
│   ├── intent-route-resolver/                # child define/design/plan material
│   ├── experiments/                          # bounded evidence work
│   ├── receipts/                             # historical lifecycle evidence
│   └── refresh/                              # past synchronized lifecycle changes
└── implementation/agent-reasoning-engine/    # executable private bytes
    ├── packages/
    │   ├── semantic-judgment-evaluator/
    │   └── intent-route-resolver/
    ├── fixtures/evaluator-v1/
    └── generated/runs/                       # immutable exact-run evidence
```

No single document owns every kind of truth:

| Question | Start here |
|---|---|
| What work is selected or blocked now? | Compare [`.craft/ledger.yml`](.craft/ledger.yml) with [`planning/WORK-PACK.md`](planning/WORK-PACK.md); current drift means no mutation route may be inferred |
| What should the candidate whole mean? | [`spec/SPEC.md`](spec/SPEC.md) and [`spec/GLOSSARY.md`](spec/GLOSSARY.md) |
| How should components remain separate? | [`design/ARCHITECTURE.md`](design/ARCHITECTURE.md) and [`design/COMPONENT-CONTRACTS.md`](design/COMPONENT-CONTRACTS.md) |
| What do the packages actually do? | Implementation source plus current tests |
| What did one historical run prove? | The exact receipt and generated run named by that claim |
| What does a passing receipt not prove? | Read its claim ceiling and residue; never infer promotion, compatibility, or permission |

## Approach a first contribution safely

Before changing code:

1. Confirm whether the task targets the evaluator, resolver, or a future ACI
   integration seam. They are not interchangeable.
2. Find the exact selected SWU, write scope, gate, and done criteria in
   synchronized lifecycle sources. “Planned” is not “authorized.”
3. State the claim ceiling: what may the change prove, and what must it not be
   used to claim?
4. Begin with one fixture or test that changes one condition.
5. Keep unknowns visible and fail closed.
6. Run the focused test, then the complete package suite.
7. Inspect the exact diff and whitespace before review.

Useful focused commands are:

```bash
node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/semantic-judgment-evaluator/test/evaluator.test.mjs

node --test cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/intent-route-resolver/test/resolve.test.mjs

git diff --check -- \
  cyberAlchemy-v2/development/agent-reasoning-engine \
  cyberAlchemy-v2/implementation/agent-reasoning-engine
```

Do not hand-edit generated run receipts. A receipt binds the inputs, code,
environment, and harness captured by that run; it is not a golden snapshot to
adjust after code changes. Materialize a new witness only when an authorized
task owns its output path and validation.

## Catch these boundary mistakes

| Tempting conclusion | Boundary that corrects it |
|---|---|
| “The folder exists, so the whole engine exists.” | Only two bounded slices are implemented; the whole-engine runtime is candidate and blocked. |
| “The resolver returned one candidate, so run it.” | A disposition is advisory and carries `authority_effect: none`. |
| “The evaluator recommended it, so the action is allowed.” | An independent exact-effect gate must pass for the identical envelope. |
| “The JSON validates, so the facts are correct.” | Schema validity is shape evidence, not semantic truth. |
| “Replay passed, so the result is valid now.” | Replay checks retained history; current validity requires a fresh revalidation. |
| “A receipt passed, so the next task is authorized.” | Receipts record derivations; they do not approve, promote, or select successors. |
| “More agents, agreement, tokens, or tests create confidence and therefore authority.” | Evidence can strengthen a claim only inside its declared ceiling; authority must come from its owner. |
| “A missing value can use the likely default.” | Unknown material input stays visible and fails closed. |
| “A digest or canonical byte difference is formatting trivia.” | Exact bytes and digests are part of the behavior and evidence binding. |
| “The orchestrator repository is the engine.” | It is a separate control plane and future integration dependency. |
| “Private CAV2 language can be copied into public Arcanum.” | The public/private boundary is an ownership boundary, not a documentation preference. |

## Keep a small vocabulary nearby

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
- **Current revalidation:** fresh evaluation against current authority, catalog,
  evidence, and time.
- **SWU:** Smallest Working Unit, the bounded unit admitted for one execution
  path. A listed SWU is not automatically selected.
- **L0:** the smallest witnessed layer here, not a synonym for complete,
  integrated, production-ready, or released.
- **ACI:** the external communication/runtime authority the future integrated
  engine is designed to remain subordinate to.

For canonical linked vocabulary—authority, provenance, traceability, gate,
claim <= proof, intent, challenge contract, authority model, and schema—use the
[project glossary](spec/GLOSSARY.md), which points to the private CAV2 definition
owners.

## You are oriented when you can do five things

1. Explain why a semantic recommendation and effect permission are different.
2. Change one refund fact and predict the resulting evaluator outcome.
3. Explain why an unresolved routing discriminator returns ambiguity instead of
   a guess.
4. Name what each implemented package proves and which whole-engine or product
   claims remain out of bounds.
5. Find the exact selected boundary before proposing a code change, even when
   every current test passes.

When you can run both suites, trace one fixture in each sibling package, and
retell those five points, the opening caution no longer looks like ceremony:
you can see exactly which decision each boundary protects—and why advice is
still never permission to act.
