# Essays Agent Runtime WebAssembly Identity

Result: selected, pending security-owner review

Selected option: `OPT-WASM-ID-OWNER-SIGNED-MANIFEST`

Authority effect: none

Every first-vertical component is bound by a deterministic owner-signed
manifest to its exact component, WIT, capability-profile, budget-profile, and
provenance digests. Verification against a versioned local trust store must
succeed before immutable content-addressed cache admission or instantiation.

Unknown, expired, unauthorized, or revoked signers and any byte or digest
mismatch fail closed. A valid signature establishes identity and integrity
under the selected policy; it does not establish safety, correctness,
acceptance, capability, or execution authority.

The exact cryptographic suite, manifest encoding, protected key custody,
rotation, revocation, and provenance-attestation binding remain subject to the
Essays security-owner gate. No keys, signatures, trust roots, cache entries, or
executable authority are created by this decision.

The machine-readable decision is `selection.json`, bound to request digest
`d7760c35bb01cfbc77768f66ecd97e5c2882bbd6422b3df8dc9adc61d4904696`.
