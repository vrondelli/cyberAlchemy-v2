# P3 — OSS Agent-Orchestration Tooling: The Advocate's Case

**Role:** Advocate finder. Corpus: external OSS ecosystem (web-sourced, July 2026).
**Thesis I argue FOR:** The hand-built dispatch discipline (router→type-skill→form chain,
append-only `subagents-dispatch.yaml` ledger, the three dials, `check-tension` gate,
dependency-scheduled group graph) is a *correct control model* but sits on *no runtime substrate*.
Every gap the skeptic will call "not needed yet" — crash recovery, telemetry analysis, sandboxed
execution, sub-agent messaging — is a solved problem in mature, permissively-licensed OSS. Adopting
selectively lets the project keep its governance semantics while borrowing durability, observability,
and isolation it would otherwise have to hand-build badly.

---

## Framing: the project's model → the six orchestration seams

The current system is a **graph of groups with loops**, driven turn-by-turn by the parent agent:

- **Group graph, dependency-scheduled** → *graph scheduling* seam.
- **Three dials** — `robot_talks` (intra-group), `zig-zag` (inter-group, `loop_cap`),
  `max_loops` (whole-graph re-run) → *graph scheduling + durable re-runs* seams.
- **`subagents-dispatch.yaml`** (append-only, two rows/dispatch) → *telemetry/eval* seam,
  currently a write-only ledger with **no analysis layer**.
- **`check-tension`** anti-bias gate → an *eval/gate* concern that could run as a scored node.
- **Parent-agent-driven, no crash recovery** → the *durable execution* seam is entirely absent.
- Native Claude Code subagents run in-process, no isolation → *sandboxed execution* absent.
- No formal *inter-agent messaging* (fan-out/fan-in only) and no *prompt/agent versioning*.

Each candidate below is scored by **WHERE** (which seam) and **WHY** (concrete mapping onto the
graph-of-groups-with-loops model). The single highest-leverage adoption is a **durable-execution
engine** wrapping the parent loop; the second is a **telemetry backend** the YAML ledger feeds.

---

## 1. Orchestration frameworks (the control-model layer)

The project already *has* a control model, so these are mostly **comparison peers / borrowable
patterns**, not drop-in replacements. But two (LangGraph, Google ADK) encode the exact
graph+loop+state semantics the project hand-rolls, and are worth mining or adopting as the graph
substrate.

| Tool | One-line | License | WHY it helps | WHERE (seam) |
|---|---|---|---|---|
| **LangGraph** | Stateful graph runtime: nodes, edges, conditional/loop edges, checkpointed state | Apache-2.0 | Its `StateGraph` + **checkpointer** is *literally* a group-graph-with-loops that persists state between steps; `interrupt()`/`Command(resume=)` give human-in-loop gates like `check-tension`. Conditional edges express `zig-zag`; recursion limit ≈ `max_loops`. Adopt the checkpointer even if you keep your own router. | graph scheduling · durable re-runs (checkpoint) |
| **Google ADK** | Model-agnostic agent kit with explicit `Sequential`/`Parallel`/`Loop` workflow agents | Apache-2.0 | The `LoopAgent` + `ParallelAgent` primitives map 1:1 onto `robot_talks` (parallel intra-group) and `max_loops` (bounded loop). First-class A2A + MCP wiring. Cloud Trace hooks give telemetry for free on GCP. | graph scheduling · inter-agent messaging |
| **AutoGen / AG2** | Conversational multi-agent framework (GroupChat, speaker-selection) | Apache-2.0 | `GroupChat` + custom speaker-selection is a ready-made **intra-group `robot_talks`** engine with turn arbitration you currently drive by hand in the parent. Mine its speaker-selection policies. | inter-agent messaging (intra-group) |
| **CrewAI** | Role/task/crew abstraction, sequential & hierarchical process | MIT | "Crew = group, agents = angles, process = schedule" is your model in miniature; hierarchical process ≈ a manager node routing sub-crews. Good reference for the type-skill→form contract. | graph scheduling (pattern) |
| **OpenAI Agents SDK** | Lightweight agents + **handoffs** + guardrails + built-in tracing (Swarm's successor) | MIT (Apache-2.0 for spec bits) | **Handoffs** are a clean formalization of inter-group `zig-zag`; built-in **guardrails** are exactly `check-tension` as code; ships tracing out of the box. Swarm is deprecated → migrate patterns, not code. | inter-agent messaging · eval/gate · telemetry |
| **DSPy** | Compile/optimize prompt *programs* against a metric (MIPROv2, etc.) | MIT | Turns `check-tension` and angle-selection into **optimizable, versioned artifacts**: define a metric (bias-cancellation score), let DSPy compile the angle-set prompts. Directly attacks the *prompt/agent versioning* + *eval* seams the project has nothing for. | prompt/agent versioning · eval |
| **Pydantic-AI** | Type-safe agent framework; structured outputs validated by Pydantic | MIT | Enforces the *form* half of router→type-skill→**form** as typed schemas; dispatch rows become validated models, killing the class of "malformed ledger row" bugs. Integrates natively with Langfuse/OTel. | prompt/agent versioning (typed forms) · telemetry |
| **Mastra** | TS-native agents + **durable workflows** (`.then`/`.branch`/`.parallel`) + evals in one pkg | Apache-2.0 | Its workflow graph is *suspendable/resumable* — a JS-land LangGraph. Relevant if any orchestration moves to a TS surface; branch/parallel primitives mirror the dials. | graph scheduling · durable re-runs |

**Advocate's read:** the project reinvents LangGraph/ADK's graph+state+loop layer in prose and
parent-agent turns. You don't have to switch frameworks — but **adopting a checkpointed graph
runtime as the executor** would make the dials *mechanical* (recursion limit = `max_loops`,
conditional edge = `zig-zag`) instead of parent-agent-interpreted, and give you durable resume for free.

---

## 2. Durable-execution / workflow engines (the missing substrate — highest leverage)

This is the seam the project *explicitly lacks* ("NO crash-recovery/durable execution ...
orchestration driven turn-by-turn by the parent agent"). If the parent agent dies mid-fan-out,
the whole dispatch is lost. Durable execution makes the group graph **crash-proof and resumable**
without changing its semantics.

| Tool | One-line | License | WHY it helps | WHERE (seam) |
|---|---|---|---|---|
| **Temporal** | Durable workflow engine: code-as-workflow, automatic state persistence, replay, retries, timers | MIT (server + SDKs) | The reference answer. Model each **group as an Activity**, the **graph as a Workflow**; `max_loops` is a workflow loop, `zig-zag`/`loop_cap` are just loop bounds — all **durably persisted and replayed** after a crash. Signals = human `check-tension` approvals; Queries = live dispatch status. Used in prod by OpenAI, Replit, Cursor for exactly agent loops. | **durable re-runs** · graph scheduling · inter-agent messaging (signals) |
| **DBOS Transact** | Durable execution as a *library* — persists workflow + step state in Postgres/SQLite, in-process | MIT | Zero new infra (no server/cluster like Temporal). Decorate the parent-loop steps `@DBOS.workflow`/`@DBOS.step`; on crash it resumes from the last completed group. **Lowest-friction adoption** for a solo/private repo: your `subagents-dispatch.yaml` semantics could live in the same Postgres as durable state. | durable re-runs (minimal infra) · telemetry (state in SQL) |
| **Restate** | Durable execution + durable state/timers/messaging; single self-contained binary | BUSL-1.1 (source-available) | Lighter than Temporal to self-host (one binary), adds **durable inter-service messaging** — useful if groups become long-lived services that message each other (richer than fan-out/fan-in). Note the BUSL license (not OSI-approved) — production-use caveat. | durable re-runs · inter-agent messaging |
| **Inngest** | Event-driven durable functions; steps individually retriable; `step.ai.infer` for LLM calls | Apache-2.0 (SDK/dev-server) | Event-first model fits "dispatch event → fan-out group runs → fan-in synthesize." `step.run` gives per-group retry/memoization so a re-run (`max_loops`) skips already-done groups. Dev server runs locally. | durable re-runs · graph scheduling (event DAG) |
| **Prefect** | Pythonic workflow orchestration (`@flow`/`@task`), retries, caching, scheduling | Apache-2.0 | Decorator model matches the skill-based dispatch; task caching = memoized groups across `max_loops`; concurrency limits govern parallel `robot_talks`. Lighter than Temporal, heavier durability than DBOS. | graph scheduling · durable re-runs (caching) |
| **Dagster** | Asset-centric orchestrator; each output is a tracked, versioned "asset" with lineage | Apache-2.0 | If each group's artifact is a **data asset**, you get lineage + materialization history *for free* — a natural analysis layer over dispatches. Heavier/data-eng-flavored; best if artifacts are first-class. | graph scheduling · telemetry (lineage) |
| **Argo Workflows** | K8s-native container DAG engine (YAML DAGs, parallel steps, retries) | Apache-2.0 | If groups ever run as isolated containers, Argo schedules the **DAG-of-groups on Kubernetes** with native parallelism/retry. Heavyweight (needs a cluster); only if you go container-per-agent. | graph scheduling · sandboxed execution (container) |

**Advocate's read:** Start with **DBOS Transact** (library, Postgres, no new infra) to make the
parent loop crash-recoverable this week; graduate to **Temporal** if dispatches become long-running
or multi-tenant. This is the single biggest reliability win and requires *no change* to the router →
type-skill → form governance — it wraps it.

---

## 3. Runtime / sandbox infrastructure (isolation for agent-run code/tools)

Native subagents run in-process with the parent's trust and filesystem. The moment a dispatch runs
untrusted or generated code (or you want parallel groups that can't corrupt each other's workspace),
you need isolation.

| Tool | One-line | License | WHY it helps | WHERE (seam) |
|---|---|---|---|---|
| **E2B** | Open-source sandboxed cloud runtime for AI agents, Firecracker microVMs, ~150ms boot | Apache-2.0 | Give each group/agent a **disposable microVM** with its own FS + terminal; generated code never touches the host. Fast enough to spawn one per fan-out branch. Self-hostable core. | **sandboxed execution** |
| **Firecracker** | AWS microVM monitor: hardware-isolated VMs, <150ms boot, <5MiB overhead | Apache-2.0 | The isolation primitive under E2B. Adopt directly for a hardened DIY per-agent sandbox if you don't want E2B's control plane. | sandboxed execution |
| **Ray** | Distributed compute: actors + tasks, Python-native parallelism/scheduling | Apache-2.0 | Model each group as a **Ray actor**; Ray schedules parallel `robot_talks` across cores/nodes and handles fan-in via object refs. A distributed-executor answer for the graph scheduler when parallelism outgrows one process. | graph scheduling (distributed) · inter-agent messaging (actors) |
| **Modal** | Serverless cloud compute; gVisor-isolated sandboxes, GPU on demand | Proprietary cloud (open Python SDK) | Zero-infra way to run isolated agent code / GPU steps; `Sandbox` API for generated code. Not self-hostable (vendor lock caveat) but fastest path to isolated remote execution. | sandboxed execution · graph scheduling |

**Advocate's read:** **E2B (Apache-2.0, Firecracker-backed, self-hostable)** is the clean answer the
day a dispatch executes code it didn't write. Until then it's optional — but it's the *right* option,
not a bespoke `subprocess` jail.

---

## 4. Protocols (interoperability the project has none of)

The dispatch graph is a closed world (Claude Code subagents only). Two Linux-Foundation-track
standards let groups become interoperable, tool-equipped, and inter-callable across frameworks/vendors.

| Tool | One-line | License | WHY it helps | WHERE (seam) |
|---|---|---|---|---|
| **MCP (Model Context Protocol)** | Open standard for agent↔tool/context (JSON-RPC) | MIT (spec + SDKs) | Standardizes how any group acquires tools/context; a dispatch could expose the `subagents-dispatch.yaml` ledger or the repo as an **MCP server** so every agent reads it uniformly. Already the de-facto tool standard. | inter-agent messaging (agent↔tool) · telemetry (ledger-as-server) |
| **A2A (Agent2Agent)** | Open standard for agent↔agent messaging; Linux Foundation, JSON-RPC, AgentCards | Apache-2.0 | Formalizes inter-group `zig-zag` as a **wire protocol**: groups advertise capability via AgentCards, hand off tasks with typed state. Lets a group be a non-Claude agent without breaking the graph. Governed by LF (AWS/Google/IBM/MS/Salesforce TSC) → durable standard. | **inter-agent messaging** (agent↔agent) |

**Advocate's read:** MCP is low-risk to adopt now (expose ledger/repo as a server). A2A matters the
moment a group is implemented outside Claude Code — it turns `zig-zag` from a parent-agent convention
into a checkable protocol.

---

## 5. Observability / eval (the write-only ledger's missing analysis layer)

The project has an **append-only ledger with no analysis layer**. These backends turn that ledger
into queryable traces, dashboards, regression evals, and scored gates — and most are
OpenTelemetry-based, so instrumentation is vendor-neutral.

| Tool | One-line | License | WHY it helps | WHERE (seam) |
|---|---|---|---|---|
| **Langfuse** | Open-source LLM engineering platform: tracing, evals, prompt mgmt, datasets, playground | MIT (self-host uncapped) | The **analysis layer the YAML ledger wants to be**: nest a trace per dispatch, a span per group, tag angles/anti-bias-axis; run **evals** (LLM-as-judge) to *score* `check-tension` historically. Includes **prompt management/versioning** → covers the prompt/agent-versioning seam too. Self-host free. Now backed by ClickHouse. | **telemetry/eval** · prompt versioning |
| **Arize Phoenix** | OSS agent/LLM observability + evaluation, OTel-native | Elastic-2.0 (free self-host) | Strong **agent-trace visualization + eval** with no event caps self-hosted; good for inspecting fan-out/fan-in structure and where loops thrash. OTel means no lock-in. | telemetry/eval |
| **OpenLLMetry** | Vendor-neutral OpenTelemetry instrumentation for LLM/agent apps | Apache-2.0 | Instrument **once** (OTel semantic conventions), ship traces to *any* backend (Langfuse/Phoenix/OpenObserve). Future-proofs the telemetry seam against backend churn. Adopt as the wire format the ledger emits. | telemetry (instrumentation standard) |
| **LangSmith** | LangChain's hosted tracing/eval/prompt-hub | Proprietary (closed) | Best-in-class DX for eval datasets + prompt hub, *but closed-source/hosted* — flagged as the anti-recommendation for a privacy-sensitive private repo. Included for completeness; prefer Langfuse/Phoenix. | telemetry/eval (vendor) |
| **Braintrust** | Eval-first LLMOps: datasets, scorers, experiments, prompt playground | Proprietary (closed) | Strongest **eval/experiment** workflow (scored regressions across prompt versions) — the discipline `check-tension` needs — but closed-source/hosted. Use as a pattern reference; implement the same scored-eval loop on Langfuse. | eval · prompt versioning (vendor) |

**Advocate's read:** Instrument with **OpenLLMetry** (Apache-2.0, OTel) → ship to **self-hosted
Langfuse** (MIT). That single stack converts the write-only ledger into: (a) queryable dispatch
traces, (b) historical `check-tension` scoring via evals, and (c) prompt/angle versioning — three
named gaps closed with permissive, self-hostable OSS and zero vendor exposure for a private repo.

---

## Candidates the brief under-weighted (advocate additions)

- **OpenTelemetry GenAI semantic conventions** (Apache-2.0) — the *standard* the ledger should emit;
  makes every observability tool above interchangeable. Adopt the schema even before a backend.
- **Kestra** (Apache-2.0) — declarative YAML, event-driven orchestrator; closest in *spirit* to a
  YAML-ledger-driven dispatch graph. Worth a look as a config-first scheduler.
- **Flyte** (Apache-2.0) — strongly-typed, versioned, K8s-native workflows with caching; the
  "typed DAG with reproducibility" option if artifacts/versioning become central.
- **AgentOps** (open core) — purpose-built agent-session telemetry (cost, tool-calls, loop counts) —
  a lighter, agent-specific alternative to Langfuse for the loop-thrash question (`max_loops` tuning).
- **Semantic Kernel / Microsoft Agent Framework** (MIT) — process framework with checkpointable
  workflows; another graph+state peer to mine, .NET/Python.

---

## Bottom line (advocate)

Ranked by leverage-per-effort onto *this* system:

1. **Durable execution — DBOS Transact (MIT), graduate to Temporal (MIT).** Closes the #1 named gap
   (no crash recovery) by wrapping the parent loop; group=step, graph=workflow, `max_loops`=loop.
   No change to governance semantics.
2. **Telemetry/eval — OpenLLMetry (Apache-2.0) → self-hosted Langfuse (MIT).** Turns the write-only
   `subagents-dispatch.yaml` into queryable traces + historical `check-tension` scoring + prompt
   versioning. All self-hostable → safe for a private repo.
3. **Graph runtime — LangGraph (Apache-2.0) or Google ADK (Apache-2.0)** as the *executor* beneath the
   dials, making `zig-zag`/`max_loops`/`robot_talks` mechanical (checkpointed) rather than
   parent-agent-interpreted.
4. **Sandboxing — E2B (Apache-2.0, Firecracker)** the day a dispatch runs code it didn't author.
5. **Protocols — MCP (MIT) now** (ledger/repo as server), **A2A (Apache-2.0) when** a group is
   implemented outside Claude Code.

The honest advocate caveat (owed under Radical Candor): the project's *control model* is sound and
should be kept; these tools supply the **runtime, durability, isolation, and analysis substrate** it
lacks — not a replacement for its governance. The skeptic's fair rebuttal will be adoption cost and
premature infra for a single-operator private repo; the strongest counter is that DBOS + Langfuse are
both *library-grade, self-hosted, permissive* — low-ceremony wins, not platform migrations.

---

### Sources

- LangGraph / CrewAI / AG2 licenses & comparison — https://softmaxdata.com/blog/definitive-guide-to-agentic-frameworks-in-2026-langgraph-crewai-ag2-openai-and-more/ · https://qubittool.com/blog/ai-agent-framework-comparison-2026
- OpenAI Agents SDK (MIT) / Swarm deprecated — https://openai.github.io/openai-agents-python/ · https://github.com/openai/swarm · https://www.respan.ai/articles/openai-agents-sdk-vs-swarm
- DSPy / Pydantic-AI / Mastra / Google ADK — https://github.com/pydantic/pydantic-ai · https://ai.pydantic.dev/ · https://www.paperclipped.de/en/blog/ai-agent-frameworks-tier-list-2026/ · https://dev.to/anmolbaranwal/open-source-toolkit-for-building-ai-agents-in-2026-55h1
- Durable execution (Temporal/Restate/DBOS/Inngest) — https://temporal.io/ · https://www.inngest.com/ · https://www.zenml.io/blog/temporal-alternatives · https://www.spheron.network/blog/ai-agent-workflow-orchestration-temporal-inngest-restate-gpu-cloud/ · https://zylos.ai/research/2026-04-24-durable-execution-agent-runtimes/
- Prefect / Dagster / Argo — https://www.zenml.io/blog/orchestration-showdown-dagster-vs-prefect-vs-airflow · https://kestra.io/resources/infrastructure/argo-workflows-alternatives · https://atlan.com/know/open-source-data-orchestration-tools/
- Sandbox infra (E2B/Firecracker/Modal/Ray) — https://github.com/e2b-dev/E2B · https://e2b.dev/ · https://manveerc.substack.com/p/ai-agent-sandboxing-guide · https://agentmarketcap.ai/blog/2026/04/11/code-execution-sandbox-race-2026
- Protocols (MCP/A2A) — https://a2a-protocol.org/latest/ · https://www.linuxfoundation.org/press/linux-foundation-launches-the-agent2agent-protocol-project-to-enable-secure-intelligent-communication-between-ai-agents · https://aws.amazon.com/blogs/opensource/open-protocols-for-agent-interoperability-part-4-inter-agent-communication-on-a2a/
- Observability/eval (Langfuse/Phoenix/OpenLLMetry/LangSmith/Braintrust) — https://github.com/langfuse/langfuse · https://github.com/arize-ai/phoenix · https://openobserve.ai/blog/llm-observability-tools/ · https://www.morphllm.com/comparisons/langsmith-alternatives · https://laminar.sh/article/braintrust-alternatives-2026
