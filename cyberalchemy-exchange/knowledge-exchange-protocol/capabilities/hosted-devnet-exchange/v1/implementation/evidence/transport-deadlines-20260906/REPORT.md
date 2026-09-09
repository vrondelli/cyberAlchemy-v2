# KEP transport write-deadline prototype — 2026-09-06

**PASS for the isolated one-response HTTP/1.1 connection prototype. Hosted KEP integration remains incomplete.**

Route CA2-ROUTE-IMPLEMENT. Product construction: the next transport prerequisite in the reviewed response-admission plan. Operational support: bounded loopback fixture servers owned by the test process. No database, public RPC, key, preview or production operations were performed.

## Implementation

New `src/transport.rs` implements DeadlineIo and WriteDeadlines. It delegates both is_write_vectored and poll_write_vectored, and refuses a scalar transport because the previous epoch demonstrated Hyper's copying path defeats the byte-owned reservation.

Timers start at the first nonempty write. Successful positive-byte writes reset the idle timer; flush success does not reset the absolute timer. Both write and flush poll the timers, registering the task waker even if the underlying I/O remains pending. Timeout returns a sticky TimedOut error; shutdown remains allowed. Reads are delegated without a timer, and elapsed handler time before the first response write does not consume the write budget.

Candidate defaults are 30 seconds idle and 300 seconds absolute. Tests use short durations. This wrapper has a single write budget for its connection and intentionally exposes no unsafe reset mechanism. It is not yet suitable for a keep-alive connection serving multiple responses. The module is exported but the hosted listener and routes are unchanged.

## Verification

Command: `cargo test --offline --locked --features ui --test transport_deadlines --test response_admission -- --nocapture`.

**11 tests passed:** five existing ownership tests rerun and six new transport tests. See tests.txt.

- Real Axum HTTP/1.1 fixture: exactly four large responses admitted and two rejected with Retry-After. Server-side transfer capacity stayed reserved through the wrapper.
- Clients kept all four sockets open and consumed no body bytes. With a two-second idle timeout, the server released all four reservations without client disconnect. Subsequent reads ended with truncated bodies of approximately 3.9–4.0 MB, below the 13,333,416-byte expected length. This also illustrates why capacity release is not proof of client receipt.
- An independent control request succeeded during saturation. A subsequent complete 13,333,416-byte download returned exact fixture bytes and capacity recovered.
- A synthetic writer that never wakes itself was awakened by the idle timer and returned TimedOut; the timeout remained sticky and shutdown was permitted.
- A pending flush timed out after the full frame had been consumed, addressing the body-polling gap.
- A synthetic writer making repeated successful vectored writes and flushes could not extend the absolute budget.
- Waiting longer than both configured budgets before the first write did not cause a false timeout. This tests the handler-delay boundary, not database transaction cancellation behavior.
- Scalar transports were rejected, and the prior ownership diagnostic still reproduced the scalar-copy limitation.

These tests use the pinned dependency stack and a dedicated fixture router, not the actual KEP API or deployed binary. No browser, TLS, HTTP/2, persistence, retention, production throughput or long-term RSS claim is made. The total-budget trickle case is a deterministic synthetic I/O test, not a throttled real-network throughput measurement.

## Construction frontier

The isolated transport prerequisite now has executable evidence. Next runnable product work is persistent-response integration: associate a transfer generation with each bulk response and its connection, arm deadlines only for that response, and clear it only after owned data is released under the validated transport path. Do not reset on every flush or apply one transfer's deadline to a later keep-alive request. Verify normal repeated requests and idle connection reuse, as well as slow transfer termination.

Then wire the separate four-slot pool before file payload copying/serialization. Preserve the existing handler limits and leave acknowledgement/control traffic independent of bulk slots. Add actual KEP lifecycle tests for retention after partial downloads, existing acknowledgements during saturation, timeout/disconnect recovery, no persisted attempt on capacity rejection and fresh HTTP/soak trials. Test HTTP/2 separately or explicitly bound the supported transport; connection-level failure must not be mistaken for stream-level isolation.

The prototype does not cancel handler futures or database work itself. Real integration must still prove that a connection error does not interrupt an in-flight persistence commit, including pipelining or multiplexing cases. This obligation is not satisfied by the fixture's synthetic control endpoint.

## Operational support and residue

The test runtime owns and tears down its temporary servers. Deployment operator tasks—production proxy limits, legitimate-link timeout tuning, coherent database/binary recovery, clock investigation and separately authorized rollout—remain deferred. They do not prevent the next local integration work. No product approval, admission or operational authority follows from these test results.

## Preservation and open questions

Only src/lib.rs changed among pre-existing source/test/migration/evidence files; prior-lib.rs preserves its preimage. New src/transport.rs, tests/transport_deadlines.rs and this epoch are the other additions. Prior evidence and tests remain byte-identical. No dependency upgrade, migration, wallet/key access, alchLang change, commit, push or deployment occurred.

Open questions: how to bind response generations through the hosted connection service without widening cancellation scope; supported HTTP/2 behavior; whether the transfer pool needs an additional byte budget; and production timeout values. These must remain explicit until integration evidence resolves them.
