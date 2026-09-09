# Essays Agent Runtime Local IPC

Result: selected
Selected option: `OPT-IPC-LOCAL-FRAMED-JSON`
Authority effect: none

Desktop and CLI clients will use versioned, bounded, length-framed JSON over a
Unix domain socket or Windows named pipe. The future protocol must bind actor,
workspace, request, command, expected revision, idempotency, errors, receipts,
replay, cancellation, and backpressure. Large content uses authorized handles
or bounded streams rather than unbounded inline messages.

OS permissions and peer credentials support authentication evidence; they do
not grant Essays semantic authority.

The machine-readable decision is `selection.json`, bound to request digest
`2739c16089f79da56a58a26306750b32753a2e73377c4b39ced2af294cb1f35e`.
