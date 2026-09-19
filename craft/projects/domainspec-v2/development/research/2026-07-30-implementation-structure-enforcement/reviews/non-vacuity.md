# Non-vacuity review

## Gate verdict

`CONDITIONAL_KEEP`.

The exact-binding architecture changes observable verdicts across the requested fixture. It survives only with these repairs:

1. Rust module topology cannot be attributed to `cargo metadata`; that output describes packages and package dependencies, not source-level `mod`, `use`, or re-export edges. The bounded fixture needs a shared evaluator restricted to explicit, macro-free `mod`/`use` syntax. `#[path]`, `cfg`, macro-generated modules, and runtime loading must produce `unsupported`, never pass. [Cargo metadata documents its package-level graph](https://doc.rust-lang.org/cargo/commands/cargo-metadata.html).
2. Compiler exhaustiveness must be consumed and normalized, not reimplemented. TypeScript `never`, mypy `assert_never`, and Rust exhaustive matching already own the language guarantee. DomainSpec value is binding that evidence to the canonical State Machine/profile and recording it in the receipt. [TypeScript](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), [mypy](https://mypy.readthedocs.io/en/stable/literal_types.html), [Rust](https://doc.rust-lang.org/reference/expressions/match-expr.html).
3. Suppressions remain violations. The initial gate may validate exception-record completeness but must not invent an accepted-with-exception authority verdict.

Nothing below was implemented or executed.

## Smallest fixture

Common manifest:

```yaml
fixture_id: rule-transition-001
rule_id: can-approve
use_case_id: approve-order
input: { state: draft|approved, eligible: boolean }
valid: { from: draft, to: approved, effect_intent: OrderApproved }
invalid: { from: approved, to: approved }
required_edge: approve-order -> domain/rules/can-approve leaf
forbidden_edges:
  - rule -> use-case
  - rule -> adapter
```

TypeScript projection:

```ts
// domain/rules/can-approve.ts
export const canApprove = (i: { eligible: boolean }): boolean => i.eligible;

// application/use-cases/approve-order.ts
import { canApprove } from "../../domain/rules/can-approve.js";
type State = "draft" | "approved";
type Input = { state: State; eligible: boolean };

export function approveOrder(i: Input) {
  switch (i.state) {
    case "draft":
      return canApprove(i)
        ? { ok: true, state: "approved", effects: ["OrderApproved"] }
        : { ok: false, code: "DSV2-RULE-REJECTED" };
    case "approved":
      return { ok: false, code: "DSV2-TRANSITION-NOT-ALLOWED" };
    default: {
      const impossible: never = i.state;
      return impossible;
    }
  }
}
```

Python projection:

```py
# domain/rules/can_approve.py
def can_approve(i: "ApproveOrderInput") -> bool:
    return i.eligible

# application/use_cases/approve_order.py
from ...domain.rules.can_approve import can_approve
from typing import assert_never

def approve_order(i: ApproveOrderInput) -> Outcome:
    match i.state:
        case State.DRAFT:
            return approved(["OrderApproved"]) if can_approve(i) else rule_rejected()
        case State.APPROVED:
            return invalid("DSV2-TRANSITION-NOT-ALLOWED")
    assert_never(i.state)
```

Rust projection:

```rust
// domain/rules/can_approve.rs
pub(crate) fn can_approve(i: &ApproveOrderInput) -> bool { i.eligible }

// application/use_cases/approve_order.rs
use crate::domain::rules::can_approve::can_approve;

pub(crate) fn approve_order(i: ApproveOrderInput) -> Result<Outcome, Diagnostic> {
    match i.state {
        State::Draft if can_approve(&i) =>
            Ok(Outcome::new(State::Approved, vec![Effect::OrderApproved])),
        State::Draft => Err(Diagnostic::rule_rejected()),
        State::Approved =>
            Err(Diagnostic::new("DSV2-TRANSITION-NOT-ALLOWED")),
    }
}
```

For every projection, the paper assertions are:

```text
approve({state:draft, eligible:true})
  => approved + OrderApproved

approve({state:approved, eligible:true})
  => DSV2-TRANSITION-NOT-ALLOWED
```

The required structural failure adds a rule-to-use-case import, producing `DSV2-MODULE-DIRECTION` independently of the runtime assertions.

## Exact typed negatives

| Negative | TypeScript mutation | Python mutation | Rust mutation | Required normalized verdict |
|---|---|---|---|---|
| Empty rule directory | Remove `can-approve.ts` | Remove `can_approve.py` | Remove `can_approve.rs` | `fail / DSV2-RULE-ROOT-EMPTY / OBL-RULE-IDENTITY` |
| Renamed file | Rename to `may-approve.ts`, manifest unchanged | `may_approve.py` | `may_approve.rs` | `fail / DSV2-BINDING-UNRESOLVED` |
| Barrel bypass | Import from `domain/rules/index.js` | Import from `domain.rules` | Import re-export from `crate::domain::rules` | `fail / DSV2-USE-EDGE-NONDIRECT` |
| Dynamic import | `await import(path)` | `importlib.import_module(name)` | `libloading::Library::new(...)` | TS/Python: `fail / DSV2-DYNAMIC-IMPORT-FORBIDDEN`; Rust: `unsupported / DSV2-DYNAMIC-LINK-UNSUPPORTED`, and admission fails |
| Generated code | Change generator input without updating generated output/hash | Same | Same, including persisted `OUT_DIR` residue | `fail / DSV2-GENERATED-STALE` |
| Suppression | `eslint-disable` around forbidden import | `# noqa`/type ignore | `#[allow(...)]` | Underlying violation retained plus `fail / DSV2-EXCEPTION-INVALID` unless complete candidate exception record exists |
| Cycle | Rule imports `approve-order` | Rule imports `approve_order` | Rule `use`s application use case | `fail / DSV2-MODULE-CYCLE` and `DSV2-MODULE-DIRECTION` |
| Skipped invalid test | `it.skip` | `pytest.mark.skip` | `#[ignore]` | `fail / DSV2-EVIDENCE-SKIPPED` |
| Unreachable/new state | Add `"cancelled"` without switch arm | Add `State.CANCELLED` without match arm | Add `State::Cancelled` without match arm | Native type/compiler failure normalized as `DSV2-STATE-NONEXHAUSTIVE` |
| Invalid transition accepts | Make approved→approved succeed | Same | Same | `fail / DSV2-TRANSITION-ACCEPTED-INVALID` |
| Boundary violation | Rule imports adapter/use case | Same | Same | `fail / DSV2-MODULE-DIRECTION` |
| Orphan rule | Add unregistered second rule leaf | Same | Same | `fail / DSV2-RULE-ORPHAN` |

Generated freshness requires explicit hashes because Cargo notes that `OUT_DIR` persists across builds and its rerun detection is timestamp-based, not a semantic provenance guarantee. [Cargo build-script documentation](https://doc.rust-lang.org/cargo/reference/build-scripts.html).

## Per-policy decisions

| Candidate policy | Decision | Non-vacuity result |
|---|---|---|
| Canonical Rule ID has exactly one binding | KEEP | Missing, duplicate, orphan, and renamed mutations change the verdict. |
| One registered callable entry point | KEEP | Ambiguous or absent symbols fail; helpers remain language-idiomatic. |
| Direct use-case→leaf Rule edge | KEEP | Barrel/re-export mutation changes the verdict. Dependency-cruiser supports required direct dependencies and detects dynamic/circular edges. [Rules reference](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md) |
| Direction and cycle policy | KEEP | Reverse and cyclic imports receive distinct diagnostics. Import Linter provides forbidden, layered, independence, and acyclic contracts. [Import Linter contracts](https://import-linter.readthedocs.io/en/stable/contract_types/) |
| Existing roots must be non-empty; source must be classified | KEEP | Empty and orphan controls prevent vacuous green runs. |
| Runtime valid/invalid transition fixture | KEEP | It proves an observed transition decision that compilers do not prove. |
| Compiler-native state exhaustiveness | KEEP | Adding a state changes `tsc`, mypy, and rustc verdicts. |
| Separate DomainSpec exhaustiveness implementation | KILL | Duplicates compiler guarantees; normalization and canonical binding are the DomainSpec value. |
| Generated provenance hashes | KEEP | Stale generated bytes can compile while the provenance verdict fails. |
| Visible, validated exception record | KEEP | Suppression can no longer erase the underlying violation. |
| Accepted suppression semantics in the initial profile | KILL | No authority owner defines its gate meaning. |
| Normalized receipt with raw native attachments | KEEP | Skips, unsupported cases, suppressions, and native diagnostics become comparable. |
| Universal one-Rule-per-file | KILL | Files are not equivalent implementation units across all three languages. |
| Universal exactly-one-export/item | KILL | Duplicates Rust visibility and is not meaningful Python privacy. |
| Universal arrow-functions-only | KILL | No cross-language DomainSpec verdict. |
| Filename-convention enforcement as semantic proof | KILL | Only manifest resolution and registered identity matter. |
| Ruff custom plugin for DomainSpec checks | KILL | Ruff does not support third-party plugins; use the repository-owned narrow `ast` evaluator. [Ruff FAQ](https://docs.astral.sh/ruff/faq/) |
| Mypy plugin for structure/topology | KILL | The plugin API is experimental and not intended as a module-topology owner. [Mypy extension documentation](https://mypy.readthedocs.io/en/stable/extending_mypy.html) |
| Custom Clippy/Dylint as initial required gate | KILL | It adds compiler-internal/nightly maintenance without necessity; use rustc plus the bounded shared evaluator. [Clippy development](https://doc.rust-lang.org/clippy/development/adding_lints.html), [Dylint](https://github.com/trailofbits/dylint) |
| `cargo metadata` as Rust source-module graph | KILL | It exposes package dependency topology, not leaf `use` edges. |
| Bounded Rust explicit-module fallback | KEEP | Admit only explicit macro-free `mod`/`use`; fail closed as `unsupported` for `cfg`, `#[path]`, macro expansion, or runtime loading. |

Claim ceiling: this review establishes paper-level falsifiability and comparable expected verdicts only. It provides no fixture execution, project-fit, parity, implementation, promotion, release, or production-readiness evidence.
