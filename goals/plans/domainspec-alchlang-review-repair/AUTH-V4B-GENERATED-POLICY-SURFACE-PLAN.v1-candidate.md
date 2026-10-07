# Auth V4b generated-policy callable inventory — bounded candidate plan

Status: candidate plan for one endpoint-discovery repair. It does not decide
which Boolean helper is a downstream decision entrypoint or close the owner's
every-native-entrypoint rule.

## Context and obligation

The accepted endpoint scope counts every native decision-producing Auth
entrypoint reachable from the selected public request, not only one adapter.
The current syntax-wide v2 inventory recognizes `authorize` in the generated
policy but its suspect filter misses exported Boolean functions such as
`allow_iff` and `default_deny`. `authorize` itself calls `allow_iff`. A
name/return-type filter therefore cannot be the coverage gate for this
generated package.

Controlling sources: `AUTH-DOWNSTREAM-ENDPOINT-SCOPE.v1-owner-decision.md`,
`auth-v4b-native-endpoint-inventory-v2.mjs`, its focused tests, the generated
`standard-runtime/.../auth-exact-permission/authorize.rs`, and the selected
Cargo closure. The v2 inventory is candidate evidence only; compiler target,
dynamic effects, final endpoint roles, READY dominance, and runtime
observation remain open.

## Plan → analysis → review → implementation DAG

1. **A — Enumerate the actual surface.** Use the existing Rust syntax parser
   over the selected generated policy source and enumerate every function
   definition in that file, including exported Boolean policy predicates.
   Require the exact Cargo `[lib].path`, manifest identity, selected-root
   membership, current production source role, and zero parser-opaque items
   for this generated file. The parser cannot resolve re-exports, external
   modules, macros, or foreign blocks, so any such item fails closed. List
   explicit expected callable names and result shapes;
   added, removed, duplicated, hidden, cfg-conditional, or reshaped entries
   fail closed until classified.
2. **B — Preserve role uncertainty.** Report the full generated-policy
   callable set separately from the existing decision-shaped suspects.
   `authorize` is a known full-decision entrypoint; Boolean predicates are
   policy-capable callable candidates, not automatically accepted downstream
   endpoints or proven safe helpers. Keep the final endpoint-role relation
   unresolved and all three guarantee flags false.
3. **C — Independent plan review.** Check that the gate cannot be bypassed by
   a differently named public `fn -> bool`, a visibility change, a new
   function outside the name filter, or a new re-export/macro/external module;
   check that generated-module/cfg opacity is not promoted to coverage.
4. **D — Implement and test.** Add the exhaustive generated-function gate and
   report to the v2 inventory. Add hostile controls for a new Boolean
   function, changed visibility/return shape, missing/duplicate definition,
   opaque syntax, and current full evaluation. Include an integrated mutant
   that passes through the same generated-surface gate used by
   `evaluateCurrent`, so a disconnected helper cannot pass. Do not modify generated runtime or Auth
   production code.
5. **E — Validate and review.** Run focused syntax inventory controls and
   selected current inventory evaluation, then get read-only postimage
   review. Update the repair status only with tested evidence.

Edges: A → B → C → D → E. The current product frontier is accurate endpoint
discovery; local parser and Cargo metadata are operational prerequisites.
Endpoint-role admission, compiler call/effect closure, F5, deployment, and
publication remain deferred. The task is done when every currently defined
generated-policy function is visible in the v2 report and a new Boolean
callable fails closed without weakening the claim ceiling.

## Write ceiling

Only this plan, `auth-v4b-native-endpoint-inventory-v2.mjs`, its focused test,
the current aggregate validator and focused test, its README, and one additive
`IMPLEMENTATION-STATUS.md` checkpoint may change. The aggregate has an exact
seven-test expectation that must track the expanded ten-test suite. Existing
meaning, generated policy, production Auth services, historical evidence, and
deployment are out of scope.

## Open Questions

- Which of the Boolean policy callables is an independently counted native
  decision entrypoint rather than an internal predicate? This repair keeps
  that role decision explicit and unresolved.
- What compiled call/effect and same-request evidence will close the complete
  endpoint set and READY dominance beyond syntax discovery?

## Implementation and validation checkpoint — 2026-10-06

The v2 inventory now binds the selected generated-policy Cargo manifest to its
one exact library source in all four public roots. It enumerates all nine
functions in that source, pins their visibility and complete syntax-level
signatures, and rejects parser-opaque re-exports, external modules, macros,
and foreign blocks. `authorize` remains the known full-decision entrypoint;
the eight Boolean callables are visible but their independent endpoint roles
are unresolved. A changed source, added/removed function, new Boolean
callable, visibility, parameter, return type, or opaque item fails the
candidate check rather than disappearing behind the old name filter.

The inventory suite passes 10/10 and the current aggregate's focused unit
suite passes 6/6. Direct current inventory evaluation exits 0 with nine
callables and all guarantee flags false. The aggregate's exact test-count
expectation and README were updated from seven to ten controls. An attempted
full aggregate run **failed before the inventory stage** at the separately
versioned v5 technical binding: its expected source hash for
`authorization-api/src/http_api_tests.rs` differs from the stored binding.
This task did not edit that source or rebind v5; no full aggregate pass is
claimed. The v5 mismatch is a separate freshness-review task.

Independent preimplementation review found and closed a P1 parser-opacity
hole in the plan. Postimage review found a P2 parameter-shape hole; the gate
now pins complete parsed signatures and has a hostile extra-parameter test.
Final independent read-only rereview reran the focused inventory suite
(10/10), found the signature-shape P2 closed, and found no remaining P1/P2 in
this bounded repair.
