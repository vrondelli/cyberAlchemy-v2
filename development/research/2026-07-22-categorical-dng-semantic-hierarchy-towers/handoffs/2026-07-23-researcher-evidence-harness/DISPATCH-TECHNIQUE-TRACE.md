# Dispatch Spec Technique Trace

## Route

- Invoke mode: `handoff`
- Handoff type: `research-direction`
- Full dispatch:
  [DISPATCH.json](DISPATCH.json)
- Full dispatch required: yes, because the route creates a reusable handoff,
  crosses from Invoke to Research Evidence Harness, and carries protected
  private CyberAlchemy-v2 context.
- Subagents: none; the source dispatch is closed and this package is one bounded
  parent-owned authoring result.

## Selected Techniques

| Technique | Activation Trigger | Affected Phase Or Artifact | Validation Expectation |
| --- | --- | --- | --- |
| `sequence` | Inventory lookup must precede context selection, which must precede handoff authoring. | Dispatch steps `s1` → `s2` → `s3`. | Every non-first step consumes a prior handle or ledger. |
| `handle_handoff` | Context must transfer by selected paths and selectors rather than a whole-session transcript. | `context-index.json`, `CONTEXT-PACK.md`, `SESSION-HANDOFF.md`. | Seven obligations map to selected evidence; excluded context is recorded. |
| `owner_boundary_check` | Invoke must not absorb the next research lifecycle or semantic authority. | Route rationale, target boundary, gates `g2` and `g3`. | Invoke authors only the handoff; downstream owners retain fixtures, adapters, policies, execution, and promotion. |
| `residue_ledger` | The source result is closed but empirical and semantic prerequisites remain absent. | Context gaps `G-01` through `G-06`. | Each gap has an owner, status, and next action; no gap is hidden by a pass label. |
| `concrete_path_evidence` | The package must be usable without conversational memory. | All source selections, dispatch inputs, and manifest records. | Paths are concrete and local; copied PDFs retain source digests. |
| `protected_context_flag` | CyberAlchemy-v2 and the source research are private. | Dispatch boundary `b2`, handoff target boundary, package README. | The package remains private/local and is not copied into public Arcanum. |
| `state_namespace_boundary` | Immutable source artifacts are copied into a derived session-evidence package. | Dispatch boundary `b1` and the `research/` portable tree. | Original artifacts remain unchanged; copies and authored handoff metadata are distinguishable. |
| `artifact_contract_bridge` | Invoke's handoff contract must become concrete package validation. | `SESSION-HANDOFF.md`, `context-index.json`, `DISPATCH.json`, `MANIFEST.sha256`. | Dispatch, JSON, links, hashes, obligation coverage, and diff hygiene pass. |
| `observability_grouping` | The authoring run has multiple output artifacts. | Invoke observability envelope and local projections. | One run ID groups mode, coverage, paths, gaps, Distill skip, and next route. |

## Skipped Techniques

| Technique | Reason Skipped |
| --- | --- |
| `delegation_boundary` | No subagent or delegated execution occurs in this handoff run. |
| `execution_receipt_handoff` | No empirical execution is authorized or represented. |
| `scu_swu_reduction` | This is not an implementation plan or work-pack. |
| `validation_loop` | One deterministic package-validation pass is sufficient; there is no bounded repair loop unless validation fails. |
| `memory_promotion_split` | The route performs no memory or Inventory promotion; the non-authority boundary is already explicit. |

## Distill Decision

- Verdict: `skipped`
- Rationale: the output is already one coherent research-direction handoff with
  a single next owner, seven bounded obligations, no implementation plan, no
  SWU, and no mutation-capable execution route. Distill would not reduce a
  broader executable unit because no such unit is authored here.

## Validation Result

- Dispatch Spec: `pass`
- Package validation: `pass`
- Mutation handoff: `not authorized`
