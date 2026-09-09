# One bounded text task through RWO and ARE

Status: candidate implemented; native fixtures and one live VPS text task pass, 2026-09-07.
Authority effect: none. Owner: the user directing this VPS continuation.

## Plan and construction boundary

The next product frontier after the fixed smoke is immutable supplied-text work.
`CA2-ROUTE-IMPLEMENT` covers this owner-directed D65 construction: existing RWO
and ARE definitions → exact text-task binding → testable host/adapter extension
→ native fixture and bounded VPS evidence. No ontology selectors or governance
records are added. The pure RWO kernel and its fixture payload schema stay pinned.

The runnable product work is a closed task contract, task-aware CLI entry points,
command-before-effect journaling, verified completion, and offline replay.
Operational support belongs to the VPS operator: each task needs fresh private
state, exact source files, native hook trust and an explicit one-call budget.
The supplied example is selected for one transient VPS test under the continuing
user authorization. Existing active services are not replacement targets.
Workspace launch controls and multi-worker scheduling are deferred product work;
general recovery and MCP remain operational/integration residue.

## Contract

[task.example.json](task.example.json) shows the five required fields. Unknown
fields are rejected except the optional typed `objective_kind: "understand"`.
The current example and Workspace controls include that objective; historical
five-field tasks retain their original identities. Limits are measured in UTF-8 bytes: title 160, instruction
2048, input 8192. IDs use 1–80 ASCII letters, digits, underscores or hyphens.
Empty strings and NUL bytes are rejected. The exact normalized field order binds
the entire task, including title and ID, to a SHA-256 digest.

The worker receives the supplied instruction and text, with tools disabled by
the provider proxy. Budget: one provider request, 512 output tokens, nonempty
text output at most 8192 bytes. Completion validation establishes native/ARE
binding and output shape; it does not certify the answer's semantic correctness.
The task request ID must equal its task ID. A wrong digest or ID is rejected
before dispatch. Changed task content cannot reuse a host state or RWO history.

`task-host.mjs` compiles the task and uses the existing native host. It exposes
only private Unix control operations `status` and digest-bound `run` for tasks;
the smoke operation is rejected. `rwo/task-adapter.mjs` compiles the same task
and derives `RunAreLunaText` through the actual kernel before dispatch. Its
history uses the existing fsynced command/terminal journal. Timeout, uncertain
outcomes and interrupted dispatch still require inspection and never retry.

The transport retains the existing `thread/start` and `turn/start` flow described
in the [official Codex App Server documentation](https://learn.chatgpt.com/docs/app-server).
The pinned native binary is verified by the integration tests; no new API or
model substitution is introduced.

## Run and verify

Create a new stage using the pinned kernel from the prior build:

```sh
node prepare-task.mjs /tmp/new-task-stage /absolute/rwo-are-pilot-kernel task.example.json
```

The stage contains exact sources, host and adapter configs, and SHA-256 manifest.
Review that manifest and task before the separately routed VPS execution. The
VPS runner refuses existing source/state targets, prepares persisted hook trust,
starts a dedicated transient unit, runs the task, stops the host, then verifies
replay and projects its history. Credentials enter through systemd's existing
private credential-file reference and are never included in the task or output.

```sh
# After transferring the exact stage to the already selected VPS:
python3 /tmp/new-task-stage/run-task-vps.py /tmp/new-task-stage
```

The source closure mirrors this runtime directory. From that closure,
`node rwo/task-adapter.mjs adapter.json run` returns a completed receipt on replay;
`verify` emits Workspace-compatible task state. `serve` requires an explicitly
configured free loopback port and exposes the same read-only endpoint as the smoke
adapter. Task input/output stays in private state and CLI receipts; the public
shape of the read model contains title, status and execution bindings only.

Tests: [contract boundaries](../evidence/text-task-contract-test.json) and
[actual kernel/native host integration](../evidence/text-task-native-test.json).
The native test checks task content on the provider wire, wrong ID/digest
rejection, persisted task binding, completion, changed-task rejection and offline
replay. These fixtures perform no external model calls. Smoke adapter and native
launcher regressions also pass.

## Live result and retained state

The [live receipt](../evidence/text-task-live.json) records task
`rwo_text_summary_01`: one provider call, a two-sentence summary of the supplied
runtime status, a verified ARE completion and two accepted RWO transitions.
The transient host stopped after completion. Offline replay made zero new calls.
The existing Workspace projection function consumed the live task state and
matched its native turn ID. This test did not add a new persistent HTTP service
or change the existing port 18082 smoke monitor.

Exact source closure: `/srv/are-luna-pilot/tasks/1aceb74772c2b7f9`.
Private state: `/var/lib/are-luna-pilot/tasks/1aceb74772c2b7f9`.
The [post-live check](../evidence/text-task-post-live.json) verifies the source
manifest, stopped transient host, and unchanged active services. Preserve that
state; rerunning the installer deliberately refuses an existing target.

To read or replay the completed task on the VPS without a model call:

```sh
runuser -u are-luna -- /srv/are-luna-pilot/candidates/04384954e710e58f/bin/node \
  /srv/are-luna-pilot/tasks/1aceb74772c2b7f9/rwo/task-adapter.mjs \
  /srv/are-luna-pilot/tasks/1aceb74772c2b7f9/adapter.json run
```

The [adapter rejection tests](../evidence/text-task-adapter-test.json) verify
wrong-task receipts and invalid outputs cannot produce success or trigger retry.
The [smoke regressions](../evidence/text-task-regressions.json) preserve the
original fixed-smoke behavior.

## Open Questions

- [Workspace launch controls](WORKSPACE-LAUNCH.md) now provide explicit review,
  budget acceptance, private connection and result display; packaged desktop validation remains.
- Multiple tasks/workers need a separately bounded scheduling and capacity contract.
- Filesystem tools, worktree mutation, cancellation and uncertain-effect recovery
  remain outside this text-only task contract.
- The worker's answer quality needs task-specific acceptance criteria when tasks
  have requirements beyond text shape and verified delivery.
- Existing arbitrary Codex sessions and MCP remain deferred; this creates one
  bounded native task thread through ARE.
