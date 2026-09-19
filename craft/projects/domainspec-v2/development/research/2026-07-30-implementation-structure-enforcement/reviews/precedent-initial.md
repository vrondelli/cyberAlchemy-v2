# Precedent review — initial feedback

## Precedent verdict

**FLAG, with no KILL.** The architecture direction survives, but the synthesis is not precedent-clean as currently expressed. Its language-tool composition is sound; several proposed DomainSpec objects overlap already-deployed owners and must be reframed as extensions, adapters, or projections.

| Proposed concern | Existing owner evidence | Classification | Required correction |
|---|---|---|---|
| Canonical semantic identities and relationships | `projects/domainspec-v2/definitions/meta-types/meta-types.yml:153-170,261-278`; `definitions/relationships/relationships.yml:101-146` | `already-deployed` | Reference Rule, Operation, State Machine, `enforces`, and `transitions`; do not redefine them. |
| `ImplementationProfile` and language projections | `projects/domainspec-v2/definitions/supported-profiles/supported-profiles.yml:1-69`; `impl/spec/minted-project/project.schema.json:3-45`; `impl/tools/minted-project/compiler.ts:287-453` | `build-from-owned` | Extend or companion the supported-profile owner. A second standalone profile registry would create duplicate authority. |
| Binding manifest | `impl/test-derivation-engine/src/bindings/index.ts:1-81`; `bindings/financial-settlement.json:1-14`; `impl/governance/tags/CODE-TAG-SCHEMA.md:1-51` | `already-deployed`, then `build-from-owned` | Select one canonical mapping owner. Sidecars and code tags must be reconciled or generated projections, not independent sources of truth. Avoid confusing implementation mapping with existing UI `Binding` at `meta-types.yml:23-27`. |
| Obligations and `EnforcementRuleSet` | `impl/test-derivation-engine/src/ir/types.ts:68-100`; `src/rules/index.ts:1-56,132-208,692-729` | `already-deployed` | Extend the existing content-addressed `Obligation` and versioned `RuleSet`; do not introduce another rule-set registry. |
| State-machine enforcement | `impl/spec/meta-types/lifecycle/state-machine.schema.yml:1-26`; `impl/test-derivation-engine/src/rules/index.ts:132-208`; `src/emit/spec.ts:41-67`; `src/emit/tests.ts:330-347` | `build-from-owned` | Transition obligation derivation is deployed. A contract may configure it, but runtime effects and scheduling remain application/use-case responsibilities. |
| Module boundaries | `implementation/domainspec/architecture/pattern-library/DEPENDENCY-RULES.md:1-22`; `LAYERING-REFERENCE.md:49-99` | `precedent-clean` when derived | Generate or reconcile native tool configuration from the owned profile. Do not establish parallel architecture configuration. |
| Shared evaluator | Existing package scripts, compiler validation, tag validators, and derivation engine | `precedent-clean` only as a pure reconciler | It may normalize results and evaluate cross-source agreement. It must not become a second compiler, task scheduler, CI system, or language-tool runner. |
| Violations and receipts | `impl/tools/minted-project/views.ts:46-77,147-167`; `impl/spec/features/ui-profile-create-player/generated/build-receipt.json:1-20` | `build-from-owned` | Normalize by referencing native diagnostic codes, raw artifacts, and digests. Do not create a general replacement receipt envelope or copy foreign tool state. |
| Suppressions | `impl/governance/tags/CODE-TAG-WAIVERS.md:1-41`; `validate-code-tags.ts:513-660`; `code-tag-waivers.yaml:1-29` | `already-deployed` for code tags | The synthesis’s “no accepted suppression owner” claim is too broad. General cross-tool exception semantics remain unowned, but the scoped code-tag waiver lane must be reused or explicitly distinguished. |
| Migration | `projects/domainspec-v2/IMPORT-MANIFEST.md:1-55,95-97` | `already-deployed` | Use the active Import Manifest; do not create a second generic migration ledger. |
| Generated projections | `impl/tools/minted-project/compiler.ts:585-650` | `already-deployed` | Generated views carry source/profile/registry digests and remain evidence, never canonical authority. |
| Public Arcanum integration | `cyberAlchemy-v2/SOURCE-MAP.md:10-33`; `arcanum/formulae/dispatch-spec/TECHNIQUE-CATALOG.md:96-103`; `arcanum/arcana/verification-weaver/README.md:1-27,49-60` | `precedent-clean` by reference only | DomainSpec implementation metadata remains private. Arcanum may route and link owner-held receipts; it must not absorb private manifests, diagnostics, or semantic prose. |

## External-language precedent

The proposed tool split is viable if DomainSpec owns only its policy and mapping:

- TypeScript: TypeScript project references and `tsc -b` own build-graph/type orchestration; typescript-eslint supports typed custom rules; dependency-cruiser owns dependency constraints. DomainSpec should generate or reconcile their configuration. [TypeScript project references](https://www.typescriptlang.org/docs/handbook/project-references), [typescript-eslint custom rules](https://typescript-eslint.io/developers/custom-rules/), [dependency-cruiser rules](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md).
- Python: CPython `ast` is suitable for an owned structural evaluator, with the Python version pinned. Import Linter owns import topology, while mypy owns typing. Ruff has no third-party custom-rule mechanism, and mypy’s plugin API is explicitly unstable. [Python AST](https://docs.python.org/3/library/ast.html), [Import Linter contracts](https://import-linter.readthedocs.io/en/stable/contract_types/), [mypy extensions](https://mypy.readthedocs.io/en/stable/extending_mypy.html), [Ruff FAQ](https://docs.astral.sh/ruff/faq/).
- Rust: Cargo and rustc own package/build/type checks; Cargo metadata exposes package dependency resolution, not the complete intra-crate module graph. Clippy owns standard lints. Dylint requires unstable compiler internals and is not a clean baseline dependency. [Rust modules](https://doc.rust-lang.org/reference/items/modules.html), [Cargo metadata](https://doc.rust-lang.org/cargo/commands/cargo-metadata.html), [Cargo check](https://doc.rust-lang.org/cargo/commands/cargo-check.html), [Clippy usage](https://doc.rust-lang.org/clippy/usage.html), [Dylint](https://github.com/trailofbits/dylint).

## Explorer feedback required

The explorer/synthesizer loop should repair these missing-source defects before the writer stage:

1. Add the supported-profile registry and minted-project compiler as the owner precedent for implementation profiles.
2. Reconcile code tags, derivation binding sidecars, and any new mapping manifest under one canonical owner.
3. Reuse the existing `RuleSet`, `Obligation`, and transition-obligation derivation.
4. Correct the suppression finding to recognize the deployed code-tag waiver lane while preserving the broader cross-tool exception gap.
5. Reuse the active Import Manifest and minted build-receipt/provenance model.
6. Bound the evaluator to normalization and cross-source agreement; leave tool execution, scheduling, and application state transitions with their existing owners.
7. Preserve the private DomainSpec/public Arcanum boundary through stable references and summaries only.

No files were changed, no output receipt was persisted, and no promotion or implementation action was taken.
