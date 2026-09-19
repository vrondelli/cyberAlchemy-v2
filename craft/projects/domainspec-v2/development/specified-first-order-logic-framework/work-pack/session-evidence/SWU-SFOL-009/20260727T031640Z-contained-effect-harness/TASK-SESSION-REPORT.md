# Task Session Report — SWU-SFOL-009

SWU-009 passes. The adopter-neutral core now exposes one versioned local
effect-harness SPI and a deterministic reference lifecycle covering setup,
pre-state capture, run/effect capture, post-state capture, trace validation,
and teardown.

Containment is owned by the harness rather than asserted by the adapter. A
finite resource registry, exact declared effect order, cooperative abort
signal, timeout, and lifecycle phase machine make setup failure, run failure,
partial trace, incomplete trace, undeclared effects, timeout, teardown
failure, resource overflow, and post-teardown leakage explicit. Teardown is
always attempted after setup completes, and its outcome is preserved even
when the target fails.

Focused 10/10, combined DS-SFOL 74/74, full engine 221/221, isolated strict
compile, dependency isolation, oracle/evaluator isolation, no-`any` scan, and
plan validation pass. The package-wide TypeScript command retains its recorded
external baseline residue and reports no owned harness error.

This is framework-corpus L2 observation containment only. Timeout requires a
cooperative local adapter; the SPI neither evaluates correctness nor proves an
external service. Canonical-node projection, adopter approval, BTE semantic
admission, release, and production remain outside this receipt.
