# Auth V4b approved SQL source-use check — v14 candidate

The owner-selected no-call scope covers every native decision-producing Auth
entrypoint. This additive check addresses one narrow gap in the existing
root-context census: a compiler dep-info edge to one of three allowlisted
cross-package `.sql` files was previously classified as data by file suffix.
The v14 wrapper leaves the v7 source and its historical results unchanged. It
requires each such edge to have a literal `include_str!` use in a compiler-listed
Rust source and rejects `include!`, `include_bytes!`, nonliteral text inclusion,
and direct `#[path]` use in those sources pending review. The focused tests
include brace/bracket macro delimiters and comment/string decoys.

Run the focused controls from the repository root:

```sh
python3 -m unittest auth-foundation/formalization/cases/AF-ADMIT-AUTHORIZATION-COMMAND-001/test_auth_v4b_sql_source_use_v14.py
```

`auth-v4b-sql-source-use-v14.py` performs a fresh four-root instrumented Cargo
replay when invoked directly. It does not save or alter v7's result. This
final replay completed on 2026-10-06 with `indeterminate` status and four
root contexts; the combined v14/v7 focused suite passed 16/16. This
lexical source-use check is not macro expansion, transitive effect analysis,
or a proof that the native endpoint set is closed. The candidate remains
`indeterminate`; `all_path_ready_dominance` and
`runtime_guarantees_observed` remain false. No FormalClaim, TDE, F5, EVF,
release, or production guarantee follows.

## Open Questions

- Can compiler-expanded source identity establish the actual active inclusion
  sites and exclude generated or aliased macro forms?
- Can all selected native decision entrypoints and same-request READY dominance
  be closed across indirect and external effects?
