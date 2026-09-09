# DomainSpec v2 — pillar rework (cav2 workstream)

Working home for the **DomainSpec v2** rework. Governed by Craft context
[`CTX-CAV2-DOMAINSPEC-V2`](../../.craft/ledger.yml) — peer of the Mint feature,
recomposes into `CTX-CAV2-ROOT`. Candidate / working material; not authority.

## What domainspec-v2 means (already owned — do not re-derive)

DomainSpec v2 = **govern + enforce Ontology A (the DomainSpec language) on evidence**,
per the owned inventory synthesis
[`ontology-operationalization-in-the-machine`](../../../.arcanum/inventory/entries/ontology-operationalization-in-the-machine-synthesis.md)
("two ontologies, align-not-merge; 'domainspec-v2' = govern A + enforce A, earned on evidence").
This is **build-from-owned** over DomainSpec v1
([`implementation/domainspec/`](../../../implementation/domainspec)) and the Lean
formalization ([`domainspec-lean-formalization/`](../../../domainspec-lean-formalization)),
not a greenfield rebuild.

## First work: v1 → v2 import triage

Decide, per capability, what to **import / reformulate / drop** for v2, across the
areas named at kickoff (each has owned v1 carriers):

| area | v1 carriers |
| --- | --- |
| **Two offers** — free LLM pipeline vs proprietary engine | `domainspec-pipeline` (free generate→implement) · `implementation/domainspec/tools/test-derivation-engine/` (proprietary moat) |
| **Code-tag drift** | `domainspec-tag-code` · [`DRIFT-CONVERGENCE.md`](../../../implementation/domainspec/DRIFT-CONVERGENCE.md) · `domainspec-sync-registry` |
| **Audit** | `domainspec-audit-alignment` · Lean audits (`VLACHOPULOS-2026-AUDIT.md`, `SMITHE-2024-AUDIT.md`) |
| **Layering alignment** | `domainspec-audit-layering` · [`ADLC-ALIGNMENT.md`](../../../implementation/domainspec/ADLC-ALIGNMENT.md) |

Also in corpus: the pre-existing `projects/domainspec-v2/` (separate early-v2 material).

Guardrails carried into every triage row: **claim ≤ proof**; the deterministic **engine
stays proprietary** (moat) while the **LLM pipeline is the free path**; the
**write-authority proviso** (no modeling surface writes promotion-status); cav2 authority
owns promotion.

Dispatch design + folder/destination confirmation are governed by
`domainspec-subagents-strategy`.
