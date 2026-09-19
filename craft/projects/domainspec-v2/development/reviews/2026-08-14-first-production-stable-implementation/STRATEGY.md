# DomainSpec v2 first production-stable implementation review

Status: confirmation-ready review strategy; no dispatch registration or product mutation

## Direct answer

There is enough working prototype substance to justify a production-stability
review, but not enough evidence to call the current implementations production
stable. The strongest current proof is candidate-local: WP-RMT-001 reports 47
passing authority-none SWUs, and the architecture-conformance factory reports
locked, replayed, verified, same-host reproducibility. Both sources explicitly
deny production, promotion, publication, release, deployment, and cross-host
claims.

The review will therefore decide three things before any hardening work starts:

1. which contracts and bytes should be kept as the stable core;
2. which must be hardened, replaced, deferred, or killed; and
3. what the smallest coherent first stable implementation slice actually is.

It will not edit those bytes. Accepted findings become the source for a later,
separately authorized Invoke or Task Session implementation package.

## Approval state machine

```text
PROPOSED
   |
   | schema 0.8.0 validation PASS
   v
SHEET_READY
   |
   | capability-bound Dispatch Spec PASS
   v
ROUTE_READY
   |
   | independent tension A PASS + tension B PASS
   v
WAITING_FOR_CONFIRMATION   <--- current state
   |
   | user replies exactly: confirmed
   v
REGISTERED
   |
   | freeze live tracked + modified + untracked target bytes
   v
CORPUS_FROZEN
   |
   | three whole-corpus attackers run in parallel and join
   v
ATTACKS_JOINED
   |
   | writer synthesizes attacks.md + candidate findings.md
   v
FINDINGS_CANDIDATE
   |
   | two verifiers attack every finding; bounded zig-zag if needed
   v
FINDINGS_VERIFIED
   |
   | sole coverage auditor ACCEPTS or requests one bounded revision
   v
REVIEW_ACCEPTED
   |
   | all seven agents joined and closed; append close row
   v
CLOSED -> later implementation route requires separate authorization
```

Any target-byte drift after `CORPUS_FROZEN`, missing authority needed to
interpret a contract, unsafe validation requirement, unresolved verifier
disagreement beyond the confirmed loop cap, or claim beyond the evidence moves
the run to `BLOCKED`, not to an optimistic completion state.

## What confirmation authorizes

Replying exactly `confirmed` authorizes:

- one append-only registration row for this exact review strategy;
- creation of a digest-bound manifest of the live in-scope corpus;
- seven bounded review agents in four dependency waves;
- safe read-only checks using existing dependencies and isolated temporary
  caches or outputs;
- writes only to review evidence under this folder; and
- one append-only close row after every agent is joined and the audit closes.

It does not authorize:

- edits to DomainSpec definitions, ontology, profiles, schemas, code, tests,
  fixtures, Craft state, or existing receipts;
- implementation of any recommended fix;
- mutation of public Arcanum or movement of private prose into it;
- package installation, network calls, credentials, external services, Git
  commits or pushes;
- semantic admission or promotion; or
- production, publication, release, or deployment.

## Review lanes

| Wave | Agent | Lens | Required result |
| --- | --- | --- | --- |
| Attackers, parallel | `van Lamsweerde, Axel` | Contract, schema, ontology, profile, projection, and state-model coherence | Full-corpus cited attack ledger and discriminating acceptance checks |
| Attackers, parallel | `Hewitt, Carl` | Runtime, factory, failures, concurrency, replay, and TypeScript/Python/Rust mechanics | Safe command receipts, hostile counterexamples, and blocked checks |
| Attackers, parallel | `Ashby, W. Ross` | Compatibility, migration, ownership, operability, maintenance, and long-horizon stability | Applicable controls, owner-gated controls, exclusions, and reopen rules |
| Synthesis | `Shannon, Claude` | Preserve disagreements and produce review artifacts | `attacks.md`, candidate `findings.md`, component dispositions, first stable slice |
| Verifiers, parallel | `Popper, Karl` | Executable counterexample and false-green attack | `KEEP`, `FIX`, or `DROP` for every finding |
| Verifiers, parallel | `Meadows, Donella H.` | Scope, authority, evolution, and systemic-risk attack | `KEEP`, `FIX`, or `DROP` plus corrected boundaries and residue |
| Final audit | `Brandenburg, Martin` | Coverage, evidence binding, and claim ceiling | `ACCEPT` or one bounded writer revision |

The attacker fanout varies methodology. The verifier fanout varies attack
vector. Every unordered pair has a specific, bidirectional predicted
disagreement in the exact sheet, and both tension reviewers found the groups
non-cloning and globally coherent.

## Target boundary

Every attacker receives the same full corpus; the lenses differ, not the target
bytes. The six source families are:

1. canonical authority, definitions, relationships, profiles, and schemas;
2. ontology, language profiles, projections, validators, and form decisions;
3. realization kernel, conformance families, TypeScript/Python/Rust targets,
   compatibility, acceptance, factory, and realization compiler;
4. remaining-meta-type candidates, admissions, terminal receipt, and factory
   reproduction evidence;
5. W3 effects/connections, W4 state-machine/workflow, and bounded system-
   integration evidence; and
6. accepted production and status comparators.

Generated caches, build directories, historical preimages, stale staged
copies, UI HTML, command logs, and public or out-of-repository targets are
excluded by default. A frozen `corpus-manifest.json` will enumerate and hash
the exact selected files immediately after registration; no attacker starts
until that gate passes.

## Mandatory review questions

- Do canonical definitions, schemas, ontology, profiles, decisions,
  realizations, language bindings, factory providers, fixtures, evaluators,
  and receipts describe the same semantics?
- Which contracts are stable APIs or persisted formats, and how do versions,
  migrations, defaults, compatibility, and deprecation work?
- Are TypeScript, Python, and Rust behaviorally equivalent under positive,
  hostile, and future-version inputs without pretending their native bytes
  must match?
- Are tests discriminating, or do implementations and expectations share the
  same bug?
- Does the factory fail closed under stale locks, partial writes, tampering,
  collisions, replay, process failure, and dirty input?
- Does W3's atomic record-plus-outbox contract compose with W4's ordered
  `persist` then `publish` plus compensation, or do they encode incompatible
  failure semantics?
- What clean-build, cross-host, dependency, security, recovery, observability,
  performance, resource, CI, support, and ownership evidence is actually
  required for the selected stable slice?
- Which bytes receive `KEEP`, `HARDEN`, `REPLACE`, `DEFER`, or `KILL`?

## Expected findings

The accepted review must contain:

- a direct current-state answer;
- exact source-family and implementation coverage;
- a component maturity and production-stability matrix;
- cited `CRITICAL`, `MAJOR`, and `MINOR` change requests with one-line fixes and
  discriminating acceptance commands;
- an explicit W3/W4 semantic adjudication;
- compatibility, migration, owner, and residual-risk consequences; and
- one smallest coherent stable slice with dependency order, owner decisions,
  acceptance surface, and explicit exclusions.

Review `ACCEPT` means the findings are sufficiently covered and evidence-bound.
It does not accept implementation bytes or establish production readiness.

## Inventory and blind spots

The root Inventory passed lookup readiness at
`2ac0e3538aa1882e2d11fb41fb8a6dfeec945f10cf15c30ea0048de88f8c74b5`,
but source coverage is partial and DomainSpec v2 has no consumer-local machine
index. It supplied prior production, validation, language-enforcement,
implementation-structure, and system-integration boundaries. The exact current
factory, WP-RMT-001, ontology-v2, W3, and W4 bytes still require direct review.

Current known blind spots include the dirty live target, an unbound or
unverified G0 release contract, same-host-only factory evidence, schema/API
evolution, cross-language semantic parity, clean-checkout and CI evidence,
dependency and security posture, crash recovery, observability, performance
and resource bounds, operator support, and the unresolved W3/W4 failure model.

## Gate state

- Sheet schema: `0.8.0` — `PASS`
- Sheet SHA-256: `35eeded757ac503124ebd3af5b03fa013458b5443a442737e92855563e4ce1e1`
- Material-strategy SHA-256: `80dde58194879e32f0dfe7a7e7c285842e471f5f598613078a92ca922ef7db31`
- Dispatch Spec route: `PASS`
- Independent tension gate: `PASS/PASS`, no apontamentos
- Human confirmation: required, not yet granted
- Registration: not run
- Ledger mutation: none
- Actual review agents launched: `0 / 7`

## Next human action

Reply exactly `confirmed` to authorize registration and execution of this
frozen review strategy. Any other response is discussion or a revision request,
not approval.
