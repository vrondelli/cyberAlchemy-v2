# P3 — Orchestration Tooling: The Skeptic's Return

**Role:** SKEPTIC finder. Corpus = the *internal* dispatch system (read, not modified).
**Stance:** adopt-conservative. For each candidate an advocate would raise, the claim is
either (a) our governed native dispatch already does the equivalent, or (b) adopting the
external orchestrator breaks Claude-Code-native execution, the append-only ledger, or the
router→type-skill→form discipline. Genuine gaps are named plainly at the end.

---

## 0. What the native system actually is (the thing a tool would replace)

Before judging any candidate, pin the incumbent. It is **not** an unstructured "spawn some
subagents" habit — it is a four-part governed machine:

1. **A router** — `.claude/skills/domainspec-subagents-strategy/SKILL.md`. Decides *whether*
   to dispatch (four triggers: synthesis / context-protection / isolation / parallelism §1),
   holds the **single human confirm gate** (§3), enforces universal invariants (§5), and
   routes by `dispatch_type` to a LIVE type skill (§4). It is explicitly a *router*: "defines
   no field and no type-specific judgment."
2. **Type skills** — `research`, `review`, `experiment` (LIVE); `code`, `plan`, `suggestion`
   RESERVED and refused if dispatched (§4 table).
3. **A form + ledger** — `register-dispatch/SKILL.md` + `append-dispatch.cjs` writing
   `telemetry/agents/subagents-dispatch.yaml` under **schema v0.6.0**, **append-only**, **two
   appends per dispatch** (dispatch row at launch, close row at termination).
4. **Two anti-bias gates** — `check-tension` (init-time, two independent agents, five-test
   rubric) and `robot-talks` (multi-agent tension-mapping with collapse detection).

Crucially, the **execution substrate is the Claude Code turn itself**: groups run as parallel
`Agent`/Task spawns in one message (router §2 step 3); dependency scheduling is "a group is
READY when every `sequential`/`zig-zag` predecessor has produced its input." There is **no
external process, no daemon, no event loop**. The whole thing is driven by the model's turn and
a deterministic Node appender. That is the property every candidate below must not break.

---

## 1. Graph orchestration frameworks — LangGraph / CrewAI / AutoGen

**Advocate's pitch:** "You're hand-rolling a DAG of agents with edges and loop caps. LangGraph
gives you a typed state graph, conditional edges, checkpointing, and a supervisor pattern for
free. CrewAI gives you roles/tasks. AutoGen gives you multi-agent conversations."

**What native already does (cite):**
- The DAG *is* first-class already. `connections[]` in schema v0.6.0
  (`register-dispatch/SKILL.md` §"Each object in `connections`") are exactly
  `{from, to, type, loop_cap?}` with `type ∈ sequential | zig-zag | feedback` — nodes are
  `groups`, edges are typed, and the router schedules by dependency (§2 step 3). This *is* a
  typed state graph.
- The "supervisor / conditional routing" pattern is the router + `final_approver` (§5): every
  dispatch names an approver holding last accept/reject, with **self-approval prohibited**.
- CrewAI's roles map onto the closed `role` enum (`explorer | skeptic | writer | auditor`) and
  AutoGen's "agents converse" maps onto `robot_talks: true` — but with a discipline AutoGen
  lacks: **collapse detection** (router §8 — the synthesizer must receive each agent's initial
  *and* final position so premature convergence is visible). AutoGen's free chat has no such
  guard.
- The three loop dials (`layers` / `loop_cap` / `max_loops`, router §6) are LangGraph's
  recursion-limit and per-edge iteration, but with an explicit "smallest scope wins" rule that
  LangGraph's single global recursion counter does not give you.

**Why it is redundant / breaks discipline:**
- **The graph is the least of it.** LangGraph gives you edges; it gives you *nothing* on the
  parts that are the actual point here — the human confirm gate (router §3), the check-tension
  five-test anti-bias rubric, the closed `exit_reason` vocabulary with precedence (§7), the
  append-only two-append ledger. Adopting LangGraph replaces the 20% that's already solved and
  leaves the 80% that's the discipline.
- **It moves execution off the Claude Code turn.** LangGraph/CrewAI run their own Python event
  loop and *call* an LLM API. That inverts the model: today the model **is** the orchestrator
  and spawns agents as turns; under LangGraph a Python process is the orchestrator and Claude
  is a callee. You lose native subagent semantics, the `Agent` tool, skill-invocation inside
  agents, and the whole "one message, parallel spawns" primitive. This is precisely the CLAUDE.md
  route-2 prohibition: **"prefer native skills/subagents over nested model-backed CLI"** and
  orchestrate §5 **"Do not spawn nested model-backed CLIs for the same stage."**
- **It bypasses the ledger.** LangGraph state lives in its own checkpointer (SQLite/Postgres),
  not in `subagents-dispatch.yaml`. Either you keep both (double-bookkeeping, drift guaranteed)
  or you abandon the append-only YAML — and with it the strict v0.6.0 validation, the dedup-on-id
  idempotency, and the grandfathering guarantee (`register-dispatch/SKILL.md` §Grandfathering).
- **Role/enum collision.** CrewAI roles are free strings; our `role` is a validated closed enum
  the appender rejects on violation (exit 2). Importing CrewAI's vocabulary means either
  re-mapping every task or loosening the schema — a governance regression.

**Verdict: redundant and disciplinarily corrosive.** The one thing LangGraph does that we don't
(durable checkpointing of an interrupted run) is a real gap — see §6.

---

## 2. Durable execution — Temporal / Restate

**Advocate's pitch:** "Your `max_loops` run can be interrupted mid-flight and you lose all
progress. Temporal gives durable workflows, automatic retries, and replay-based crash recovery.
A dispatch is a workflow; each agent is an activity."

**What native already does (cite):**
- **Durability of the *record*** is already solved, and solved well, by the append-only ledger.
  Every dispatch is recorded at launch (dispatch row) before any agent runs
  (`register-dispatch/SKILL.md` — "append only after the human's explicit confirm"), and the
  close row records `exit_reason` + `agents_spawned` (with `loops_used`) at termination. The
  intent and the outcome are both durable on disk, human-readable, git-tracked.
- **Retry/ceiling semantics** exist as `max_loops` (1..5, whole-sequence re-run ceiling, router
  §6) and per-edge `loop_cap`. The re-run is *deliberately* gated on a `final_approver`
  rejection, not automatic — an accountability property Temporal's blind auto-retry would erase.
- **Partial-failure handling** is specified: "An agent error degrades to a **partial group
  result** that downstream groups and the `final_approver` must be told about" (router §2) and
  `exit_reason: error` with precedence below `user_abort` (§7).

**Why it is redundant / breaks discipline:**
- **Wrong durability unit.** Temporal makes *the orchestrator process* durable. But here there is
  no long-lived orchestrator process to crash — the orchestrator is a model turn. What's durable
  and needs to be durable (the dispatch spec + outcome) already is. Temporal solves a problem the
  turn-driven model doesn't have in the acute form Temporal assumes.
- **It demands a running worker.** Temporal/Restate require a persistent worker process polling a
  task queue. That is a daemon — the exact opposite of the native "no external process" property.
  It cannot be driven from a Claude Code turn; it inverts control the same way LangGraph does.
- **Determinism constraints fight LLM agents.** Temporal's replay model requires activity
  determinism and versioning discipline; wrapping non-deterministic LLM agent calls as
  "activities" is a known impedance mismatch and buys little, because our agents are already
  idempotent-by-record (`dispatch_id` dedup makes re-registering a no-op —
  `register-dispatch/SKILL.md` §Top level).
- **Two sources of truth.** Temporal's event history would become a second, richer ledger that is
  *not* the governed append-only YAML. The append-only hook (documented in
  `register-dispatch/SKILL.md`: "the append-only hook blocks Bash access to the file, even
  read-only commands") exists precisely to keep *one* tamper-evident record. Temporal reintroduces
  the drift the hook was built to prevent.

**Verdict: the *record* durability is already met; the one genuine sliver — resuming an
interrupted mid-loop run without re-spawning completed groups — is real but small (see §6), and
does not justify a daemon-based execution inversion.**

---

## 3. Runtime / sandbox — Ray / Modal / E2B

**Advocate's pitch:** "Ray parallelizes across a cluster; Modal gives serverless fan-out; E2B
gives isolated sandboxes so untrusted agent code can't touch the repo."

**What native already does (cite):**
- **Parallelism** is native and free: "Launch all READY groups concurrently … Agents inside a
  group always run in parallel — one message, each with its own briefing" (router §2 step 3).
  The parent Agent-tool guidance is the same: independent work goes in one message. No cluster
  scheduler is needed for the 2–5-agent fan-outs the ledger actually shows (every recorded
  dispatch is n=2 or n=3).
- **Isolation** is a first-class *trigger*, not an infra concern: "isolation — discardable
  exploration you don't want in the parent's context" (router §1). Subagents already run in
  their own context window; a read-only agent's writes never touch the parent. The Agent tool's
  worktree isolation mode covers filesystem isolation when needed.

**Why it is redundant / breaks discipline:**
- **Scale mismatch.** Ray/Modal earn their keep at hundreds-to-thousands of parallel tasks over
  big data. The corpus is human-gated dispatches of a handful of agents each. You would import a
  distributed scheduler to run three Explore agents that one message already runs. Pure overhead.
- **E2B solves untrusted-code execution — a threat we don't have.** Our agents are governed
  Claude subagents under a closed role enum and a human gate, not arbitrary third-party code
  needing a jail. Trust-but-verify (router §5: "inspect the actual diff / run the actual check")
  is the control here, not a sandbox VM.
- **Execution inversion again.** Modal/Ray tasks run in *their* runtime; the model would call out
  to them, violating route-2 native-first and orchestrate §5. And nothing in Ray/Modal/E2B
  touches the ledger, the gates, or the type-skill chain — they are pure execution substrate for
  a scale we don't operate at.

**Verdict: redundant at our scale; solves threats/scales we don't have. No gap.**

---

## 4. Protocols — MCP / A2A

**Advocate's pitch:** "MCP standardizes tool/context servers; A2A (agent-to-agent) standardizes
cross-agent messaging so your agents could talk to external agents and your dispatch could be
consumed by other systems."

**What native already does (cite):**
- **Agent-to-agent messaging** inside a dispatch is already a typed, governed channel: `zig-zag`
  and `feedback` connection edges with `loop_cap` (`register-dispatch/SKILL.md` §connections),
  the robot-talks discussion protocol (router §8, `robot-talks/SKILL.md`), and the rule that
  `feedback` asks are recorded **verbatim** in the close row (`feedback_prompts[]`). A2A's
  "agents exchange messages" is our edges — but with an audit trail A2A doesn't mandate.
- **Context passing to a subagent** is deliberately *narrow*: "context … the only channel
  subagents get" (`register-dispatch/SKILL.md` top-level `context` field) plus each agent's
  `initial_prompt`. This is a governance choice — a bounded briefing — not an accident MCP should
  "fix" by opening a wide context bus.

**Why it is redundant / breaks discipline (mostly):**
- **A2A is redundant *inside* the boundary and premature *outside* it.** Internally, typed edges +
  the ledger already do what A2A standardizes. Externally, exposing our dispatch to foreign agents
  crosses the public/private boundary CLAUDE.md guards ("never leak private prose into `arcanum/`")
  and has no consumer today. Adopting A2A now is speculative surface area.
- **A2A's open message bus fights the single-gate rule.** The router enforces **exactly one human
  gate** (§3, §8: "there is still only the one entry confirm"). A protocol whose whole premise is
  autonomous agent-to-agent negotiation pushes toward ungated multi-party loops — the opposite of
  the frozen-after-confirm sheet.
- **MCP is the exception — partly complementary, not an orchestrator.** MCP is a *tool/context
  server* protocol, not an agent orchestrator, so it doesn't compete with the router at all. Claude
  Code already speaks MCP natively (this very environment exposes MCP tools). If a dispatch agent
  needs a governed external data source, an MCP server is the native-compatible way to give it one
  **without** inverting execution — the model still drives, MCP just serves. That is additive and
  in-bounds. It does **not** touch the ledger or the gates, so it neither helps nor harms the
  discipline; it is orthogonal.

**Verdict: A2A redundant-and-premature; MCP orthogonal and already native — not an orchestration
substitute, occasionally a useful tool-server for an agent's data needs.**

---

## 5. Observability / eval — Langfuse / Phoenix

**Advocate's pitch:** "You have a 1.2MB append-only YAML and no way to see traces, latencies, cost
per dispatch, or eval scores. Langfuse gives tracing + eval dashboards; Phoenix gives LLM eval and
drift analysis over your runs."

**What native already does (cite):**
- The ledger *is* the trace store: every dispatch row carries `goal`, `context`, full `groups`
  with each agent's `role/model/token_budget/initial_prompt/angle`, `connections`, and every
  close row carries `exit_reason` + `agents_spawned {total, tree, loops_used}` +
  `feedback_prompts`. That is a complete, structured, per-dispatch trace — model used, tokens
  budgeted, tree shape, loops consumed, why it ended. `telemetry/agents/subagents-dispatch.yaml`
  is already the source Phoenix would ingest.
- **Eval discipline is upstream, by design.** check-tension is a *pre*-flight anti-bias eval
  (five tests, two independent judges); the `experiment` type carries a pre-registered criterion
  and SURVIVED/FALSIFIED/INVALID verdict. The system evaluates *sheets before they run* rather
  than scoring traces after — a deliberate "anti-bias enforced only at initialization"
  stance (`check-tension/SKILL.md`: "There is no post-dispatch realization check").

**Why the incumbent nearly covers it — and where it honestly doesn't:**
- **Redundant for capture:** Langfuse's core job (capture structured spans of an agent run) is
  already done, and done in a *governed, tamper-evident, git-diffable* form the append-only hook
  protects. Piping the same data into Langfuse duplicates capture and creates a second store
  outside the hook's protection.
- **The honest gap is the *read* side, not the *write* side.** The ledger is optimized for
  append-only integrity, **not** for querying. There is no native "cost per dispatch over time,"
  "median loops-used by type," "which anti_bias axes recur," "error-rate by model" view. Today
  answering those means hand-parsing 1.2MB of YAML. This is a real analytics gap (see §6).
- **But the fix must respect the ledger's primacy.** A read-only analytics layer *over* the
  append-only YAML (the YAML stays the source of truth; the tool only ingests) is defensible.
  Making Langfuse/Phoenix the *system of record* is not — it would move truth off the hooked,
  git-tracked file and defeat the append-only guarantee. Adopt-conservative answer: build a small
  native read-model/query script over the existing YAML before importing a hosted eval platform
  with its own storage, auth surface, and (for hosted variants) private-data-egress concern
  against a private repo.

**Verdict: capture is redundant; a read/analytics layer is a genuine gap — fill it native-first,
as a derived view, never as a replacement system of record.**

---

## 6. Where a tool WOULD genuinely fill a real gap (honest accounting)

Being a skeptic is not being a denier. Three real seams, ranked, with integration cost noted
against the turn-driven native model:

1. **Analytics / query layer over the append-only telemetry (real, moderate value).** The ledger
   is write-optimized and query-hostile. A derived read-model — "cost/loops/exit_reason/anti_bias
   trends by type and model" — is genuinely missing. *Native-first cost:* a small deterministic
   script that parses `subagents-dispatch.yaml` into a queryable view is cheap, stays in-repo, and
   respects the hook. A hosted eval platform (Langfuse/Phoenix) adds a second store, auth, and
   egress risk for a private repo — disproportionate to the need. **Recommend native derived view;
   reject hosted-as-source-of-record.**

2. **Crash-recovery / resume for an interrupted `max_loops` run (real, narrow value).** If a
   multi-group, multi-loop dispatch is interrupted mid-flight, there is no native "resume from the
   last completed group" — the dispatch row records intent but not per-group *progress*, so a
   restart re-spawns completed work. Temporal/LangGraph checkpointing targets exactly this.
   *Native-first cost:* the honest fix is small and in-model — a lightweight per-group progress
   marker (append-only, same ledger) so a re-run skips completed READY groups. Importing Temporal
   for this is a daemon-and-determinism tax wildly out of proportion to a gap that bites only on
   mid-loop interruption of the largest dispatches (of which the ledger shows essentially none —
   almost every recorded run is single-loop, single-group). **Low priority; native marker if ever
   needed; reject durable-execution engine.**

3. **MCP as a governed data-server for an agent's external reads (real, orthogonal).** Not an
   orchestrator and not a gap in orchestration — but the native-compatible way to give a dispatch
   agent a bounded external source without inverting execution. Already spoken natively. **Adopt
   opportunistically per-need; it touches neither ledger nor gates.**

Everything else — LangGraph/CrewAI/AutoGen as orchestrators, Temporal/Restate as the execution
engine, Ray/Modal/E2B as substrate, A2A as the messaging protocol — is either redundant with the
router→type-skill→form chain, or breaks the two load-bearing properties: **execution stays on the
Claude Code turn** (route-2 native-first; orchestrate §5 no nested model-backed CLI) and **the
append-only ledger stays the single tamper-evident system of record** (register-dispatch schema
v0.6.0 + the append-only hook).

---

## 7. One-line summary per candidate

| Candidate | Native equivalent (cite) | Skeptic verdict |
|---|---|---|
| LangGraph / CrewAi / AutoGen | typed `connections[]` DAG + roles enum + `robot_talks` collapse-detection (router §2/§8, schema) | **Redundant + inverts execution + bypasses ledger.** Reject. |
| Temporal / Restate | append-only ledger (durable record) + `max_loops`/`loop_cap` + partial-result rule (router §2/§6) | **Record-durability already met; needs a daemon; two-source drift.** Reject engine; tiny native resume marker if ever needed. |
| Ray / Modal / E2B | one-message parallel spawns + isolation trigger + worktree (router §1/§2) | **Wrong scale, wrong threat model, inverts execution.** Reject. No gap. |
| MCP | native tool-server; agents already governed | **Orthogonal, already native, additive per-need.** Not an orchestrator. |
| A2A | typed `zig-zag`/`feedback` edges + verbatim `feedback_prompts` + single-gate rule (§3/§8) | **Redundant inside boundary, premature + un-gated outside.** Reject now. |
| Langfuse / Phoenix | ledger as structured trace + check-tension/experiment as pre-flight eval | **Capture redundant; read/query layer is a real gap — build native derived view, never as system of record.** |
