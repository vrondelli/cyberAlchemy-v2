---
tags:
  - business
layer: market
nature: explanatory
status: consolidated
audience: agent, engineer, product
version: 0.1.0
last_updated: 2026-03-09
node_type: axiom
is_session: false

---

# Business Axioms

> Foundational commitments that back our business decisions. We take these as given — they are not derived from something smaller, and revising them would require rethinking major decisions that depend on them. They have more poetic freedom than mathematical axioms, but they carry the same weight: if you disagree with one, you disagree with what was built on top of it.

---

## Objective

This document defines the **non-negotiable business commitments**. It answers the question: *"What business truths do we take as given, and what collapses if we challenge them?"*

These are the bedrock on which the mission, business premises, and the system's emphasis on verifiable collateral and reproducible accounting are built.

---

## Index

1. [AX-BIZ-1 — Correct and Reproducible Accounting](#ax-biz-1--a-fund-administrators-primary-obligation-is-correct-and-reproducible-accounting)
2. [AX-BIZ-2 — No Value Without Verifiable Collateral](#ax-biz-2--a-credit-right-has-no-value-without-verifiable-collateral)
3. [Connections](#connections)

---

## AX-BIZ-1 — A fund administrator's primary obligation is correct and reproducible accounting

A FIDC portfolio exists as a legal and financial artifact. The integrity of that artifact — every installment, every assignment, every cash flow — must be verifiable at any point in time. This is not a product decision. It is the minimum condition for the fund to exist legally and for investors to trust it.

Everything we build either serves this obligation directly or enables something that serves it.

---

## AX-BIZ-2 — A credit right has no value without verifiable collateral

An installment in our system is only as real as the CCB (or equivalent instrument) that legally proves the debt exists. A line in a spreadsheet without a corresponding legal document is not an asset — it is a fiction. The CCB is the minimum unit of proof.

This axiom justifies the emphasis on collateral tracking, CCB verification, and the refusal to treat unverified data as equivalent to verified data.

---

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[business-premises]] | `derives-from` | Business premises sit on top of these axioms — expressed as `derives-from` on that document |
| [[event-system-constitution]] | `derives-from` | AX-BIZ-1 justifies append-only reproducible event log — expressed as `derives-from` on that document |
| [[mission]] | `derives-from` | AX-BIZ-1 and AX-BIZ-2 are the bedrock the mission builds on — expressed as `derives-from` on that document |
