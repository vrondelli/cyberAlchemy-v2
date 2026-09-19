# Design Context

## System Of Interest

`domainspec-v2.implementation-conformance` is a profile-bound library contract
that reconciles existing semantic, mapping, architecture, derivation, and
native-tool evidence into a deterministic evaluation receipt.

## Constraints

- Define and Design only; no product code, package manifest, Work Pack, or
  mutation-ready task may be created.
- Semantic admission, canonical mapping, architecture laws, derivation,
  execution, exception acceptance, promotion, and release remain external.
- The contract kernel is pure. Project-owned adapters may execute tools but do
  so outside the shared evaluator.
- TypeScript, Python, and Rust share result meaning, not parser implementation.
- `unsupported` remains visible and blocks a passing evaluation when its
  evidence class is required.
- Raw native diagnostics remain reachable, subject to a data-lifecycle owner.
- No general exception owner is assumed.

## Selection Evidence

| Artifact | Status |
| --- | --- |
| `DESIGN-SCOPE-MANIFEST.json` | closed, unknowns empty, exact input digest |
| `DESIGN-DENOMINATOR-RECEIPT.json` | pass; independently extracted |
| `DESIGN-SELECTION-RESULT.json` | pass; fixed point; `design-validator-pass` |
| denominator replay | byte-identical |
| selection replay | byte-identical |

Selected extensions are authority/trust, state/event, failure/compensation,
quality, integration/versioning, migration/rollout, data lifecycle, and
validation contracts. Security, persistence, and UX are N/A for the bounded
package. Rollout and performance are recommendations, not selected claims.

## Design Interview Result

The gap-check found no ambiguity that prevents architecture authoring. Direct
leaf versus public index, package admission, code-tag reformulation, exception
authority, and data retention are consequential owner decisions and remain in
the gap ledger. Design does not answer them by assumption.

