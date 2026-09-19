# Meta-Type Definitions — Candidate List (owner approval required)

> **How to use this list.** Every row is a **candidate** — nothing is promoted to a canonical definition until
> you approve it. Mark the **Approve?** cell `yes` / `defer` / `no` (or approve a whole tier in its header).
> On approval, each tier routes to its owner: **Tier 1 → batch-1 R7**, **Tier 2 → definitions-governance**,
> **Tier 3 → a schema-format reference** (recommended: documented, not defined). No card is written before approval.

- **Tier 1** — domain meta-types (`DS-D1`) + edge verbs/signatures (`DS-D2`/`DS-D8`): **24** staged labels
  (13 active backend + 11 formation-deferred UI) plus the R3A relationship class now promoted.
- **Tier 2** — method / framework terms (`domainspec-v2-D6+`): **10** candidates.
- **Tier 3** — schema-format / implementation vocabulary: **15** candidates (7 rule kinds + 8 attribute keys).
- **Total: 49 current candidates/labels.** Numeric IDs preserve the retired `DS-D1.10` gap.

## Current maturity ledger

- Backend `DS-D1.1..9,11..14`: human cards, machine schemas, and fixtures exist, so
  they are shape/fixture-backed candidates. They are not uniformly promoted
  semantic authorities; each remains subject to its confirmation contract.
- UI `DS-D1.15..25`: formation-deferred. The rows below preserve the candidate
  trail; active DS-D8 endpoint use is evidence pressure only and does not grant
  DS-D1 formation authority.
- This file is an approval/planning trail, not canonical authority. Root
  `definitions/meta-types/` is the current DS-D1 read model.

---

## Tier 1 — Domain meta-types (`DS-D1.<n>`) · owner: definitions-governance · home: root `definitions/DEFINITIONS.md` (`#ds-d1-meta-type-system`) — DD-D3 resolved; NOT impl/ (R7 redirected)

### 1a. Backend (13) — criterion EXISTS (its `.schema.yml`); **recommend: PROMOTE**
Each card's Formal voice = its schema criterion; Evidence links the `.schema.yml` + TAXONOMY entry.

| # | Candidate | Proposed ID | One-line meaning (criterion) | Rec | Approve? |
| --- | --- | --- | --- | --- | --- |
| 1 | Entity | DS-D1.1 | identity-bearing, lifecycle-tracked object (≥1 identity field; all fields typed) | PROMOTE | |
| 2 | Value Object | DS-D1.2 | immutable, equal-by-fields; **no** identity + an Equality clause | PROMOTE | |
| 3 | Enum | DS-D1.3 | fixed finite named value set (a `Value` table) | PROMOTE | |
| 4 | Operation | DS-D1.4 | state-changing business action (`state_change=yes`) | PROMOTE | |
| 5 | Query | DS-D1.5 | read-only retrieval (`state_change=no`) | PROMOTE | |
| 6 | Calculation | DS-D1.6 | pure function returning a value (`formal_return_type=value`) | PROMOTE | |
| 7 | Rule | DS-D1.7 | boolean guard that blocks/allows (`formal_return_type=boolean`) | PROMOTE | |
| 8 | Policy | DS-D1.8 | strategy selector (`formal_return_type=strategy`) | PROMOTE | |
| 9 | Workflow | DS-D1.9 | orchestration of operations with declared `intra-feature` or `cross-feature` scope | PROMOTE | |
| 11 | Interface | DS-D1.11 | API boundary exposing operations/queries (`interface_kind` external\|internal) | PROMOTE | |
| 12 | Event | DS-D1.12 | past-tense notification of a state change (`temporal=past`) | PROMOTE | |
| 13 | Mapping | DS-D1.13 | field-by-field transform between two shapes (has a `direction`) | PROMOTE | |
| 14 | State Machine | DS-D1.14 | states + valid transitions over time (`has_transitions=yes`) | PROMOTE | |

### 1b. UI (11) — criterion PENDING (MT5 deferred); **recommend: DEFER (descriptive card only)**

| # | Candidate | Proposed ID | One-line meaning | Rec | Approve? |
| --- | --- | --- | --- | --- | --- |
| 15 | Page | DS-D1.15 | a routable screen/view | DEFER | |
| 16 | Layout | DS-D1.16 | shared structural shell around pages | DEFER | |
| 17 | Component | DS-D1.17 | reusable UI building block | DEFER | |
| 18 | View Model | DS-D1.18 | data shaped for rendering (derived from entities) | DEFER | |
| 19 | Hook | DS-D1.19 | reusable stateful UI behavior | DEFER | |
| 20 | Form | DS-D1.20 | schema-validated user input contract | DEFER | |
| 21 | Action | DS-D1.21 | a user-triggered UI intent | DEFER | |
| 22 | Guard | DS-D1.22 | a UI access/precondition check | DEFER | |
| 23 | Binding | DS-D1.23 | a UI↔backend data binding | DEFER | |
| 24 | Adapter | DS-D1.24 | shape coercion between API and UI | DEFER | |
| 25 | State Indicator | DS-D1.25 | a visual state signal (loading/error/empty) | DEFER | |

### 1c. Edge verbs (`DS-D2`) + relationship signatures (`DS-D8`) — **APPROVED + PROMOTED 2026-07-02**
R3A has landed the root relationship authority in `definitions/relationships/relationships.yml` with 31 active
canonical signatures plus generated/deprecated/deferred sections. The class-level owner gate was consumed by
definitions-governance; canonical cards now live as `DS-D2` and `DS-D8` in root `definitions/DEFINITIONS.md`.

---

## Tier 2 — Method / framework terms (`domainspec-v2-D6+`) · owner: definitions-governance · home: root `definitions/`
**Recommend: PROMOTE** (load-bearing for the validation method).

| # | Candidate | Proposed ID | One-line meaning | Rec | Approve? |
| --- | --- | --- | --- | --- | --- |
| 26 | meta-type | domainspec-v2-D6 | one of the active DomainSpec concept types; deferred UI labels are not yet formation-authoritative | PROMOTE | |
| 27 | category | domainspec-v2-D7 | the grouping a meta-type belongs to (Structural / Behavioral / Connective / Lifecycle / UI) | PROMOTE | |
| 28 | formal criterion | domainspec-v2-D8 | a checkable predicate: a concept is a well-formed T iff `<criterion>` | PROMOTE | |
| 29 | edge-participation signature | domainspec-v2-D9 | method/framework term for endpoint participation; cites DS-D8 as the domain relationship-signature authority, not an alias | PROMOTE DONE | |
| 30 | content validator | domainspec-v2-D10 | tool checking an aspect file: each concept satisfies its criterion + each edge its signature | PROMOTE | |
| 31 | instance | domainspec-v2-D11 | a concept normalized to structured YAML conforming to its meta-type schema | PROMOTE | |
| 32 | instance validator | domainspec-v2-D12 | checks a machine-generated instance against its schema criterion | PROMOTE | |
| 33 | aspect file | domainspec-v2-D13 | the markdown spec doc (Concept Registry + per-concept tables) the validator reads | PROMOTE | |
| 34 | Concept Registry | domainspec-v2-D14 | the aspect-file table declaring each concept and its meta-type | PROMOTE | |
| 35 | declared-attributes convention | domainspec-v2-D15 | the `Attribute \| Value` table a behavioral/connective/lifecycle concept uses to declare its discriminators | OPTIONAL | |

---

## Tier 3 — Schema-format / implementation vocabulary · **recommend: DOCUMENT (not canonical definitions)**
These are the validator's internal vocabulary. Recommendation: document in a schema-format reference
(`meta-types/README.md` or a SCHEMA-CONSTITUTION-local), **not** promote as definitions — but listed so you can
pull any up to Tier 2 if you disagree.

### 3a. Criterion rule kinds (7)
| # | Candidate | One-line meaning | Rec | Approve? |
| --- | --- | --- | --- | --- |
| 36 | at-least-one | ≥1 row in a column is truthy (e.g. an identity field) | DOCUMENT | |
| 37 | all-nonempty | every row in a column is non-empty (e.g. typedness) | DOCUMENT | |
| 38 | none | zero rows in a column are truthy (e.g. VO has no identity) | DOCUMENT | |
| 39 | section-contains | the concept section contains a token (e.g. an Equality clause) | DOCUMENT | |
| 40 | table-has-column | the concept's table has a named column (e.g. Enum `Value`) | DOCUMENT | |
| 41 | attribute-equals | a declared attribute equals a value (e.g. `state_change=yes`) | DOCUMENT | |
| 42 | attribute-present | a declared attribute exists, any value (e.g. `interface_kind`) | DOCUMENT | |

### 3b. Declared-attribute keys (8)
| # | Candidate | One-line meaning | Rec | Approve? |
| --- | --- | --- | --- | --- |
| 43 | identity | field flag: this field is the concept's identity | DOCUMENT | |
| 44 | state_change | behavioral: does it mutate state (yes/no) — Operation vs Query | DOCUMENT | |
| 45 | formal_return_type | behavioral: boolean / strategy / value — Rule vs Policy vs Calculation | DOCUMENT | |
| 46 | scope | behavioral: Workflow orchestration scope, `intra-feature` or `cross-feature` | DOCUMENT | |
| 47 | temporal | connective: past / present — Event vs command | DOCUMENT | |
| 48 | direction | connective: inbound / outbound / bidirectional — Mapping | DOCUMENT | |
| 49 | interface_kind | connective: external / internal — Interface | DOCUMENT | |
| 50 | has_transitions | lifecycle: yes/no — State Machine vs flat Enum | DOCUMENT | |

---

## Summary for approval
| Tier | Count | Recommendation |
| --- | --- | --- |
| 1a backend meta-types | 13 | **PROMOTE** (DS-D1.1–9,11–14; criteria exist) |
| 1b UI meta-types | 11 | **DEFER** (descriptive; criterion pending MT5) |
| 1c edge verbs + signatures | (class) | **PROMOTE DONE** (DS-D2/DS-D8 active from R3A authority) |
| 2 method terms | 10 | **PROMOTE** (domainspec-v2-D6–D15) |
| 3 schema-format vocab | 15 | **DOCUMENT** (not canonical) |

**Fastest path if you agree with all recommendations:** approve Tier 1a + Tier 2 as PROMOTE, Tier 1b/1c as
DEFER, Tier 3 as DOCUMENT — then DD1 (method terms) + DD2 (meta-types via R7) execute. Or edit any **Approve?**
cell to override a recommendation.
