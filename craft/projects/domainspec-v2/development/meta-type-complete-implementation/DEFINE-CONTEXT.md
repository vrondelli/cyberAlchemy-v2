# Define Context

## Context-builder contract

Mode: standard. Strictness: strict. Selected sources: 12, below the standard ceiling of 14. The context is private and repository-local; no public Arcanum artifact may copy its prose.

| Obligation | Selected evidence | Resulting constraint |
| --- | --- | --- |
| ontology formation | `definitions/meta-types/meta-types.yml`, `development/meta-type-definitions/{DESIGN,WORK-PACK}.md` | definition card and criterion fixtures precede active membership |
| relationship semantics | `definitions/relationships/relationships.yml` | source/target direction and non-examples are explicit |
| authority separation | `cyberAlchemy-v2/SOURCE-MAP.md`, `cyberAlchemy-v2/ontology/AUTHORITY-KINDS.md` | candidate read models and generated receipts do not promote |
| implementation evidence | `development/implementation-conformance/{SPEC,ARCHITECTURE}.md` | binding, native evidence, runtime evidence, and receipts remain separate |
| source/type assurance | `development/language-type-enforcement-parser-experiment/ARCHITECTURE.md` | parsing completeness is necessary but not semantic or runtime proof |
| three-language structure | `development/research/2026-07-30-implementation-structure-enforcement/findings.md` | use layered evaluators and exact negative fixtures; avoid universal syntax rules |
| v1 precedent | `implementation/domainspec/architecture/pattern-library/{DEPENDENCY-RULES,LAYERING-REFERENCE}.md` | precedents inform candidate architecture but do not silently govern v2 |

## Inventory preflight

The installed inventory validator passed with `lookup_readiness=ready`. Lookup returned accepted language/type enforcement evidence and candidate implementation-structure enforcement evidence. Inventory is used only as a discovery read model; load-bearing claims remain bound to the source paths above.

## Decisions extracted from intent

- The package is reusable; the actual meta-type is an execution input.
- A candidate ontology hypothesis may come first, but canonical identity moves only through definitions-governance.
- Canonical admission precedes design closure.
- TypeScript, Python, and Rust are independent witness lanes after the design gate.
- The package stops at bounded reference conformance; deployment and production claims are excluded.

## Structured interview disposition

Questions asked: 0. Decisions supplied by the user: lifecycle ordering, three target languages, and complete implementation as the destination. Remaining ambiguity: the identity and semantics of the actual meta-type. Verdict: pass for authoring a parameterized development package; blocking at execution until `INSTANCE-INTENT.md` is complete.
