# Context Pack: SWU-SFOL-001 Independent Denominator Apply

Status: Task Session evidence; strict coverage pass.

## Scope

Apply and validate the exact Invoke-produced post-images for
`SWU-SFOL-001`. The session may create only the independent denominator
implementation, its focused test, and append-only Task Session evidence.

## Obligation Matrix

| ID | Obligation | Controlling evidence | Status |
| --- | --- | --- | --- |
| O1 | Consume canonical graph, manifest, build, profile, and source-set handles only. | `SPEC.md` node authoring contract and invariants 7/11; denominator task | covered |
| O2 | Build an adopter-neutral exact clause and execution-role denominator. | denominator task objective; `DESIGN.md` View 2 | covered |
| O3 | Restrict implementation mutation to two exact files. | admitted material package and admission probe | covered |
| O4 | Reject empty, missing, extra, duplicate, stale, malformed, and noncanonical inputs with stable codes. | denominator task acceptance boundary | covered |
| O5 | Import no language, cases, bindings, emitter, runner, evaluator, proof, generated-output, or receipt module. | `SPEC.md` invariant 2; `DESIGN.md` forbidden dependencies | covered |
| O6 | Apply the material package without treating material readiness as completion. | Invoke Refresh report and material receipt | covered |
| O7 | Preserve package, owner, authority, publication, and source-frontier bindings. | material package, receipt, and admission probe | covered |
| O8 | Run focused tests, strict compilation, dependency validation, plan validation, and engine regression. | denominator task validation surface | covered |
| O9 | Stop after Task Session evidence and hand lifecycle synchronization to Invoke Refresh. | work-pack closeout contract | covered |

## Live Bindings

- Work pack SHA-256:
  `98a8723af4ef9009c903e80abe36dc6fc5c6bff290c3ccee55e0fc2df18a9afd`
- Task contract SHA-256:
  `54c075716adce782b15c5e25bf3b84f77464380cd468c3ac8e810814c96e0f03`
- Material package canonical digest:
  `5eda56e3b4b4ec405418cc4e8d36d9acd71d98cc268b415250c2846cf7e9e733`
- Material receipt file SHA-256:
  `1eceb31d9c9403aa21be9f30bbbcd0d7952a3460aaac2849e9be24b548c5959c`
- Admission probe verdict: `admit`; mutation ready: `true`

## Exact Implementation Scope

- `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/denominator/index.ts`
- `projects/domainspec-v2/impl/test-derivation-engine/src/sfol/denominator.test.ts`

## Validation Surface

- focused live denominator Vitest corpus;
- strict scoped TypeScript compilation;
- full engine regression and workspace typecheck;
- exact post-image digest comparison;
- DS-SFOL plan-package validation;
- focused dependency assertion in the denominator corpus.

## Exclusions

Language, evaluator, bindings, runners, effects, node adapter, proof join,
adopters, structural BTE catalogues, source correction, release, promotion,
production, and public Arcanum are outside this Task Session.
