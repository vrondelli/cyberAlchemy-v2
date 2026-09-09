# Plan transport — ACI-subordinate conformance revision

## Invoke result

- Mode: `plan`
- Spell: `invoke`
- Observed capability: Invoke Plan
- Target artifact: private agent reasoning engine work-pack
- Target lifecycle owner: reasoning-engine planning cycle
- Phase status: `pass` for authored plan
- Work-pack gate: `block`
- Complexity/output: `high`, `split`
- Distill: `pass` for plan structure; mutation blocked
- SWU atomicity: `pass`; one prior SWU retired
- First-unit narrowness: `n/a` for execution; two route-specific candidates pass
- Task Session closeout synchronization: `block`
- Selected SWU: `none`
- Implementation authorized: `false`

## Outputs

- [`../IMPLEMENTATION-LAYERING.md`](../IMPLEMENTATION-LAYERING.md)
- [`../WORK-PACK.md`](../WORK-PACK.md)
- [`../EXECUTION-PACK.md`](../EXECUTION-PACK.md)
- [`../DISTILL-VALIDATION.md`](../DISTILL-VALIDATION.md)
- [`../work-pack/tasks/TASK-ARE-ACI-CONFORMANCE-001.md`](../work-pack/tasks/TASK-ARE-ACI-CONFORMANCE-001.md)
- [`CONTEXT-PACK.md`](CONTEXT-PACK.md)
- [`TEMPLATE-SELECTION.md`](TEMPLATE-SELECTION.md)
- [`DISPATCH-TECHNIQUE-TRACE.md`](DISPATCH-TECHNIQUE-TRACE.md)
- [`DISPATCH.json`](DISPATCH.json)
- [`PLAN-RECEIPT.json`](PLAN-RECEIPT.json)
- [`VALIDATION.json`](VALIDATION.json)

## Material decisions

1. Retire `SWU-ARE-002`; a local integrated journal cannot satisfy option A.
2. Separate local-only containment from integrated conformance.
3. Make external fixture admission the first integrated trust boundary.
4. Keep semantic artifact mapping, actor-event reads, optional Bus publication
   mapping, replay, revalidation, artifact durability, and exact-effect mapping
   as distinct owner-aware units.
5. Preserve ACI acceptance after every candidate mapping; no local output is an
   accepted command, canonical receipt, journal span, or effect intent.
6. Withhold every execution route until one SWU is explicitly selected and its
   exact Task Session closeout synchronization contract passes.

## Unresolved target-lifecycle residue

- ACI runtime work-pack gate is blocked.
- Bus latest integration assessment has no later `PASS`.
- ACP remains draft discovery.
- APT mutation gate is blocked.
- Cross-repository conformance vectors/receipts are absent.
- Artifact and incident owner decisions remain open for their L2 units.
- Task Session closeout synchronization is unbound.
- No SWU is selected.

## Mutation boundary

This route changed planning artifacts plus one non-authoritative Invoke
observability signal:

`.arcanum/observability/tmp/invoke-plan-20260723T190219-aci-subordinate-conformance.json`.

- Source implementation: unchanged
- Upstream define/design artifacts: unchanged
- Craft ledger/projections: unchanged
- External orchestrator: unchanged
- Public Arcanum: unchanged
- Promotion/authority: unchanged
- Real effects: none

## Next route

`deferred`.

- When new external owner evidence arrives:
  `invoke:refresh:proposal-only ACI-subordinate conformance evidence`.
- If the human owner wants the permitted local-only experiment before external
  maturity: open a separate selection and closeout-binding gate for
  `SWU-ARE-019`.
- For integrated work: wait for `G-ARE-ACI-CONFORMANCE`, then open a separate
  selection and closeout-binding gate for `SWU-ARE-016`.

Neither candidate is selected by this transport.
