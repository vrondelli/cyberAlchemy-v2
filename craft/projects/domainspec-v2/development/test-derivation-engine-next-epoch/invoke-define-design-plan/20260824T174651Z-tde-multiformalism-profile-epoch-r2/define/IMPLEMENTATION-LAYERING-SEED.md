# Implementation Layering Seed

- L0 contracts: identities, digests, typed states, neutral IR, receipts.
- L1 intake and registry: source/currentness checks and explicit profile resolution.
- L2 derivation: language-neutral obligation and case construction.
- L3 adapters: TypeScript, Python, and Rust renderers plus normalization.
- L4 provider edges: runtime/toolchain execution and EVF/theorem handoff.
- L5 closeout: parity, residue, exact ceilings, and lifecycle receipts.

Dependency direction is inward: adapters depend on neutral contracts; neutral derivation never imports language adapters or provider execution.
