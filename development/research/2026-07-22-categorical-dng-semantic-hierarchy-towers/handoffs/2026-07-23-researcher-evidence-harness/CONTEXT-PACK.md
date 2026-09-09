# Context Pack: Ponder Ontology Evaluator Evidence Harness

## Identity

- Task: prepare a researcher to build the evidence package implied by the
  completed CLS/DNG semantic-hierarchy research
- Source session:
  `session-20260722-categorical-dng-semantic-hierarchy-towers`
- Source dispatch:
  `2026-07-22-categorical-dng-semantic-hierarchy-towers`
- Handoff type: `research-direction`
- Builder mode: `standard`
- Strict obligation coverage: `pass`
- Evidence date: `2026-07-23`
- Repository revision: `6b691fe11d35403a92f52eb8a138e524ca67a265`

## Obligation Coverage

| ID | Obligation | Status | Selected Evidence |
| --- | --- | --- | --- |
| `O-01` | Preserve source identity, hashes, and evidence status. | `covered` | Both tower source records and PDFs. |
| `O-02` | Preserve the corrected algorithm and non-collapse boundaries. | `covered` | Accepted findings §§3–6 and prior bridge findings. |
| `O-03` | Carry the minimal fixtures, matched baselines, negative controls, and falsification contract. | `covered` | Accepted findings §§7–10 and both learning packs. |
| `O-04` | Prevent categorical or neural vocabulary from becoming ontology semantics by substitution. | `covered` | CLS pack §§2–4 and DNG pack §§3–5. |
| `O-05` | Expose missing owners, artifacts, and evidence as typed residue. | `covered` | Accepted findings §§7,13 and Inventory synthesis. |
| `O-06` | Make the evidence independently portable. | `covered` | Copied `research/` tree, governance receipts, and checksum manifest. |
| `O-07` | Give a copy-ready next prompt and route without granting execution authority. | `covered` | `SESSION-HANDOFF.md`, `DISPATCH.json`, and this pack. |

Coverage: `7/7`, `100%`.

## Selected Sources

1. [Accepted cross-tower findings](research/2026-07-22-categorical-dng-semantic-hierarchy-towers/findings.md)
   - Selectors: §§1–10 and §§13–15
   - Obligations: `O-02`, `O-03`, `O-05`, `O-07`
   - Evidence kind: audited synthesis
2. [CLS final learning pack](research/2026-07-22-categorical-dng-semantic-hierarchy-towers/towers/categorical-learning-system/learning-pack.md)
   - Selectors: §§2–7
   - Obligations: `O-01`, `O-03`, `O-04`
   - Evidence kind: source-backed tower synthesis
3. [DNG final learning pack](research/2026-07-22-categorical-dng-semantic-hierarchy-towers/towers/dynamic-neural-graph-inference/final-learning-pack.md)
   - Selectors: all
   - Obligations: `O-01`, `O-03`, `O-04`
   - Evidence kind: source-backed tower synthesis
4. [CLS source record](research/2026-07-22-categorical-dng-semantic-hierarchy-towers/towers/categorical-learning-system/sources/source-record.md)
   - Selectors: Primary source; Source boundary
   - Obligations: `O-01`, `O-04`
   - Evidence kind: immutable-source receipt
5. [DNG source record](research/2026-07-22-categorical-dng-semantic-hierarchy-towers/towers/dynamic-neural-graph-inference/sources/source-record.md)
   - Selectors: full record
   - Obligations: `O-01`, `O-04`
   - Evidence kind: immutable-source receipt
6. [Prior semantic-hierarchy bridge](research/2026-07-22-semantic-hierarchy-bridge/findings.md)
   - Selectors: definitions, architecture, verdicts, proof boundary
   - Obligations: `O-02`, `O-04`, `O-05`
   - Evidence kind: earlier accepted synthesis
7. [Inventory synthesis](governance/INVENTORY-SYNTHESIS.md)
   - Selectors: Accepted Result; Verdicts; Gate; Next Human Action;
     Authority Boundary
   - Obligations: `O-05`, `O-07`
   - Evidence kind: non-authority discovery view
8. [Source-run observability](governance/SOURCE-RUN-OBSERVABILITY.json)
   - Selectors: execution, observer, target_artifact
   - Obligations: `O-01`, `O-05`, `O-06`
   - Evidence kind: run receipt

## Architecture Guidance

The first evidence-harness package must keep these operations separate:

1. frozen Ponder projection;
2. finite authored serialization schedule;
3. predicate-candidate scoring over predeclared tuples;
4. deterministic relation admission;
5. separate direct-parent and ancestor contracts;
6. independent multi-label facet admission;
7. named projection of heterogeneous views;
8. componentwise, N/A-aware comparison.

An ordered recurrent typed-graph encoder may be one experimental arm. It is not
called transferred DNG unless the adapter defines actual graph-event dynamics.

## Constraints And Non-Goals

- PDFs and copied tower artifacts are immutable evidence.
- CLS is an architecture proposal; no categorical claim in it is
  defined-with-laws.
- DNG measurements remain paper-reported and not locally reproduced.
- Embedding proximity does not entail a predicate, order, facet, or hierarchy.
- Learned scores cannot create authority or override deterministic constraints.
- The first experiment must not claim a second hierarchy or alignment.
- Scalar TNAS remains killed.
- Local proposed thresholds may be revised only before fixture labels and run
  results are inspected.
- This package must not be published into public Arcanum.

## Expected Research-Evidence-Harness Outputs

- `PONDER-ONTOLOGY-EVALUATOR-MINIMAL-FIXTURES.v0`
- fixture JSONL schema and deterministic validator
- frozen projection/source/schema digest record
- finite adapter and feature/label-separation contract
- authored schedule and schedule-counterfactual manifests
- separate relation/direct-parent/ancestor/facet target schemas
- matched baseline and ordered-arm configuration manifests
- grouped split, seed, calibration, selective-risk, and hard-negative records
- prediction, admission, failure, metric, and reviewer-adjudication JSONL
- machine-readable contribution-evidence ledger
- claim-adjudication receipt preserving source status and kill criteria

## Validation Surface

The next owner must provide:

- JSON/JSONL parse checks;
- schema validation for every record family;
- deterministic dry-run fixtures;
- source/model/config/split/checkpoint digests;
- hard-negative slice counts and results;
- matched-baseline comparability checks;
- leakage and reference-integrity checks;
- a receipt distinguishing package construction, local execution, and semantic
  claim admission.

## Gaps And Blockers

- `G-01`: minimal Ponder fixtures absent; open for evidence-harness authoring,
  blocks runs.
- `G-02`: finite adapter/schedule absent; open for Ponder adapter owner, blocks
  the ordered arm.
- `G-03`: primary predicate, gold labels, split owner, and reviewers unselected;
  blocks execution.
- `G-04`: deterministic relation/order/facet policies absent; blocks semantic
  admission.
- `G-05`: DNG code/reproduction uninspected; deferred.
- `G-06`: second order-bearing view and correspondence absent; blocks alignment.

## Authority Precedence

1. Preserved PDFs and their source records for source claims.
2. Tower claim ledgers and learning packs for source-specific interpretation.
3. Parent-approved cross-tower `findings.md` for the accepted bridge result.
4. Ponder data/policy owners for future fixtures, labels, and admission rules.
5. Research Evidence Harness for non-authority run schemas and receipts.
6. Inventory only as a discovery/read-model surface.

## Fallback Exploration Rule

Expand beyond this package only for one of `G-01` through `G-06`, and name the
gap before reading new sources. External DNG code, new papers, Ponder runtime
code, and Lean formalization are not startup context. Any added source must be
recorded with its evidence status and effect on an obligation.

## Output Paths

- Session handoff: `SESSION-HANDOFF.md`
- Context index: `context-index.json`
- Dispatch: `DISPATCH.json`
- Technique trace: `DISPATCH-TECHNIQUE-TRACE.md`
- Invoke result: `INVOKE-RESULT.md`
- Portable evidence: `research/`
- Governance receipts: `governance/`
- Hash manifest: `MANIFEST.sha256`
