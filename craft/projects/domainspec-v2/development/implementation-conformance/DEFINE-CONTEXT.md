# Define Context: DomainSpec Implementation Conformance Package

## Context Builder Summary

- Task: Invoke Define and Design for the implementation-conformance package.
- Mode: standard, strict obligation coverage.
- Selected files: 14.
- Handoff pack: none; these are authoring artifacts, not runtime session evidence.
- Strict coverage: pass.
- Blockers: 0 for Define; owner-gated adoption decisions remain explicit gaps.

## Obligation Matrix

| ID | Obligation | Evidence | Status |
| --- | --- | --- | --- |
| DEF-O1 | Preserve the research claim ceiling. | accepted findings and closeout | covered |
| DEF-O2 | Define a package boundary without creating a second semantic-profile registry. | findings, supported profiles, authority models | covered |
| DEF-O3 | Keep code tags as the intended implementation-symbol mapping owner after reformulation. | code-tag schema, Import Manifest, code-tag conformance design | covered |
| DEF-O4 | Express exact binding, callable-entry, direct-use, and direction checks. | findings, canonical relationships | covered |
| DEF-O5 | Separate style, source shape, topology, native type, semantic formation, binding reconciliation, and runtime evidence. | findings enforcement model | covered |
| DEF-O6 | Define bounded TypeScript, Python, and Rust realizations. | findings toolchain matrix | covered |
| DEF-O7 | Separate canonical State Machine meaning from an application-owned runtime contract. | findings, meta-types, relationship authority | covered |
| DEF-O8 | Reuse existing Obligation, RuleSet, pattern, parser, waiver, and receipt owners. | findings and adjacent packages | covered |
| DEF-O9 | Preserve the v1 public-index versus direct-leaf conflict as an owner decision. | v1 dependency and layering precedent | covered |
| DEF-O10 | Carry blind spots, unsupported constructs, ergonomics, performance, and migration residue. | findings blind-spot and adoption sections | covered |
| DEF-O11 | Keep CAV2 patterns as harvested architecture/authority discipline, not DomainSpec method authority. | both local authority models | covered |
| DEF-O12 | Stop after Define and Design. | user instruction and Invoke contracts | covered |

## Included Context

| Source | Selectors | Obligation fit |
| --- | --- | --- |
| `development/research/2026-07-30-implementation-structure-enforcement/findings.md` | enforcement model through claim ceiling | DEF-O1–O10 |
| research `closeout-receipt.json` | accepted hash, non-claims, residue | DEF-O1, O12 |
| `authority/AUTHORITY-MODEL.md` | Core Rule, Authority Kinds, Non-Collapse Rules | DEF-O2, O8, O11 |
| `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md` | authority movement, closed kinds, narrowest owner | DEF-O2, O11 |
| `definitions/minted-project/supported-profiles.yml` | current profile admission and omissions | DEF-O2, O7 |
| `definitions/meta-types/meta-types.yml` | Rule and State Machine criteria | DEF-O4, O7 |
| `definitions/relationships/relationships.yml` | `enforces` and `transitions` directions | DEF-O4, O7 |
| `impl/governance/tags/CODE-TAG-SCHEMA.md` | canonical code-tag mapping shape | DEF-O3, O4 |
| `IMPORT-MANIFEST.md` | reformulation and migration ownership | DEF-O3, O8, O10 |
| Architecture-Pattern Enforcement `SPEC.md` | structure-law owner and package precedent | DEF-O8 |
| Code-Tag Conformance `DESIGN.md` | binding/drift precedent | DEF-O3, O8 |
| parser experiment `ARCHITECTURE.md` | pure-kernel and adapter boundary precedent | DEF-O6, O8 |
| v1 `DEPENDENCY-RULES.md` | inward dependency direction | DEF-O4, O9 |
| v1 `LAYERING-REFERENCE.md` | public index/no-internal-import conflict | DEF-O9 |

## Excluded Candidates

- `agent-spec-conformance/`: adjacent agent-output conformance concern; not the
  general implementation-binding package owner.
- first-production-release plans: useful later for release routing, but release
  scope is explicitly outside Define and Design.
- external tool documentation: already bounded and cited by the accepted
  findings; no new research claim is needed for authoring.

## Structured Interview Result

- Mode: Define/Design gap-check.
- Questions asked: 0; no unresolved blocker-level ambiguity remained after the
  evidence baseline.
- Decisions recorded: package name/path, define/design-only ceiling, composition
  boundary, and no second registry/compiler/runner.
- Remaining ambiguities: profile admission, direct-leaf policy, code-tag
  reformulation, tool versions, and exception acceptance are owner-routed gaps.
- Verdict: pass for authoring; not an implementation-readiness verdict.

