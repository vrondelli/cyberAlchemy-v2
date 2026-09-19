# Findings audit — initial

## Verdict

**REJECT**

| Audit area | Verdict | Finding |
|---|---|---|
| Artifact integrity | PASS | Findings SHA-256 exactly matches the writer receipt. |
| Evidence closure | PASS | All reviewer-receipt and synthesis-revision hashes match `evidence-closure.json`; referenced artifacts exist. |
| Local selectors | PARTIAL | All 21 cited paths exist and ranges are plausible, but the mandatory `implementation/domainspec` precedent is absent from `findings.md`. |
| Exact-binding fixture | FAIL | The TypeScript, Python, and Rust snippets define rule and use case together without actual `import`, `from … import`, or `use` edges. They therefore do not exercise the central direct-leaf dependency or barrel-bypass invariant. |
| Precedent | FAIL | `DEPENDENCY-RULES.md:7-10` supports inward dependency direction, but `LAYERING-REFERENCE.md:51-55` requires public index re-exports and forbids importing internal files—the opposite of the proposed mandatory leaf import. The finding neither cites nor resolves this conflict. |
| Tool evidence | PARTIAL | Named tooling claims are supported by maintained documentation: [dependency-cruiser configuration](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md), [Import Linter contracts](https://import-linter.readthedocs.io/en/stable/contract_types/), [Ruff’s plugin limitation](https://docs.astral.sh/ruff/faq/#can-i-write-my-own-linter-plugins-for-ruff), and [mypy’s unstable plugin API](https://mypy.readthedocs.io/en/stable/extending_mypy.html). The proposed TypeScript AST, Python `ast`, and Rust `mod`/`use` readers still lack named maintained extension surfaces in the finding. |
| Layer non-collapse | PASS | Style, source shape, topology, type, formation, admission, graph, runtime, evidence, and authority remain separately classified. |
| Verdict matrix | PASS | Complete and authority-conscious. |
| Blind spots and claim ceiling | PASS | Explicit; no implementation, execution, promotion, or production claim is made. |

## Bounded writer revision list

1. Restore explicit per-file TypeScript, Python, and Rust import/`use` statements from the admitted non-vacuity fixture, so each projection visibly exercises the required use-case-to-Rule-leaf edge.
2. Add exact `implementation/domainspec` precedent selectors and explicitly resolve the index/barrel-versus-leaf contradiction. Classify whether the v1 convention is retained, adapted, or superseded through an owner route; do not silently override it.
3. For every proposed source-shape/topology reader, either name and cite its maintained extension surface or classify it as a repository-owned evaluator with implementation/version selection still open. Add official CPython `ast` and Rust module-reference documentation where those readers remain recommended.

Claim ceiling: this audit establishes only artifact integrity and a bounded writer-revision requirement. It does not establish fixture execution, implementation, project fit, cross-language parity, profile admission, promotion, release, deployment, or production readiness. No files were modified.
