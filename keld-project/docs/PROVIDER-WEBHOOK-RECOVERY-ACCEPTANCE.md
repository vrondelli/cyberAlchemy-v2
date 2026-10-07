# Mercado Pago and PayPal webhook recovery acceptance

- **Status:** installed and VPS-compatible; provider runs not executed
- **Prepared:** 2026-09-20
- **Environment:** KELD sandbox staging only
- **Tool:** `deploy/capture_webhook_recovery_evidence.py`, local SHA-256
  `2ad4b83034e9f3df22125733c22e3ee23e75cc31ce6fe5ea03f4e0b1743d2d09`
- **Authority effect:** none; this runbook does not stop services, create a
  payment, request provider redelivery, or authorize production

## D65 boundary

- **Current product frontier:** schema-v3 r23 proves all-provider
  purchase/download and Stripe webhook recovery. Genuine Mercado Pago and
  PayPal webhook evidence remains open.
- **Runnable product work:** execute one bounded provider run at a time when the
  merchant/operator is present. The exact standalone verifier and runbook are
  ready on staging now.
- **Operational owner:** merchant owner triggers the sandbox payment/redelivery;
  operations owner controls the exact worker container; the agent observes and
  validates the evidence.
- **Affected stages:** webhook receipt, worker lifecycle, provider verification,
  ledger settlement or idempotent replay, authenticated download, redelivery.
- **Causal blocker:** a real provider event cannot be fabricated or inferred.
  The run requires a coordinated sandbox window.
- **Deferred residue:** refund/dispute policy, production event allowlists,
  production credentials, and cutover remain separate owner gates.

## Why the two providers use different modes

Mercado Pago Orders can complete asynchronously. Its acceptance mode is
`settlement-recovery`: the event must arrive while the worker is stopped and
the local order is still unpaid. After restart, one worker attempt must verify
the current provider state, create exactly one payment, and leave the customer
able to consume exactly one new artifact grant.

PayPal capture is deliberately initiated only by an authenticated KELD confirm
action. A webhook cannot normally create that capture. Its safe current mode is
`idempotent-replay`: a genuine `PAYMENT.CAPTURE.COMPLETED` event for the already
verified staging purchase must queue while the worker is stopped, process once
after restart, and create no payment or grant. A second genuine redelivery must
leave the work generation and attempts unchanged.

This PayPal mode does **not** claim recovery across the narrow crash window
between a successful PayPal capture and local ledger settlement. Exercising
that window requires a separately reviewed failpoint or controlled process
interruption; bypassing KELD to call PayPal capture is not an acceptable
substitute.

## Safety properties of the verifier

- reads SQLite in query-only mode;
- never sends HTTP requests or invokes provider SDKs;
- never stops, starts, or recreates a container;
- binds the worker container name plus immutable Docker container and image IDs
  across every phase;
- requires a healthy observation followed by an explicit stopped checkpoint
  before delivery, another stopped observation after receipt, and healthy
  observations after processing and redelivery;
- stores the resumable run state and final receipt with mode `0600`;
- uses keyed references internally and emits no customer, account, order,
  event, payment, remote-resource, or grant-token identifiers;
- binds the operator's provider-redelivery receipt only by byte count and hash;
- fails on concurrent provider orders, events, payments, or downloads inside
  the bounded run.

Run one provider at a time. Do not use a shared window in which unrelated buyers
can create orders or download artifacts.

## Live compatibility preflight

At `2026-09-20T17:18:00Z`, the exact local verifier source was streamed to the
staging VPS for in-memory compilation and read-only execution; no remote file was
created. It passed against the live Python runtime, the exact Docker inspection
format, and the current SQLite schema. The observed worker was running and
healthy with a 64-character container ID and 71-character digest-pinned image
ID. The artifact was 208 bytes with SHA-256
`233a65486c8f3ef9ecae954704be8b55c6bca5827c8f2b0cd309123a51b88769`.
Both provider inbox snapshots contained zero Mercado Pago or PayPal events, so
the future runs can require exactly one new provider event without confusing a
historical inbox item. Only aggregate table counts were returned; no customer,
order, payment, event, or token identifier was emitted.

At `2026-09-20T17:29:48Z`, the reviewed verifier was atomically installed as the
new standalone file `/opt/keld-staging/capture_webhook_recovery_evidence.py`.
The installed regular file is 24,806 bytes, owned by `root:root`, mode `0755`,
and has the exact reviewed SHA-256
`2ad4b83034e9f3df22125733c22e3ee23e75cc31ce6fe5ea03f4e0b1743d2d09`.
An in-memory compile and installed-source read-only execution against the live
Docker and SQLite formats passed. The artifact remained 208 bytes with SHA-256
`233a65486c8f3ef9ecae954704be8b55c6bca5827c8f2b0cd309123a51b88769`,
both provider inboxes still contained zero events, and only aggregate counts
were returned.

The current r23 manifest remains byte-for-byte unchanged at SHA-256
`6906d38c7457f1cb4aaa3d56d5d28df1e0bdfbaf975435689ef1894c2f3b0c96`
and still verifies because the standalone verifier is not an r23 manifest
input. The monitor timer remained active with its latest run successful at
`2026-09-20T17:29:32Z`; the exact worker remained running and healthy on the
r12 image. No service was restarted, no database or release manifest was
written, and no provider endpoint or event was triggered. Bind the verifier
only in a successor immutable manifest after a genuine provider run; never edit
r23.

## Common paths

Run from `/opt/keld-staging`. Substitute a new private directory for each run:

```sh
install -d -o root -g root -m 0700 \
  /opt/keld-staging/security-evidence/webhook-PROVIDER-YYYYMMDDTHHMMSSZ

RUN=/opt/keld-staging/security-evidence/webhook-PROVIDER-YYYYMMDDTHHMMSSZ/run.json
OUTPUT=/opt/keld-staging/security-evidence/webhook-PROVIDER-YYYYMMDDTHHMMSSZ/evidence.json
DATABASE=/opt/keld-staging/.runtime/commerce/commerce.db
ARTIFACT=/opt/keld-staging/.runtime/artifacts/sandbox.bin
```

Do not paste provider credentials, buyer credentials, webhook bodies, order
IDs, or event IDs into these commands or the final receipt.

## Mercado Pago settlement-recovery run

1. Confirm the worker and web receiver are healthy. Start the evidence run
   before creating the checkout:

   ```sh
   python3 ./capture_webhook_recovery_evidence.py begin \
     "$DATABASE" "$ARTIFACT" "$RUN" --provider mercadopago
   ```

2. Stop only the exact worker. Keep web and edge healthy:

   ```sh
   docker stop --time 135 keld-staging-worker-1
   python3 ./capture_webhook_recovery_evidence.py stopped \
     "$DATABASE" "$ARTIFACT" "$RUN"
   ```

3. Create one new Mercado Pago sandbox checkout and complete its Pix payment.
   Do not click KELD's status verification action. Wait until the provider shows
   the notification delivered.
4. Prove the signed event is durable and unprocessed while the worker is down:

   ```sh
   python3 ./capture_webhook_recovery_evidence.py received \
     "$DATABASE" "$ARTIFACT" "$RUN"
   ```

5. Start the same worker, wait for Docker health `healthy`, then prove exactly
   one settlement:

   ```sh
   docker start keld-staging-worker-1
   python3 ./capture_webhook_recovery_evidence.py processed \
     "$DATABASE" "$ARTIFACT" "$RUN"
   ```

6. Restore the checkout in the authenticated browser and download the artifact
   exactly once.
7. Request genuine provider redelivery of the same event. Save the provider's
   success/status response as a private file no larger than 1 MiB. After the
   provider reports delivery complete, finalize:

   ```sh
   python3 ./capture_webhook_recovery_evidence.py finalize \
     "$DATABASE" "$ARTIFACT" "$RUN" "$OUTPUT" \
     --redelivery-receipt /PRIVATE/mercadopago-redelivery-receipt
   ```

The final receipt passes only when there is one new paid order, one new payment
event, one consumed exact-artifact grant, one worker attempt, and no duplicate
work after redelivery.

## PayPal idempotent-replay run

The current ledger already contains the completed PayPal staging purchase. Use
its genuine `PAYMENT.CAPTURE.COMPLETED` provider event. Do not create another
checkout and do not call PayPal capture outside KELD.

1. Begin before asking PayPal to deliver an event not yet present in KELD:

   ```sh
   python3 ./capture_webhook_recovery_evidence.py begin \
     "$DATABASE" "$ARTIFACT" "$RUN" --provider paypal
   docker stop --time 135 keld-staging-worker-1
   python3 ./capture_webhook_recovery_evidence.py stopped \
     "$DATABASE" "$ARTIFACT" "$RUN"
   ```

2. Request the first genuine delivery from PayPal's sandbox controls. When
   PayPal reports success, prove the event is queued with zero worker attempts:

   ```sh
   python3 ./capture_webhook_recovery_evidence.py received \
     "$DATABASE" "$ARTIFACT" "$RUN"
   ```

3. Restart the worker, wait for health, and prove one idempotent processing
   attempt with no new order, payment, or grant:

   ```sh
   docker start keld-staging-worker-1
   python3 ./capture_webhook_recovery_evidence.py processed \
     "$DATABASE" "$ARTIFACT" "$RUN"
   ```

4. Request a second genuine redelivery of that same event, save the private
   provider receipt, and finalize:

   ```sh
   python3 ./capture_webhook_recovery_evidence.py finalize \
     "$DATABASE" "$ARTIFACT" "$RUN" "$OUTPUT" \
     --redelivery-receipt /PRIVATE/paypal-redelivery-receipt
   ```

The final receipt passes only when the same event remains generation 1 / attempt
1 and no payment or grant is added during either delivery.

## Failure handling

- If `received` reports more or fewer than one new event, leave the worker
  stopped only long enough to preserve evidence, inspect the private queue, and
  abort the run. Do not delete or edit ledger rows.
- If a command fails after the worker is stopped, restore availability with
  `docker start keld-staging-worker-1`, wait for health, and preserve the mode-
  `0600` run file for diagnosis.
- If processing enters `review` or `retry`, preserve it. Do not requeue or close
  it merely to make the acceptance pass.
- If unrelated commerce occurs during the run, the verifier fails closed.
  Start a new run later; do not rewrite the existing run file.
- A provider dashboard screenshot or export may contain identifiers. Keep it
  private; only its hash and size enter the final KELD receipt.

## Acceptance and claim ceiling

A passing receipt proves the phase-specific SQLite, artifact, and exact-worker
invariants described above and binds an external redelivery receipt by hash. It
does not authenticate the provider UI/export independently, approve refund
policy, establish a production event allowlist, or authorize production.

After each run, copy the final receipt off the VPS through the existing private
operator channel, install only the reviewed privacy-safe receipt under the
deployment baseline, capture a successor immutable staging manifest, and rerun
the monitor. Never edit r23.

## Open Questions

1. When can the merchant/operator coordinate the Mercado Pago run?
2. Can PayPal's sandbox controls redeliver the historical capture event that is
   absent from the current KELD inbox, or must a new authenticated purchase be
   scheduled?
3. Is post-capture/pre-ledger PayPal fault injection required before production,
   and if so, what exact reversible mechanism and maintenance window are
   approved?
