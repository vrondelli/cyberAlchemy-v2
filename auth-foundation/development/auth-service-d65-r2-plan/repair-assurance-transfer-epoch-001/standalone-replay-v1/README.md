# W5 standalone source bridge — v1 candidate

Run from the CyberAlchemy v2 checkout root:

```sh
python3 auth-foundation/development/auth-service-d65-r2-plan/repair-assurance-transfer-epoch-001/standalone-replay-v1/verify_source_bridge.py
python3 auth-foundation/development/auth-service-d65-r2-plan/repair-assurance-transfer-epoch-001/standalone-replay-v1/test_verify_source_bridge.py
```

The binding checks all 222 repository file references from the archived W5
input manifest against exact bytes in this standalone checkout. Only two
declared path prefixes are mapped. The old manifest, candidate, scripts,
profiles, logs, and 48-check product result remain unchanged.

The bridge is a source-byte prerequisite, **not** a replay verdict. Its
`w5_product_replay` field stays `not_performed`: the later run has a separate
candidate and result. The archived manifest embeds former host-tool identities
that cannot be reused as current tool identities.

## Standalone successor result, 2026-10-03

`run_replay.py` runs the unchanged W5 completion script from an isolated
old-layout copy. It binds its own exact bytes and `binding.json` into the new
candidate, and adds the isolated `ELAN_HOME` and `TMPDIR` to both generated EVF
profiles. The original W5 scripts, candidate, profiles, and 48-check result in
this checkout remain unchanged.

The captured output is in [replay-output-2026-10-03](replay-output-2026-10-03/).
Its candidate digest is
`63570b7a63cbeaafb568491448d2ec41ec497e6464841da5076819fdb33bf4ba`.
The full run passed 48/48 required checks and 64 Rust tests; executable and
theorem EVF evidence each passed independent S0–S12 verification. The recorded
product result says `product_approval_eligible: true`,
`product_approval: not-requested`, and `authority_effect: none`. This is
bounded local Auth Service/API evidence, not product approval, deployment,
credential verification, or `runtime_guarantees_observed` for AlchLang.

The copied output is an inspection snapshot. Its exact references still name
the isolated `/var/tmp/auth-w5-evf.km0MMA/workspace` and pinned host tools; it
does **not** become independently current merely because its JSON was copied
here. Re-run in a fresh isolated copy for a fresh currentness claim. The
prepared tool directory at `/var/tmp/auth-w5-evf.km0MMA` currently contains
Lean 4.33.1, Zig 0.16.0, and EVF binaries built from this checkout; it is
temporary and may need rebuilding if removed.

To inspect the recorded result:

```sh
jq '{status,candidate_digest,required_check_count,product_approval_eligible,product_approval}' \
  auth-foundation/development/auth-service-d65-r2-plan/repair-assurance-transfer-epoch-001/standalone-replay-v1/replay-output-2026-10-03/PRODUCT-TEST-RESULT.json
```

To make a new local run while the prepared tool directory still exists, from
this checkout root:

```sh
AUTH_W5_TOOL_ROOT=/var/tmp/auth-w5-evf.km0MMA
AUTH_W5_REPLAY_ROOT=$(mktemp -d /var/tmp/auth-w5-replay.XXXXXX)
mkdir -p "$AUTH_W5_REPLAY_ROOT/workspace/projects" "$AUTH_W5_REPLAY_ROOT/workspace/.git" "$AUTH_W5_REPLAY_ROOT/scratch"
cp -a auth-foundation "$AUTH_W5_REPLAY_ROOT/workspace/projects/auth-foundation"
cp -a craft/projects/domainspec-v2 "$AUTH_W5_REPLAY_ROOT/workspace/projects/domainspec-v2"
cp -aL agent-routing/node_modules \
  "$AUTH_W5_REPLAY_ROOT/workspace/projects/auth-foundation/development/auth-service-d65-r2-plan/repair-assurance-transfer-epoch-001/compiler-snapshot/node_modules"
export PATH="$AUTH_W5_TOOL_ROOT/elan-home/bin:$AUTH_W5_TOOL_ROOT/zig-x86_64-linux-0.16.0:$PATH"
export ELAN_HOME="$AUTH_W5_TOOL_ROOT/elan-home" ELAN_TOOLCHAIN='leanprover/lean4:v4.33.1'
export TMPDIR="$AUTH_W5_REPLAY_ROOT/scratch" CARGO_TARGET_DIR="$AUTH_W5_TOOL_ROOT/auth-target"
export AUTH_EVF_BIN="$AUTH_W5_TOOL_ROOT/target/debug"
export AUTH_ZIG_BINARY="$AUTH_W5_TOOL_ROOT/zig-x86_64-linux-0.16.0/zig"
python3 -B auth-foundation/development/auth-service-d65-r2-plan/repair-assurance-transfer-epoch-001/standalone-replay-v1/run_replay.py \
  --workspace "$AUTH_W5_REPLAY_ROOT/workspace"
```

The complete replay is expensive because EVF rehashes large, exact-bound
toolchain binaries across multiple checks and mutations. Do not rerun against
the existing completed workspace with the same attempt ID; use a fresh copy.

## Open Questions

- Which product-owner decision, if any, should be issued for this exact
  successor candidate? This replay does not infer one.
- Which durable release-grade environment should replace the temporary host
  paths if this candidate is later advanced beyond local review?
