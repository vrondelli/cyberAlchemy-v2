# Lean Provider Runtime Detail

The provider is an EVF-local Python adapter over an exact existing Lean project;
it does not modify Lean source. It receives a validated request and admitted
manifest, builds in an isolated local work area with network disabled, captures
every command and raw output, inspects the named declaration and actual type,
audits `sorry`, unsafe declarations, and axiom closure, recomputes all source
and environment identities, and emits exactly one total receipt.

The positive integration fixture is the existing
`DomainSpec.SchemaInstance.pullback_comp` theorem. Success claims only that the
existing declaration checks under the exact pinned boundary. A nonzero process,
missing inspection, or incomplete identity is `unresolved`.

No provider manifest becomes admitted merely because its schema validates or a
test passes. Production admission is a later owner route.
