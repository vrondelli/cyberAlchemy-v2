# KELD / Agent Reasoning Engine — private preview

This bundle contains the full ARE engine, customer-profile tools and a small
sample project. It is a local release candidate, not approved for sale or public
distribution. License and third-party notice review is unfinished.

ARE checks selected context and preserves explicit reasoning state around agent
requests. You supply the agent and model access. No hosted service is included.

## Prerequisites

- Linux, Python 3 and Node **26.8.1** for this tested setup.
- For the agent connection: an explicit path to the separately obtained
  **Codex 0.153.0-alpha.5** binary and working model access.
- A trusted copy of this bundle and its matching SHA-256 manifest. Hashes verify
  content integrity; they do not independently establish who supplied the package.

## Try the included project

Open a terminal in the extracted bundle directory. Run:

```sh
python3 tools/install-private-engine.py . ./engine
node engine/cyberAlchemy-v2/implementation/agent-reasoning-engine/bin/are.mjs doctor --json
node tools/setup-customer-profile.mjs ./engine ./example-project ./example-project/setup.json
```

Expected: installer PASS, doctor PASS and profile setup PASS. The example project
is separate from `engine`, even though both sit inside this bundle. Setup creates
`.are-keld` under the project and refuses to overwrite an existing setup.

To launch the agent protocol connection:

```sh
node tools/customer-app-server.mjs ./engine ./example-project /absolute/path/to/codex
```

This process expects an app-server JSON-lines client, not typed chat messages.
The client initializes with `experimentalApi: true`, selects `example-project`
as the thread working directory, then starts a turn. Ask it to explain Widget
using the supplied context. The sample is intentionally an explanation task;
its routing and effect policies do not authorize arbitrary project changes.

## Use your own project

Copy `project-spec.example.json` to `project-spec.json` and replace its project ID,
definitions and instructions with your own. Choose `persistent_state` explicitly.
Then create a new project directory with:

```sh
node tools/create-customer-project.mjs ./engine ./my-project ./project-spec.json
```

The directory must not already exist. The command creates editable source files,
binds the route/decision hashes, and validates the profile through the installed
engine. The starter supplies an explanation-only route, candidate definitions and
no arbitrary tool-effect permission. It does not adopt your definitions as authority
or configure the agent automatically. Review the generated files before use.

For advanced routing, use an explicit setup JSON based on `example-project/setup.json`
and supply your own route registry/decision profile, definitions, ontology and
instructions. Changing a route registry requires updating its bound decision-profile
digest and provenance; do not copy the starter as production policy without review.

All selected source paths are project-relative. The setup validates the real
engine profile and rejects sources or symlinks outside the project. Engine
protocol evidence remains version-bound. A protocol mismatch is a reason to
select the tested agent binary, not edit away the version check.

The included example enables `persistent_state`. The launcher creates a
checkpointed ledger and a Linux advisory writer lock under `.are-keld`. Python 3
is required for the persistent launcher. The operating system releases the lock
when the actual writer exits, including SIGKILL. The `writer.flock` file remains;
never delete or replace it while a writer may be running. Local Linux filesystems
are the tested scope; shared/network storage is unverified. A legacy `writer.lock`
blocks migration: confirm the old writer is stopped before removing that legacy
file. Do not edit or truncate the ledger to hide a recovery error. Lock release
does not resume interrupted actions or agent transport.


The engine also creates `.are-keld/reasoning-state.jsonl.writer.lock`. Unlike the
outer OS lock, this internal lock can survive SIGKILL and prevents restart with
`reasoning.writer-lock-held`. Automatic crash restart is therefore **not** proved.
Stop all writers and preserve the complete `.are-keld` directory before explicit
reconciliation. Removing a lock does not repair an incomplete ledger or establish
whether an external action completed. Never delete `writer.flock` to bypass this.

## Verified behavior and limits

The engine archive passed 1,244 product tests after extraction. Its doctor passed
in an isolated Linux Node container. Customer-profile tooling passed a real
model task using selected project context and a completed-state restoration/replay
check. Each bundle build separately checks extracted installation and customer
context projection; inspect its external manifest for that exact result.

These checks do not establish broad task-quality gains, interrupted-action
recovery, agent transport resumption, compatibility with arbitrary agents, other
operating systems, or legal distribution readiness. Diagnostic manifests and
checks are not sale approval.

## Open Questions

Before customer release: finish license/notice review, supported agent acquisition,
project authoring and migration guidance, interrupted-task recovery, authenticated
delivery, customer support and commercial policies. The private release owner
maintains those decisions; this sample grants no external effects.

## Stopped-writer reconciliation tool

On Linux/local storage, `python3 tools/reconcile-customer-state.py ENGINE PROJECT`
inspects a stopped session. To apply, add `--expected-lock-sha256` with the returned
hash and `--confirm-local-stopped-writer`. Confirm the state belongs to this same
machine/PID namespace and all writers have stopped before using the flag. The
command refuses live PIDs and invalid/uncheckpointed ledgers, preserves and syncs
a private full-state backup, then clears only the internal stale lock. It never
replays actions. Retain the backup until recovery is verified. This does not
implement automatic recovery or transport resumption.
