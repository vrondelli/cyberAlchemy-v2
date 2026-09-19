# BC-003 Task Context

This session completes the generic effect proof path over the already passing
effect trace algebra, contained harness, and canonical node proof context.

The trace contract must be independently admitted and bound to both a source
proposal digest and proof context. Fixtures are input-only. Bindings contain no
expected values. Replay rebuilds only from immutable cases, bindings, raw
observations, evaluations, contracts, and digests; it never reruns the
asynchronous harness.

Strict coverage: pass.
