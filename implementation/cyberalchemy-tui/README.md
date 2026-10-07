# CyberAlchemy v2 TUI

Candidate system-wide terminal interaction shell. Define is the first capability
contribution; the shell, transport, projection, commands, and inspectors are not
Define-owned.

```bash
cd /home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/cyberalchemy-tui
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node bin/cyberalchemy.mjs
```

The normal path connects Define to the persistent ARE gateway. Start typing with
a broad domain, subject, context, or project. Commands:

- `/help` or `Ctrl+P` — command palette
- `/context` or `Ctrl+O` — definitions and ontology overlay
- `/define` — return to the Define workspace
- `/implement` — open the review-and-apply coding-agent workspace
- `/self-test` — run the disposable coding-agent product canary
- `/diagnostics` — inspect the current redacted run receipt
- `/quit` — exit

## Control-center prototype

Open the safe model-free product slice:

```bash
cd /home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/implementation/cyberalchemy-tui
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node bin/cyberalchemy.mjs --control-center-demo
```

The wide view shows Sessions, the active Chat, and a global Attention inbox.
Terminals narrower than 100 columns collapse those panes into tabs while
retaining the pending-attention count. Use `Ctrl+1`, `Ctrl+2`, and `Ctrl+3`
(or `Ctrl+A`) to change focus and the arrow keys to select sessions or attention
items. The demo contains fixture agents and queue items only: it starts no
model, tools, sandbox, background process, or approval effect.

Run its deterministic product checks with:

```bash
/home/vrondelli/.nvm/versions/node/v26.8.1/bin/node --test test/*.test.mjs
```

## Chat-first coding workspace

The coding agent can start directly as a conversation. Put the bounded scope at
`.cyberalchemy/coding-agent.json` in the target repository and run the ARE
gateway separately with its pinned Codex backend; the TUI does not need a
second local Codex executable:

```bash
node bin/cyberalchemy.mjs --repository-root /path/to/repository
```

You can also select the scope and gateway socket explicitly without supplying
session or proposal paths:

```bash
node bin/cyberalchemy.mjs --chat \
  --repository-root /path/to/repository \
  --coding-config /path/to/coding-agent.json \
  --gateway-socket /absolute/path/to/gateway.sock
```

The TUI creates a private unique workspace outside the repository for the
session journal and per-turn proposal receipts. A completed, rejected, blocked,
or verified turn returns to the composer so the user can continue the same
conversation. A changed repository still requires a separately displayed exact
digest confirmation and sandbox verification; chat text never grants mutation.

Define retains its terminal completion behavior. The chat-first coding workspace
stays open between completed, blocked, rejected, and verified turns. `Ctrl+C`
and `/quit` remain explicit exit paths.

Run the iterative coding agent in the TUI with an explicit runtime config,
repository, persistent session path outside that repository, and optional
proposal output:

```bash
node bin/cyberalchemy.mjs --implement \
  --coding-config /path/to/coding-agent.json \
  --repository-root /path/to/repository \
  --session /tmp/coding-agent-session.jsonl \
  --proposal-output /tmp/coding-agent-proposal.json \
  "Describe the bounded change"
```

Use `--max-steps`, `--resume`, `--cancel-file`, `--tool-policy <json>`, and
`--context-config <json>` to select the same bounded iterative controls exposed
by the non-interactive coding-agent CLI.

Check every launch dependency without invoking a model or changing the target:

```bash
node bin/cyberalchemy.mjs --doctor \
  --codex-command /absolute/path/to/codex \
  --coding-config /absolute/path/to/scope.json \
  --repository-root /absolute/path/to/repository \
  --proposal-output /tmp/unique-proposal.json
```

Run the complete disposable product path without opening the interactive UI:

```bash
node bin/cyberalchemy.mjs --self-test \
  --codex-command /absolute/path/to/codex \
  --coding-config /absolute/path/to/scope.json \
  --repository-root /absolute/path/to/repository \
  --proposal-output /tmp/unique-self-test-proposal.json
```

`--doctor` checks configuration, repository, optional local executable, wrapper profile,
output path, sandbox engine, and pinned image. `--self-test` uses a newly
created temporary repository and cannot approve or mutate the selected user
repository. The TUI also shows a bounded phase timeline for preflight, model
and tools, proposal, apply/verify, and terminal state.
Gateway connection and backend identity are checked at proposal start;
`--doctor` does not itself prove that a gateway is running.

The Implement workspace performs iterative read-only discovery and produces an
approval-bound proposal. It enters a separate review state and applies only
after the human supplies the exact `approval_digest`. Candidate, scope, profile,
baseline, sandbox, and verification bindings are rechecked before mutation.
An animated activity panel distinguishes repository/model work from approved
application and verification. Before synchronous verification begins, the
controller yields once so the applying state is visibly painted.

### Codex App Server

Codex mode uses the gateway's authenticated, pinned Codex backend and ARE
wrapper; the TUI needs a scope configuration, not an API key:

```json
{
  "schema_version": "are.codex-coding-agent-scope/v1",
  "observation_allowlist": ["package.json", "src/range.mjs", "test/range.test.mjs"],
  "mutation_allowlist": ["src/range.mjs"],
  "verification_command": ["node", "--test"],
  "maximum_steps": 8,
  "tool_policy": {
    "allow": ["list-files", "read-file", "search-text", "repository-map"],
    "ask": [],
    "deny": []
  },
  "repository_map": {
    "maximum_files": 256,
    "maximum_bytes": 262144
  },
  "sandbox": {
    "type": "container",
    "engine": "/usr/bin/docker",
    "image": "your-registry/coding-verifier@sha256:<64-lowercase-hex-digest>",
    "allowed_commands": ["node"]
  }
}
```

```bash
node bin/cyberalchemy.mjs --implement \
  --codex-command /mnt/c/Users/vlad_/.codex/bin/wsl/7201d2ecd19dd0c3/codex \
  --coding-config /tmp/codex-tui-scope.json \
  --repository-root /tmp/coding-agent-fixture \
  --proposal-output /tmp/coding-agent-proposal.json \
  "Repair sumInclusive so it includes both endpoints"
```

The Codex coding-proposal path now connects to the persistent ARE gateway as
`codex:coding-proposal`, separate from Define's `codex:human-chat` consumer. The
gateway pins the backend adapter and starts an ephemeral thread by default with
`on-request` approvals and a read-only sandbox. Thread and turn mutations use
stable request keys; a private, single-writer POSIX state file retains the
gateway resume token across completed proposal turns and TUI process restarts.
Each model turn now checkpoints a content-free intent before dispatch and
clears it only after a verified completed response. If a process exits with an
unresolved intent, the restarted TUI displays an uncertain/blocked state and
disables new proposals; it never automatically retries that turn.

The default ephemeral Codex thread does not expose full turn history through
this installed App Server. The TUI can recheck its owned thread's runtime
status with Ctrl+R, but cannot match the saved intent to a particular turn or
clear the block from that status alone. `--durable-proposal-thread` explicitly
opts into local Codex thread history. In that mode, read-only recovery can
match the saved prompt digest to exactly one host turn and report active or
terminal status without showing the prompt. Even a matching terminal turn
does not automatically restore the lost proposal or unblock new requests.

The file lives under the user's XDG state directory, outside the target
repository. A missing gateway or conflicting writer fails closed; the TUI does
not silently launch a second direct writer. This does not yet reconcile an
interrupted turn against host history or recover its lost proposal. Restored UI
history and native Windows secret custody remain open. This is not a handover
of the current Codex desktop task.

The two-process installed-host, fixed-provider canary exercises restart
recovery through this gateway path without an external model call or repository
mutation:

```bash
npm run canary:native-gateway -- /absolute/path/to/codex 'codex-cli <exact-version>'
npm run canary:native-gateway -- /absolute/path/to/codex 'codex-cli <exact-version>' --crash-recovery
```
The outer runtime supplies a deterministic map plus allowlisted `list-files`,
`read-file`, `search-text`, and `repository-map` observations across at most
`maximum_steps` model turns. Unknown, denied, or unattended `ask` tools block;
the Codex thread never receives direct host command or mutation authority.
The saved Codex proposal enters an explicit review state. Activate the visible
`Confirm & apply` button with `Enter`, type `/approve` followed by the exact
displayed digest, or type `/reject`. The button retrieves the exact pending
digest from the controller; it does not create a weaker approval path. Application
revalidates candidate bytes, scope configuration, wrapper profile, repository
baseline, and the approval digest before using the transactional patch-set
runtime. A configured digest-pinned container sandbox is mandatory; without it,
application blocks before mutation.
Closing the TUI while Codex is active closes its RPC client and gateway
connection; cancellation never grants an apply effect.

The package is an in-memory, non-authorizing interface realization. It does not
create durable sessions, admit ontology, promote definitions, or grant effects.
