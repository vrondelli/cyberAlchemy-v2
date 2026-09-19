---
tags: [framework-unification, artifacts, components, catalog, tiers]
node_type: reference
is_session: false
layer: architecture
nature: reference
status: draft
version: 0.1.0
last_updated: 2026-06-16
created_by: victorboscaro@gmail.com
---

# Framework Unification — Artifact Catalog

> **What this node is.** A clear, direct catalog of the **artifacts** the engine deals with: what
> each one is, which **tier** it belongs to, where it **originates**, and what is relevant about it.
> It deliberately does **not** map how artifacts relate to each other — that is the next node. It
> decides no owner and ratifies no schema. Conventions proposed here are marked **(proposal)**.
>
> Governed by [SCOPE.md](../SCOPE.md); sits under [CONCEPT-MAP.md](../CONCEPT-MAP.md) (this is the
> "artifacts" detail behind the concept map's horizontal axis).

---

## The first cut: four tiers, not one list

The word "artifact" hides four different kinds of thing. Separating them is the load-bearing move —
mixing the **product** (tier A) with the **engine** (tier D) is the single most common confusion.

| Tier | What it is | Lifecycle scope |
|---|---|---|
| **A — Object artifacts** | outputs of *running the lifecycle over a domain*. Carry the node envelope, form the typed graph, are where drift/residue live. **The spine.** | per-run / per-feature |
| **B — Knowledge artifacts** | accumulate *across runs* into the domain's persistent knowledge | cross-run, repo-global |
| **C — Signal artifacts** | append-only telemetry that feeds the tuning loop | append-only stream |
| **D — Engine / governance artifacts** | the *mechanism itself* (the "how" = Arcanum) — they define the run, they are not produced by it | repo-global |

**The recursive twist.** The engine is built with itself — we run the lifecycle *on* the engine (this
workspace is the proof). So a tier-D artifact like a skill has, **during its development**, a matching
set of tier-A objects (its own problem-statement → discovery → plan → spec). The tier-A development
artifacts and the tier-D source are **distinct files at different altitudes** — the recursion lives in
the **process** (domainspec applied to domainspec), not in one file wearing two hats.

---

## Three ontologies — which plane are we on?

"Ontology" is overloaded. Three distinct planes, easy to conflate:

| Plane | Ontology of… ("the …") | Examples | Tier |
|---|---|---|---|
| **1. Meta-system** | the *artifacts that build any domain* (how we build) | problem-statement, research, discovery, constitution, spec, code + their `derives-from`/`cites` edges | **this catalog is it** (spans A/C/D) |
| **2. Domain meta-ontology** | the *types* of domain concept — abstract, same for every business | Entity, Operation, Rule, Event… (`TAXONOMY.md`) + the 29 edges (`RELATIONSHIPS.md`) | D |
| **3. Domain ontology (instances)** | *this* business's concepts (what the client sees) | `Caminhão`, `Posto`, `Jurisdição`, `Abastecer`, `EstoqueMínimoRule` | B |

- **The client only sees plane 3.** Nobody wants to see "Entity" — they want `Caminhão`, `Posto`,
  `Jurisdição`. Plane 3 is plane 2 **instantiated** (`Caminhão` IS-A Entity).
- **Plane 1 governs the process that produces plane 3**; plane 2 is the vocabulary plane 3 is written
  in. This catalog = plane 1 (the meta-system ontology). `TAXONOMY` = plane 2. The ontology-view /
  `domain.md` / registry hold plane 3.
- This is the M2/M1/M0 layering from another angle: plane 2 ≈ the per-type schema (M1), the node
  envelope ≈ the meta-schema (M2), plane 3 ≈ instances (M0).

---

## Tier A — Object artifacts (the spine)

Read each row as: **producer (skill) ← input → the question it answers**. `Node kind`: `root` (origin
of provenance) · `node` (single envelope) · `composite` (a bundle of sub-nodes) · `leaf` (in the
graph only via tags). `Status`: `built` · `designed` · `to-create`.

| Artifact | Producer (skill) | Input | Question it answers | Node kind | Status |
|---|---|---|---|---|---|
| **problem-statement** | — *(none yet)* | raw user intent | "what is the pain/goal, and what is success?" | **root** | **to-create** |
| **define** (PROJECT-OVERVIEW · INITIAL-DEFINITIONS · PROJECT-DECISIONS · HYPOTHESES · EXPERIMENT-CANDIDATES) | `domainspec-interview-scope` | problem-statement + user | "what is the scope of the domain?" | composite | built |
| **research** | `domainspec-subagents-strategy` / manual | a question from define/discovery | "what do the sources say?" (raw evidence) | node | built |
| **findings** | same dispatch | research | "what does it mean?" (synthesis + analysis) | node | built |
| **discovery** | `domainspec-discovery-writer` agent (via `domainspec-subagents-strategy`; style guide `discovery-writing.md`) | many findings | "what is the design space — decisions, alternatives, open questions?" (**load-bearing**) | node | built |
| **paired-views** (ontology-view · system-view · engineer-view) | `ontology-view` / `system-view` / `engineer-view` | discovery | "typed vocabulary / shape & stakes / mechanics & verdicts" | composite (ontology-view bridges A→B) | built |
| **plan** | `domainspec-planner` **agent** (pipeline Step 1; no standalone skill) | discovery | "what is the execution order / task list?" | node | built (no schema; often inline) |
| **spec** (SPEC.md · architecture.md · aspects: domain/operations/states/interfaces/events/queries/workflows) | `domainspec-spec-feature` | discovery / plan | "what is the formal behavior contract?" | composite | built |
| **stories** | `domainspec-sync-user-stories` | spec aspects | "what journeys (BDD), traceable to concepts?" | node | built |
| **test-spec** | `domainspec-generate-tests` | aspects + stories | "what evidence proves each obligation?" (claim ≤ proof) | node | built |
| **code** (+ code-tags.json + drift report) | `domainspec-implement` + `domainspec-tag-code` | spec | "the implementation that satisfies the contract" | **leaf** (tagged) | built |

### Notes on the subtle ones

- **problem-statement (to-create).** The proposed **root of provenance**: every downstream artifact
  should trace back to it (invariant I2). It is the *why / pain / success criteria* — distinct from
  `define`'s *what / scope*. **(proposal:** problem-statement **precedes** define; they coexist, one
  does not replace the other.)
- **research + findings.** Two artifacts, tightly coupled: `research` (`domainspec-research.md`, raw
  evidence) and `findings` (`domainspec-findings.md`, synthesis-on-top + analysis-below). A
  `domainspec-subagents-strategy` dispatch produces both via the `domainspec-research-writer` /
  `domainspec-findings-writer` agents; its **dispatch record** is a tier-C ledger entry
  (`subagents-dispatch.yaml`), not a tier-A artifact.
- **paired-views & spec are composites.** Each is one bundle of sub-nodes (paired-views = 3 sibling
  views with a single-owner invariant across them; spec = SPEC.md + architecture.md + N aspect files).
  **(proposal:** a *composite* carries its own envelope **and** its sub-nodes carry theirs.)
- **code is the only non-doc.** It is a **leaf** because it is not *authored* as a lifecycle node — it
  is *generated* by one producer (`domainspec-implement`) and linked back retroactively via tags. It
  enters the typed graph **only through tags** (`governance/tags/code-tags.json`, the `@source`/`@sys`
  markers); the drift report (`governance/tags/CODE-TAG-DRIFT-REPORT.md`) is the residue of that edge —
  code-without-spec / spec-without-code (the ADLC orphan rate). **(design choice:** code = leaf linked
  by tags, not a doc-node.)

### What counts as ONE artifact (design choice under exploration)

> **Rule:** one artifact = one node with its own `identity`/envelope. Bundles (`spec`, `paired-views`,
> `define`) are **composite nodes** whose parts are sub-nodes. This keeps the graph countable instead
> of ambiguous. **Status: proposed, not ratified (see OQ-1).**

---

## Tier B — Knowledge artifacts (accumulate across runs)

The domain's persistent memory. `ontology-view` is the bridge from tier A: it is produced per-run but
feeds the cross-run knowledge graph.

| Artifact | Producer | What it holds |
|---|---|---|
| **ontology-view** | `ontology-view` skill | typed nodes + typed edges; forbidden relations made unconstructible |
| **domain-dictionary / glossary** | `domainspec-feature-glossary`, `domain-dictionary` | canonical term definitions (the "dicionário de negócios") |
| **registry + glossary (global)** | `domainspec-sync-registry` | repo-wide concept registry synced from SPEC concept tables |
| **business-ontology** | (Arcanum) | `arcanum/BUSINESS-ONTOLOGY.md` — business-layer ontology |
| **backlog** | `backlog-pattern` | unresolved work accumulating across runs (`docs/vault/backlog/`) |

> **Open seam:** the "business dictionary" has four candidate homes (CONCEPT-MAP OQ-C). Listed here
> as candidates, not resolved.

---

## Tier C — Signal artifacts (append-only telemetry)

Not lifecycle nodes — the residue/observability stream that feeds the tuning loop.

| Artifact | Producer | What it carries |
|---|---|---|
| **pipeline-signals.jsonl** | `domainspec-emit-signals` (pipeline Step 10) | per-step verdicts, overhead, alignment/spec/governance gaps, decisions |
| **ledgers** (delegation-tuning · terminal-guard · sigil-invocations · subagents-dispatch) | various hooks / `observe-invocation.sh` | per-stage telemetry, command execution, dispatch records |
| **TUNING-REPORT.md** | `domainspec-reflect` | cross-run patterns + evidence-backed improvement proposals |

---

## Tier D — Engine / governance artifacts (the mechanism)

These **define** the run; they are not produced by it. Fenced here on purpose — **the engine,
documented separately**. Listed only so the catalog is complete.

| Artifact | Role |
|---|---|
| **CLAUDE.md / AGENTS.md routers** | route a task to the right skill/agent; the "MANDATORY first step" context router |
| **constitutions / axioms** (`CONSTITUTION.md`, `AXIOMS.md`, modular constitutions) | the law that constrains how other artifacts must be shaped |
| **skills** | reusable capabilities (the verbs of the engine) |
| **agents** | subagent definitions (roles, tools, model) |
| **hooks** (`settings.json`) | automation the harness runs around tool calls |
| **taxonomy / relationships** (`TAXONOMY.md`, `RELATIONSHIPS.md`) | the concept-type and domain-edge catalogs the typed graph is built from |
| **SIGNAL-SCHEMA.md** | defines the signal envelope + threshold contract that tier-C signals must follow |

> **Recursive note:** when any tier-D artifact is *being developed* (e.g. a new skill), it becomes a
> tier-A object with its own problem-statement → discovery → plan → spec. That is the altitude shift,
> not a contradiction.

---

## Open Questions

### OQ-1. The "one artifact" granularity rule is proposed, not ratified.
**Context:** `spec`/`paired-views`/`define` are composites; research+findings are two coupled nodes.
The proposed rule (one node = one envelope; composites carry their own + sub-nodes) is unconfirmed.
**Recommendation:** ratify before the relations node is authored. **Status:** OPEN.

### OQ-2. Where exactly does `problem-statement` sit, and is it distinct from `define`?
**Context:** proposed as the provenance root preceding `define`. Needs the owner's confirmation, plus
a producer (no skill authors it yet). **Recommendation:** confirm placement; scope a minimal producer.
**Status:** OPEN.

### OQ-3. Is `code` a tagged leaf or a first-class graph node?
**Context:** code is the only non-doc; today it joins the graph via `code-tags.json`. **Recommendation:**
confirm the leaf-via-tags model so code-drift is one typed edge with a residue report. **Status:** OPEN.

### OQ-4. Scope of this catalog vs the engine.
**Context:** tier D (engine) is listed for completeness but fenced. Intentionally **omitted** for now:
the verify/observability-stage **reports** (`ALIGNMENT-REPORT.md`, `OBSERVABILITY-REPORT.md`,
`PIPELINE-REPORT.md`), the **infra** artifacts (pipeline Steps 7a–7d), and the **ephemeral**
session/scratchpad nodes. **Recommendation:** keep tier D in a separate engine doc; pull in the verify
reports + observability/infra only when in the line of sight. **Status:** OPEN.

### OQ-5. How do we incrementally build the domain ontology (plane 3), and when is it "enough"?
**Context:** the domain meta-ontology (plane 2, `TAXONOMY`) is fixed, but plane-3 instances
(`Caminhão`, `Posto`, …) are co-built with the user. The engine leans **emergent/recursive** (Via
Negativa); a **unified up-front "build the business ontology first" flow** is aspirational (the
knowledge-graph path, `TUNING-LOOP` v2.x). **Sufficiency, not completeness:** plane 3 is "enough for
now" when it **closes** — every concept used downstream types to a plane-3 node, nothing is invented
(orphan rate → 0) — with the rest tracked as residue. **Recommendation:** scope the foundation flow as
a candidate first-build for this workspace. **Status:** OPEN.

### OQ-6. How do we mechanically guarantee every artifact carries an Open Questions section?
**Context:** [SCOPE §3](../SCOPE.md) mandates it by **convention** (human-gated); it is not
mechanically enforced. This is invariants I1/I3 made checkable — a validator/hook that rejects an
artifact with no `## Open Questions`. **Recommendation:** a candidate rung-1 validator check (cheap,
high-value). **Status:** OPEN.

---

## Connections

| Document | Type | Description |
|---|---|---|
| [../CONCEPT-MAP.md](../CONCEPT-MAP.md) | `derives-from` | This is the artifact detail behind the concept map's horizontal axis + invariants. |
| [../SCOPE.md](../SCOPE.md) | `relates-to` | Governs the aspirational boundary and the open-questions rule. |
| [../layers/domainspec-language/SCHEMA-INVENTORY.md](../layers/domainspec-language/SCHEMA-INVENTORY.md) | `cites` | Empirical inventory of the real artifact schemas. |
| [../../../implementation/domainspec/.claude/skills/domainspec-pipeline/SKILL.md](../../../implementation/domainspec/.claude/skills/domainspec-pipeline/SKILL.md) | `cites` | The built orchestrator: which skill produces which artifact. |
