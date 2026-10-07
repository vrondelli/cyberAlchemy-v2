# Auth V4b generated policy callable ingress repair — candidate plan

Status: bounded proof-checker repair under the owner-selected every-native-decision-entrypoint scope. No production Auth behavior, accepted meaning, or guarantee flag changes.

## Context and defect

The generated policy exports nine functions: `authorize` and eight Boolean rule functions. The v2 syntax inventory sees all nine, but the v6 standalone-MIR ingress guard searches only `::authorize`; v7 root-context capture reuses that guard. A synthetic pre-READY `authorization-state-reader` call to `::allow_iff` currently passes the v6 guard and is classified as `direct-static`. This is a false negative, not evidence of a current production bypass.

Controlling evidence: the owner endpoint-scope decision, generated-policy v2 callable inventory, v6/v7 MIR census source and tests, and the selected Cargo closures. The generated crate may call its own rule helpers; the forbidden ingress is a cross-crate reference outside the sole READY decision bridge.

## Plan, review, implementation DAG

1. Derive the current callable names from the v2 source-bound inventory, reject malformed/duplicate/missing `authorize` names, and pass them into both v6 and v7 MIR checks. Keep the v2 exact nine-function gate as the source-shape authority.
2. Check compiled references to **each** known generated function. Permit exactly one cross-crate direct `::authorize` from `authorization-ready-decision`. Reject any other cross-crate direct, reified, or unclassified reference; observe internal generated-crate direct rule calls separately and fail on internal reification/unknown references. Classify every known policy callable call as `generated-policy`, not ordinary direct-static.
3. Add hostile v6 and v7 tests for pre-READY Boolean direct calls and function-pointer references, plus legitimate internal helper calls and incomplete callable-name inputs. Preserve the existing `indeterminate`/false closure and observation flags.
4. Run focused tests, syntax checks, current v6/v7 captures and aggregate if feasible; independently review the postimage and record exact limits.

Edges: 1 → 2 → 3 → 4. A read-only independent analysis confirmed the false negative and the generated-crate internal-call exception before implementation.

Write ceiling: this plan, v6/v7 census scripts and focused tests, and one additive status checkpoint. No generated Rust, accepted meaning, historical binding, production service, deployment, or publication edits.

## Open Questions

- Which Boolean rule callables are independently counted endpoints versus internal predicates? This repair conservatively prevents any new cross-crate ingress without resolving that role question.
- Dynamic targets, Drop, callbacks, external effects, and same-invocation all-path READY dominance remain open; this repair cannot establish `runtime_guarantees_observed`.

## Implementation checkpoint — 2026-10-06

The v6 guard now receives the nine callable names from the v2 source-bound inventory; v7 passes the same inventory into the shared check. Direct cross-crate policy ingress is limited to one `authorize` call from the READY decision bridge. Boolean helper direct calls, function pointers, and unclassified references fail closed; internal qualified generated-crate calls are reported separately. The effect census no longer labels a generated Boolean policy call `direct-static`.

Focused v6/v7 tests pass 21/21; Python syntax checks pass. The standalone current 14-manifest MIR capture exits 0, reports one cross-crate `authorize` ingress from `authorization-ready-decision`, no qualified internal direct, reified, or unresolved policy references, and 1,244 unresolved general effect terminators. Independent read-only postimage review found no P1/P2 in this bounded guard. The postimage full selected-Auth aggregate exited 0 with `status: pass`: four current stages passed, seven selected Rust crates were checked, and the root-context MIR captures reported 695/731/731/860 unresolved effect terminators for API/HTTPS/prototype/tenant. All closure and runtime-guarantee flags remain false. The aggregate result is a local candidate-validation pass, not Auth admission or observed runtime guarantee.
