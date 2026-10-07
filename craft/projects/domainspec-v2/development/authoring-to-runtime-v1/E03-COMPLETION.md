# E03 completion — exact causal EVF evidence joining

Date: 2026-09-20. Status: scoped complete. Authority effect: none.

## Completion statement

E03 is complete for the current execution-evidence and theorem-evidence
routes. Exact provider request/result evidence now joins through the current
DomainSpec evidence-binding and EVF contracts while retaining eight distinct
causal outcomes, exact currentness and bounded revision guidance.

## Done-criterion accounting

| Obligation | Evidence | Result |
| --- | --- | --- |
| Exact inputs | Every request, receipt, claim, assessment, obligation, projection, preservation, provider, runtime and environment reference resolves by path, SHA-256, size and declared currentness. | pass |
| Two current EVF routes | Execution emits a schema-valid provider evidence binding; theorem evaluation emits a schema-valid theorem evidence binding. Both emit schema-valid EVF joins. | pass |
| Eight causal outcomes | `pass`, `fail`, `unknown`, `timeout`, `malformed`, `stale`, `unavailable` and `not-evaluable` are covered on both routes: 16/16 cells. | pass |
| Non-collapse | Only `pass` can satisfy an obligation or emit `PASS_BOUNDED`; all seven non-pass outcomes retain cause, residue and a non-`none` revision route. | pass |
| Currentness | Pass requires all exact inputs current and all comparability dimensions true. `stale` requires at least one explicitly non-current input; no other outcome may consume one. | pass |
| Missing evidence | Unavailability is represented by an exact current availability observation and `MISSING`, never by silently omitting the evidence slot. | pass |
| Vocabulary preservation | The causal wrapper retains `malformed` and `not-evaluable` even where the theorem schema must project them to `provider-error` and `blocked`. | pass |
| No inferred execution or authority | The trace records that the join did not execute or retry a provider, omit evidence, promote non-pass, approve a product or grant authority. | pass |

## Validation

- AlchLang strict and build-surface typechecks: pass.
- Focused E03 EVF join suite: 6/6 pass, zero skips, covering all 16
  route/outcome cells and hostile currentness/pass mutations.
- E01-E03 formal-chain regression: 17/17 pass, zero skips.
- E03 qualification validator: 2/2 pass.
- Complete serial `application-*.test.ts` regression: 128/128 pass, zero
  skips; duration 179633.100741 ms.
- Qualification: `evidence/e03-evf-evidence-join/qualification.json`, SHA-256
  `afdccd1cfdc45e80b0a80b42ff26b50ed4548271cc1ad562b6014467525ec44c`.

## Claim ceiling

This closes E03 only. It proves neither a FormalClaim universally nor provider
admission or execution. It does not establish product approval, publish,
release, deploy, establish production readiness or grant operational authority.

Progress is 27 of 37 scoped nodes. E04 is next on the runtime-evidence branch;
E05 waits for both E03 and E04. Product-owner validation remains deferred until
L4X.

## Open Questions

E04 owns source-bound, stage-separated runtime observations. E05 owns the
cross-layer semantic and non-collapse qualification across E01-E04.
