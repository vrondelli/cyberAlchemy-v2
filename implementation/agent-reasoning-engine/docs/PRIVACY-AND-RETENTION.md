# Privacy and retention

ARE stores explicit records of operations and reasoning so operators can recover and audit decisions.
It does not claim to store the model's hidden chain-of-thought. Operators must decide which user and repository data may enter
each record before enabling durable use.

## Data classes

| Data class | Examples | Default handling |
| --- | --- | --- |
| Request data | Raw user text, target refs, constraints, evidence refs | Bound to request and context records |
| Context evidence | Selected definitions, ontology records, instructions, source digests | Deterministically projected with provenance |
| Reasoning State | Explicit events, observations, dispatches, checkpoints, frontiers | Append-only. File-backed in the gateway profile |
| Runtime journal | Lifecycle events, cuts, replay and eviction receipts | Bounded operational store, distinct from Reasoning State |
| Gateway continuity | Consumer identity, resume token binding, buffered messages, acknowledgements, tombstones | Bounded local session store |
| Conversation data | Turn identity, route, pending decisions, canonical responses | Ordered runtime records |
| Interaction learning | Attributed correction, lesson, scope, application, revision or revocation | Prototype, participant-scoped, default off |
| Research evidence | Prompts, outputs, scores, token usage, manifests, decisions | Separate research storage and retention rules |
| Secrets | Provider credentials, encryption material | Supplied through secret-provider boundaries. Excluded from prompts and receipts |

## Current repository profile

The Candidate 018 repository profile uses these bounded defaults:

| Setting | Value |
| --- | ---: |
| Runtime journal maximum events | 4,096 |
| Runtime journal maximum closed turns | 256 |
| Gateway maximum clients | 8 |
| Buffered messages per client | 256 |
| Detached-session timeout | 5 minutes |
| Idle-session timeout | 30 minutes |
| Retained bytes per session | 4 MiB |
| Reasoning log bytes per session | 64 MiB |
| Expiration tombstone lifetime | 1 hour |
| Reasoning State mode | File per consumer, single writer |
| Gateway session store | Append-only file with fsync, single writer |

These are development-candidate defaults, not a general retention policy. The
owning values live in [`repository-v1.json`](../packages/codex-app-server-wrapper/profiles/repository-v1.json).

## Collection and projection rules

- Select context for the current request. Record excluded information. Do not add unrelated files to the prompt.
- Record the sources of included context. Record the transformations applied to that context.
- Keep credentials and provider reasoning content outside Context Envelopes,
  ledgers, receipts, examples, and research artifacts.
- Record the source and permitted scope of each interaction correction. Do not treat corrections as account-wide truth.
- Distinguish lesson delivery from proof that the model used the lesson or that the lesson helped.
- Record provider cache use only from configured observed fields.
- Do not place raw sensitive content in identifiers, filenames, or diagnostic
  reason codes.

## Retention, revision, and deletion

Runtime-journal eviction removes eligible closed operational segments under its
policy. It does not rewrite the append-only Reasoning State ledger. To revise or revoke an interaction lesson, append a new record.
This record prevents future delivery of the earlier lesson and preserves its history.

Session expiry, logical revocation, cache compaction, and physical deletion are
different operations. Candidate 018 has bounded session and journal mechanisms.
It does not define a complete physical-erasure policy for every copy, backup,
frozen candidate, or research artifact. Deployments that require such a policy
need an owner-approved data inventory and erasure procedure first.

## Operator controls

Before durable operation:

1. Choose private storage paths and restrictive filesystem permissions.
2. Classify repositories and participants permitted to use the instance.
3. Set storage, idle, buffer, and retention limits for the environment.
4. Keep secret-provider material outside persisted ARE records.
5. Define backup encryption and access ownership.
6. Define how a participant can inspect, revise, revoke, export, and request
   deletion of retained interaction data.
7. Bind research corpora and evidence destinations before live runs.
8. Verify deletion and compaction receipts without claiming removal from
   untracked external systems.

## Trust boundaries

The local gateway authenticates continuity with resume credentials and expects
private Unix-socket and storage paths. Candidate 018 does not establish network
service isolation, tenant separation, regulatory compliance, or a production
data-processing agreement. The host and provider have their own data handling
boundaries outside ARE's local records.

## Incident handling

If sensitive content enters a record unexpectedly, stop projection. Stop new writes.
Identify every derived record and external dispatch. Preserve only the
minimum incident evidence that policy permits. Rotate exposed credentials.

Follow the owning repository or provider deletion process. Do not edit an
append-only log in place and then claim its digest chain remains valid.

## Open Questions

- What retention, export, and physical-erasure policy should govern an accepted
  deployment?
- Which fields require structured redaction before a multi-user host is
  considered?
- How should frozen research evidence balance reproducibility with later
  participant deletion requests?
