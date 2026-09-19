# Runtime Handoff Pack

## Identity

- Task/SWU: `BMC-REL-001-INVOKE-DEFINE`
- Source task/work-pack: `HN-E1384364D9F4` and the BMC-REL-001 decision corpus
- Session/run id: `invoke-define-bmc-rel-001-20260823T192902+0100`
- Session evidence path: `projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/define/evidence`
- Runtime handoff: `runtime`
- Repository revision: `7e77af60ea1fa80fca20d3ebe1df41e2391df149`
- Evidence date: `2026-08-23`

## Obligation Coverage

| Obligation | Status | Selected Evidence | Resolution |
| --- | --- | --- | --- |
| `O1` bounded Define goal | `covered` | active user instruction; decision record lines 1-35 and 834-850 | Compile, do not reopen, D01-D08 and expose the remaining constraint-completion frontier. |
| `O2` exact authority boundary | `covered` | `relationships.yml`; Definitions DS-D8, D27, D29, D30 | Canonical sources are read-only and outrank the candidate sidecar. |
| `O3` current packet state | `covered` | packet, schema, and validator exact hashes | Preserve 31 unresolved row decisions, 30 unresolved numeric facets, pending owner disposition, and `authority_effect: none`. |
| `O4` Define output contract | `covered` | Invoke root and Define mode contracts; DomainSpec spec template | Emit a spec, glossary, context, intent, template selection, technique trace, Distill result, gaps, transport, validation, and approval manifest. |
| `O5` calibrated examples | `covered` | Complexity Example Ladder contract and D01-D08 claim ceiling | Produce aligned low, medium, and complex hypotheticals without selecting unresolved policy. |
| `O6` safe delegation | `covered` | repository AGENTS route and this strict handoff | One helper may write only the new Define sidecar and must return a validation receipt. |
| `O7` approval boundary | `covered` | Invoke Design activation gate | Stop after candidate validation; Design requires exact owner approval of the Define baseline. |

Strict coverage: `pass`

## Selected Sources

- `projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/decisions/BMC-REL-001-BACKEND-CARDINALITY-DECISIONS.md`
  - Selectors: lines 1-35; D01-D08 sections; lines 834-850
  - Obligations: `O1`, `O3`, `O5`, `O7`
  - Evidence: D01-D08 are resolved; the separate nonnumeric pass and other blockers remain.
- `projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/candidates/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.json`
  - Selectors: top-level status/authority/owner disposition; all row `proposed_decision` objects
  - Obligations: `O3`, `O5`
  - Evidence: candidate-only packet with unresolved row decisions and numeric facets.
- `projects/domainspec-v2/definitions/relationships/relationships.yml`
  - Selectors: active catalogue and `produces`, `orchestrates`, `maps`, `emits`, `owns`, `belongs-to`
  - Obligations: `O2`, `O5`
  - Evidence: machine authority for canonical relationship signatures.
- `projects/domainspec-v2/definitions/DEFINITIONS.md`
  - Selectors: DS-D8 lines 1119-1177; D27 lines 1200-1251; D29 lines 1317-1428; D30 lines 1430-1532
  - Obligations: `O2`, `O5`
  - Evidence: authority, responsibility, ownership-dimension, and membership-kind boundaries.
- `projects/domainspec-v2/definitions/DEFINITIONS-INDEX.md`
  - Selectors: DS-D8, D27, D29, D30 index rows
  - Obligations: `O2`
  - Evidence: synchronized definition index.
- `projects/domainspec-v2/definitions/ownership-dimensions/ownership-dimensions.json`
  - Selectors: complete closed registry
  - Obligations: `O2`, `O5`
- `projects/domainspec-v2/definitions/membership-kinds/membership-kinds.json`
  - Selectors: complete closed registry
  - Obligations: `O2`, `O5`
- `projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/schemas/BMC-REL-001.RELATIONSHIP-CONSTRAINT-DECISION-PACKET.schema.json`
  - Selectors: proposed-decision surface and closure rules
  - Obligations: `O3`
- `projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/validators/validate-bmc-rel-001-decision-packet.mjs`
  - Selectors: claim ceiling, row validation, and hostile-probe self-test
  - Obligations: `O3`, `O6`
- `.arcanum/handoff-notices/notices/HN-E1384364D9F4.json`
  - Selectors: identity, source bindings, open call, and claim ceiling
  - Obligations: `O1`

Inventory lookup was ready and returned adjacent relationship-governance entries, but none covered the current BMC-REL-001 corpus more precisely than the exact owner records above; they are excluded from the authored evidence denominator.

## Architecture Guidance

The Define baseline is one candidate, non-authority read model over exact canonical and owner-selected sources. It must keep concept-level, declared-occurrence, runtime, topology, representation, and numeric axes distinct.

## Related Feature Context

D06 and D07 already created governed registries and typed packet projections. D08 retained canonical endpoint provenance without adding a cross-row constraint.

## Constraints And Non-Goals

- Do not change, reinterpret, or normalize any existing source.
- Do not choose numeric bounds or unresolved nonnumeric policies.
- Do not accept the packet, implement enforcement, or claim promotion/publication/release/deployment.
- Record the discovery waiver: the exact D01-D08 decision corpus and original handoff provide a narrower, stronger baseline than a new generic discovery pass.
- Examples must be hypothetical, aligned across three complexity rungs, and have decision effect `none`.
- Use one-agent labelled Proposer/Balancer simulation for Distill; a multi-agent tournament is outside the approved route.

## Write Scope

- `projects/domainspec-v2/development/relationship-constraint-decisions/BMC-REL-001/sidecars/BMC-REL-CONSTRAINT-COMPLETION/define/**`

## Validation Surface

- Parse every new JSON file.
- Run the sidecar validator with `/home/vrondelli/.nvm/versions/node/v22.12.0/bin/node`.
- Run the main BMC packet validator positive path and self-test without modifying its sources.
- Run scoped whitespace/content checks and `git diff --check` for the new sidecar.
- Re-hash all ten selected source files and require the bindings in `RUNTIME-HANDOFF.json` to remain exact.

## Gaps And Blockers

- Target-semantic gaps are inputs to the Define gap ledger, not delegation blockers.
- Exact owner approval of the finished candidate is required before Invoke Design.

## Authority Precedence

1. Canonical `relationships.yml` and Definitions cards/registries.
2. Owner-selected BMC decision record and exact selection receipts.
3. Current candidate packet, schema, and validator.
4. Invoke/Distill/Complexity Example Ladder authoring contracts.
5. Candidate-sidecar synthesis and labelled hypothetical examples.

## Fallback Exploration Rule

Broad repository exploration is not allowed. Additional reads must close a named obligation or validation failure and must be reported in the helper receipt.

## Provenance

- Source refs: the ten selected sources above
- Content hashes: bound in `RUNTIME-HANDOFF.json`
- Builder mode: `standard`

## Output Paths

- Markdown: this file
- JSON/index: `RUNTIME-HANDOFF.json`
