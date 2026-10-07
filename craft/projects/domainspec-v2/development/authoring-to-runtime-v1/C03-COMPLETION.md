# C03 bounded completion — formal-condition consumers

Date: 2026-09-20. Status: scoped complete. Authority effect: none.

## Result

Every selected formal-condition consumer in `application-v1` now reuses a
declared Rule or FormalClaim. Policy and target State Machine consumers lower to
the bundled DomainSpec typed contracts with exact Rule argument binding. Query
retains its existing exact substitution. Operation references work in both
`requires Rule` and `Rule --enforces--> Operation` forms. Invariants select one
claim or Rule, and Workflows retain direct typed Rule bindings plus the Rule
closure of their ordered Operation steps.

The compiler rejects inline Policy and guard propositions, competing Invariant
conditions, missing Rule arguments, mismatched argument types, and target State
Machines that mix explicit and implicit trigger semantics. Trigger Events and
resulting output Events remain separate.

## Fresh validation

- AlchLang TypeScript typecheck: pass.
- Versioned syntax contract: 2 groups passed; all 18 cases are current-profile obligations with exact hostile diagnostics.
- Focused C03 consumer/non-collapse suite: 2 groups passed.
- Adjacent `application-*.test.ts` suite: 103 passed, zero failed or skipped.
- The focused positive fixture is accepted by the real bundled DomainSpec compiler with typed Policy and State Machine contracts.

## Evidence surface

- `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/parser.ts`
- `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/formal-claim.ts`
- `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/application-source.ts`
- `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/application-domain-lowering.ts`
- `language/capabilities/alchlang/plans/general-compiler-v1/implementation/src/application-rule-projection.ts`
- `language/capabilities/alchlang/plans/general-compiler-v1/implementation/test/application-formal-consumers.test.ts`
- `language/capabilities/alchlang/plans/general-compiler-v1/implementation/test/application-syntax-contract.test.ts`
- `FORMAL-CONSUMER-GRAPH.md`

## Claim ceiling

C03 proves bounded source-to-consumer identity, typed argument closure where the
current backend owns a typed contract, and rejection of inline replacements. It
does not prove FormalClaims, complete general-FOL execution, C04 module/entry
composition, C05 three-language parity, installed-product behavior, approval,
publication, release, deployment, or production readiness.

Progress is 20 of 37 scoped nodes. C04 is the next runnable product-construction
node; C05 still waits for C04.

## Open Questions

The current Workflow backend has no direct guard member, so Workflow closure is
direct source binding plus guarded-Operation closure rather than an invented
backend field. E02 owns formal-provider/EVF connection, and C05 owns native
three-language consumer parity. Product-owner validation remains deferred until
L4X.
