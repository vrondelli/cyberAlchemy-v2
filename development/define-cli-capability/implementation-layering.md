---
title: Define CLI Capability Implementation Layering
status: planning-candidate
updatedAt: 2026-09-02
owner: CyberAlchemy v2 Define runtime owner
scope: capability
authority_effect: none
---

# Define CLI Capability Implementation Layering

This document defines a progressive implementation model for a first-class
Define CLI capability. It is a planning candidate. It does not adopt a
capability, amend the closed Define package, authorize implementation, accept a
Definition Pack, promote a definition, or select a deployment.

## Context

- Target: a reusable terminal capability for operating one bounded Define job.
- Current state: product meaning and a DomainSpec system model exist; the CLI,
  shared session runtime, and live CLI/chat continuity are not implemented.
- Primary users: a human participant and an agent acting through an explicit
  command contract.
- Primary constraint: the CLI must expose Define without becoming the owner of
  product meaning, session truth, accepted definitions, or downstream effects.
- Source references:
  - `cyberAlchemy-v2/define/docs/INTERACTION.md`
  - `cyberAlchemy-v2/define/docs/DEFINE.md`
  - `cyberAlchemy-v2/define/docs/DEFINITION-PACK.md`
  - `cyberAlchemy-v2/define/capabilities/define-shared-meaning.product-capability.json`
  - `cyberAlchemy-v2/define/capabilities/obligations/define-shared-meaning.obligations.json`
  - `cyberAlchemy-v2/define/system-ontology/`
  - `projects/domainspec-v2/development/invoke-define-cli-modeling-experiment/ontology/`
  - `cyberAlchemy-v2/implementation/agent-reasoning-engine/packages/context-basis-runtime/`

## Capability Classification

The CLI is first-class, but it is not a second Product Capability.

| Object | Kind | Owns | Does not own |
| --- | --- | --- | --- |
| `CA2-CAP-DEFINE-SHARED-MEANING` | Product Capability | The useful Define outcome and Definition Pack expectations | Terminal mechanics |
| `CA2-AGENT-CAP-DEFINE-CLI` | Candidate Agent Capability | Reusable terminal work contract for operating a Define job | Product meaning, accepted definitions, session storage, or authority |
| `define-cli` package | Capability Realization | Parsing, rendering, command dispatch, exit codes, and protocol adaptation | The Agent Capability contract or Product Capability |
| Define Session Runtime | System realization | Commands, queries, question lifecycle, revision checks, and Definition Pack projection | Interface-specific state |
| ARE context lifecycle | Context provider | Route, definition closure, ontology lock, frozen Context Envelope, and refresh evidence | Define dispositions or session authority |

`CA2-AGENT-CAP-DEFINE-CLI` is a candidate identity for planning. Its final ID
and record shape must conform to `DEF-ARC-CAPABILITY` and be registered as an
Agent Capability reference; this plan does not invent a generic Capability type
or modify `CAV2-D67`.

## Target Runtime Boundary

```text
human or agent
      |
      v
Define CLI adapter
  parse / render / exit codes
      |
      v
versioned Define command-query port
      |
      +--> ARE context port
      |      route -> definitions -> ontology lock -> Context Envelope
      |
      +--> Define application service
             question lifecycle -> explicit disposition -> pack projection
                        |
                        v
                 session repository
```

The CLI and future chat adapter call the same command-query port. They never
maintain separate semantic session state. ARE is called as a bounded library or
port; the Codex app-server gateway is not a Define session store.

## Proposed Command Contract

### Layer 0 command

```text
define run --goal <text> --intent <text> --context <text> \
  --consumer <id> [--input <json>] [--output <path>] [--json]
```

`define run` performs one in-process job: construct context, show one question
at a time, accept an explicit answer/defer/refuse/correct action, validate the
candidate structure, and emit a candidate Definition Pack. Silence and EOF are
never answers.

### Durable commands introduced in Layer 1

```text
define start    --goal ... --intent ... --context ... --consumer ...
define next     --session <id>
define answer   --session <id> --question <id> --expected-revision <n> --text <text>
define defer    --session <id> --question <id> --expected-revision <n> --reason <text>
define correct  --session <id> --expected-revision <n> --context <text>
define inspect  --session <id> [--json]
define validate --session <id>
define export   --session <id> --output <path>
define resume   --session <id>
```

All mutating commands carry the expected revision. Human output goes to stdout,
machine records use canonical JSON, diagnostics go to stderr, and full context
or answers are never copied into telemetry.

Proposed stable exit classes are: success, invalid request, more context
required, revision conflict, authority block, invalid Definition Pack, and
runtime unavailable. Exact numeric codes are frozen with the v1 CLI contract.

## Layering Method

- Minimum proof: one useful end-to-end Define job through a real terminal.
- Decision-first: each layer unlocks one distinct implementation decision.
- Progressive hardening: persistence, parity, and packaging follow only after
  the preceding behavior is demonstrated.
- Non-regression: later layers preserve explicit context provenance, visible
  gaps, no inferred answers, and authority effect none.
- Evidence-gated promotion: no layer advances from schema validity alone.

## Layer Decision Table

| Layer | Decision question | Minimum working unit | Operator outcome | Risk reduced | Promotion decision |
| --- | --- | --- | --- | --- | --- |
| L0 | After this layer, we know whether a terminal user can complete one bounded Define job and receive a structurally valid candidate pack. | One-process `define run`, in-memory session, ARE Context Envelope, one-question loop, pack projection. | A real candidate Definition Pack or a visible unresolved gap. | Core interaction and integration uncertainty. | Continue only if golden and hostile runs preserve meaning and authority limits. |
| L1 | After this layer, we know whether CLI work can stop, resume, and reject stale writes without losing confirmed state. | Versioned local session repository and durable command/query set. | Resumable sessions with exact revision conflicts and recovery. | Persistence, retry, and concurrent-write risk. | Continue only if restart/replay and failure-injection tests pass. |
| L2 | After this layer, we know whether CLI and chat can operate one shared session without semantic divergence. | Shared transport, chat adapter, parity matrix, access checks, bounded semantic sufficiency adapter. | The same question, answers, gaps, and revisions appear in both interfaces. | Interface divergence and authority-confusion risk. | Continue only if both directions satisfy obligation `CAP-OBL-DEFINE-011-CLI-CHAT-CONTINUITY`. |
| L3 | After this layer, we know whether the capability is packageable for a bounded pilot. | Stable installer/bin, compatibility policy, observability, migration adapter, pilot evidence. | Repeatable installation and operation with documented recovery. | Packaging, upgrade, and operator-support risk. | Pilot, narrow, or stop based on measured evidence. |

## Capability Or Scope Progression

| Area | L0 | L1 | L2 | L3 |
| --- | --- | --- | --- | --- |
| Capability record | Candidate Agent Capability contract and realization map | Versioned contract compatibility | CLI/chat shared-contract evidence | Pilot-supported compatibility policy |
| Context | Frozen ARE Context Envelope per run | Refresh and successor envelope per session revision | Same selected context dependencies across interfaces | Upgrade/drift support |
| Session state | In-memory, one process | Durable local repository with compare-and-commit | Shared CLI/chat repository | Migration, backup, and bounded retention |
| Interaction | One-question terminal loop | Full command/query surface | CLI/chat parity | Usability and accessibility pilot |
| Evidence | Golden and hostile fixtures | Replay and failure injection | Bidirectional continuity experiment | Installation and pilot evidence |

## Layer Definitions

### L0 — Minimum Working Unit

Included:

- A source-owned `CA2-AGENT-CAP-DEFINE-CLI` candidate contract with input,
  output, authority, failure, and challenge boundaries.
- A `define-cli` implementation package with a dependency-free or narrowly
  dependency-bound parser and deterministic human/JSON renderers.
- A versioned internal `DefineCommandRequest/v1` and
  `DefineCommandResult/v1` boundary.
- Inline use of ARE context lifecycle to obtain related definitions,
  selector-locked ontology meaning, provenance, gaps, and a frozen Context
  Envelope before the first Define question.
- One in-memory Define session containing explicit goal, intent, context,
  consumer, current question, answers or non-answers, dispositions, gaps, and
  authority ceiling.
- One explicit action at a time: answer, defer, refuse, correct context, or
  stop. EOF and silence leave the question open.
- Candidate Definition Pack projection and structural validation.

Deferred:

- durable sessions, `resume`, multi-process concurrency, chat, IPC selection,
  production semantic-domain catalogs, definition promotion, construction
  handoff, public Invoke migration, installation, and deployment.

Exit evidence:

- Exact command help and JSON schemas.
- Golden run from bounded goal/context to candidate pack.
- Hostile cases: missing context, EOF, malformed input, duplicate disposition,
  inferred answer, authority smuggling, oversized mandatory context, and pack
  write failure.
- Deterministic output under input/source permutation.
- Proof that the CLI performs no effect after a blocked or incomplete result.

Promotion:

- Continue when all hostile cases fail closed and the golden run preserves the
  Product Capability input/output obligations.
- Pivot when ARE integration dominates the interaction or the one-question
  loop cannot be kept transport-neutral.
- Stop when the CLI must own accepted meaning or hidden session state to work.

### L1 — Durable Local Session

Add:

- `SessionRepositoryInterface` implementation with canonical versioned records.
- Atomic compare-and-commit using session ID, expected revision, state digest,
  idempotency key, and outcome event.
- `start`, `next`, `answer`, `defer`, `correct`, `inspect`, `validate`, `export`,
  and `resume` commands.
- Immutable predecessor/successor Context Envelope identities when selected
  dependencies or explicit context change.
- Recovery that preserves the last confirmed state and exposes rejected writes.

Exit evidence:

- Restart/resume replay, duplicate-command idempotency, stale revision conflict,
  interrupted write, schema migration refusal, and historical pack immutability.

Prior guarantees preserved: one-question flow, explicit non-answer states,
context provenance, deterministic pack projection, and authority effect none.

### L2 — Shared CLI And Chat Runtime

Add:

- One versioned `SessionTransportInterface` shared by CLI and chat adapters.
- Bidirectional CLI-to-chat and chat-to-CLI parity tests over real runtime bytes.
- Exact actor/session/question/authority checks for every mutation.
- Define-specific context-sufficiency adapter to ARE semantic evaluation only
  for explicitly configured domains; default remains structural/no-op.
- Privacy-safe event identities, latency, failure class, and replay evidence.

Exit evidence:

- The existing synthetic continuity fixture is replaced or supplemented by a
  live experiment against exact session repository and adapter bytes.
- Questions, deferrals, corrections, conflicts, evidence gaps, owners, reasons,
  next actions, refresh routes, and handoff references survive both directions.

Prior guarantees preserved: the interfaces project one state owner, semantic
outcomes are advisory, and no recommendation grants an effect.

### L3 — Packaging And Bounded Pilot

Add:

- Stable `define` bin packaging, installation/uninstallation, shell completion,
  version negotiation, health command, and compatibility matrix.
- Bounded retention/export configuration and operator recovery documentation.
- An explicit adapter decision for public Invoke Define; no implicit migration
  or public/private prose crossing.
- Pilot measures for completion, repeated questions, recovery success, context
  requests, and user corrections without recording private answer content.

Exit evidence:

- Clean-host installation, upgrade/downgrade refusal, recovery rehearsal,
  compatibility tests, and a bounded pilot report.

Prior guarantees preserved: Product Capability identity, source ownership,
session truth separation, context provenance, explicit gaps, and zero implicit
authority.

## D65 Construction Sequence For Implementation

Implementation must preserve this dependency order:

1. Reuse canonical `CAV2-D67` and `DEF-ARC-CAPABILITY`; add no generic
   Capability definition.
2. Preserve `CA2-CAP-DEFINE-SHARED-MEANING` as the product outcome owner.
3. Bind the CLI Agent Capability to existing Define business ontology and the
   exact CLI/chat continuity obligation.
4. Revise the capability-local system ontology only for the selected CLI
   command, renderer, application-service, context-port, and repository nodes.
5. Author DomainSpec v2 sources for those selected nodes and relationships.
6. Deterministically compile the graph and system ontology.
7. Create one exact implementation-binding candidate for the `define-cli`
   package.
8. Produce independent conformance evidence against every CLI and Product
   Capability obligation.

The Agent Capability record, realization binding, implementation binding, and
conformance assessment remain separate artifacts and decisions.

## Implementation Wave Backbone

| Wave | Layer | Key artifacts | Verification |
| --- | --- | --- | --- |
| W0 | L0 | Agent Capability contract, command schemas, DomainSpec delta, `define-cli` package, fixtures | Unit tests, golden/hostile CLI runs, deterministic replay |
| W1 | L1 | Session repository, durable commands, revision/idempotency records | Restart, concurrency, corruption, and failure-injection tests |
| W2 | L2 | Shared transport, chat adapter, semantic adapter, parity evidence | Live two-direction continuity and authority tests |
| W3 | L3 | Installer, compatibility policy, migration decision, pilot package | Clean-host canary, recovery rehearsal, pilot evidence |

## Non-Regression Guardrails

- The CLI is an adapter and realization; it never becomes the source of Define
  product meaning or accepted definitions.
- Every run begins from explicit request context plus an ARE-produced frozen
  Context Envelope; definitions or ontology text are not admitted facts.
- Silence, omission, model output, and observed behavior are never answers.
- A session-visible actor is not necessarily an authority-bearing owner.
- Missing, stale, ambiguous, or conflicting mandatory context remains visible
  and blocks only the dependent use.
- CLI and chat never keep independent semantic session copies.
- Validation, a candidate pack, or a recommendation cannot authorize Design,
  implementation, promotion, publication, or deployment.
- Historical sessions, Context Envelopes, and exported packs are immutable.

## Open Decisions Before L0 Implementation

1. Final source-owned Agent Capability identity and exact
   `DEF-ARC-CAPABILITY`-compatible record location.
2. The minimum required-concept manifest for the first bounded Define job.
3. Whether L0 accepts only flags/JSON or also a TTY prompt; both must drive the
   same command record.
4. Exact canonical JSON and CLI exit-code schemas.
5. Exact implementation package root; recommended candidate:
   `cyberAlchemy-v2/implementation/define-cli/`.

## Recommended Next Step

Implement L0 only. First freeze the Agent Capability and command/result
contracts, then build one `define run` vertical using ARE Context Envelope input
and an in-memory Define session. Do not begin durable storage or chat parity
until the real CLI vertical passes its hostile matrix.

## Claim Ceiling

This artifact makes the CLI capability boundary and implementation sequence
explicit. It does not create or adopt the capability, alter the canonical
Capability Ontology, amend the Define package, authorize implementation,
establish conformance, close CLI/chat continuity, promote definitions, migrate
Invoke, publish, release, deploy, or grant an external effect.
