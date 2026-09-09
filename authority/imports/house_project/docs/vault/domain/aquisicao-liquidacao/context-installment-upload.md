---
tags:
  - remessa
  - aquisicao
  - liquidacao
  - domain
  - installment-upload
layer: domain
nature: explanatory
status: active
veracidade: high
convicção: high
audience: agent, engineer, product
version: 1.0.0
last_updated: 2026-03-28
node_type: discovery
is_session: false
---

# Remessa Upload — Business Context

> This document explains what the remessa upload feature is, why it exists,
> and what each domain object represents in the business. How the code is
> structured lives in `architecture-installment-upload.md`.

---

## Why This Feature Exists

A FIDC (Fundo de Investimento em Direitos Creditórios) grows by acquiring
credit receivables — CCBs — from originators, and shrinks as those receivables
are paid back (liquidated). Both operations enter the platform via CSV uploads
submitted by operators.

Before a batch of receivables enters the fund's portfolio, it must be:

1. **Validated** — no duplicate installments, no malformed rows
2. **Evaluated** — fund-specific eligibility rules must pass
3. **Approved** — a human decision confirms the batch is ready

This feature owns that entire lifecycle: from the moment a CSV file is dropped
until the installments are either promoted to production or discarded.

---

## Domain Objects

### UploadFile
A single CSV file submitted by an operator. It is the root entity — every
remessa, installment, and contract created from a batch traces back to one
`UploadFile`. Carries the `stream_id` that links all downstream events.

### Remessa
An aggregated group of installments from the same CSV, scoped to a single fund
and a single date context:

- **Aquisição remessa** — grouped by `(cnpj_fundo, data_aquisicao, id_cessao)`.
  Represents a batch of new receivables the fund is acquiring from an originator.
- **Liquidação remessa** — grouped by `(cnpj_fundo, movimento, data_baixa_custod)`.
  Represents payments received against existing receivables.

A single CSV upload can produce multiple remessas if it contains installments
for different funds or date groups.

### Installment (AquisicaoManual / LiquidacaoManual)
The smallest indivisible unit — one row from the CSV, representing a single
payment obligation (aquisição) or settlement (liquidação). Installments are
identified by a deterministic hash so they can be traced across uploads and
tables without relying on auto-increment PKs.

Installments live in **staging tables** (`AquisicaoManualStaging`,
`LiquidacaoManualStaging`) until a remessa is approved, at which point they
are promoted to production tables (`AquisicaoManual`, `LiquidacaoManual`).

### ContratoCCB
A CCB (*Cédula de Crédito Bancário*) is a Brazilian promissory note — a debt
title representing a borrower's total obligation to the fund. It aggregates all
installments for the same `(cnpj_fundo, numero_titulo)`, giving a single view
of how many installments a borrower has open and how much total value is owed.

ContratoCCB only exists for aquisição (liquidação has no contract-level
aggregation). It is created at upload time alongside the staging installments
and promoted to production on approval.

### LiquidacaoManualSemParcela
A liquidation installment that has no matching acquisition record in the fund's
portfolio. This happens when a payment arrives for a receivable that was never
uploaded or was uploaded under a different batch. These records are kept
separately for reconciliation and are permanently deleted on remessa rollback.

---

## Filter System

Before a remessa can be approved, it must pass the eligibility rules configured
for its fund. These rules are set by the fund manager and vary per fund.

### FilterDefinition
The catalogue of available rule types. Each definition has a `filter_key` and
a `parameters_schema` describing what the fund manager can configure.
`is_implemented=False` means the filter is a stub — it always passes vacuously
until real logic is registered.

Currently implemented filters:
- `concentracao_max` — batch value as a percentage of total portfolio must not exceed a configured limit
- `ccb_freshness` — all installments must have a `data_aquisicao` within a configured number of days
- `max_contratos` — limits the number of contracts per remessa

### FundFilterConfig
The binding of a `FilterDefinition` to a specific fund. A fund manager
configures which filters apply to their fund and sets the parameters (e.g.
`max_pct: 20` for concentration). One fund can have many active configs.

### RemessaFilterResult
The outcome of evaluating one filter against one remessa — one row per
`(remessa × FundFilterConfig)`. Carries the result (`pass`, `fail`, `skipped`),
a human-readable `detail` explaining why, and override fields for cases where
an administrator needs to unlock a failed mandatory filter.

A remessa can only be approved if all **mandatory** filters pass or have been
explicitly overridden with a written justification.

---

## Lifecycle States

A remessa moves through the following states:

| Status | Meaning |
|---|---|
| `Pendente` | Created at upload, awaiting approval |
| `Aprovado` | Approved — staging rows promoted to production |
| `Rejeitado` | Rejected — staging rows deleted |
| `Rollback` | Approved then reversed — production rows moved back to staging |
| `Deletado` | Expired by the TTL job (stale > 7 days) or superseded by a newer upload |

A remessa in `Rollback` status can be re-approved without re-uploading the CSV.

---

## Current State

| Capability | Status |
|---|---|
| Upload, dedup, atomic staging | ✅ Implemented |
| ContratoCCB creation | ✅ Implemented (aquisição only) |
| Eligibility filter evaluation | ✅ Implemented |
| Filters: `concentracao_max`, `ccb_freshness`, `max_contratos` | ✅ Implemented |
| Approve / Reject / Rollback | ✅ Implemented |
| TTL auto-expiry (7 days) | ✅ Implemented |
| Filter override — backend + frontend (Phase 6) | ✅ Implemented |

---

## Connections

| Document | Type | Description |
|---|---|---|
| [[architecture-installment-upload]] | `implemented-by` | Code structure, services, flow diagram |
| [[event-system-constitution]] | `governed-by` | Event emission rules for all upload events |
