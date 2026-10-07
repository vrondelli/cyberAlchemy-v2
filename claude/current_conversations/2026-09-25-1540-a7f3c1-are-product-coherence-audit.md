---
node_type: agent-dialogue
title: ARE product coherence audit
date: 2026-09-25
status: awaiting-human-gate
route: CA2-ROUTE-RESEARCH
authority_effect: none
---

# ARE product coherence audit

## Scope

Central question: What is still missing before ARE is a structured and coherent
product, treating Candidate 020 as historical evidence rather than the target of
another pass/fail exercise?

Priority order selected by the owner:

1. Runtime, security, and operations: durability, portability, failure recovery,
   secrets, resource limits, diagnostics, and deployment readiness.
2. Architecture and governance: policy ownership, context packaging, authority
   boundaries, goals, open decisions, and unfinished candidate systems.

Assumptions:

- The hosted DSH iframe and ARE website integration are no longer in scope.
- This is a read-only research audit. It does not repair, promote, freeze,
  publish, deploy, or activate ARE.
- Candidate 020 remains immutable historical evidence. Successor work needs a
  newly selected product boundary and identity.
- The target product form has not yet been selected among developer source
  closure, installable single-user CLI/daemon, and operated service.

ARE route receipt digest:
`668a1a03083c8d029263d23142682d5a5cdb066b2839ed88017f8b0af68d1c62`.

## Agent report: runtime, security, and operations

### Key Findings

1. **High — The required DSH component is not yet a portable/self-contained
   product component.** `product.json` declares DSH required and exposes it as an
   entrypoint (`product.json:123`, `product.json:171`), but DSH is a nested npm
   dependency (`packages/dsh-gateway-backend-adapter/package.json:15`). The
   product closure excludes all `node_modules` (`product.json:31`), and the
   materializer only copies closure files; it performs no dependency
   installation (`src/distribution.mjs:16`). The distribution test proves only
   doctor and routing, never DSH startup (`test/distribution.test.mjs:18`). A
   live closure inspection confirmed that the adapter package and lockfile are
   present while installed `@deepseek-ai/dsh` bytes are absent. A delivered
   standalone closure therefore cannot exercise a required component without a
   separate nested `npm ci`. Resolution choices are an aggregate workspace and
   install contract, a vendored artifact, optional-component classification, or
   an installer that verifies the lock and runtime.

2. **High — The DSH no-effects boundary is syntactic and denylist-based, not a
   closed capability boundary.** The provider-overlay validator uses a regular
   expression over only lines shaped exactly like `- id: ...`
   (`packages/dsh-gateway-backend-adapter/src/dsh-runner.mjs:14`); it does not
   parse YAML, reject aliases or alternate YAML forms, or attest the effective
   merged configuration. The final patch disables a known list of current tools
   (`config/read-only.patch.yml:1`), so a future DSH plugin or tool addition is
   allowed unless separately discovered and denied. The canary verifies zero
   advertised tools for one exact path, not every accepted configuration.
   `effects:false` requires schema-aware overlay validation and effective
   capability attestation at startup.

3. **High — DSH durability is unreclaimable and can permanently exhaust its own
   thread limit.** Restored session files are loaded into one in-memory map
   (`server.mjs:73`); `thread/start` rejects once that map reaches `maxThreads`
   (`server.mjs:148`), but the protocol has no thread close, delete, or expiry
   operation. The default limit of 32 is therefore a lifetime creation quota,
   not a concurrency limit. Persistence is silently disabled when neither
   `session_store_root` nor `DSH_HOME` is supplied (`server.mjs:60`), while the
   gateway CLI makes `--dsh-home` optional. A single user/assistant pair larger
   than `maxHistoryBytes` is not trimmed because trimming stops at two records;
   the oversized file is then silently skipped at restart (`server.mjs:100`).
   Mode 0600, atomic rename, and prompt/output/active-turn bounds are useful but
   do not yet form a durable lifecycle.

4. **High — The gateway session store is physically unbounded and becomes
   progressively more expensive.** Every append replays the complete prior
   history (`gateway-session-store.mjs:62`), creating cumulative quadratic work.
   The backing file only appends and fsyncs (`gateway-session-store.mjs:105`);
   acknowledgements and expiry remove reconstructed in-memory state but never
   compact historical payload bytes. This conflicts with the manual's bounded
   local session-store wording (`docs/PRIVACY-AND-RETENTION.md:15`). The product
   needs a hash-preserving snapshot/compaction protocol, total disk quota,
   startup budget, archive/erasure semantics, and crash-safe compaction tests.

5. **Medium-High — Failure recovery, resource enforcement, and diagnostics do
   not form an unattended operational contract.** Lifecycle checks do not run
   while a client is attached (`gateway.mjs:195`), so a long-running attached
   session can exceed the advertised reasoning-log bound. Hard process death
   leaves exclusive writer locks, and the reasoning-state package deliberately
   has no stale-lock adjudication (`reasoning-state-runtime/README.md:116`). The
   operator reconciliation direction has no executable runbook. Backend stderr
   is forwarded verbatim (`are-codex-gateway.mjs:111`), and RPC failures embed
   captured stdout/stderr in exception details (`rpc-client.mjs:26`). The common
   backend path lacks redaction, structured failure classification,
   health/readiness probes, and exportable metrics.

### Gaps or Inconsistencies

- Product metadata calls DSH required, but the main README, configuration,
  deployment, privacy, threat, compatibility, migration, and source-rights
  surfaces do not structurally include it.
- Runtime/release documentation names incompatible current baselines:
  `product.json` says `0.10.0-rc.1`; deployment applies to Candidate 018;
  compatibility names Codex `0.153.0-alpha.5`; the repository profile binds
  `0.155.0-alpha.16.3`.
- Configuration omits `--backend-agent dsh` and DSH limits, storage, and
  environment settings exposed by the CLI.
- Product runtime is exact Node `26.8.1`, while many components declare
  `>=22`; development compatibility, qualification, and supported installation
  are not distinguished.
- Direct adapter recovery and non-restarting gateway composition have tests;
  composed gateway crash plus backend restart plus durable-thread recovery does
  not.
- Missing resource controls include process RSS/CPU/file descriptors, total
  state-directory quota, queue limits, provider budgets, dependency-download
  policy, and sustained-load baselines.
- No service manager/container, health/readiness, telemetry export, backup
  destination, secret backend, filesystem owner, or deployed resource profile
  is selected. This is missing deployment evidence, not a falsely implemented
  control.
- There is no assigned security, operations, or reliability owner. The SLO
  document correctly says there is no operated service or numerical SLO.

### Local Tensions

- Append-only auditability versus bounded retention and deletion.
- Fail-closed recovery versus unattended operation.
- Required backend versus optional install, credential, storage, and retention
  setup.
- Effect-free claims versus an evolvable upstream dependency protected by a
  denylist.
- Useful durable context versus privacy and physical erasure.
- Minimal child environment versus provider portability and useful diagnostics.
- Single-user local implementation versus service-style deployment language.

### Questions for Synthesis

1. Is DSH required, or optional/experimental until installation, capability
   attestation, durability, rights, and upgrade policy close?
2. Is the finish target a developer source closure, installable single-user
   CLI/daemon, or operated service?
3. Which record is authoritative after restart: gateway events, Reasoning State,
   DSH thread files, or a coordinated checkpoint?
4. What retention model applies to gateway payloads and DSH transcripts?
5. Who may reconcile stale locks and unknown outcomes, and with what evidence?
6. Is the DSH invariant zero effective tools, or only known stock tools disabled?
7. Is the supported runtime exact Node 26.8.1 on Linux/WSL or Node >=22?
8. Must all backend diagnostics pass through structured redaction?
9. What disk, memory, CPU, provider-cost, and startup-replay budgets apply?
10. Should one successor baseline be selected before further capability work?

## Agent report: architecture and governance

### Key Findings

1. **Critical — Routing conflates effect requested with route intended.** Any
   matching effect class makes a route eligible, and structured-effect candidates
   survive even when an explicit objective exists (`router.mjs:186`,
   `router.mjs:208`). `local-read` is shared by Locate, Recent, Understand,
   Research, Ontology, and other routes. An explicit research objective plus
   `requested_effects:["local-read"]` produced a seven-route gate during this
   audit. Route affinity, permitted effects, and requested operational posture
   need distinct fields.

2. **High — Repository policy has no single authoring owner.** `routes.json`
   authors lifecycle, authorization, ceilings, blockers, match text, and
   operational metadata, while `cyberalchemy-v1.json` separately authors
   objective kinds, effect classes, owner gates, and signals. The build step
   refreshes hashes; it does not derive one representation from the other.
   Loader validation proves ID coverage, not semantic agreement. Select one
   canonical structured policy source and generate runtime projections from it.

3. **High — CLI and gateway do not consume the same configuration product.**
   The CLI defaults to an immutable repository policy bundle; the gateway loads
   a repository profile and refreshes live repository files. The profile carries
   static digest-looking source fields and a static `source_epoch`, while the CLI
   derives an epoch from the current snapshot. Select one compiled context and
   policy bundle contract, or define versioned live-development and compiled
   modes with identical snapshot/epoch semantics.

4. **High — Authority constraints are prose, not enforced policy.** Route
   `write_ceiling` and `blockers` are strings. Consequence evaluation recognizes
   only a ceiling beginning with `none`; it returns blockers as metadata without
   interpreting them. Every lifecycle other than `blocked` is considered
   available, so candidate Implement and Governance routes remain selectable
   despite runtime blockers. Machine-readable allowed/blocked effects,
   prerequisite IDs, authorization evidence, and blocker applicability are
   required for governed enforcement.

5. **High — Product, Project, Goal, and implementation lifecycles do not close.**
   The implementation is a `0.10.0-rc.1` stability candidate with evolution
   required. The owning Project remains `proposed` with empty evidence and
   construction-binding indexes; the multi-cycle Goal remains draft/not-proven
   with stale P2-era current condition. Read-only Goals validation returned
   `BLOCK` with 48 errors, including evidence references rejected by the
   validator. The schema permits unconstrained goal `evidence_refs`, while the
   validator requires evidence objects linked through the Project index. The
   model and validator must agree before owner decisions can advance reliably.

### Gaps or Inconsistencies

- Architecture says 17 required components; `product.json` contains 19.
- All five evolution cycle definitions remain candidate, unadmitted, disabled,
  and non-runnable under production defaults. Evolution must either be optional
  or receive an explicit admission and enablement decision.
- `CA2-ROUTE-SESSION` says Context runtime is unimplemented, while product docs
  describe durable gateway and reasoning recovery. Repository Session and
  gateway session may be distinct, but the taxonomy does not explain it.
- The DSH layering document still targets hosted clients and an L3 website path,
  contrary to the newly selected scope.
- The canonical product README duplicates a completed-turn-frontier paragraph
  and mixes implemented behavior with product promises instead of one current
  capability matrix.
- Open questions are distributed across architecture, capabilities, goals,
  evolution plans, lighthouse research, and residue without one owner/status
  register.

### Local Tensions

- Reproducibility versus freshness: immutable bundle and live repository modes
  lack one epoch and promotion model.
- Non-authorizing advice versus enforceable governance: authority cannot be
  manufactured, but prerequisites and evidence still need machine-readable
  enforcement.
- Required product component versus candidate subsystem: evolution is required
  while every production cycle is disabled.
- Stable surface versus experimental breadth: research, DSH, hosted browser
  controls, evolution, and core routing share one required closure.
- Global governance correctness versus local delivery: runtime tests can pass
  while the Project/Goal promotion path is blocked.

### Questions for Synthesis

1. What is the ARE vNext core: routing/context/state/effect/continuity only, or
   are evolution and DSH required?
2. Does `agent-routing/routes.json` become the sole policy authority, or does a
   new governed source own affinity, ceilings, blockers, and gates?
3. Is production context a compiled signed bundle, a live snapshot, or two
   explicit modes sharing one epoch contract?
4. What evidence proves an owner gate, and which host authenticates that owner?
5. Should ARE repair the global Goals package as its promotion path or establish
   a smaller ARE-local lifecycle registry first?
6. With hosted website work abandoned, should browser-host additions and the L3
   plan leave ARE core while the local adapter is classified separately?
7. Which questions block product definition, which are roadmap items, and which
   are research hypotheses?

## Cross-layer synthesis

The audit does not support a single flat backlog. The missing work forms five
cross-layer tensions whose resolution order matters.

### T1 — The product boundary is flatter than the maturity evidence

`product.json` makes all 19 components required, including the benchmark,
evolution runtime, MCP, coding-agent runtime, host wrapper, and DSH. Yet DSH is
not self-contained, evolution is disabled and candidate-only, and deployment
remains local/developer-operated. This is the central structural defect.

Recommended decision: define three explicit layers before another freeze:

- **ARE Core:** intent/routing, bounded context, policy/consequence decisions,
  reasoning state, journal, and conversation contracts.
- **Host and execution extensions:** Codex wrapper, MCP, coding agent, and
  backend adapters, each with its own maturity and installation contract.
- **Research and evaluation:** evolution cycles and benchmarks, never required
  by the minimum runtime unless individually promoted.

### T2 — Durable records exist without one recovery and retention authority

Gateway events, Reasoning State, and DSH transcripts each persist different
truth. Append-only design supports audit, but physical growth, deletion,
compaction, stale locks, and coordinated crash recovery have no selected owner
or protocol.

Recommended decision: select a coordinated recovery model. The gateway should
own session orchestration, Reasoning State should own semantic task truth, and a
backend transcript should be replaceable cache/evidence unless explicitly
promoted. Then add snapshot/compaction, quotas, lock adjudication, and composed
crash tests around that hierarchy.

### T3 — Product governance is described but not executable

Routes and the ARE decision profile duplicate policy. Objectives and effects are
conflated. Ceilings and blockers are mostly prose. Goals validation is blocked
by a schema/validator disagreement, while the implementation already calls
itself a stability candidate.

Recommended decision: select one canonical repository-policy schema and compile
all ARE runtime policy from it. Separate `objective_affinity`,
`requested_effects`, `allowed_effects`, prerequisites, blocker conditions, and
authenticated owner-gate evidence. Repair the Goals schema/validator contract
and bind accepted evidence before using Project state as a promotion gate.

### T4 — Reproducibility and live development are accidentally mixed

The CLI consumes a compiled policy bundle while the gateway rereads live files
under a different epoch model. The source closure recreates repository layout
and calls itself self-contained, while at least one required dependency and
several runtime policy/context inputs need separate setup.

Recommended decision: support two named modes, not one ambiguous mode:

- `development-live`: explicit repository root, live refresh, drift events, no
  release or replay claim.
- `product-bundle`: content-addressed policy/context bundle, dependency lock,
  confined paths, one epoch, isolated start/restart/route/context tests.

### T5 — Documentation is historical evidence and current manual at once

The manual alternates between Candidate 018, Candidate 020, and the dirty
successor. Component counts, Codex versions, configuration, deployment, and DSH
coverage disagree. The abandoned website integration still appears as a target
and active plan.

Recommended decision: preserve candidate-specific facts only in release notes.
Create one generated current-capability matrix with component layer, lifecycle,
default state, install dependency, supported topology, owner, and evidence. Mark
the hosted DSH/browser plan abandoned or superseded; do not leave it in the
active product roadmap.

## Recommended implementation order

### P0 — Select the coherent product contract

1. Choose the finish form: recommended default is an installable single-user
   local CLI/daemon, not an operated service.
2. Split Core, extensions, and research/evaluation in `product.json` or successor
   manifests.
3. Classify DSH as optional/experimental until its install, closed capability,
   durability, rights, and upgrade contracts close.
4. Treat Candidate 020 as historical and allocate a new successor identity only
   after this boundary is committed.

### P1 — Runtime, security, and operations closure

1. Define record authority across gateway, Reasoning State, and backend threads.
2. Implement gateway compaction/snapshot, total disk quota, startup budget, and
   crash-safe recovery.
3. Implement DSH thread close/expiry/reclamation and hard byte-limit behavior;
   require an explicit durable or ephemeral mode.
4. Replace DSH denylist protection with parsed effective-configuration
   attestation and fail closed on every undeclared capability.
5. Add stale-lock reconciliation with evidence and unknown-outcome preservation.
6. Enforce limits during attached sessions; add CPU/RSS/FD/queue/provider-budget
   boundaries appropriate to the selected local product.
7. Redact and structure backend diagnostics; expose doctor, readiness, health,
   recovery status, storage growth, and limit events.
8. Prove isolated install, start, restart, crash, recovery, rollback, and removal
   for Core and each selected extension.

### P2 — Architecture and governance closure

1. Choose one canonical policy authoring source and generate runtime bundles.
2. Separate objective selection from effect request and route permissions.
3. Make ceilings, blockers, prerequisites, and owner evidence structured and
   machine-enforced without pretending ARE grants authority.
4. Unify CLI and gateway snapshot/epoch semantics across live and bundled modes.
5. Repair Goal schema/validator semantics; connect Project evidence and
   construction bindings; advance lifecycle only through explicit owner gates.
6. Create a single decision register and capability/maturity matrix.

### P3 — Documentation and release preparation

1. Move historical candidate facts to candidate-specific release records.
2. Regenerate current architecture, configuration, operations, privacy, threat,
   deployment, compatibility, and migration documentation from the selected
   product contract.
3. Retire or supersede the hosted website/iframe plans.
4. Only then execute full qualification and freeze a new candidate.

## Human gate

Awaiting owner classification of each synthesis tension as:

- actionable now;
- deferred by design;
- misinterpretation requiring correction; or
- uncertain and requiring a narrower investigation.

Recommended immediate owner decisions:

1. Accept an installable single-user local CLI/daemon as the vNext finish form.
2. Accept Core / extension / research as the product layering model.
3. Reclassify DSH from required to optional experimental.
4. Select gateway orchestration plus Reasoning State semantic truth as the
   recovery authority hierarchy.
5. Select one generated repository-policy bundle as the production policy and
   context input, retaining live repository refresh only for development mode.

No repair, promotion, candidate freeze, publication, or deployment is authorized
by this record.

## Follow-up links

- [`implementation/agent-reasoning-engine/product.json`](../../implementation/agent-reasoning-engine/product.json)
- [`implementation/agent-reasoning-engine/docs/ARCHITECTURE.md`](../../implementation/agent-reasoning-engine/docs/ARCHITECTURE.md)
- [`implementation/agent-reasoning-engine/docs/OPERATIONS-AND-SECURITY.md`](../../implementation/agent-reasoning-engine/docs/OPERATIONS-AND-SECURITY.md)
- [`implementation/agent-reasoning-engine/docs/PRIVACY-AND-RETENTION.md`](../../implementation/agent-reasoning-engine/docs/PRIVACY-AND-RETENTION.md)
- [`implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json`](../../implementation/agent-reasoning-engine/packages/codex-app-server-wrapper/profiles/repository-v1.json)
- [`goals/projects/agent-reasoning-engine/project.json`](../../goals/projects/agent-reasoning-engine/project.json)
- [`goals/projects/agent-reasoning-engine/plans/multi-cycle-evolution-runtime/PLAN.md`](../../goals/projects/agent-reasoning-engine/plans/multi-cycle-evolution-runtime/PLAN.md)

