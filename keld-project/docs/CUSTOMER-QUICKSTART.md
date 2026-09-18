# ARE private alpha: first customer connection

Verified scope: Linux, Python 3, Node 26.8.1 and Codex 0.153.0-alpha.5. This is a
private release candidate; licensing and commercial delivery remain incomplete.

ARE connects to your agent, supplies selected project context, and records explicit
reasoning state. KELD provides the software package. Agent installation, model
access and a compatible app-server client are separate prerequisites.

## 1. Start with the customer bundle

Use the [customer bundle](CUSTOMER-BUNDLE.md), which includes the complete engine,
installer, setup tools and sample project. Verify its SHA-256 against a trusted
manifest before extraction. A hash proves matching bytes, not publisher identity.
Open a terminal in the extracted bundle directory. Check prerequisites:

```sh
node --version
python3 --version
/absolute/path/to/codex --version
```

Expected Node: `v26.8.1`. Expected agent: `codex-cli 0.153.0-alpha.5`. The launcher
checks the exact agent protocol binding. Do not edit that check to accept another
version without compatibility evidence. Codex and model credentials are not bundled.

## 2. Install and configure the included project

```sh
python3 tools/install-private-engine.py . ./engine
node engine/cyberAlchemy-v2/implementation/agent-reasoning-engine/bin/are.mjs doctor --json
node tools/setup-customer-profile.mjs ./engine ./example-project ./example-project/setup.json
```

All three steps should report PASS. Keep `engine` and `example-project` separate:
the former holds the software and dependencies; the latter holds customer context
and its `.are-keld` state. Setup refuses to overwrite an existing configuration.
The sample defines Widget and permits an explanation task. It is a starting point
for understanding the integration, not a policy granting arbitrary tool effects.

## 3. Connect your app-server client

Configure the client to launch this process from the extracted bundle directory:

```sh
node tools/customer-app-server.mjs ./engine ./example-project /absolute/path/to/codex
```

This is a JSON-lines protocol endpoint, not an interactive terminal chat. The client
sends `initialize` with `capabilities.experimentalApi: true`, waits for its response,
then sends `initialized`. It starts a thread whose working directory is the absolute
path to `example-project`, then starts a turn asking the agent to explain Widget
using the supplied project context. The client handles responses, streaming events,
and any approval/input requests. No graphical client is included in this bundle.

The older engine entry point using `profiles/repository-v1.json` selects ARE's own
repository context. Use the customer launcher above for your project. A successful
handshake alone does not establish a completed model task or quality improvement.

## 4. Configure your project deliberately

Use the [project starter](CUSTOMER-AUTHORING.md) to create a new explanation project
from your terms and instructions. Use [customer-profile setup](CUSTOMER-PROFILES.md)
for advanced source formats and boundaries.
All selected source files must be inside your project. Supply your own definitions,
ontology, instructions and routing policy; review the sample before adapting it.
Route changes require their decision-profile digest/provenance to remain consistent.
Broader routing authoring and upgrade migration remain unfinished release work.

Persistent state uses an append-only ledger and excludes concurrent writers. If a
session is killed, preserve its state and follow [customer recovery](CUSTOMER-RECOVERY.md).
The explicit reconciliation tool supports stopped local writers with a valid
checkpoint; it refuses incomplete ledgers and never replays uncertain actions.

## Evidence and limits

The bundle report binds the exact artifact, installation, context-projection and
engine tests. The customer-turn check separately demonstrates one real model task,
completed-frontier restoration and replay without another upstream call. These are
bounded integration results, not arbitrary-agent or general task-quality claims.

For maintainers, `check-host-handshake.py` exercises only initialization through the
engine repository profile. `check-customer-turn.mjs` exercises the separate customer
profile. Keep these different claims visible in release evidence.

## Open Questions

Supported-agent acquisition, friendly project authoring/migration, interrupted-task
recovery, final licensing, customer identity, delivery and support ownership remain
tracked in [release readiness](RELEASE-READINESS.md) and [project intake](PROJECT-INTAKE.md).
