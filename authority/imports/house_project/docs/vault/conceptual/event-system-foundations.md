---
tags:
  - event-system
  - architecture
  - ontology
layer: architecture
nature: explanatory
status: exploratory
veracidade: high
convicção: high
audience: agent, engineer, product
version: 0.2.0
last_updated: 2026-03-24
node_type: conceptual
is_session: false

---

# Event System — Motivation, Context and Intellectual Foundations

> This document explains *why* the event system exists and *why* it is shaped the way it is. It does not define rules — those live in `architecture/event-system-constitution.md`. It provides the business motivation, the practical value proposition, and the intellectual grounding: three disciplines that, independently, converged on the same structural decision.

---

## Objective

This document is the **conceptual justification** for the event system's design. It answers two questions: *"What problem does the event system solve?"* and *"What intellectual traditions and engineering principles converge on this architecture?"*

It covers the business problem, the layered value over time, why traditional logging is insufficient, the catalog-as-contract concept, the three foundations (Ontology, Digital Twins, Event Sourcing), why they converge, and outlines a future direction for semantic vector-based agent navigation.

---

## Index

1. [The Problem That Motivated Everything](#the-problem-that-motivated-everything)
2. [Why It Is Useful — Layered Value](#why-it-is-useful--layered-value)
3. [Why Not Just Traditional Logging?](#why-not-just-traditional-logging)
4. [The Architecture in One Sentence](#the-architecture-in-one-sentence)
5. [The Catalog as Contract](#the-catalog-as-contract)
6. [The Three Intellectual Traditions](#the-three-intellectual-traditions)
   - [Ontology](#1-ontology--what-exists-and-how-it-relates)
   - [Digital Twins](#2-digital-twins--a-virtual-mirror-of-the-real-object)
   - [Event Sourcing](#3-event-sourcing--the-ledger-not-the-balance)
7. [Why All Three Converge](#why-all-three-converge)
8. [Future Directions — Semantic Vector Layer](#future-directions--semantic-vector-layer-for-agent-navigation)
9. [Connections](#connections)

---

## The Problem That Motivated Everything

The platform processes CSV uploads, validates contracts, approves financial remittance batches, and recalculates fund positions. Each of these operations involves real money, regulatory compliance, and legal liability.

The system, in its initial form, stored only **current state** — what a record looks like *now*. This created a gap in the system's knowledge about itself:

- *What happened with this upload?*
- *Who approved this remittance, and with what data visible to them at the time?*
- *Did the nightly recalculation work or fail, and why?*
- *What caused the change in this fund position?*

These questions could not be answered with confidence. The system did not know its own history. This is not a logging gap — it is an **epistemological gap**: the platform has no memory of itself.

---

## Why It Is Useful — Layered Value

### Today — Operational

The system creates the ability to answer questions about itself:

```python
# Full timeline of an upload
EventLog.objects.filter(stream_id=upload.stream_id).order_by('created_at')

# Who approved each remittance, and when
EventLog.objects.filter(
    event_type=EventLog.EventType.REMESSA_USER_APPROVED
).select_related('actor')

# Why a batch failed
EventLog.objects.filter(stream_id=batch.stream_id, event_type='upload_failed')
    .values('description', 'payload')
```

This covers operational debugging, client support, and traceability of asynchronous processing.

### In Months — Audit and Compliance

The `actor` + `origin=HUMAN` fields on each event create a non-repudiable audit trail: one knows exactly who did what, when, and with what data available at the time of the decision. The `payload` records the "cognitive snapshot" of the moment — such as the `valor_total` visible to the approver.

For regulated financial products, this is not optional. The historical alternative was unstructured application logs, which are impractical for formal auditing.

### In Years — Deep Business Understanding

The complete sequence of events is the **primary dataset** for:

- Behavioral analysis: usage patterns, bottlenecks, anomalies
- Predictive models: which remittances have the highest probability of rollback?
- Multi-hop causal traceability: given a problem in a fund today, which upload from 3 weeks ago originated that state?
- AI agent integration: an agent with access to the event stream can answer complex questions about business state without needing access to multiple state tables

---

## Why Not Just Traditional Logging?

The difference is fundamental:

| Aspect | Traditional Logging | Event System |
|---|---|---|
| Structure | Free text in a file | Structured JSON with schema |
| Guarantee | None (can fail silently) | `log_event_safe()` guarantees fail-open |
| Semantics | "Something happened" | "This named event with these entities transitioned through this state" |
| Query | Full-text search | SQL queries by `stream_id`, `entity_type`, `actor`, `event_type` |
| Ontology | Implicit (understood by humans) | Explicit (registered in the catalog) |
| Compensation | Impossible to trace | `is_compensating=True`, `compensates=` |
| Retention | Uniform TTL or none | Differentiated by tier (business=forever, tech=15d) |

Traditional logging answers: *"the system printed this string at 14:32"*.
The Event System answers: *"user X approved remittance Y with value R$ 1,234,567, 38 minutes after upload Z was processed, which was queued by Z2 running on attempt 2 of 3"*.

---

## The Architecture in One Sentence

> An append-only event log (`EventLog`) where each event type is declared in an ontological catalog (`event_catalog.py`), grouped by lifecycle (`stream_id`), causally linked to the previous event (`parent_event`), and written exclusively by a single controlled module (`event_log_service.py`) — such that the current state of any entity is always derivable from its event history.

---

## The Catalog as Contract

The `event_catalog.py` deserves special attention. It is not just documentation — it is an **executable contract**:

- `tier` is read by the service to determine the retention policy (no client code chooses this)
- `description_template` is used to automatically generate the human-readable description of each event
- `business_weight` (1–10) encodes the ontological importance of the event for future analytics tools and prioritization
- `valid_next_events` documents the domain's state machine
- `compensates` / `is_compensating` prepares the ground for an eventual saga coordinator

Changing the catalog does not alter past events — they are immutable. The catalog is an **interpretation layer**, like the index of a historical archive. This is deliberate: the interpretation of what an event means can evolve, but the fact that it occurred is permanent.

---

## The Three Intellectual Traditions

### 1. Ontology — What Exists and How It Relates

Ontology, in its philosophical origin in Aristotle and formalized for computing by Tom Gruber (1993), is the discipline of formally specifying what exists in a domain, what properties those things have, and how they relate to one another.

Building an event system forces a rigorously ontological exercise: you must explicitly enumerate the **first-class entities** of the business (`UploadFile`, `RemessaBatch`, `RemessaEntry`, `Fundo`...) and the **states through which they transition** (`imported → approved → rolled_back`). You cannot record an event without first naming what happened and who was involved.

The `event_catalog.py` is literally an ontological registry: it declares what each event type *means* in the domain, which entities it relates (`ontology_links`), the importance weight of the event (`business_weight`), and which events may compensate it (`compensates`). The Entity Registry is the formal enumeration of the domain's substances.

> **Ontology is not a separate artifact — it emerges from the event system itself.**

---

### 2. Digital Twins — A Virtual Mirror of the Real Object

The **Digital Twin** concept was articulated by Michael Grieves in 2002 in the context of manufacturing and product engineering, and popularized by NASA for monitoring aerospace systems. The central idea: create a virtual representation of a real object that is continuously updated by a stream of real-time sensor data.

In the context of this platform:

- A physical `UploadFile` (a CSV on disk or in S3) has a digital twin in the `EventLog` table
- Each `RemessaBatch` has a digital twin: the ordered set of events sharing the same `stream_id`
- Each fund position has a digital twin derived from `INVENTORY_RUN_*` events

The `stream_id` is the twin's identifier — the key that groups all events from a specific lifecycle. Writing `upload_file.stream_id = stream_id` is literally connecting the real object to its digital mirror.

The stream hierarchy (Upload → RemessaBatch → FilterRun, each with its own `stream_id` and `parent_event`) is the topology of nested digital twins:

```
Upload CSV           → stream=A   (digital twin of the upload)
  └── RemessaBatch   → stream=B   (digital twin of the batch)
        └── FilterRun → stream=C  (digital twin of the filter cycle)
```

Any current state of any entity can be derived from its twin. **The twin is more reliable than the state table**, because the twin never lies: it contains facts annotated at the moment they occurred.

---

### 3. Event Sourcing — The Ledger, Not the Balance

The oldest archetype of event sourcing is double-entry bookkeeping, invented by Luca Pacioli in 1494. The central intuition: the **ledger** (the journal of entries) is the source of truth, not the **balance** (the current state). The balance is derivable from the ledger at any point in time; the reverse is not true.

Eric Evans formalized the concept of **Event Sourcing** for software in his work on Domain-Driven Design (DDD, 2003). Martin Fowler consolidated and popularized it in his catalog of architecture patterns. The premise:

> Instead of storing only the current state of an entity, we store the complete sequence of **events** that led to that state. The current state is a *projection* of the events.

In the implemented system:
- The `EventLog` is the ledger — append-only, immutable, the primary source of truth
- The state tables (`RemessaBatch.status`, `UploadFile.status`) are balances — projections derived from events
- An event like `REMESSA_USER_APPROVED` does not update a field: it *records the fact* that the approval occurred, who executed it, with what data visible, at what moment

Immutability (Rule 1 of the Constitution) is not a bureaucratic constraint — it is what makes the system epistemically reliable. **A recorded event is a historical fact, not a variable.**

---

## Why All Three Converge

These three disciplines did not coordinate on the same design independently by coincidence. They converge because they share a common epistemological commitment: **the present state of things is insufficient to understand them**. You need the history of how they came to be.

- **Ontology** demands explicit naming of what exists — you cannot record history without first defining what can exist
- **Digital Twins** demand a continuously updated mirror that faithfully reflects the real world — you cannot mirror without a record of every change
- **Event Sourcing** demands the ledger as primary truth — the record is the system, not the reflection of it

The event system in this platform is simultaneously: an ontological registry (catalog), a digital twin fabric (stream hierarchy), and an event-sourced ledger (append-only EventLog).

---

## Future Directions — Semantic Vector Layer for Agent Navigation

> **Status:** Exploratory idea, not yet scoped for implementation.

The current agent navigation model is keyword-based: agents read files using `grep_search` and `view_file`. This works, but forces agents to search across the entire vault with broad queries. As the vault grows, the search space expands linearly.

A more powerful model takes inspiration from **Meta's FAISS/Andromeda** and the embedding-based retrieval that powers modern recommendation systems:

1. **Each vault document is embedded** into a dense vector space using a language model.
2. When an agent needs context, it performs a **semantic similarity search** against the vector index instead of a keyword grep.
3. The top-N most semantically similar documents are injected into the agent's context window — reducing search noise and token cost.

**Why this is valuable for this vault specifically:**
- The graph structure (edges between nodes) can be combined with vector similarity — a technique called **Graph-RAG**. When the constitution is retrieved, its grounding premises are automatically pulled in via graph traversal.
- Conversation session nodes (`conversations/` layer) become the **usage signal** for which documents are retrieved most frequently in which contexts — analogous to click-through data in ad recommendation models.

**Implementation path:**
1. Generate embeddings for all vault `.md` files at commit time (a CI step)
2. Store embeddings in a local FAISS index at `docs/vault/.index/vault.faiss`
3. Expose a query interface agents call to retrieve top-N matches by semantic similarity
4. Wire this into `agent-navigation.md` as **Heuristic 0** — before grep, query the index

This transforms agent navigation from O(vault size) to O(log N) — the same complexity improvement that embedding-based retrieval gave to search engines in the 2010s.

---

## Connections

| Document | Type | Description |
|----------|------|-------------|
| [[event-system-constitution]] | `contextualizes` | The three disciplines explain why the constitution's rules are shaped as they are |
| [[system-axioms]] | `derives-from` | AX-SYS-4 (Immutability) and AX-SYS-5 (Observability) are the formal expression of the intuitions here |
| [[mission]] | `contextualizes` | The financial context (FIDC, CCBs, auditors) is what makes the epistemological rigor non-negotiable |
