# Research Inventory Index

**Last updated:** 2026-04-26
**Entries:** 11
**Total concepts:** 86
**Total cross-context edges:** 94

---

## Quick Lookup

| Source ID | File | Domain | BCs | Concepts | Edges | Patterns | Confidence | Experiments |
|-----------|------|--------|----:|--------:|------:|----------|:----------:|-------------|
| BOOK-Evans-BlueBook + GH-CargoTracker | [cargo-shipping.md](cargo-shipping.md) | Cargo Shipping | 5 | 13 | 15 | P1,P2,P3,P4 | high | E6, E9 |
| BOOK-Vernon-IDDD + GH-IDDD-Samples | [collaboration-agilepm.md](collaboration-agilepm.md) | Collaboration & Agile PM | 3 | 13 | 15 | P1–P6 | high | E6, E9 |
| SD-RideHailing | [ride-hailing.md](ride-hailing.md) | Ride-Hailing | 6 | 15 | 16 | P1–P5 | moderate | E6, E9 |
| GH-eShopOnContainers | [ecommerce-platform.md](ecommerce-platform.md) | E-commerce Platform | 6 | 15 | 16 | P1–P6 | high | E6, E9 |
| SD-Banking | [banking-finance.md](banking-finance.md) | Banking & Finance | 5 | 14 | 16 | P1–P5 | moderate | E9 |
| SD-FoodDelivery | [food-delivery.md](food-delivery.md) | Food Delivery Marketplace | 5 | 16 | 16 | P1–P5 | moderate | E9 |

---

## Authority Entries (Paper/Method/Framework)

| Source Cluster | File | Entry Type | Scope | Status |
|---|---|---|---|---|
| Methodology authorities | [authority-methodology.md](authority-methodology.md) | paper-abstract | Wohlin/GQM/triangulation/guidelines | operationalized |
| Governance and cybernetics authorities | [authority-governance-and-cybernetics.md](authority-governance-and-cybernetics.md) | paper-abstract | C3/C4 attenuation and intervention theory | operationalized |
| Derivation and formal-method authorities | [authority-derivation-and-formal-methods.md](authority-derivation-and-formal-methods.md) | paper-abstract | C2 deterministic derivation comparison set | operationalized |
| Architecture and meta-governance authorities | [authority-architecture-and-meta-governance.md](authority-architecture-and-meta-governance.md) | framework-architecture | C1/C4 architecture and governance framing | operationalized (with waivers) |

---

## By Industry

| Industry | Sources |
|----------|---------|
| Logistics & Shipping | cargo-shipping |
| Project Management & Collaboration | collaboration-agilepm |
| Transportation & Mobility | ride-hailing |
| Retail & E-commerce | ecommerce-platform |
| Financial Services & Banking | banking-finance |
| Food & Delivery | food-delivery |

---

## By Composition Pattern

| Pattern | Description | Sources (of 6) |
|---------|-------------|----------------|
| P1 — Data Handoff | Producer writes data consumed by another context | 6/6 (all) |
| P2 — Entity Reference | Read-only reference to another context's entity | 6/6 (all) |
| P3 — Event Trigger | Cross-context event-driven trigger | 6/6 (all) |
| P4 — Saga | Long-running cross-context coordination | 6/6 (all) |
| P5 — Cross-Enforcement | Rule from one context constrains another | 5/6 (not cargo-shipping) |
| P6 — Shared Context | Identity/tenant scoping across contexts | 2/6 (collaboration-agilepm, ecommerce-platform) |

---

## By Meta-Type Stress

| Meta-Type | Sources exercising it | Total count |
|-----------|----------------------|------------:|
| Event | all 6 | 35 |
| Value Object | all 6 | 22 |
| Entity | 5 (not food-delivery has 1) | 16 |
| Rule | 4 (CD2, CD3, CD4, CD5, CD6) | 11 |
| Saga | all 6 | 6 |
| Calculation | 2 (ride-hailing, food-delivery) | 3 |
| Operation | 1 (ecommerce-platform) | 1 |

---

## By Bounded Context Count

| BCs | Sources |
|----:|---------|
| 3 | collaboration-agilepm |
| 5 | cargo-shipping, banking-finance, food-delivery |
| 6 | ride-hailing, ecommerce-platform |

---

## E11 Source Linkage (Pin-Consistent)

Link file: [e11-technique-specialization-sources.md](e11-technique-specialization-sources.md)

Source IDs covered for E11 G3 readiness:

- `SRC-SAGA-MICROSERVICESIO`
- `SRC-SAGA-EVANS-BLUEBOOK`
- `SRC-SAGA-CAMUNDA`
- `SRC-OUTBOX-MICROSERVICESIO`
- `SRC-CQRS-FOWLER`
- `SRC-CQRS-AZURE`
- `SRC-EVENTSOURCING-AZURE`
- `SRC-COMPETING-CONSUMERS-AZURE`
- `SRC-QUEUE-LEVELING-AZURE`
- `SRC-LOAD-SHEDDING-AWS`
- `SRC-TIMEOUT-RETRY-JITTER-AWS`
- `SRC-BATCH-EIP`
- `SRC-SPRING-BATCH`
- `SRC-KAFKA-SEMANTICS`
- `SRC-OPTIMISTIC-OFFLINE-LOCK`
- `SRC-PESSIMISTIC-LOCKING-POSTGRES`
- `SRC-LEASES-ETCD`
- `SRC-RETRY-AZURE`
- `SRC-CIRCUIT-BREAKER-AZURE`
- `SRC-IDEMPOTENCY-STRIPE`
- `SRC-DLQ-AZURE-SB`
- `SRC-HEXAGONAL-ALISTAIR`
- `SRC-STRANGLER-FOWLER`
- `SRC-DDD-ACL-EVANS`
- `SRC-VERNON-IDDD`

---

## Inventory Gaps

| Gap | Impact | Action |
|-----|--------|--------|
| No E6-only domains inventoried | E6 used 18 domains; only 6 shared with E9 are inventoried | Backfill from E6 JSONL (12 domains) |
| No poker-team inventory | E9 run-1 used the live codebase; no persistent domain model extraction | Ingest from `docs/features/` and `backend/src/domain/` |
| System design sources lack version pins | ride-hailing, banking, food-delivery have no commit SHA | Pin on next access |
| Authority clusters are grouped, not per-source files | 32 paper references are inventory-linked by cluster instead of one-file-per-source | Split into per-source entries if an experiment needs source-level deep extraction |
