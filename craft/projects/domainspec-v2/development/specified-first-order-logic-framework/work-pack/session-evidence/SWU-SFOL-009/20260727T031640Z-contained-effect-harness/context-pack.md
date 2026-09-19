# Context Pack — SWU-SFOL-009

Selected `SWU-SFOL-009` after the passing SWU-008 owner receipt. Scope is only
a versioned local effect-harness SPI, one deterministic reference lifecycle,
its containment matrix, and this evidence.

The harness owns a finite resource registry, effect count/order checks, a
cooperative abort signal, a timeout, and phase state. It captures typed raw
pre/post state and call/write/event/error observations, always attempts
teardown after successful setup, then submits the complete raw trace to the
SWU-008 shape/type validator. Timeout, setup/run/capture failure, partial
trace, undeclared effects, incomplete teardown, resource overflow, and
post-teardown leakage must remain explicit diagnostics.

The SPI contains no expected result, predicate, evaluator callback, or
acceptance field. It cannot judge business behavior, project canonical nodes,
adopt a feature, admit BTE semantics, or authorize release or production.
