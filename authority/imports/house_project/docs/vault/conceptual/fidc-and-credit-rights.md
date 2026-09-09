---
tags:
  - business
  - fidc
  - credit-rights
  - capital-markets
  - ccb
layer: market
nature: explanatory
status: exploratory
veracidade: high
convicção: high
audience: agent, engineer, product
version: 0.1.0
last_updated: 2026-03-09
node_type: conceptual
is_session: false

---

# FIDCs and Credit Rights — Overview

> General market overview. The facts described here are well-established (high factual accuracy), but how they apply to our specific context is still being refined.

---

## Objective

This document is the **market context primer**. It answers the question: *"What is a FIDC, what are credit rights, who are the actors, and how does an assignment operation work?"*

It provides the domain knowledge necessary to understand why the platform exists and what business concepts the codebase models. It is not a product spec — it is the external reality the system responds to.

---

## Index

1. [What is a FIDC](#what-is-a-fidc)
2. [What are Credit Rights](#what-are-credit-rights)
3. [The Agents](#the-agents)
4. [The Instrument: CCB](#the-instrument-ccb-cédula-de-crédito-bancário)
5. [The Assignment Operation](#the-assignment-operation)
6. [Quick Glossary](#quick-glossary)
7. [Connections](#connections)
8. [Open Points](#open-points)

---

## What is a FIDC

A **FIDC (Fundo de Investimento em Direitos Creditórios)** is an investment vehicle regulated by the Brazilian Securities Commission (CVM) whose primary asset is the purchase of **credit rights** — receivables that a company has from its customers or debtors.

In plain terms: a fund that buys debt.

The FIDC pays for credit rights at a value **below their face value** and receives the full amount at maturity. The difference is the **spread** — the source of the fund's return.

### Share structure
- **Senior shares** — payment priority, lower risk, lower return
- **Subordinated shares** — absorb losses first, higher risk, higher potential return

---

## What are Credit Rights

Any credit that represents an **expected future cash flow**. Market examples:

| Origin | Example |
|--------|---------|
| Retail / card terminal | Installments from credit card purchases |
| Vehicle financing | Monthly payments |
| Personal credit | CCBs, personal loans |
| Corporate | Invoices, receivables |
| Agribusiness | CPRs |

> **In our current context:** we work primarily with personal and corporate credit formalized in **CCBs (Cédulas de Crédito Bancário)**. Other asset types exist in the market but are outside the current scope.

---

## The Agents

### Originator / Assignor (Cedente)
The company that originated the credit and **assigns** it to the fund. Receives payment below face value in exchange for immediate liquidity.

> **Note:** In some flows, the originator (who created the credit) and the assignor (who sells to the fund) may be different entities. In our current context, this distinction is not yet mapped.

### Debtor (Sacado)
The debtor — who owes the payment. May be an individual (CPF) or legal entity (CNPJ). Does not participate in the assignment; only the creditor changes.

### FIDC
The **buyer** of credit rights. Operates under CVM regulation.

### Custodian
Financial institution that **holds and validates** the documents representing the credits. Required by regulation for FIDCs. Plays a key role in CCB verification.

### Manager / Administrator
- **Manager**: decides which portfolios to buy and at what price
- **Administrator**: fulfills regulatory obligations to the CVM

---

## The Instrument: CCB (Cédula de Crédito Bancário)

The CCB is a credit instrument that legally formalizes the debt. It is the **collateral** — without it, an asset exists in the ledger but has no legally verifiable legitimacy.

In a typical operation:
1. The debtor issues or signs a CCB with the originator
2. The originator assigns the CCB to the FIDC via a remessa (batch submission)
3. The FIDC becomes the legitimate creditor

---

## The Assignment Operation

```
Debtor ─── owes ───► Originator ─── assigns ───► FIDC
(sacado)              (cedente)                (buyer)
                           ↑
                    receives value below
                    face value (spread)
```

---

## Quick Glossary

| Term | Meaning |
|------|---------|
| **Remessa** | A batch of credit rights submitted by the assignor for evaluation and acquisition |
| **Face value** | The amount the debtor must pay |
| **Acquisition value** | What the FIDC pays — always below face value |
| **Spread** | Difference between face value and acquisition value |
| **Collateral (lastro)** | Documentation proving the existence and validity of the credit |
| **Assignment (cessão)** | Formal transfer of the credit right to the fund |
| **PDD** | Provision for doubtful debtors — reserve for default risk |

---

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[mission]] | `contextualizes` | This market overview is the context where the mission is set |
| [[system-premises]] | `contextualizes` | Premises P1 and P3 gain meaning in the context of this market |

---

## Open Points

- Exact relationship between originator and assignor in our flow
- Role of the custodian in technical integration
- Other asset types the managed funds operate with (beyond CCBs)
