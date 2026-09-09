# Essays Agent Runtime Supported Platforms

Result: selected as the first-vertical conformance target

Selected option: `OPT-PLATFORM-LINUX-X64-FIRST`

Authority effect: none

The first vertical targets Ubuntu 24.04 LTS on x86-64 with glibc. Its native
evidence matrix must cover the daemon, Unix-domain-socket IPC, SQLite recovery,
Tauri and WebKitGTK shell, Playwright supervisor and browser, Wasmtime
component host, packaging, installation, upgrade, and failure recovery.

This is a target selection, not a support claim. Support can be claimed only
after the complete pinned matrix passes on a clean native runner. macOS,
Windows, other architectures, musl distributions, and mobile or browser-only
hosts are deferred without weakening the portable protocol and capability
boundaries needed for later ports.

The machine-readable decision is `selection.json`, bound to request digest
`3592c1cae5eb4c0bbe405a611ae4f297a902ffb5987eb534ea3f0cfce110411c`.
