# MTCI-009 — Rust Adapter and Witnesses

Owner route: governed parallel Task Session lane; Rust adapter owner. Status: ineligible until MTCI-007 passes.

## Outcome

Implement Cargo/module/rustc observation and the full Rust positive/negative witness set against the frozen observation contract.

## Candidate write scope

Only the selected Rust adapter/package and `instances/<slug>/realizations/rust/`. Shared contracts, TypeScript, Python, canonical definitions, and public Arcanum are forbidden.

## Evidence

Cargo metadata, bounded `mod`/`use` resolution, rustc/Clippy corroboration, public item/binding/topology facts, behavior when applicable, deterministic receipt, and typed unsupported results for unresolved macros, generated code, features, or conditional compilation.

## Acceptance

Every applicable obligation is pass/fail/unsupported-blocking with raw evidence; exact negatives fail for the intended cause; the frozen schema digest matches MTCI-007. Macro expansion is not assumed merely because compilation passed.

