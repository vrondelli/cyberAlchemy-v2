# Essays Agent Runtime WebAssembly Posture

Result: selected

Selected option: `OPT-WASM-FIRST-VERTICAL-HOST`

Authority effect: none

The first vertical will include a capability-bounded WebAssembly component
host for portable extensions. Extensions receive revision-bound context and
return proposals, diagnostics, or evidence. They cannot mutate accepted Essays
state directly.

The host must deny ambient filesystem, process, environment, secret, network,
database, browser, and publication access. Every explicitly exposed import and
every execution must be identity-, capability-, resource-, cancellation-, and
evidence-bound. The native Rust daemon remains the sole accepted-state semantic
authority.

The machine-readable decision is `selection.json`, bound to request digest
`bbce69a3e05de172f800400b9f53fb840247f7700bc43ce8564d441c5aa341fa`.
