# Durable SQLite transactional Outbox and integration layers — results

Status: layers L0–L3 implemented and locally validated; L4 technical candidate
assembled. Stable promotion and canonical provider admission remain human-owner
gates.

Governed conformance remains `not_evaluable`: the accepted Work-Pack binds an
older digest of the current DomainSpec graph loader. No accepted digest was
silently refreshed.

## Runtime path

```text
AlchLang action
  -> explicit performs edge and effect contract
  -> exact integration-binding resolver
  -> atomic versioned state + Outbox commit
  -> lease-owning durable worker
  -> stdout or confirmation-gated HTTP transport
  -> published, retry-scheduled, or dead state
  -> optional transactional SQLite inbox
```

## Implemented layers

- L0: exact runtime binding, explicit request envelope, atomic commit, rollback,
  and optimistic aggregate versioning.
- L1: pending inspection, stable message identity, separate stdout dispatch,
  and successful publication marking.
- L2: exclusive expiring lease, restart reclaim, bounded exponential retry,
  attempt ceiling, dead letter, requeue, and replay reconciliation.
- L3: exact-origin HTTP allowlist plus CLI confirmation, stable idempotency
  header, transactional inbox, v1-to-v2 migration, and runtime telemetry.
- L4 technical input: provider candidate, deterministic D65 projections, exact
  construction binding, local tarball, and source/packed CLI parity. This does
  not perform the human governance decisions.

## Evidence

| Surface | Result |
| --- | --- |
| Runtime integration validation | PASS — 11 checks |
| Package tests | PASS — 48/48 |
| DomainSpec source | PASS — 38 nodes, 32 relationships |
| Source manifest | `4449c0c790a8fcdc0e981c15436bbce5ac18a795a1ae0312d295a8a8058b0f3a` |
| Exact binding self-validation | PASS — see `evidence/construction-binding.candidate.json` |
| Governed conformance | `not_evaluable` — stale accepted Work-Pack loader digest |

## Test the local flow

```bash
export PATH=/home/vrondelli/.nvm/versions/node/v26.8.1/bin:$PATH
package_root=cyberAlchemy-v2/language/capabilities/alchlang/plans/general-compiler-v1
demo_dir=$(mktemp -d)

node "$package_root/implementation/dist/cli.js" run \
  "$package_root/implementation/examples/outbox-operation.md" \
  CommitOrderWithOutbox \
  --actor OrderService \
  --facts '{"operationId":"operation-1","orderId":"order-1","status":"pending","outboxMessageId":"message-1","occurredAt":"2026-09-03T12:00:00.000Z","payload":{"kind":"order-committed"}}' \
  --grant order-transaction-authority \
  --binding sqlite-transactional-outbox \
  --database "$demo_dir/outbox.sqlite" \
  --effect-request-file "$package_root/implementation/examples/outbox-request.json"

node "$package_root/implementation/dist/cli.js" outbox pending \
  --database "$demo_dir/outbox.sqlite"

node "$package_root/implementation/dist/cli.js" outbox dispatch \
  --database "$demo_dir/outbox.sqlite" \
  --transport stdout \
  --worker-id test-worker \
  --now 2026-09-03T12:00:00.000Z
```

## Remaining boundaries

- Online/downgrade migration and long-window compatibility evidence.
- Credentials and external broker/provider integrations.
- HA, multi-region, load, chaos, and production recovery evidence.
- Canonical DomainSpec provider admission, independent governance review, and
  owner-controlled stable-pattern promotion.

The pattern remains a candidate. Local PASS does not make it stable or admitted.
