# Comparison arm review — R1

Not approved yet. All five dispatcher tests passed independently.

A plain executor exception after client creation bypasses result classification and loses both client receipt families on the thrown outcome. Attach conservative infrastructure-failure evidence for that path, preserving known and unknown spend and the original exception; add regression coverage. Errors already carrying a result are covered.

The explicit arm routing, bound task fields and common ceilings otherwise match this component’s declared scope. This review does not approve campaign execution. Exact source bindings are in the companion JSON.

## Open Questions

Owned by [COMPARISON-ARM.md](COMPARISON-ARM.md).
