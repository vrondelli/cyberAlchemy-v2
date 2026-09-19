---
module: specified-first-order-logic-framework
version: 0.2.0
status: selected
updatedAt: 2026-07-23
docType: invoke-template-selection
---

# Template And Profile Selection

## Inventory Lookup

- Machine index: `.arcanum/inventory/index.json`
- Projection validation: `pass`
- Direct semantic-framework match: none
- Nearby evidence: validator-moat entries only; excluded because they do not
  define executable behavioral logic.

## Selected Templates

| Invoke mode | Selection | Eligibility |
| --- | --- | --- |
| Define | `domainspec-spec/SPEC.md` plus local glossary and canonical-node contracts | The target is a DomainSpec capability with typed concepts, operations, interfaces, mappings, and state. |
| Design | `domainspec-spec/architecture-bundle.md` | The target requires all six design views and source-contract discipline. |
| Plan | standalone `work-pack.md`, `implementation-layering.md`, and `domainspec-spec/execution-pack.md` | Medium complexity requires split tasks, waves, SWUs, and L0-L3 decisions. |

## Rejected Alternatives

| Alternative | Reason |
| --- | --- |
| `module-formulae` | Deprecated and retained only for historical validation fixtures. |
| generic template | Does not preserve DomainSpec Concept Registry and canonical node/graph source contracts. |
| research template | The missing architecture is locally evidenced; external research is not an acceptance-critical input for bounded L0-L2 work. |

## Selection Verdict

`pass`: one eligible template family exists for each requested mode; no
template tie requires a user decision.
