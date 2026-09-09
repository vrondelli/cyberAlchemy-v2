# Essays Agent Runtime WebAssembly Capabilities

Result: selected, pending security-owner review

Selected option: `OPT-WASM-CAP-PURE-PROPOSAL`

Authority effect: none

Each component receives one immutable, revision-bound invocation envelope and
returns one bounded typed proposal, diagnostic, evidence result, or explicit
failure. It cannot discover more workspace state or request tools while it is
running.

Only bounded structured logging and cancellation observation are exposed as
host imports. No filesystem, database, network, environment, clock, randomness,
secret, process, browser, or effect capability is linked. Component execution
remains prohibited until the separate Essays security-owner review is complete.

The machine-readable decision is `selection.json`, bound to request digest
`b3b14774287ccdb266cce3b9c6e7811c6ce143c4d6f82c08ac551419f6b31fda`.
