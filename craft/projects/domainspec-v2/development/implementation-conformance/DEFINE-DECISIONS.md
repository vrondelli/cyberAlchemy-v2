# Define Decisions

| ID | Decision | Rationale | Consequence |
| --- | --- | --- | --- |
| DEF-D01 | Name the package `domainspec-v2.implementation-conformance` at `development/implementation-conformance/`. | The package concerns implementation binding and evidence reconciliation, not a language-specific linter. | One design boundary can host bounded TypeScript, Python, and Rust realizations without claiming parity. |
| DEF-D02 | Treat exact binding and evidence normalization as the package core. | Native tools already own style, type, compiler, and topology capabilities. | The package consumes native evidence and preserves raw diagnostics instead of rebuilding toolchains. |
| DEF-D03 | Keep one-file/one-export, arrow-only, filename, and folder conventions profile-local. | These are enforceable source conventions but do not prove semantic identity or composability. | A profile may select them; portable conformance cannot depend on them. |
| DEF-D04 | Reuse Code-Tag Conformance as the intended canonical mapping owner after its reformulation. | A second binding registry would create disagreement and stale projections. | `ImplementationBinding` is a reconciled package contract, not an independent mapping authority. |
| DEF-D05 | Reuse Architecture-Pattern Enforcement for admitted architecture laws. | Layer, edge, cycle, and direction laws already have an owner. | This package consumes architecture findings and evaluates profile obligations; it does not mint another pattern authority. |
| DEF-D06 | Make language adapters evidence providers, not semantic owners. | TypeScript, Python, and Rust differ materially in source graphs and extension surfaces. | Each realization may return `unsupported`; no lowest-common-denominator parser is selected. |
| DEF-D07 | Keep State Machine formation separate from runtime-contract evidence. | Canonical formation does not prove guards, transitions, effects, persistence, or delivery. | An application-owned fixture supplies bounded valid/invalid evidence without creating a DomainSpec runtime. |
| DEF-D08 | Emit `EvaluationReceipt` as generated evidence only. | Receipts and projections cannot authorize admission, exceptions, promotion, or release. | Every receipt carries claim limits and an external owner route. |
| DEF-D09 | Defer general exception acceptance. | No authority owner, lifecycle, expiry rule, or audit contract has been admitted. | `ExceptionRecord` remains a referenced future shape and cannot turn a failure into pass. |
| DEF-D10 | Stop at Define and Design. | The user requested architecture authoring, not execution planning. | No Work Pack, implementation task, linter installation, code, release route, or readiness claim is created. |

