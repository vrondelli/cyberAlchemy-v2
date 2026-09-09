# Essays Agent Runtime WebAssembly Host

Result: selected

Selected option: `OPT-WASM-HOST-WASMTIME-COMPONENT-WASI02`

Authority effect: none

First-vertical extensions will run as WebAssembly components in Wasmtime,
using an exact versioned Essays WIT world and a pinned WASI 0.2 toolchain
baseline. WASI identifies compatible interfaces; it grants none of them by
default.

Every linked import must be explicitly selected, virtualized by the host, and
narrowed to the invocation capability envelope. Components remain untrusted
proposal producers. The Rust daemon validates every output and remains the only
accepted-state semantic authority.

The machine-readable decision is `selection.json`, bound to request digest
`8f6195bb2db9d64744b53db6ae8448887f31e9c2ac5b812a6709ed9d7aa3a621`.
