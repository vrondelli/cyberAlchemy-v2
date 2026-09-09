# Essays Agent Runtime Desktop Host

Result: selected

Selected option: `OPT-DESKTOP-TAURI`

Authority effect: none

The desktop application will use Tauri v2 as a thin Rust-owned shell around
packaged local UI assets. Its WebView receives only narrowly declared native
capabilities and communicates with the supervised daemon through the selected
versioned local protocol.

Tauri does not own Essays state or policy. The daemon remains the only
accepted-state semantic authority, while browser automation remains a separate
supervised subsystem with its own effect gate. Exact frontend, plugin, update,
signing, installer, and platform bindings remain unresolved.

The machine-readable decision is `selection.json`, bound to request digest
`d964e7903ae59a45566d1179d6c59cc1937978c55f488cc8bc18a9b0c4cce9d2`.
