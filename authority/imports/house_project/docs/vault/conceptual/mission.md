---
tags:
  - mission
  - business
  - strategy
layer: market
nature: explanatory
status: draft
veracidade: low
convicção: high
audience: agent, engineer, product
version: 0.1.0
last_updated: 2026-03-09
node_type: conceptual
is_session: false

---

# Mission

> **Low factual accuracy, high conviction.** What is written here is a bet on the future — not an established fact. Must be revised as reality validates or refutes each stage.

---

## Objective

This document is the **strategic mission statement**. It answers the question: *"Why does ZefraHub exist, what problem does it solve, and what is the phased plan to get there?"*

It defines the three-layer problem (operational → control → analytical), the MVP deliverables, the current phase focus, and the medium/long-term ambitions.

---

## Index

1. [The Problem](#the-problem)
2. [MVP — What Was Built](#mvp--what-was-built)
3. [Current Mission (Phase 1)](#current-mission-phase-1)
4. [Medium-Term Ambition (Phase 2)](#medium-term-ambition-phase-2)
5. [Long-Term Vision (Phase 3)](#long-term-vision-phase-3)
6. [Why This Matters](#why-this-matters)
7. [Connections](#connections)

---

## The Problem

The credit rights market in Brazil operates with inefficiencies across three layers that reinforce each other:

```
Operational → Control → Analytical Intelligence
     ↑_________________________________↓
```

Solving **operational** problems generates data. Data enables **control**. Control powers **analytical intelligence**. And intelligence reveals the next operational problems.

### Operational Problems
Inefficiencies that block day-to-day work:

- Difficulty sending reports and documents to relevant partners
- Lack of technology to connect and exchange information with partners
- Lack of control over asset profitability
- Difficulty generating files for partners (calculations, format, compliance)

### Control Problems
Absence of visibility and traceability over what exists in the system:

- Lack of asset control (calculation, existence, duplication, history)
- Lack of control over settlements and amounts that should be received
- Absence of storage for relevant information: CCB collateral documents, fund regulations, assignment history

### Analytical Deficiency
Inability to extract intelligence for decision-making:

- Lack of internal reports and analytics due to scarce structured data
- Lack of business intelligence for strategic and tactical decisions
- Absence of risk analysis on acquired debts *(not a priority at the moment)*

> **Source:** "Doc Mercado FIDC Pegasus" (Lain). High factual accuracy for the identified problems; medium accuracy for prioritization.

---

## MVP — What Was Built

The MVP touches the surface of all three layers:

| Layer | What the MVP delivers |
|-------|----------------------|
| **Operational** | CNAB and XML converter — automates file generation for partners |
| **Control** | Database + administrator update routine |
| **Analytical** | Dashboard of fund performance vs. CDI |
| **Validation** | Double-check of administrator information |

**Strategy:** focus first on the most pressing operational deficiencies. The client feels the gain quickly, and this generates the input for more advanced products (reports, models, dashboards).

---

## Current Mission (Phase 1)

> Resolve the operational inefficiencies that block FIDC management today.

Specifically:

1. **Create traceability between installments and CCBs** — each installment line must have a verifiable reference to the legal document that legitimizes it
2. **Automate remessa screening** — eligibility filters per fund, with full audit trail of approval and rejection decisions
3. **Build a reliable data foundation** — immutable event log, reproducible state, unambiguous data

**Success criterion for this phase:** an agent or auditor can, from any installment in the system, verify its legal legitimacy and the full history of decisions that led to its acquisition.

---

## Next Mission (Phase 2)

> Link bank extracts to contratos — reconcile what the bank says happened against what the contracts say should happen.

The fund receives bank extracts (extratos bancários) that record actual cash flows. These must be reconciled against the contratos (CCBs) to verify that payments were received, amounts match, and discrepancies are flagged. Today this reconciliation is manual or absent.

**Success criterion for this phase:** any payment recorded in a bank extract can be automatically matched to its corresponding contrato and installment, with unmatched items surfaced for operator review.

> **Uncertainty:** exact data format and integration mechanism with bank systems not yet defined.

---

## Long-Term Vision (Phase 3)

> Actively participate in the full cycle: structure and trade debt with informational advantage.

With high-quality data and proximity to the origin, it becomes possible to:
- Model risk with greater precision than the market
- Structure operations (create and price portfolios) with advantage
- Eventually, create liquidity in the secondary market for credit rights

> **Uncertainty:** this phase is the most hypothetical. It depends on the success of previous phases and business model decisions not yet made.

---

## Why This Matters

The credit market is one of the largest markets in the world. In Brazil, it is historically concentrated, inefficient, and opaque. Systems that reduce that opacity — that can model risk better and operate with more information — have a structural advantage.

The thesis: **high-quality information, close to the origin, processed reliably, is the central competitive advantage**.

---

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[fidc-and-credit-rights]] | `derives-from` | The mission is set within this market context |
| [[business-premises]] | `derives-from` | Business premises P-BIZ-1 and P-BIZ-2 motivate this mission |
| [[business-axioms]] | `derives-from` | AX-BIZ-1 and AX-BIZ-2 are the bedrock the mission builds on |
| [[system-premises]] | `derives-from` | Premises P-SYS-3 and P-SYS-7 are the technological bets that make this mission viable |

