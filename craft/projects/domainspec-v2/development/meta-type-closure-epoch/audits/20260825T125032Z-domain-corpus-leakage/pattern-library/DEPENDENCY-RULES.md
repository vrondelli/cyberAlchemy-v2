# Dependency Rules

1. A target may import language-runtime libraries and type-only generic contracts.
2. A target must not import family evaluator/decoder runtime, realization implementation, system fixtures, expected outcomes, mutants, or hostile test helpers.
3. A system corpus may depend on its own domain vocabulary and cases, but remains outside the generic target layer.
4. A realization composition adapter may depend on exactly one family evaluator and one target, and receives the system corpus as input.
5. A provider may execute the adapter and record evidence; it does not absorb authored semantics.
6. Every candidate language slot must declare one exact normalized source path, hash, and size.
7. Cross-language firewall validation must inspect TypeScript, Python, and Rust dependency forms and must pair import scanning with contextual literal/ownership evidence.

The current dependency findings are enumerated in [../LEAKAGE-FINDINGS.json](../LEAKAGE-FINDINGS.json).
