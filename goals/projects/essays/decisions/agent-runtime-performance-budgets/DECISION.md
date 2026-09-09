# Essays Agent Runtime Performance Budgets

Result: selected as unproven first-vertical conformance ceilings

Selected option: `OPT-RUNTIME-BUDGET-LEAN-INTERACTIVE`

Authority effect: none

The first vertical prioritizes immediate local control. On the selected native
Ubuntu 24.04 x86-64 reference host, its p95 ceilings are 400 ms to daemon
readiness, 1.5 seconds to a useful desktop, 10 ms for a bounded local query,
30 ms for a durably receipted command, and one second for crash recovery. The
idle daemon is limited to 96 MiB RSS; daemon plus desktop and WebView processes
are limited to 256 MiB steady RSS. The supported test envelope is two active
clients and a deterministic one-GiB store.

Every scenario requires at least 30 raw samples. Failures remain in the evidence
set, and a missed ceiling blocks conformance. The target cannot be weakened to
fit an implementation without another reviewed decision.

Browser processes are outside the base memory envelope and still need their
own numeric resource gate. WebAssembly remains governed by its separately
selected balanced hard ceilings.

These are testable targets, not proof that any implementation meets them. The
machine-readable decision is `selection.json`, bound to request digest
`30520fefd5651375ec2da2a7b66afe092d2e4899064167ba18848ff168c2edfe`.
