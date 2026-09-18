# Getting started

## Requirements

- Linux or WSL with the repository checkout and its sibling dependencies.
- Node.js `26.8.1`, matching `product.json`.
- The repository-native toolchain for Rust checks: `tools/toolchain/run`.
- Python 3 for the product-package mutation suite.

From `implementation/agent-reasoning-engine`, check the product:

```sh
node bin/are.mjs doctor --json
node bin/are.mjs candidate inspect --json
npm run release:verify
```

All three should report `PASS` for the frozen Candidate 018 workspace. The
candidate's source materializer copies its complete 907-file closure without an
Alch or DomainSpec compiler dependency. See
[Deployment](DEPLOYMENT.md#materialize-the-verified-candidate).

## Make a first routing decision

The decision CLI reads exactly one JSON request from standard input:

```sh
cat > /tmp/are-route-request.json <<'JSON'
{
  "schema_version": "are.cli-request/v1",
  "session_id": "manual-example-session",
  "request_id": "manual-example-request-1",
  "request": {
    "raw_request": "inspect the current ARE product health",
    "objective_kind": "inspect",
    "requested_effects": [],
    "target_refs": ["implementation/agent-reasoning-engine"],
    "constraints": ["read only"],
    "evidence_refs": [],
    "field_postures": {
      "request_id": "explicit",
      "raw_request": "explicit",
      "objective_kind": "explicit",
      "requested_effects": "explicit",
      "target_refs": "explicit",
      "constraints": "explicit",
      "evidence_refs": "explicit"
    }
  }
}
JSON

node bin/are.mjs decide route < /tmp/are-route-request.json
```

Carry the returned receipt into later `context`, `effect`, and `continue`
requests. Receipts bind inputs and decisions. They are not approvals.
Continue with the complete [request workflow](WORKFLOWS.md#evaluate-one-repository-request).

## Run the complete product suite

```sh
node bin/are.mjs test
```

Candidate 018 records 1,158 passing cases across 146 files and 20 targets. Run
the suite when the declared product closure changes. Use focused package tests
while developing one component.

## Start the gateway

```sh
node bin/are.mjs gateway \
  --config packages/codex-app-server-wrapper/profiles/repository-v1.json \
  --repository-root /path/to/domainspec-core \
  --listen /run/user/$(id -u)/are-codex/gateway.sock
```

The Unix socket and its parent directory must be private to the current user.
See [Gateway and agents](GATEWAY-AND-AGENTS.md) before connecting another host.

## Open Questions

- Should the repository add a one-command local bootstrap that checks all
  external compiler inputs before `doctor`?
