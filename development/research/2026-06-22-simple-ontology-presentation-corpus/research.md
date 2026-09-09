# Research Returns: Simple Ontology Presentation Corpus

Dispatch: `2026-06-22-simple-ontology-presentation-corpus`
Type: research
Status: collected explorer returns

This file preserves the explorer-stage returns for the ontology presentation
corpus dispatch. Synthesis and the Whisper-ready brief live in
[findings.md](findings.md).

## Agent 1: Bateson, Gregory

Role: explorer
Angle: systems, relations, and feedback loops

An ontology is best explained as a **map of meaning with receipts**.

Not just a dictionary. Not just a folder of notes. More like a city map where
the streets are relationships: this rule supports that behavior, this business
promise becomes that test, this runtime signal confirms or contradicts that
expectation. A glossary tells you what a word means. An ontology tells you what
a thing is, what it connects to, where the evidence came from, how confident we
are, who may rely on it, and what should happen when reality disagrees.

A second metaphor: ontology is the **nervous system between intention and
action**. Business intent says, "this is what should be true." System evidence
says, "this is what the code, tests, data, and runtime actually do." The bridge
says, "here is where those match, here is where they drift, and here is the
residue left by translation." That is the feedback loop. CyberAlchemy/DomainSpec
keeps an ontology so agents and humans do not repeatedly rediscover meaning
from raw files, and so execution can be checked against governed meaning instead
of vibes.

Relation maps matter because systems fail in the gaps between nouns. Knowing
"policy," "test," "API," and "customer promise" as separate terms is weak.
Knowing which policy governs which promise, which spec translates it, which
implementation claims to realize it, which test verifies it, and which signal
observes it is much stronger. The relation map turns knowledge into a control
surface: you can ask what a change affects, what evidence supports a claim,
which business concept lacks implementation, or which implementation artifact
has no clear business trace.

The business/system/bridge separation helps because it prevents circular
justification. If business ontology collapses into system ontology, the code can
silently rewrite the domain: "the system does this, therefore that must have
been the intent." If system ontology collapses into business ontology, intent
can pretend implementation exists when it does not. The bridge is the honest
middle: it compares meaning with realization and keeps translation loss visible.
In Bateson terms, it preserves the difference that makes a difference.

For a simple presentation, say:

> CyberAlchemy keeps an ontology so meaning can survive handoff. It records what
> things are, how they relate, what evidence supports them, and how they should
> be used. Business ontology protects intent. System ontology records
> realization. Bridge ontology watches the feedback loop between them. The
> ontology is useful because it lets agents act with context, but it also keeps
> them from treating every generated summary as authority.

Source notes:

- `cyberAlchemy/agentic-system-ontology-synthesis.md`, "Ontology: The Knowledge
  System" and following sections: strongest presentation source. It says
  ontology is where evidence becomes meaning, meaning becomes reusable guidance,
  and guidance becomes safe execution context. It also gives the inventory,
  business, system, bridge, operational, and governance split.
- `arcanum/BUSINESS-ONTOLOGY.md`, "The Core Concept" and "Value Proposition":
  useful for the branch-aware model. Business Ontology is intent, System
  Ontology is operational reality, and Bridge Layer is traceability. Also useful
  for drift prevention and governed traceability.
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`, `CAV2-D19: Ontology`:
  canonical definition source. Ontology is a governed meaning layer made of
  typed knowledge objects, typed relations, branch or role assignments,
  provenance, confidence, promotion state, and use obligations. The
  plain-language phrase "map of meaning with typed links, receipts, and rules
  for use" is the cleanest short version.
- `cyberAlchemy-v2/ontology/README.md`: boundary source. The ontology folder
  can model authority, condense meaning, and prepare promotion requests, but it
  cannot promote itself or redefine definitions, constitutions, specs, runtime
  contracts, schemas, or public claims.

Warning against overclaiming:

Do not say ontology is "the source of truth for everything." Better: it is a
governed meaning layer over selected evidence. Do not say candidate ontology
makes something canonical. Better: it prepares meaning for review, promotion,
contradiction, or downstream use. Do not imply the ontology proves the system
works; it shows what is claimed, how it relates, and what evidence or feedback
would support, challenge, or invalidate it.

## Agent 2: Wittgenstein, Ludwig

Role: explorer
Angle: language use and meaning boundaries

Transport: short presentation
Objective: explain, in simple terms, what an ontology is, what it does, and why
CyberAlchemy/DomainSpec keeps one.
Angle: language-use and meaning boundaries. The key sentence: an ontology is
not a museum of words; it is a disciplined way to say how words may be used in a
working system.

### What Ontology Is Not

An ontology is not a glossary. A glossary says "this word means that." An
ontology says "this word plays this role, in this scope, with this evidence,
under these limits, and it may or may not be allowed to guide action."

It is not raw source material, inventory, memory, a session transcript, a
generated index, or automatic authority. CyberAlchemy's definition says this
directly: ontology may condense meaning, but it cannot promote definitions,
constitutions, runtime contracts, or public claims by itself.

It is also not "the truth machine." It does not make a phrase true because it
has been entered into a map. It makes the phrase usable, challengeable, and
bounded. That is the important modesty.

### Why Words Need Role And Use Boundaries

A word is dangerous when everyone can use it, but nobody knows what kind of work
it is doing. "Ontology," "authority," "evidence," "runtime," "source," "claim,"
and "confidence" all become slippery if their role is not declared.

DomainSpec's vault conventions solve this by separating axes. `node_type` asks:
what role does this document play? If challenged, what kind of answer is
appropriate? `layer` asks: what part of the system does this concern? `status`
asks: how mature is it? `veracidade` asks: how much does evidence support it?
`conviccao` asks: how much are we committing to it?

That separation matters because two sentences can sound equally confident while
doing completely different jobs. A constitution is not a discovery. A source
note is not a promoted rule. A runtime observation is not a business intent. If
we collapse those uses, we do not become simpler; we become vague.

In language-use terms: meaning is not just inside the word. Meaning is in the
rule for using the word. CyberAlchemy keeps an ontology so the rule is visible.

### Keep It Simple Without Lying

Use this simple formulation:

> An ontology is a map of the important things in a project: what they are, how
> they relate, where they came from, how much we trust them, and what they are
> allowed to do.

Then immediately add the safety line:

> But the map is not the government. It can show that something might become
> authority; it cannot make it authority by itself.

For a nontechnical audience, avoid starting with graphs, schemas, or formal
tuples. Start with everyday confusion:

Imagine a team keeps saying "source," "evidence," "decision," and
"implementation." At first everyone nods. Later, someone treats a research note
like a rule, a generated index like evidence, or a passing test like permission
to change the product story. The ontology prevents that silent slide. It tells
each word where it may stand and what it may authorize.

Then give the CyberAlchemy/DomainSpec reason:

They keep an ontology because the work is spread across sources, inventories,
generated views, research, public and private repositories, runtime evidence,
definitions, and promotion gates. The ontology reduces search and preserves
meaning without pretending every nearby file has the same authority.

Source notes:

- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`, CAV2-D19: best anchor
  for the presentation. Defines ontology as a governed meaning layer with typed
  objects, typed relations, branch or role assignments, provenance, confidence,
  promotion state, and use obligations. The plain-language line is strong: "a
  map of meaning with typed links, receipts, and rules for use."
- `implementation/domainspec/vault/ontology-conventions.md`, `node_type`: use
  this for the "words need roles" section. The challenge-response framing is
  simple and powerful: the role of a document determines how it should be
  challenged.
- `implementation/domainspec/vault/ontology-conventions.md`, `status`,
  `veracidade`, `conviccao`: use this to explain why "trusted" is not one
  thing. Maturity, evidence, and commitment are different.
- `implementation/domainspec/vault/ontology-conventions.md`, edge framing: use
  sparingly. The audience only needs to know that relationships have direction
  and obligations.
- `.arcanum/ontology-vault/map-2026-06-18-dispersed-knowledge.md`: use for
  evidence-bounded corpus selection. It says the map is candidate-only and
  emphasizes promotion split: inventory captures evidence, ontology condenses
  meaning, definitions/governance own promotion.
- `cyberAlchemy-v2/ontology/README.md`: use for why CyberAlchemy keeps one. The
  folder is a candidate authority-model package, useful for making authority
  relations explicit before downstream projects build on the base.

Warning:

Do not let the presentation imply: "once it is in the ontology, it is true."
Better: "once it is in the ontology, we know how to inspect it."

Ontology is a tool for disciplined use, not a sovereign. It can classify,
relate, trace, condense, and prepare promotion requests. It cannot bless itself.
Authority still belongs to definitions, constitutions, decisions, specs, runtime
contracts, and owner routes.

That is the honest simplicity: the ontology is the project's grammar of
meaning. It tells us how to speak without letting speech pretend to be law.

## Agent 3: Fong, Brendan

Role: explorer
Angle: typed graph, structure, and agent-usable context

A good short presentation can use a tiny four-source corpus:

1. `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`, `CAV2-D19: Ontology`
2. `projects/ontology/ARCHITECTURE.md`, Architecture Intent plus Low-Level Components
3. `cyberAlchemy/agentic-system-inventory-ontology-pipeline.md`, Corrected
   Layering plus Inventory To Ontology Promotion Rule
4. `arcanum/arcana/ontology-vault/SKILL.md`, Branch-Aware Arguments and Bridge
   Validation

### Minimal Structural Model

In simple terms: an ontology is a governed map of meaning. It says what the
important things are, what type each thing is, how they relate, where the
evidence came from, how confident we are, and how another human or agent is
allowed to use it.

The minimal model from `CAV2-D19` is:

```text
Ontology = Nodes + Edges + Branches + Receipts + Confidence + Promotion State + Use Rules
```

Where:

- `Nodes` are typed knowledge objects: concept, rule, capability, decision,
  workflow, failure mode.
- `Edges` are typed relations: traced_to, realized_by, constrained_by,
  tested_by, drifts_from.
- `Branches` separate meaning/business claims, system/runtime claims, and
  bridge claims.
- `Receipts` link claims back to source or inventory evidence.
- `Confidence` records how well supported the claim is and how committed the
  project is to it.
- `Promotion State` says whether a claim is candidate, reviewed, promoted,
  demoted, blocked, or deferred.
- `Use Rules` tell agents when the knowledge can guide work and when it must ask
  for a gate.

Presentation line:

> An ontology is not just a folder of notes. It is a typed graph of meaning with
> receipts and rules for use.

### Inventory, Candidate, Promotion, Retrieval

The clean distinction is the ladder:

```text
raw source
-> inventory evidence
-> ontology candidate
-> promotion record
-> retrieval/use view
```

Inventory is the findable evidence layer. It summarizes sources, extracts
claims, tracks tags, contradictions, provenance, and lookup handles. It helps us
find and cite knowledge, but it does not itself decide meaning or authority.

An ontology candidate is a thick proposed meaning unit. It has a claim, type,
branch target, evidence, confidence, invalidation route, review owner, and
agent-use payload. It is where evidence becomes structured meaning, but still
not automatic truth.

A PromotionRecord governs movement. It says whether a candidate passed review,
is blocked, needs more evidence, was rejected, or can become a promoted ontology
node. It separates "this is useful" from "this is allowed to guide future work."

A retrieval/use view is the agent-facing projection. It gives a task-specific
slice: only the ontology entries and evidence selectors needed for the present
obligation. This is what lets future agents avoid rereading the whole repo.

### What A Machine Or Agent Gets

For an agent, ontology reduces ambiguity. Instead of seeing a pile of files, it
gets typed usable context:

- what kind of thing a claim is,
- where it belongs,
- what evidence supports it,
- what other claims it connects to,
- whether it is candidate or promoted,
- what contradictions, drift, or invalidation routes exist,
- whether a business meaning claim is actually implemented by system evidence,
- what context to retrieve for a task,
- what not to treat as authority.

This is why CyberAlchemy/DomainSpec keeps one: agents need more than search.
Search returns nearby text. Inventory returns evidence. Ontology returns
governed meaning with enough structure to act carefully.

Strong presentation phrase:

> Inventory helps the agent find the receipts. Ontology helps the agent
> understand what the receipts mean and whether they can be used.

Source notes:

- `projects/ontology/ARCHITECTURE.md`: use Architecture Intent for the main
  ladder: `source selector -> InventoryEvidence -> OntologyCandidate ->
  PromotionRecord -> governed projection / retrieval view`. Use Low-Level
  Components for artifact classes: source, evidence, candidate node, promotion
  record, branch view, decision, generated read model. Use Node Eligibility for
  the anti-pointer rule: a node needs claim, evidence, confidence, promotion
  gate, invalidation, and agent use.
- `cyberAlchemy/agentic-system-inventory-ontology-pipeline.md`: use Purpose and
  Corrected Layering. This gives the clearest simple distinction: inventory is
  ingestion/evidence substrate; ontology is governed, agent-usable knowledge.
  Use Inventory To Ontology Promotion Rule for the epistemic ladder: never
  promote raw source directly into ontology authority.
- `arcanum/arcana/ontology-vault/SKILL.md`: use Branch-Aware Arguments and
  Validate Branch Bridges. This is the source for explaining why ontology
  separates business/domain meaning, system/runtime artifacts, and bridge
  evidence. Key simple idea: system facts must not silently redefine meaning,
  and meaning must not pretend implementation exists.
- `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`, `CAV2-D19`: use this
  as the canonical definition source. It defines ontology as a governed meaning
  layer with typed objects, typed relations, branch/role assignments,
  provenance, confidence, promotion state, and use obligations. It also gives
  the plain-language line: a map of meaning with typed links, receipts, and
  rules for use.

Warning:

Do not make pointer-only ontology nodes.

A path list, index page, source manifest, or generated inventory page can be
useful, but it is not ontology by itself. If a node only says "see this file,"
it gives the agent location without meaning. A real ontology node must carry
usable content: claim, type, relation, evidence, confidence, status,
invalidation route, and agent-use guidance.

The risk is "filesystem mirror collapse": mistaking the folder structure for
the knowledge structure. DomainSpec avoids that by requiring thick entries and
promotion gates before a claim becomes agent-usable ontology.
