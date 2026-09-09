---
tags:
  - business
  - strategy
layer: market
nature: explanatory
status: exploratory
audience: agent, engineer, product
version: 0.1.0
last_updated: 2026-03-09
node_type: premise
is_session: false

---

# Business Beliefs

> Working hypotheses about the market and why we exist. These are informed bets, not proven facts. They are expected to be revised as we accumulate evidence. Each statement carries an explicit confidence level.

---

## Objective

This document captures the **business bets** the company is making. It answers the question: *"What market hypotheses drive our strategy, and how confident are we in each?"*

Unlike business axioms (taken as given), these premises are expected to be tested and revised. Each carries explicit confidence labels.

---

## Index

1. [P-BIZ-1 — Information Asymmetry](#p-biz-1--the-credit-market-in-brazil-has-structural-information-asymmetry)
2. [P-BIZ-2 — Proximity to Origin](#p-biz-2--a-system-closer-to-the-origin-of-credit-has-a-structural-advantage)
3. [P-BIZ-4 — Operational Efficiency First](#p-biz-4--operational-efficiency-is-the-gateway-to-everything-else)
4. [P-BIZ-5 — Administrator Data Errors](#p-biz-5--the-double-check-of-administrator-data-reveals-systematic-errors)
5. [Connections](#connections)

---

## P-BIZ-1 — The credit market in Brazil has structural information asymmetry

`convicção: high` `veracidade: medium`

Relevant market information is concentrated among a small number of incumbents (large banks, administrators). Smaller players — fund managers, originators — operate with incomplete data about the assets they acquire and manage.

*Source: Lain's market document (Doc Mercado FIDC Pegasus). Qualitative observation, not formally measured. Needs external validation.*

---

## P-BIZ-2 — A system closer to the origin of credit has a structural advantage

`convicção: medium` `veracidade: low`

The later in the credit lifecycle a player receives data, the less useful that data is for risk assessment and pricing. A system with higher-quality data, earlier in the flow, can make better decisions than incumbents operating with downstream data.

*This is the core strategic bet. It has not been tested commercially. It depends on whether we can actually access better upstream data — which is not guaranteed.*

---

---

## P-BIZ-4 — Operational efficiency is the gateway to everything else

`convicção: high` `veracidade: medium`

Analytical and strategic capabilities depend on having clean, structured, reliable operational data. Without operational discipline first, any analytical product is built on sand. The build order matters: operational → control → analytical intelligence.

*This is the premise behind the MVP prioritization. Observed pattern across financial tech companies. Not unique to our situation.*

---

## P-BIZ-5 — The double-check of administrator data reveals systematic errors

`convicção: high` `veracidade: low`

Administrator reports contain errors — mismatched values, incorrect data, calculation inconsistencies — that go undetected because no one has built the tooling to cross-reference them against originator data. The market tolerates this by default.

*Stated by Lain as a direct operational observation. Applies to his specific experience. Generalizability across the market is unknown.*

---

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `[[mission]] | `derives-from` `| The mission document is an application of P-BIZ-1 and P-BIZ-2 — expressed as `derives-from` on that document |
| [[business-axioms]] | `derives-from` | Business axioms are the foundational layer below these premises |
| [[fidc-and-credit-rights]] | `contextualizes` | Market overview provides the factual substrate for these premises |
