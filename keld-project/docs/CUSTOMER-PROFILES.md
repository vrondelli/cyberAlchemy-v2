# Separate customer-project profiles

Candidate implementation for KELD's private ARE alpha. The engine installation
and customer project now have separate explicit roots in the KELD setup/launcher.
These scripts are development tooling outside the current engine archive; package
them into the eventual customer delivery before calling onboarding complete.

## Inputs and setup

The customer supplies a setup JSON with these fields:

| Field | Meaning |
| --- | --- |
| `project_id` | Lowercase project identifier, letters/digits/hyphens, at most 64 characters. |
| `decision_profile` | Project-relative verified ARE decision profile, with project-owned route registry and hashed provenance. |
| `definition_sources` | Nonempty list of project-relative definition JSON sources accepted by the engine adapter. |
| `system_ontology` | Project-relative ontology JSON containing `ontology_id`, `nodes` and `edges`. |
| `instruction_sources` | Explicit list of project-relative instruction files; an empty list selects none. |
| `context` | Explicit engine context selectors, source epoch, relations and non-authorizing posture. |
| `effect_defaults` | Explicit effect assessment configuration for the project. Unknown effects remain subject to engine gates. |
| `persistent_state` | Optional boolean; `true` enables a checkpointed file ledger under `.are-keld`. Defaults to process memory. |

The [integration test fixture](../scripts/setup-customer-profile.test.mjs) shows a
complete small project with one explanation route, one definition and one ontology
node. Its synthetic meanings are test inputs, not default customer authority.

```sh
node keld-project/scripts/setup-customer-profile.mjs \
  /absolute/path/to/extracted-engine \
  /absolute/path/to/customer-project \
  /absolute/path/to/setup.json
```

The setup creates a new `.are-keld` directory inside the project. It refuses an
existing directory rather than merging or overwriting it. It copies only six
hash-verified engine support JSON files: protocol interface/observation/projection,
continuation selection, context-basis receipt and reasoning policy. Project
definitions, instructions, ontology and routing are loaded from the supplied
project paths, never copied from the engine's repository defaults.

The generated profile is checked by the real engine loader. Invalid setup removes
only the newly created output; existing project files are preserved. Absolute or
escaping project paths and external symlinks are rejected, including transitive
decision-profile provenance. Live source refresh repeats the boundary check.
This check protects configured source selection; it is not a sandbox against
concurrent hostile filesystem mutation.

## Launch

```sh
node keld-project/scripts/customer-app-server.mjs \
  /absolute/path/to/extracted-engine \
  /absolute/path/to/customer-project \
  /absolute/path/to/tested-codex
```

The launcher loads customer context using the project root, verifies the exact
agent protocol version, and realizes the engine module port using the installation
root. It then uses the existing ARE stdio wrapper. It does not edit agent defaults
or register a managed daemon. The protocol client must choose the customer working
directory in its thread request. With `persistent_state: true`, the launcher
uses an append-only checkpointed ledger and acquires an exclusive writer lock.
The Python 3 launcher helper holds a Linux advisory lock across exec into the
actual Node writer. Normal exit and SIGKILL release it; the `writer.flock` inode
stays in place and must not be deleted while writers may run. A surviving writer
still excludes a second launch even if its outer launcher has died. Tests cover
local Linux storage, not network filesystems. Existing legacy `writer.lock` files
require confirmation that the old writer stopped before migration. This does not
implement interrupted-action recovery or gateway transport resumption.

`python3 keld-project/scripts/test_writer_lock.py` verifies live exclusion, release
after SIGKILL, stable lock inode, and symlink refusal.


The engine also creates `.are-keld/reasoning-state.jsonl.writer.lock`. Unlike the
outer OS lock, this internal lock can survive SIGKILL and prevents restart with
`reasoning.writer-lock-held`. Automatic crash restart is therefore **not** proved.
Stop all writers and preserve the complete `.are-keld` directory before explicit
reconciliation. Removing a lock does not repair an incomplete ledger or establish
whether an external action completed. Never delete `writer.flock` to bypass this.

## Evidence and limits

`node --test keld-project/scripts/setup-customer-profile.test.mjs` passes:

- Real wrapper preflight forwards a request containing the synthetic customer's
  instruction, definition and ontology; no CyberAlchemy routing vocabulary appears.
- Customer instruction changes refresh through the live provider.
- A source replaced with an escaping symlink fails the next source-boundary check.
- Existing setup is preserved, escaping input is refused, and invalid-profile
  cleanup leaves the project intact.

## Real task and recovery result

On 2026-09-17, the new launcher passed a real Codex 0.153.0-alpha.5 / `gpt-5.6-sol`
task using the extracted private archive and a separate disposable customer project.
The model returned an exact randomly generated delivery code supplied only through
the selected definition file. The prompt did not contain the code, and zero tool
items were observed. Completion status was `completed`.

After graceful process shutdown, a fresh wrapper recovered one completed-turn
frontier from the file ledger. Replaying the exact original completion notification
produced an explicit `replayed` receipt and zero upstream messages. This establishes
completed-frontier restoration and replay, not restart of the agent's transport,
recovery of an interrupted tool action, or general quality improvement.

```sh
node keld-project/scripts/check-customer-turn.mjs /absolute/path/to/tested-codex gpt-5.6-sol
```

This command invokes a real model through the selected local agent and requires
working model access. It writes bounded results to
`evidence/private-candidate/customer-turn.json`, retaining hashes and outcomes
rather than task text. Temporary engine/project trees are removed. The tested
archive SHA-256 is `b95a07e0ab880465aa1d2b4a3e8e243f983b0af4b38683ad9c732a0e63cb3962`.

A failed intermediate replay check reconstructed the completion message instead
of preserving its exact framing; zero upstream messages alone were insufficient
evidence of successful replay. The current check preserves the original message
and requires the explicit replay receipt.

## Open Questions

Remaining work: a friendly authoring path for customer routing and domain inputs,
crash recovery and transport resumption, packaging
these scripts with their support notices, and customer update/migration behavior.
See [delivery plan](DELIVERY-PLAN.md) for the full sale-preparation objective.

## Stopped-writer reconciliation tool

On Linux/local storage, `python3 tools/reconcile-customer-state.py ENGINE PROJECT`
inspects a stopped session. To apply, add `--expected-lock-sha256` with the returned
hash and `--confirm-local-stopped-writer`. Confirm the state belongs to this same
machine/PID namespace and all writers have stopped before using the flag. The
command refuses live PIDs and invalid/uncheckpointed ledgers, preserves and syncs
a private full-state backup, then clears only the internal stale lock. It never
replays actions. Retain the backup until recovery is verified. This does not
implement automatic recovery or transport resumption.
