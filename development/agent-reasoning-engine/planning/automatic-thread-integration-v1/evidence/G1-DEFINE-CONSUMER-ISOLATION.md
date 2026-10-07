# G1 Define consumer isolation

Status: bounded local construction evidence, 2026-09-27. TUI is discontinued
and outside this check. No current desktop task, installed configuration,
external model, or host activation was changed.

## Gap and change

Define CLI previously defaulted to `codex:human-chat`, the same acknowledged
gateway consumer as the hosted Windows client. The gateway permits one attached
transport per consumer, so these two clients could block each other's
attachment and had no distinct session identity. Define now defaults to its own
exact `codex:define-cli` interaction consumer. The repository source profile,
default profile fallback, and generated runtime bundle allowlist all include
that identity. The hosted client's `codex:human-chat` identity is unchanged.
Existing historical gateway sessions are neither migrated nor adopted.

The chosen fixed identity is a reversible construction step. It separates
client products without adding a dynamic allowlist or claiming durable Define
conversation identity. A second simultaneous Define process still receives
the gateway's one-attachment rejection; per-invocation identity and credential
policy remain future work.

## Verification

- The local real-wrapper Define gateway fixture completed one read-only Define
  turn, then attached `codex:human-chat` concurrently. The gateway exposed two
  separate consumers, and the hosted consumer's `thread/read` for Define's
  backend thread was rejected before backend dispatch. A second concurrent
  Define attachment was rejected with `gateway.consumer-already-attached`.
- The generated runtime bundle retains its prior source epoch
  `682af6e6725d5c22200e7647d2fc983fac9f62f474f1f16d83b9926052ceefc8`.
  Removing only the new allowlist entry from the new bundle material reproduced
  the previous bundle digest
  `ad5ccbb52979e6609efeef0ae069027e911895cf61a5ad1720f913ef3fc2e450`.
  This checks that regeneration did not alter unrelated bundle material.
- Focused Define/profile/integration-map tests passed 53/53. Full Define
  `npm test` passed 71/71, including five fresh Alch/Craft verifiers. The
  full wrapper `npm test` passed 417, failed 0, skipped 5, after its exact
  allowlist expectation was synchronized.
- A disposable installed-Codex canary against
  `codex-cli 0.155.0-alpha.16.4` (binary SHA-256
  `20694b227d085e4ef69b5042ff7a2b262434eee470ae29f9a8a11b7a7551c520`)
  completed one Define turn through the gateway with a loopback fixed-response
  provider. It reported `consumer_id: codex:define-cli`, structured output on
  the provider wire, zero external model calls, and successful temporary-config
  removal and child teardown.

## Claim boundary

This is identity separation and one owned-thread negative test for two local
clients. It does not prove multi-invocation Define recovery, a unique human
identity, exclusive handover from the Codex desktop client, complete effect
interception, or control of this current chat. The Define implementation
binding remains candidate-stale; this evidence does not refresh or promote it.

## Open Questions

- Should Define acquire a per-invocation durable consumer identity and private
  resume credential, or remain explicitly single-attachment on this gateway?
- Which host/user decision and installed-client mechanism would permit exact
  desktop-task handover rather than a separate Define conversation?
