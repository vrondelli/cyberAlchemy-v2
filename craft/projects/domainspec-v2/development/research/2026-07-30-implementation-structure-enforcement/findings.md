# DomainSpec v2 implementation-structure enforcement findings

## Answer and current-state classification

**Answer:** DomainSpec v2 can enforce implementation structure without collapsing
semantic authority, source layout, native language guarantees, runtime behavior,
evidence, and promotion into one universal linter. The defensible portable invariant
is narrower:

> Every admitted canonical `Rule` identity has exactly one admitted
> `ImplementationBinding` and one callable entry point, and every bound
> Operation/Query use case depends directly on that Rule leaf in the canonical
> Rule-`enforces`-Operation direction.

The design is **evidence-closed research, implementation-open**.

- `[AUTHORITY-OWNED][OBSERVED]` Existing DS-D1/DS-D2 definitions, supported-profile
  admission, `Obligation`, `RuleSet`, transition derivation, code-tag waiver,
  Import Manifest, generated-provenance, and authority routes remain their current
  owners.
- `[PROPOSED]` The exact-binding model, six-term implementation vocabulary,
  language realizations, bounded source-graph checks, runtime fixture, normalized
  receipt, adoption waves, and performance budgets are candidates.
- `[EXECUTED]` **None.** No TypeScript, Python, or Rust fixture, mutant, repository
  integration, latency benchmark, or IDE path was implemented or run.
- `[DEFERRED]` General cross-tool exception acceptance and any owner widening for
  implementation-profile or obligation fields.
- `[KILLED]` Blanket one-rule-per-file, one-export-per-file, arrow-functions-only,
  filename-as-semantic-proof, DomainSpec-owned exhaustiveness, `cargo metadata` as
  a Rust source graph, accepted-with-exception in the initial profile, and a broad
  shared enforcement engine.
- `[OPEN]` Code-tag reformulation, fixture implementation and execution, project
  fit, tool-version selection, parity, false-positive rate, caching, CI cost, IDE
  latency, migration execution, profile admission, promotion, release, and
  production readiness.

These findings do not change any canonical schema, ontology, source code, generated
projection, authority, lifecycle, release, or production state.

## Claim labels

| Label | Meaning in this finding |
|---|---|
| `[AUTHORITY-OWNED]` | An existing narrow owner remains responsible; this research does not widen it. |
| `[OBSERVED]` | Present in the cited repository bytes or primary tool documentation; not necessarily executed for this proposal. |
| `[PROPOSED]` | Candidate contract or work sequence requiring implementation and validation. |
| `[EXECUTED]` | Actually run against the proposed fixture. There are no such claims in this finding. |
| `[DEFERRED]` | Owner, semantics, or timing is intentionally unresolved. |
| `[KILLED]` | Rejected from the portable initial model. |
| `[OPEN]` | Required evidence or owner action is still missing. |

## Enforcement model

The enforcement model is a set of separately diagnosable check classes. It is not
a ten-rung proof ladder.

| Check class | What it may establish | Initial owner/evidence | Current classification |
|---|---|---|---|
| Lexical/style | Profile-local formatting and naming preferences | Existing language formatter/linter | `[PROPOSED]`; never semantic proof |
| Source-shape/AST | Admitted declarations, source tags, entry-point shape, forbidden dynamic constructs | Native parser or narrow repository-owned AST reader | `[PROPOSED][OPEN]` |
| Module topology | Direct dependencies, direction, cycles, leaf bypass, or unsupported source constructs | Language-specific import graph plus bounded reconciliation | `[PROPOSED][OPEN]` |
| Static type | Symbol resolution, type agreement, and language-native exhaustiveness | `tsc`, mypy, rustc | `[AUTHORITY-OWNED][OBSERVED]`; fixture execution open |
| DomainSpec formation | Whether a canonical concept satisfies its kind criterion | Existing DS-D1 schemas/validators | `[AUTHORITY-OWNED][OBSERVED]` |
| Semantic-profile admission | Whether a kind and relationship are admitted by a selected minted profile | Existing supported-profile registry and compiler | `[AUTHORITY-OWNED][OBSERVED]` |
| DomainSpec graph | Canonical kinds, directions, and constructible edges | Existing definitions/relationship registries and compiler | `[AUTHORITY-OWNED][OBSERVED]` |
| Binding and provenance reconciliation | Exact concept-to-symbol binding and agreement among tag, generated index, sidecar, native evidence, and digests | Post-reformulation code tags plus bounded shared evaluator | `[PROPOSED][OPEN]` |
| Runtime/temporal | Guard decision, valid/invalid transition, and effect intent under named inputs | Application-owned runtime fixture | `[PROPOSED][OPEN]` |

`[OBSERVED]` Evidence is cross-cutting: every class may emit a finding and raw
artifact. `[AUTHORITY-OWNED]` Authority is a separate owner gate. An
`EvaluationReceipt` is evidence and cannot promote, redefine, or authorize.

### Shared-evaluator boundary

`[PROPOSED]` The shared evaluator is limited to:

- reconciling code tags, supported profiles, derivation projections, existing
  obligations, native diagnostics, source/generated digests, and receipt references;
- normalizing native results to `pass`, `fail`, or `unsupported`;
- emitting stable findings, disagreement, and residue.

`[KILLED]` It must not become a second compiler, parser ecosystem, tool runner,
scheduler, CI service, derivation engine, state-machine runtime, waiver authority,
migration ledger, receipt system, or promotion gate.

## Candidate vocabulary and authority map

The initial candidate vocabulary has exactly six terms:

1. `[PROPOSED]` **`ImplementationConformanceProfile`** — authored configuration
   referencing an existing semantic profile. It contains source classes, language
   realizations, evaluator references, exclusions, obligations, and claim limits.
   It extends or accompanies the supported-profile owner; it does not create a
   second admission registry.
2. `[PROPOSED]` **`ImplementationBinding`** — one shape for Rule,
   Operation/Query, State Machine, and other admitted concepts. It carries the
   canonical concept reference, resolved kind and admission, source unit, callable
   entry point, language, canonical relationship edge, and source digest.
3. `[AUTHORITY-OWNED][OBSERVED]` **existing `Obligation`** — the current
   content-addressed derivation request. Any new check class, evaluator, or
   claim-limit field needs its current owner.
4. `[PROPOSED]` **`StateMachineRuntimeContract`** — references a canonical
   State Machine but owns only executable state, transition selection, guard,
   effect intent, and runtime invariants. `runtime_transition` is nested data,
   not a new ontology kind or DS-D2 relationship.
5. `[DEFERRED]` **`ExceptionRecord`** — a possible cross-tool governed record.
   Native suppressions and scoped code-tag waivers are representations or precedent,
   not general acceptance authority.
6. `[PROPOSED]` **generated `EvaluationReceipt`** — evaluator-family evidence
   with bound digests, findings, native diagnostics, unsupported cases, skips,
   exception references, and raw-artifact references. It never authorizes or
   promotes.

Language realizations, module-boundary constraints, evaluator references, findings,
provenance, migration rows, and runtime transitions remain nested fields or existing
governed artifacts. `[KILLED]` They are not new DS-D1 kinds, DS-D2 relationships, or
CAV2 authority kinds.

### Ownership chain

```text
canonical DomainSpec identity and relationship
  -> admitted minted semantic profile
  -> ImplementationConformanceProfile
  -> source-local canonical code tag
  -> generated/reconciled mapping index
  -> derivation binding projection
  -> existing Obligation and RuleSet
  -> native evaluator evidence
  -> generated EvaluationReceipt
  -> separate authority decision
```

Ownership constraints:

- `[AUTHORITY-OWNED][OBSERVED]` DS-D1 owns `Rule` and `State Machine`; DS-D2 owns
  `enforces` as Rule→Operation and `transitions` as Event→State Machine.
- `[AUTHORITY-OWNED][OBSERVED]` The supported-profile registry owns semantic
  admission. Active DS-D1 membership is not admission: the current experimental
  profile admits `Rule` but not `State Machine`.
- `[PROPOSED][OPEN]` After the recorded v2 reformulation, source-local code tags
  are the intended sole canonical owner of implementation-symbol mappings.
  Current tag bytes remain reformulation-pending under the active Import Manifest.
- `[OBSERVED]` Extracted indexes are generated/reconciled projections. Existing
  derivation sidecars retain obligation selection, emitter strategy, fixtures, and
  coverage gaps; duplicated `module`/`symbol` fields must be derived from or
  fail-closed reconciled with the tag mapping.
- `[AUTHORITY-OWNED][OBSERVED]` Existing `Obligation`, versioned `RuleSet`,
  valid/invalid transition derivation, code-tag waiver policy, Import Manifest,
  minted provenance/receipt pattern, and authority routes are reused.
- `[DEFERRED]` No owner currently defines general cross-tool exception acceptance.
- `[AUTHORITY-OWNED]` Generated projections and receipts remain evidence. Only a
  separate owner route may authorize or promote.

## Folder, module, and import conventions

`[PROPOSED]` Folder names classify source for an
`ImplementationConformanceProfile`; they do not become ontology or prove
composability. A minimal profile may recognize:

```text
domain/
  rules/
application/
  use-cases/
adapters/
generated/
tests/
```

The portable structural contract is:

1. Each admitted canonical Rule identity resolves to exactly one
   `ImplementationBinding`.
2. The binding resolves to exactly one registered callable entry point.
3. The bound Operation/Query use case imports or uses the Rule leaf directly.
4. A Rule leaf does not depend on its use case, an adapter, or another
   outward-facing layer.
5. Cycles, unresolved bindings, duplicate bindings, orphan Rule leaves, barrel or
   re-export bypasses, and unclassified source fail with distinct diagnostics.
6. Dynamic or statically indeterminate constructs return `unsupported`, and
   `unsupported` fails profile admission rather than passing silently.

Language-local realization:

| Language | Candidate convention | Portable status |
|---|---|---|
| TypeScript | A bound Rule may live at `domain/rules/can-approve.ts`; the use case imports that leaf path rather than a barrel. Kebab-case filename and arrow/function style are profile-local. | `[PROPOSED]` exact binding/direct edge; `[KILLED]` universal one-file, single-export, arrow-only law |
| Python | A bound Rule may live at `domain/rules/can_approve.py`; the use case imports the specific module/symbol. Snake-case is profile-local. | `[PROPOSED]` exact binding/direct edge; `[KILLED]` lambda-only or fake export-privacy equivalence |
| Rust | A bounded fixture may use `domain/rules/can_approve.rs` and an explicit `use crate::domain::rules::can_approve::can_approve`. Cargo metadata covers packages, not intra-crate source edges. | `[PROPOSED]` explicit macro-free `mod`/`use` analysis; `[OPEN]` general Rust source graph |

### v1 public-index precedent versus proposed leaf imports

`[OBSERVED]` The v1 architecture precedent agrees with the inward dependency
direction: domain imports stay in domain/shared domain, application imports domain,
infrastructure imports domain plus application contracts, and interfaces import the
application API
(`implementation/domainspec/architecture/pattern-library/DEPENDENCY-RULES.md:7-10`).
But its module-boundary precedent also requires public API re-exports from module
index files and forbids importing another module's internal files
(`implementation/domainspec/architecture/pattern-library/LAYERING-REFERENCE.md:51-55`).
That public-index rule conflicts directly with the candidate's mandatory Rule-leaf
import and `DSV2-USE-EDGE-NONDIRECT` barrel/re-export negative. Both cannot govern
the same edge unchanged.

`[PROPOSED][OPEN][AUTHORITY-OWNED]` The direct use-case→Rule-leaf rule is therefore
an owner-routed `ImplementationConformanceProfile` decision, not current inherited
authority. If accepted, it adapts and supersedes the v1 public-index/no-internal-import
precedent only for admitted Rule-binding edges in that profile, while retaining the
v1 inward layer direction and public-contract rule elsewhere. Until that owner
decision exists, v1 remains precedent and mandatory leaf import remains an unresolved
candidate conflict; this finding cannot silently override it.

`[KILLED]` Filename agreement is never semantic proof. Renames matter because they
break an admitted binding, not because a filename itself owns Rule identity.

## Rule and meta-type file contracts

| Surface | Required initial contract | Authority posture |
|---|---|---|
| Canonical Rule definition | Existing DS-D1 `Rule`, boolean guard criterion, existing formation schema | `[AUTHORITY-OWNED][OBSERVED]`; do not create `RuleDefinition` |
| Canonical State Machine definition | Existing DS-D1 `State Machine`, formation criterion `has_transitions=yes` | `[AUTHORITY-OWNED][OBSERVED]`; formation is not runtime proof |
| Canonical relationships | Existing `enforces` Rule→Operation and `transitions` Event→State Machine | `[AUTHORITY-OWNED][OBSERVED]`; do not add `uses_rule` or `contains_transition` |
| Rule implementation unit | One admitted binding and callable entry point per canonical Rule identity; helpers may remain language-idiomatic | `[PROPOSED][OPEN]`; not universally one file or one export |
| Operation/Query implementation unit | Binding resolves the implementation role to a canonical Operation/Query; direct dependency to the Rule leaf | `[PROPOSED][OPEN]`; “use case” is not a new semantic kind |
| Implementation profile | References semantic-profile id/version/digest and registries; declares language realizations, source classes, evaluators, exclusions, obligations, and claim limits | `[PROPOSED][DEFERRED]` owner acceptance required |
| Binding record | Code-tag-owned concept/edge plus source unit, symbol, language, digest, and generated index agreement | `[PROPOSED][OPEN]` until code-tag reformulation |
| Runtime contract | Canonical State Machine ref, admitted states, runtime transition records, guard binding, effect intent, valid/invalid fixtures, claim limits | `[PROPOSED][OPEN]`; persistence and orchestration excluded initially |
| Obligation | Reuse existing key, rule type, source anchor, canonical parameters, and description | `[AUTHORITY-OWNED][OBSERVED]`; widening deferred to owner |
| Evaluation receipt | Generated, content-addressed evidence with native attachments and explicit unsupported/skipped residue | `[PROPOSED]`; evidence only |

## Use-case and state-machine example

`[PROPOSED][EXECUTED: none]` The paper fixture binds:

```yaml
fixture_id: rule-transition-001
rule_id: can-approve
operation_id: approve-order
input:
  state: draft|approved
  eligible: boolean
valid:
  from: draft
  to: approved
  effect_intent: OrderApproved
invalid:
  from: approved
  to: approved
required_edge: approve-order -> domain/rules/can-approve leaf
forbidden_edges:
  - rule -> use-case
  - rule -> adapter
```

The canonical semantic edge remains `can-approve Rule --enforces--> approve-order
Operation`. The source dependency is the implementation realization of that
direction: the use case calls the guard before transition execution.

TypeScript Rule unit:

```ts
// domain/rules/can-approve.ts
export const canApprove = (i: { eligible: boolean }): boolean => i.eligible;
```

TypeScript use-case unit with the proposed direct-leaf edge:

```ts
// application/use-cases/approve-order.ts
import { canApprove } from "../../domain/rules/can-approve.js";

export function approveOrder(i: { state: "draft" | "approved"; eligible: boolean }) {
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

Python Rule unit:

```python
# domain/rules/can_approve.py
def can_approve(i: ApproveOrderInput) -> bool:
    return i.eligible
```

Python use-case unit with the proposed direct-leaf edge:

```python
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

Rust Rule unit:

```rust
// domain/rules/can_approve.rs
pub(crate) fn can_approve(i: &ApproveOrderInput) -> bool { i.eligible }
```

Rust use-case unit with the proposed direct-leaf edge:

```rust
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

All three must demonstrate:

```text
approve({state:draft, eligible:true})
  => approved + OrderApproved

approve({state:approved, eligible:true})
  => DSV2-TRANSITION-NOT-ALLOWED
```

The runtime assertions are separate from compiler exhaustiveness and module topology.
A rule-to-use-case dependency must independently produce `DSV2-MODULE-DIRECTION`.

## TypeScript, Python, and Rust toolchain matrix

No versions are selected or validated. `[OPEN]` Version pinning, project fit,
installation cost, and runtime measurements belong to implementation.

| Concern | TypeScript | Python | Rust | Shared normalization |
|---|---|---|---|---|
| Lexical/style | Existing formatter/ESLint profile | Existing formatter/Ruff profile | rustfmt/Clippy profile | Preserve native diagnostic; no portable arrow/style law |
| Source shape/tag | Documented ESLint custom-rule visitor API plus typescript-eslint `ESLintUtils.RuleCreator` and code-tag extractor | CPython `ast.parse`, `NodeVisitor`, `Import`, and `ImportFrom` plus code-tag extractor | Rust Reference module and `use` syntax as the bounded grammar basis | Reconcile tag-derived binding and source digest; repository implementation/version selection remains open |
| Module topology | dependency-cruiser required/forbidden/circular/dynamic rules | Import Linter forbidden/layers/independence/acyclic contracts | `cargo metadata` for packages only; bounded explicit `mod`/`use` for intra-crate source | Normalize direct edge, direction, cycle, unresolved, and unsupported |
| Static type/exhaustiveness | `tsc` and `never` | mypy and `assert_never`/exhaustive match | rustc exhaustive `match` | Bind native evidence to canonical State Machine/profile; do not reimplement |
| Runtime fixture | Existing TypeScript test harness | Existing Python test harness | Existing Rust test harness | Compare named inputs, transition verdicts, and effect intent |
| Generated freshness | Explicit source/generator/config/output digests | Same | Same, including persisted `OUT_DIR` residue | Emit `DSV2-GENERATED-STALE` on disagreement |
| Exceptions | Native suppression remains a finding; scoped code-tag waiver may be referenced | Same | Same | Validate record completeness only; no accepted-with-exception verdict |

Tool-selection limits:

- `[OBSERVED]` ESLint documents the custom-rule `create(context)` AST-visitor and
  reporting surface; typescript-eslint recommends
  `@typescript-eslint/utils` `ESLintUtils.RuleCreator` for TypeScript-aware rule
  modules. `[PROPOSED][OPEN]` The repository-owned Rule binding/topology rule,
  parser configuration, and exact ESLint/typescript-eslint versions are not selected
  or implemented.
- `[OBSERVED]` CPython documents `ast.parse`, tree visitors, and explicit
  `ast.Import`/`ast.ImportFrom` nodes. `[PROPOSED][OPEN]` A repository-owned narrow
  evaluator may consume that maintained surface, but its implementation and supported
  CPython version are unselected.
- `[OBSERVED]` The Rust Reference defines external module-file loading and `use`
  declarations, including public re-exports. `[PROPOSED][OPEN]` No stable plugin or
  parser integration is selected for the initial repository-owned source reader; its
  implementation, parser choice, Rust edition, and tool version remain open.
- `[OBSERVED]` dependency-cruiser supports direct required dependencies and
  forbidden/circular/dynamic conditions.
- `[OBSERVED]` Import Linter has forbidden, layered, independence, and acyclic
  contract types.
- `[KILLED]` Ruff cannot be the host for a third-party DomainSpec plugin; its
  official FAQ says third-party plugins are not supported.
- `[KILLED]` A mypy plugin is not the initial module-topology owner; the plugin API
  is experimental and backwards compatibility is not guaranteed.
- `[KILLED]` A custom Clippy/Dylint gate is unnecessary for the minimum fixture.
  rustc plus bounded source analysis is sufficient to test the proposed invariant.
- `[KILLED]` `cargo metadata` is not an intra-crate source graph. It reports
  workspace packages and package dependencies.
- `[PROPOSED]` `#[path]`, `cfg`, macro-generated modules, ambiguous re-exports,
  dynamic linking, and runtime loading return `unsupported`; `unsupported` blocks
  admission.

Primary tool references: [TypeScript exhaustiveness with
`never`](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking),
[ESLint custom-rule API](https://eslint.org/docs/latest/extend/custom-rules),
[typescript-eslint custom-rule `RuleCreator`](https://typescript-eslint.io/developers/custom-rules/),
[CPython `ast`](https://docs.python.org/3/library/ast.html),
[mypy exhaustiveness with
`assert_never`](https://mypy.readthedocs.io/en/stable/literal_types.html#exhaustiveness-checking),
[Rust match expressions](https://doc.rust-lang.org/reference/expressions/match-expr.html),
[Rust modules](https://doc.rust-lang.org/reference/items/modules.html),
[Rust `use` declarations](https://doc.rust-lang.org/reference/items/use-declarations.html),
[Cargo metadata](https://doc.rust-lang.org/cargo/commands/cargo-metadata.html),
[Cargo build scripts](https://doc.rust-lang.org/cargo/reference/build-scripts.html),
[dependency-cruiser rules](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md),
[Import Linter contracts](https://import-linter.readthedocs.io/en/stable/contract_types/),
[Ruff plugin limitation](https://docs.astral.sh/ruff/faq/#can-i-write-my-own-linter-plugins-for-ruff),
and [mypy plugin stability](https://mypy.readthedocs.io/en/stable/extending_mypy.html).

## Minimum cross-language fixture and typed negatives

`[PROPOSED][EXECUTED: none]` The minimum fixture consists of:

1. one canonical Rule and one canonical Operation;
2. one admitted semantic profile and candidate implementation profile;
3. one code-tag-derived binding for each canonical identity;
4. one direct use-case-to-Rule-leaf dependency;
5. one two-state runtime contract with one valid and one invalid transition;
6. one native exhaustiveness check per language;
7. one generated receipt with raw native attachments;
8. the following mutants, run independently in TypeScript, Python, and Rust.

| Negative | Mutation | Required normalized verdict |
|---|---|---|
| Empty Rule root | Remove the only bound Rule source | `fail / DSV2-RULE-ROOT-EMPTY / OBL-RULE-IDENTITY` |
| Unresolved rename | Rename the Rule file/module without updating the binding | `fail / DSV2-BINDING-UNRESOLVED` |
| Barrel/re-export bypass | Import the Rule through a package/barrel/re-export root | `fail / DSV2-USE-EDGE-NONDIRECT` |
| Dynamic import/loading | `await import(path)`, `importlib.import_module`, or dynamic Rust loading | TS/Python `fail / DSV2-DYNAMIC-IMPORT-FORBIDDEN`; Rust `unsupported / DSV2-DYNAMIC-LINK-UNSUPPORTED`, admission fails |
| Stale generated output | Change generator input without updating output/digest | `fail / DSV2-GENERATED-STALE` |
| Suppression | Hide a forbidden edge with native suppression syntax | Underlying finding retained plus `fail / DSV2-EXCEPTION-INVALID` unless a complete candidate record exists |
| Cycle | Rule depends on the Operation/use case | `fail / DSV2-MODULE-CYCLE` and `DSV2-MODULE-DIRECTION` |
| Skipped evidence | Skip/ignore the invalid-transition test | `fail / DSV2-EVIDENCE-SKIPPED` |
| New state | Add `cancelled` without a switch/match arm | Native compiler/type failure normalized as `DSV2-STATE-NONEXHAUSTIVE` |
| Invalid transition accepted | Make approved→approved succeed | `fail / DSV2-TRANSITION-ACCEPTED-INVALID` |
| Boundary violation | Rule imports adapter or use case | `fail / DSV2-MODULE-DIRECTION` |
| Orphan Rule | Add an unregistered second Rule leaf | `fail / DSV2-RULE-ORPHAN` |

The fixture passes only if the baseline passes, every mutant changes the verdict as
specified, raw native diagnostics remain attached, and no `unsupported` result is
silently converted to `pass`.

## Adoption and migration waves

Every wave is `[PROPOSED][OPEN]` until its declared evidence exists.

| Wave | Scope | Required exit evidence | Explicit non-claim |
|---|---|---|---|
| 0 — owner closure | Complete code-tag reformulation; decide the profile extension shape and any `Obligation` widening; keep general exception acceptance deferred unless an owner is selected | Owner decisions, updated migration status, validated schemas/fixtures | No implementation admission from research |
| 1 — paper fixture implementation | Implement the one-Rule/one-Operation fixture and all mutants in isolated TypeScript, Python, and Rust examples | Native outputs, source digests, normalized receipts, mutation matrix | No repository-wide parity or project fit |
| 2 — single-project pilots | Apply one language realization at a time to bounded real project slices | Baseline inventory, false-positive/negative review, developer feedback, rollback path | No cross-language equivalence |
| 3 — parity and performance | Compare normalized meanings, diagnostic stability, caching, CI cost, and IDE latency across the three pilots | Version-locked harness, repeated measurements, residue ledger | No promotion from comparable receipts |
| 4 — migration reconciliation | Derive mapping indexes from tags, reconcile/retire duplicated sidecar symbol fields, and bind generated provenance | Import Manifest closeout evidence and digest agreement | No automatic authority transfer |
| 5 — profile admission | Route the implementation-profile contract and any IR extension through their narrow owners | Owner-gated admission record and negative fixtures | No release or production readiness |
| 6 — scaled adoption | Opt projects into the admitted profile with explicit rollback and waiver boundaries | Per-project receipts, measured budgets, unresolved-residue routing | No blanket enforcement outside admitted scope |

## Developer ergonomics and performance budgets

### Ergonomic contract

`[PROPOSED]` A diagnostic should include:

- stable diagnostic code and `pass|fail|unsupported` disposition;
- canonical concept and relationship reference;
- implementation binding, source unit, entry point, and source digest;
- offending source and target modules for topology findings;
- underlying native tool diagnostic and raw-artifact reference;
- selected profile, evaluator family, claim limit, and exclusion if relevant;
- candidate exception/waiver reference without deleting the underlying finding;
- the narrow owner route for authority or schema residue.

`[PROPOSED]` Existing project task runners may expose affected-file, profile,
explain, fixture, and full-CI modes. The shared evaluator only receives and
normalizes results; it does not discover tools, schedule them, or own CI.

### Provisional budgets

These are target budgets, not measurements:

| Path | Proposed budget | Status |
|---|---|---|
| Cached IDE/affected-file diagnostic | p95 ≤ 750 ms after file save | `[PROPOSED][OPEN]` |
| Cold single-binding explanation | p95 ≤ 2 s | `[PROPOSED][OPEN]` |
| Changed-file pre-commit gate | p95 ≤ 5 s | `[PROPOSED][OPEN]` |
| Incremental CI for one affected feature | p95 ≤ 30 s | `[PROPOSED][OPEN]` |
| Full three-language fixture and mutants | p95 ≤ 120 s on the selected reference runner | `[PROPOSED][OPEN]` |
| Cache correctness | 100% invalidation on profile, registry, tag, source, evaluator-config, generator, or tool-version digest change | `[PROPOSED][OPEN]` |
| Unsupported visibility | 100% of unsupported constructs produce a blocking typed result | `[PROPOSED][OPEN]` |

Project versions, runner hardware, warm/cold protocol, sample count, cache behavior,
false-positive rate, memory use, and CI cost are unmeasured. Budget misses should
produce residue and profile-local tuning, not weaken semantic or binding checks
silently.

## Blind spots and typed residue

| Blind spot | Initial treatment |
|---|---|
| TypeScript path aliases, project references, conditional exports, decorators, and generated barrels | `[OPEN]` Admit only when the selected parser/import graph resolves them deterministically; otherwise `unsupported` |
| Python namespace packages, import hooks, `__getattr__`, monkey patching, and runtime module construction | `[OPEN]` Fail admission for indeterminate binding/topology |
| Rust `cfg`, `#[path]`, procedural/declarative macros, build-generated modules, ambiguous re-exports, dynamic linking, and runtime loading | `[OPEN]` `unsupported`; Cargo package graph must not be substituted for source topology |
| Generated code across all languages | `[OPEN]` Require source, generator, config, output, and tool-version digests; Cargo `OUT_DIR` persistence makes explicit freshness evidence necessary |
| FFI, RPC, plugin boundaries, and dynamically selected implementations | `[DEFERRED]` Outside the minimum direct-call fixture |
| Multiple implementations selected by environment or feature flag | `[DEFERRED]` Requires an owner-approved binding-selection model; violates initial exactly-one admitted binding |
| State persistence, concurrency, retries, cancellation, idempotency, effect delivery, and compensation | `[DEFERRED]` Outside the initial `StateMachineRuntimeContract` fixture |
| General exception acceptance and expiry semantics across tools | `[DEFERRED]` No selected authority owner |
| Diagnostic equivalence across native tools | `[OPEN]` Compare normalized meaning while retaining raw native diagnostics |
| False-positive/negative rate, IDE latency, caching, memory, and CI cost | `[OPEN]` Must be measured in Waves 2–3 |
| Profile admission, promotion, release, deployment, and production readiness | `[OPEN][AUTHORITY-OWNED]` Separate owner routes; receipts cannot decide |

## Required verdict matrix

| Concern | Verdict | Owner | Evidence/limit |
|---|---|---|---|
| Rule, Operation, State Machine, `enforces`, `transitions` | `[AUTHORITY-OWNED][OBSERVED] already-deployed` | Existing DS-D1/DS-D2 registries | Reference only; no new ontology |
| Semantic-profile admission | `[AUTHORITY-OWNED][OBSERVED] already-deployed` | `definitions/minted-project/supported-profiles.yml` | Current experimental profile omits State Machine |
| Consumer profile selection | `[AUTHORITY-OWNED][OBSERVED] already-deployed` | Minted project source schema/compiler | Consumer source, not authority |
| `ImplementationConformanceProfile` | `[PROPOSED] build-from-owned` | Existing profile owner, subject to owner decision | No second registry |
| Implementation-symbol mapping | `[PROPOSED][OPEN] selected intended owner` | Post-reformulation source-local code tags | Migration incomplete; not currently release-admitted |
| Mapping indexes/manifests | `[OBSERVED] generated/reconciled projection` | Tag extractor/compiler | Noncanonical |
| Derivation sidecars | `[OBSERVED] existing projection` | Existing bindings owner | Reconcile duplicated module/symbol fields |
| `Obligation` and `RuleSet` | `[AUTHORITY-OWNED][OBSERVED] already-deployed` | Existing derivation IR/rules owner | Widen only through owner |
| Valid/invalid transition derivation | `[AUTHORITY-OWNED][OBSERVED] already-deployed derivation` | Existing derivation engine | Runtime remains application-owned |
| Exact one-binding/one-entry-point invariant | `[PROPOSED][OPEN] keep` | Candidate implementation profile plus code-tag owner | Fixture not implemented |
| Direct use-case→Rule-leaf dependency | `[PROPOSED][OPEN] owner-routed profile decision` | Implementation-profile owner plus language topology realization | Aligns with canonical Rule-enforces-Operation but conflicts with v1 public-index/no-internal-import precedent; adapts/supersedes that precedent only if accepted |
| Module direction and cycles | `[PROPOSED][OPEN] keep` | Language-native graph plus bounded normalization | Distinct diagnostics required |
| TypeScript exhaustiveness | `[AUTHORITY-OWNED][OBSERVED] consume-and-normalize` | `tsc`/`never` | No duplicate DomainSpec checker |
| Python exhaustiveness | `[AUTHORITY-OWNED][OBSERVED] consume-and-normalize` | mypy/`assert_never` | No duplicate DomainSpec checker |
| Rust exhaustiveness | `[AUTHORITY-OWNED][OBSERVED] consume-and-normalize` | rustc exhaustive `match` | No duplicate DomainSpec checker |
| Rust package topology | `[AUTHORITY-OWNED][OBSERVED] already-deployed native owner` | Cargo metadata | Packages only |
| Rust intra-crate source topology | `[PROPOSED][OPEN] bounded` | Explicit macro-free `mod`/`use` evaluator | Unsupported constructs fail admission |
| Runtime guard/transition/effect intent | `[PROPOSED][OPEN] execution evidence` | Application use case and fixture harness | Nothing executed |
| Generated freshness | `[PROPOSED][OPEN] keep` | Existing provenance pattern plus native artifacts | Explicit hashes required |
| Scoped code-tag waivers | `[AUTHORITY-OWNED][OBSERVED] already-deployed, migration-residual` | Existing waiver policy/validator | Does not change canonical semantics |
| General exception acceptance | `[DEFERRED]` | No selected owner | Underlying finding cannot be erased |
| Import/migration reconciliation | `[AUTHORITY-OWNED][OBSERVED] reuse` | Active Import Manifest | No second migration ledger |
| `EvaluationReceipt` | `[PROPOSED] build-from-owned, generated evidence` | Minted provenance/receipt pattern | Never authority |
| Shared evaluator | `[PROPOSED] keep within reconciliation/normalization boundary` | Candidate implementation tooling owner | Not compiler, runner, scheduler, derivation engine, waiver owner, or receipt system |
| Evidence channel | `[OBSERVED] cross-cutting` | Each check/tool owner | Not an enforcement rung or authority |
| Promotion/authority | `[AUTHORITY-OWNED] external gate` | Existing owner routes/CAV2 boundary | Never receipt-driven |
| Blanket one-rule-per-file | `[KILLED]` | None | May be language/profile-local only |
| Blanket one-export-per-file | `[KILLED]` | None | Not portable across Python/Rust |
| Blanket arrow-functions-only | `[KILLED]` | None | Style preference, not cross-language semantics |
| Filename convention as semantic proof | `[KILLED]` | None | Binding resolution owns identity |
| DomainSpec-owned exhaustiveness checker | `[KILLED]` | None | Native compilers own guarantee |
| `cargo metadata` as Rust source graph | `[KILLED]` | None | Package graph only |
| Accepted-with-exception initial verdict | `[KILLED]` | None | No authority owner |
| Implementation, execution, parity, performance, admission, promotion, release, production | `[OPEN]` | Respective implementation and authority owners | Unchanged by this research |

## Exact source citations

### Repository authority and precedent

- `implementation/domainspec/architecture/pattern-library/DEPENDENCY-RULES.md:7-10`
  — v1 inward layer dependency direction.
- `implementation/domainspec/architecture/pattern-library/LAYERING-REFERENCE.md:51-55`
  — v1 public-index re-export and no-internal-import boundary that conflicts with
  mandatory Rule-leaf imports.
- `projects/domainspec-v2/definitions/meta-types/meta-types.yml:153-170,261-278`
  — existing `Rule` and `State Machine` definitions and owner gates.
- `projects/domainspec-v2/definitions/relationships/relationships.yml:100-114,132-146`
  — canonical `enforces` Rule→Operation and `transitions` Event→State Machine.
- `projects/domainspec-v2/definitions/minted-project/supported-profiles.yml:1-69`
  — profile-admission owner, experimental four-kind profile, digest bindings, and
  deferred release admission.
- `projects/domainspec-v2/impl/spec/meta-types/lifecycle/state-machine.schema.yml:1-26`
  — formation checks `has_transitions=yes`; it does not specify runtime execution.
- `projects/domainspec-v2/impl/spec/minted-project/project.schema.json:3-45`
  — consumer-owned profile/registry digest selection.
- `projects/domainspec-v2/impl/tools/minted-project/compiler.ts:287-453,574-629`
  — profile selection, registry/profile digest checks, relationship admission, and
  generated graph/provenance read models.
- `projects/domainspec-v2/impl/governance/tags/CODE-TAG-SCHEMA.md:1-7,27-51`
  — source annotation maps implementation symbols to canonical concepts and edges.
- `projects/domainspec-v2/IMPORT-MANIFEST.md:1-46,90-97`
  — active migration owner and code-tag reformulation residue.
- `projects/domainspec-v2/impl/test-derivation-engine/src/bindings/index.ts:1-6,30-81`
  and `projects/domainspec-v2/impl/test-derivation-engine/bindings/financial-settlement.json:1-43,98-128`
  — sidecar strategy, module/symbol fields, fixture role, and explicit coverage gaps.
- `projects/domainspec-v2/impl/test-derivation-engine/src/ir/types.ts:68-100`
  and `projects/domainspec-v2/impl/test-derivation-engine/src/rules/index.ts:1-56,132-208,692-729`
  — existing `Obligation`, versioned `RuleSet`, and deterministic valid/invalid
  transition derivation.
- `projects/domainspec-v2/impl/test-derivation-engine/src/emit/spec.ts:41-67`
  and `projects/domainspec-v2/impl/test-derivation-engine/src/emit/tests.ts:330-347`
  — transition/runtime obligations require a harness and current coverage gaps remain
  explicit.
- `projects/domainspec-v2/impl/governance/tags/CODE-TAG-WAIVERS.md:1-40`,
  `projects/domainspec-v2/impl/governance/tags/tools/validate-code-tags.ts:513-660`,
  and `projects/domainspec-v2/impl/governance/tags/code-tag-waivers.yaml:1-29`
  — scoped waiver owner, required fields, expiry validation, matching, and live
  migration-residual data.
- `projects/domainspec-v2/impl/tools/minted-project/views.ts:46-77,130-280`
  and `projects/domainspec-v2/impl/spec/minted-project/build-receipt.schema.json:3-40`
  — generated verification evidence, bound digests, stale/provenance checks, and
  receipt shape.
- `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-88,122-142` and
  `cyberAlchemy-v2/SOURCE-MAP.md:23-33`
  — owner-routed authority, generated/evidence non-collapse, public/private boundary,
  and gate vocabulary.

### Primary language and tool documentation

- [TypeScript narrowing and `never` exhaustiveness](https://www.typescriptlang.org/docs/handbook/2/narrowing.html#exhaustiveness-checking)
- [ESLint custom-rule API](https://eslint.org/docs/latest/extend/custom-rules)
- [typescript-eslint custom-rule API](https://typescript-eslint.io/developers/custom-rules/)
- [CPython `ast` parser, visitors, and import nodes](https://docs.python.org/3/library/ast.html)
- [mypy literal/enum exhaustiveness and `assert_never`](https://mypy.readthedocs.io/en/stable/literal_types.html#exhaustiveness-checking)
- [Rust match expressions](https://doc.rust-lang.org/reference/expressions/match-expr.html)
- [Rust module syntax and source filenames](https://doc.rust-lang.org/reference/items/modules.html)
- [Rust `use` declarations and re-exports](https://doc.rust-lang.org/reference/items/use-declarations.html)
- [Cargo metadata JSON package graph](https://doc.rust-lang.org/cargo/commands/cargo-metadata.html)
- [Cargo build-script `OUT_DIR` persistence](https://doc.rust-lang.org/cargo/reference/build-scripts.html#outputs-of-the-build-script)
- [dependency-cruiser required, forbidden, circular, and dynamic rules](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md)
- [Import Linter contract types](https://import-linter.readthedocs.io/en/stable/contract_types/)
- [Ruff third-party plugin limitation](https://docs.astral.sh/ruff/faq/#can-i-write-my-own-linter-plugins-for-ruff)
- [mypy plugin API stability](https://mypy.readthedocs.io/en/stable/extending_mypy.html)
- [Clippy lint-development surface](https://doc.rust-lang.org/clippy/development/adding_lints.html)
- [ESLint function-style rule](https://eslint.org/docs/latest/rules/func-style)
- [Python lambda limitations](https://docs.python.org/3/reference/expressions.html#lambdas)

## Claim ceiling

This finding supports an evidence-backed implementation candidate and bounded work
sequence only. It does **not** establish fixture execution, project fit,
cross-language parity, performance, profile admission, repository-wide enforcement,
ontology promotion, authority transfer, release, deployment, or production readiness.
