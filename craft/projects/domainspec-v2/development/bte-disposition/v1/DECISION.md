# BTE next investment decision

Proposal `DSV2-BTE-DISPOSITION-001` — pending user selection.

**Recommend preserving BTE for existing compatibility and selecting one financial-settlement structural comparison against an EVF binding.** Do not fund general BTE completion or retire its callers on the current evidence.

## Findings

BTE still has executable consumers, exported library APIs, development adapters and evidence consumers. The [inventory](consumers.json) separates these categories. Financial-settlement SFOL runs BTE verification by default. Enum conformance additionally pins its proof-engine source/test bytes. IOLM and Body War adapters are explicitly development-only; their presence does not demonstrate live use. The static search establishes references, not usage frequency or user demand.

The accepted EVF owns-reachability integration answers one question over 1–64 Entity nodes through explicit owns edges using Souffle. BTE covers formation, node and edge instance conformance, causality, structural emission and consumer replay. Using EVF as the evidence execution/transfer layer is a design hypothesis; its current accepted profile does not replace these semantics. The projector and domain-specific checks may remain useful behind a new adapter.

BTE's financial-settlement verifier deliberately checks for an exact expected-red result: 52 structural tests, 51 pass and one known mapping failure. A successor must not turn this into a blanket PASS. The retained 67 behavioral gaps are outside this proposed structural comparison and remain visible.

## Options

| Option | Work selected | Tradeoff |
| --- | --- | --- |
| A — Preserve only | Keep current callers and evidence; defer both BTE expansion and replacement | Least work now; continued legacy dependency |
| B — Preserve and compare (recommended) | Keep current BTE; define one exact financial-settlement structural contract and prototype an EVF binding against it | Tests whether replacement is worthwhile before expanding or switching callers |
| C — Complete BTE broadly | Select its unfinished structural/behavioral catalogue as a separate product program | Largest investment; no demonstrated requirement from accepted v1.0.0 scope |

Immediate removal is not a supported option: concrete callers and evidence pins remain, and no equivalent replacement has been tested.

## Proposed next construction scope under B

First define the 52-case structural comparison contract, its known failure, source identities and output semantics. Inventory the projector/emitter exports needed by this consumer. Create agent-facing prototype definitions and product/business/DomainSpec/compiled-system scaffolds for an additive adapter. Then build a local comparison candidate that can bind domain-specific structural results to EVF evidence without changing BTE callers or reusing owns-reachability semantics for unrelated claims.

Compare every case identity and status, exact diagnostic/coverage meaning, deterministic output and missing/stale/tampered evidence handling. Preserve the expected mapping failure and all 67 behavioral gaps. An independently checked replacement must also show a concrete maintenance or consumer benefit; a second wrapper alone is not sufficient reason to switch. Stop with a documented no-replacement result if the mapping adds complexity without benefit. Do not expand to all BTE catalogues.

The next product decision after that experiment is whether the bounded adapter is worth adopting. Caller cutover or deletion is a later, separate decision after a tested product candidate and approval.

## Work lanes

Product construction frontier: bounded comparison scope selection; the definition and scaffolding work becomes runnable if B is selected. No causal technical blocker to defining the experiment was found. Prototype implementation follows those definitions and a concrete file allowlist.

Operational support: migration owner retains caller inventory and any later cutover/rollback envelope; Enum conformance owner retains evidence rebinding; financial-settlement owner retains workflow adoption; publication owner retains release effects. These do not block an isolated additive prototype. Existing v1.0.0 product acceptance remains unchanged; UI stays excluded. No schedule, active use, full parity or production claim is inferred.

## Decision requested

Select A, B or C. Recommended wording:

> Select B: retain BTE for existing compatibility and proceed with a bounded financial-settlement structural-to-EVF comparison, preserving the known failure and behavioral gaps. Do not switch callers or retire BTE.

This is a work-direction decision, not approval of an unbuilt product. No implementation, caller changes, deletion or new product approval was performed while preparing this proposal.
