# KEP byte-owned response reservation prototype — 2026-09-06

**Scoped prototype: PASS on the current vectored TCP HTTP/1.1 path. Generic transport guarantee: NOT PROVEN; scalar-copy path demonstrably defeats the reservation. Hosted KEP repair remains incomplete.**

Route CA2-ROUTE-IMPLEMENT. Product construction: next dependency from the reviewed plan, the byte-ownership prototype and stronger admission tests. Operational support: temporary loopback fixture servers owned by the Rust tests. No PostgreSQL, public RPC, preview, production or keys were used. The module is exported but not wired into Application or hosted routes.

## Implemented

`src/response_admission.rs` provides TransferPool, a reservation acquired before payload allocation, and an immutable Bytes owner containing both the payload and its OwnedSemaphorePermit. Clones and slices retain the same owner. Payload storage is dropped before the permit field returns capacity. Dropping an unused reservation also releases capacity. No dependency version or lockfile changed.

This bounds ownership of retained allocations on the validated stack, not remote download completion. Copying bytes into another allocation does not transfer the reservation. Small buffers may drain to kernel buffers and release capacity before a client consumes them; no client-receipt or kernel-memory accounting claim is made.

## Five tests and evidence

`cargo test --offline --locked --features ui --test response_admission -- --nocapture` passed all five tests (tests-complete.txt).

1. A final 13,333,416-byte frame retained its reservation after the Body was dropped. Clones and a one-byte slice kept ownership live until the last reference dropped.
2. An abandoned reservation and empty payload released capacity.
3. A real Axum loopback HTTP/1.1 fixture accepted exactly four held large responses and rejected the next two with Retry-After. The test asserted server-side available capacity remained zero while readers were idle. Three cycles checked one-slot release and replacement, complete release after disconnect, successful 1 KiB and 13,333,416-byte full reads with exact fixture bytes, and a responsive independent control endpoint. This cannot pass by rejecting every request.
4. A negative handler-lifetime control admitted all six readers and reported all four slots available, reproducing the old boundary error.
5. A negative scalar-I/O control demonstrated that Hyper's flatten/copy path also admits six and releases all four byte-owner slots. This passing diagnostic test confirms a limitation; it is not a PASS for bounded response resources on that path.

The fixture uses the same pinned Axum and Hyper dependencies as the hosted application, but is not the actual KEP router or deployed binary. The control endpoint is synthetic, not evidence that actual account/acknowledgement routes remain live under saturation. No retention, persistence, timeout, TLS or HTTP/2 claim is added. No new throughput or RSS measurements were made.

## Copy-path finding

Pinned Hyper 1.11.1 `src/proto/h1/io.rs` selects Queue for I/O advertising vectored writes and Flatten otherwise. Flatten copies the data into its header buffer. The original Bytes owner can then drop while copied bytes remain queued. This is relevant to the planned timeout I/O wrapper: forgetting to forward both is_write_vectored and poll_write_vectored would reintroduce the resource gap.

Keep the generic-transport claim closed. A timeout transport prototype must preserve vectored support and prove the same four-slot regression through that exact wrapper. If the selected path requires flattening or another unaccounted copy, use independent connection/stream accounting or an explicitly enforced compatible transport policy; do not silently accept the byte-owner design as sufficient.

## Construction frontier and next dependency

The ownership experiment is complete for plain TCP and the copy hazard is now executable evidence. Next runnable work is the transport prototype: preserve vectored writes, observe stalled-write and total-transfer deadlines independently of body polling, and verify buffer/reservation release on timeout. Use short injected durations in tests and avoid cancelling database commits. Then wire the separate transfer pool before file payload cloning/serialization and exercise the real KEP routes. Actual account and acknowledgement liveness, retention invariants and the fresh HTTP/soak runs remain required integration evidence.

Node B of the earlier plan is only partially covered here: positive admission, held owner state, disconnect and full-read recovery are tested. No-read timeout, trickle behavior, exact retention snapshots and real route liveness remain with transport/integration work. Node C has a scoped supported-path result plus an explicit unsupported-path finding. D/E/F/G/H are not claimed complete by these tests.

Operational residue remains with the deployment operator: production proxy/connection limits, TLS/HTTP2 scope, timeout tuning, host clock investigation, coherent recovery and separately scoped rollout. No operational item prevents the next local transport prototype. This evidence grants no product approval, admission or deployment authority.

## Preserved historical residue

Only src/lib.rs was changed among pre-existing source/test/migration/evidence files; its preimage is retained in prior-lib.rs. The new module, new integration test and this new evidence directory are the other additions. Existing HTTP FAIL, clock-fix PASS and review epochs remain unchanged. Their manifests continue to bind historical source bytes; current lib.rs belongs to this new epoch. Unrelated dirty work, alchLang, migrations, keys and running services were not changed. No commit, push or deployment occurred.

## Open questions

Can the planned transport wrapper preserve the validated ownership path while timing out stalled writes? What other enabled protocols or response routes need independent accounting? Do serialized-size ceilings plus four slots sufficiently bound transient allocations? These remain explicit future evidence obligations.
