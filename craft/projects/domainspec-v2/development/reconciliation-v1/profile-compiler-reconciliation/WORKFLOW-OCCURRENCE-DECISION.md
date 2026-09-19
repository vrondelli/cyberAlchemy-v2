# Workflow occurrence-source decision

Date: 2026-09-09. PCR-06 / DSR-017 / Workflow portion of DEC-08.
Status: option A selected by the user `yes apply it` on 2026-09-09. Authority effect: none.
This is a development decision record, not user-facing product documentation.

## Why a decision is needed

[DEC-08](../DECISIONS.md#dec-08) explicitly gates finalizing versioned Workflow
step schemas. The earlier State Machine and Interface selections did not select
the Workflow portion. The later `yes apply it`, following the current-versus-new
explanation, explicitly selects this separate versioned Workflow format.

Current `impl/cli/src/input/project-model.ts` evidence:

- `BODY_CONTRACTS.Workflow` declares string-array `steps` and `compensations`.
- `requireStringArray` rejects repeated values. A read-only decoder check accepts
  `steps: ["reserve", "charge"]` but rejects `["reserve", "reserve"]` with
  `MTCLI_INPUT_BODY: duplicate array member`.
- `validateSelectedNodeRelationships` compares orchestrated targets by bare
  `node_id`, rejecting same-spelled Operation IDs across features.
- Compensation dependencies use Operation IDs, not individual step occurrences.
- `impl/cli/src/runtime/in-memory.ts` returns Workflow metadata; that branch is
  not a general executable or durable orchestrator.

The reconciled model needs to distinguish an Operation concept from each use of
that Operation in a Workflow. One canonical `orchestrates` relationship may
cover several execution occurrences; no repeated domain edge or helper
Operation should be invented just to make the steps distinct.

## Choice

### A. Versioned authored occurrences and explicit legacy migration — recommended

Introduce an opt-in Workflow source version with unique step IDs and qualified
Operation references. Parameters, result dependencies and compensation bindings
refer to step occurrences. Repeated Operations remain lawful; canonical
`orchestrates` checks cover the distinct referenced Operation concepts.

Illustrative identities; the implemented source shape is in [WORKFLOW-OCCURRENCES.md](WORKFLOW-OCCURRENCES.md):

```text
reserve-primary   -> inventory:reserve
reserve-secondary -> inventory:reserve
charge            -> payments:charge
```

Keep current files under their existing version-bound behavior. Migrating them
requires explicitly chosen occurrence IDs and bindings; do not infer ambiguous
compensation targets or silently change old CLI defaults.

Benefit: source, graph identity and generated orchestration can agree. Cost:
new validation/generation and an explicit migration path. Choose this for the
reconciled public compiler. Downstream work must prove repeated occurrences,
qualified references, result binding, ordering and occurrence-specific recovery
without claiming durable execution or automatic retry.

### B. Separate compiler-side occurrence bindings for a prototype

Preserve the source parser and attach occurrence IDs/bindings in a separately
selected compiler input. Keep legacy graph identity limitations explicit.

Benefit: smaller initial prototype with no source migration. Cost: two authored
representations must stay synchronized, the checked source remains limited,
and public source integration still needs reconciliation. Choose this only to
defer the new public Workflow format; it does not complete the full CLI goal.

## Gate result and independent work

Decision Gate: **PASS for constructing the selected Workflow occurrence source**,
zero unresolved source-format choices. Option A was selected by the user's
`yes apply it` after the current-versus-new explanation. The previous discovery
turn changed no Workflow implementation and did not infer selection.

Exact candidate: `domainspec.workflow-occurrences/v1`, defined in
[workflow-occurrence-contract.json](workflow-occurrence-contract.json), SHA-256
`44e7e7bae39d0694b771639706a0c6471aed3a9139d0df0232a19f1c6b31ec7d`.
This first source unit covers identities, graph closure and migration. Argument
and result typing, provider bindings, recovery execution and native orchestration
remain separate construction work; the source decoder does not claim them.

Named-contract Mapping bindings/generation, configured Interface planning and
public CLI integration remain independently runnable work. This Workflow gate
must not be presented as blocking those units or as completion of PCR-06..14.
No operational provider, deployment, admission or publication choice is requested.

## Historical discovery Task Session and routing evidence

Local native execution; no subagent or runtime handoff. Context: DEC-08, the full
CLI ledger, current Workflow source/relationship/runtime functions and existing
compensation tests. Decision Gate requires explicit selection before Workflow
source changes. Only this note and the two progress ledgers are in the effect
scope. Named Interface construction passed 386/386 shared tests beforehand;
those tests are not Workflow-successor verification. This paragraph records the
earlier documentation-only turn; the selected implementation scope and current
evidence are in [WORKFLOW-OCCURRENCES.md](WORKFLOW-OCCURRENCES.md).

ARE request `ds-cli-continuation-20260909-056`, raw user text `yes`, with the
Workflow documentation objective marked inferred from the continued CLI goal.
Route `CA2-ROUTE-IMPLEMENT`; receipt
`01e8ef1fc87ff5b3a2f9d1feecab052ee4a6902b3212b673c701f80c9af5e553`.
Context result `08ee06ce813107cff73417ef07c3dea751f468c969d9404789ee007f1ebc664d`.
Documentation-only effect result
`b4639967a9576b8cfa3a6c683849847d175aa8839e819b48ed193685bc30e56e`.
Preceding named-Interface continuation result
`d326aa5a5e778607ee229bdcb1677e1e85cacaf5d717f7bb1d4ce9df5c4e9c3f`.
The adapter assesses caller evidence but grants no authority or owner choice.

## Remaining work

Option A is selected; implementation evidence is in [WORKFLOW-OCCURRENCES.md](WORKFLOW-OCCURRENCES.md).
Other unresolved product and assurance decisions remain with their existing owners in
[DECISIONS.md](../DECISIONS.md); this record does not select them implicitly.
