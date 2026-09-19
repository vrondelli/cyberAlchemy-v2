# TASK-SEC-002A — Fake-Local Grant, Resolver, And Lease

- Layer/slice: L1A / one provider-neutral fake-local transaction.
- Task ID: `TASK-SEC-002A`.
- SWU ID: `SWU-SEC-002A`.
- Status: `selected-pending-task-session-admission`.
- Admission timing: `selected-unit-at-task-session`.
- Lifecycle owner: `projects/secret-management`.
- Authority/publication: `private` / `internal`.
- Evidence ceiling: single-process, single-threaded CPython 3.12 candidate.

## Primary Behavior

An already-issued structural grant authorizes exactly one fake in-memory
resolver call and one bounded callback consumption; every rejected pre-resolution
condition makes zero resolver calls.

## Retained Boundary Rationale

Grant checking, resolver call count, and lease clearing form one independently
reviewable fail-closed transaction. Splitting them would no longer prove that
denials stop before material access or that successful access is bounded and
cleared.

## Dependencies

- `SWU-SEC-001` candidate evidence is satisfied by current live project bytes:
  6/6 L0 tests, 7/7 ElevenLabs static tests, and 3/3 voice no-network tests on
  2026-08-16.
- No SOPS policy, credential, external effect, migration, or production decision
  is a dependency because those scopes are explicitly excluded.

## Exact Material Writes And Baselines

| Path | State | SHA-256 | Size |
| --- | --- | --- | --- |
| `projects/secret-management/secret_management/execution.py` | absent | n/a | n/a |
| `projects/secret-management/tests/test_fake_resolution.py` | absent | n/a | n/a |
| `projects/secret-management/secret_management/__init__.py` | present | `5635561174f91e0a3384c42c0a08548581981af93bb46aa2102502547610d78d` | 528 |
| `projects/secret-management/README.md` | present | `3ee49baa6680b8477b71892ccae013d8b09de73173adb30419bf1d1eca4e1125` | 774 |

## Forbidden Writes And Effects

- Every other product path, including `projects/voice-production`.
- Historical refinement runs, Handoff Notice bytes, Inventory, Arcanum sources,
  telemetry, Git index/history/remotes, credentials, secret documents, SOPS,
  files/env/subprocess/network/provider/migration/deployment effects.

## Implementation Contract

- Product module defines `ExecutionGrant`, `SecretExecutionError`,
  `SecretResolver`, internal `SecretMaterialLease`, and `consume_secret`.
- Top-level exports omit the fake resolver and internal lease.
- Grant input identifiers are syntax-checked, digested, and discarded; the grant
  stores only digests, expiry, and one-shot state.
- `consume_secret` checks type, test-fake backend, reference/consumer/request
  bindings, `now < expiry`, and unused state before claiming the grant and before
  calling the resolver.
- Resolver is called at most once. The lease is claimed before callback entry and
  cleared/closed in `finally`. Callback must return `None`.
- Outward success is one redacted canonical receipt. Every outward failure is
  generic and excludes callback exception text and rejected input.

## Done Criteria

- All eight acceptance cases in `IMPLEMENTATION-PLAN.md` are implemented and
  passing.
- No new effectful import or cross-project/provider coupling exists.
- Only the four admitted material paths differ from their baselines.
- Terminal receipt records exact touched paths, structured command outcomes,
  evidence ceiling, residue, and no automatic successor.

## Structured Validation Contracts

```json
[
  {
    "command_id": "secret-l1a-focused",
    "argv": ["/usr/bin/env", "PYTHONDONTWRITEBYTECODE=1", "/usr/bin/python3.12", "-m", "unittest", "discover", "-s", "projects/secret-management/tests", "-p", "test_fake_resolution.py", "-v"],
    "cwd": ".",
    "timeout_seconds": 120,
    "max_output_bytes": 1048576
  },
  {
    "command_id": "secret-all",
    "argv": ["/usr/bin/env", "PYTHONDONTWRITEBYTECODE=1", "/usr/bin/python3.12", "-m", "unittest", "discover", "-s", "projects/secret-management/tests", "-p", "test_*.py", "-v"],
    "cwd": ".",
    "timeout_seconds": 120,
    "max_output_bytes": 1048576
  },
  {
    "command_id": "voice-elevenlabs-static",
    "argv": ["/usr/bin/env", "PYTHONDONTWRITEBYTECODE=1", "/usr/bin/python3.12", "-m", "unittest", "discover", "-s", "projects/voice-production/tests", "-p", "test_elevenlabs_static_projection.py", "-v"],
    "cwd": ".",
    "timeout_seconds": 120,
    "max_output_bytes": 1048576
  },
  {
    "command_id": "voice-network-denied",
    "argv": ["/usr/bin/env", "PYTHONDONTWRITEBYTECODE=1", "/usr/bin/python3.12", "-m", "unittest", "discover", "-s", "projects/voice-production/tests", "-p", "test_network_denied.py", "-v"],
    "cwd": ".",
    "timeout_seconds": 120,
    "max_output_bytes": 1048576
  },
  {
    "command_id": "secret-l1a-whitespace",
    "argv": ["/usr/bin/python3.12", "-c", "from pathlib import Path; paths=[Path(p) for p in ('projects/secret-management/secret_management/execution.py','projects/secret-management/tests/test_fake_resolution.py','projects/secret-management/secret_management/__init__.py','projects/secret-management/README.md')]; bad=[f'{p}:{i}' for p in paths for i,line in enumerate(p.read_text(encoding='utf-8').splitlines(),1) if line.rstrip()!=line]; raise SystemExit('trailing whitespace: '+', '.join(bad) if bad else 0)"],
    "cwd": ".",
    "timeout_seconds": 30,
    "max_output_bytes": 65536
  }
]
```

The focused test module owns the effectful-import/cross-project AST guard and all
privacy/replay/lease acceptance cases.

## Terminal And Closeout Contract

- Expected terminal source receipt:
  `projects/secret-management/development/secret-resolution-l1/runs/20260816T134104Z/task-session/task-session-terminal-receipt.json`.
- Closeout owner: `invoke:refresh:apply-approved`, admitted only through
  Continuation Router after terminal validation.
- Closeout target inventory: `WORK-PACK.md`, `WORK-PACK.json`, this task file,
  and `GAP-LEDGER.md` under the project-owned plan root.
- Allowed pass deltas: mark only `SWU-SEC-002A` evidence-complete, attach exact
  terminal/validation receipt refs, and preserve all L1B/L1C/later blockers.
- Unique successor: none. Return the blocked L1B/L1C choices without executing.
- Any failed acceptance-critical command leaves the task blocked and prevents
  pass closeout.
