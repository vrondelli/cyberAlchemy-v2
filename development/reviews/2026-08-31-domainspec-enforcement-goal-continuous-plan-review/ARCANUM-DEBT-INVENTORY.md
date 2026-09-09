# Arcanum-derived Technical Debt Inventory

Status: read-only disposition candidate  
Work-graph node: `CGC-G20`  
Audited revision: `a286f8909c65477e864fe6169b257500034d5669`  
Authority effect: none

## Direct finding

Arcanum is not one removable dependency. The current repository contains three
different things that must not be collapsed:

1. useful public tools and workflow techniques;
2. active private-to-public runtime couplings that need a wrapper or replacement;
3. historical snapshots and old planning prose that should remain evidence, not
   be treated as the live construction path.

A bounded discovery found 951 private files with an explicit Arcanum path or
generated-skill/dispatch-ledger reference. Of those, 607 are under versioned
candidate, rebound, imported, or source-snapshot trees; 247 are development or
historical work; 97 are other surfaces. These are discovery counts, not 951 live
runtime dependencies.

## Dependency register

| ID | Dependency | Current role | Risk | Proposed disposition | Closure evidence |
|---|---|---|---|---|---|
| `ARC-DEBT-01` | CyberAlchemy request routing versus generated Arcanum skills | Root `CA2-ROUTE-ENTRY` is already authoritative; the router explicitly rejects `.agents/skills` as route authority. | low, guarded | `keep-separate` | Router negative tests continue to reject generated-skill fallback. |
| `ARC-DEBT-02` | Generated native skills such as `goal` and `domainspec-subagents-strategy` | Useful techniques, generated from public Arcanum packages, but invoked only after CA2 routing. | medium | `wrap` | A private capability binding names allowed operation, source version, inputs, output, and authority ceiling; generated packages remain replaceable. |
| `ARC-DEBT-03` | Subagent-strategy runtime engine under `arcanum/arcana/subagent-strategy` | Active readiness/register/close engine. The default public profile was stale at schema `0.6.1`; the private profile correctly selected `0.10.0`. | high | `replace-or-private-wrapper` | One private native coordinator selects the current form owner without public-profile drift; compatibility tests preserve ledger history. |
| `ARC-DEBT-04` | `telemetry/agents/subagents-dispatch.yaml` | Operational dispatch evidence and append-only history. It is not Product, Goal, ontology, or implementation authority. | medium | `keep-as-evidence`, later `wrap` | Private dispatch binding and close receipts prove exact row identity without making the public ledger a CA2 authority store. |
| `ARC-DEBT-05` | `.arcanum/inventory` and Inventory workflows | High-value discovery/read model used for preflight; explicitly non-authoritative. | low | `keep-as-public-tool` | Inventory remains rebuildable, reports partial coverage, and cannot admit or route private work. |
| `ARC-DEBT-06` | Goal/Craft control-loop technique | Supplies frontier, staging, approval, and audit discipline. The active CyberAlchemy Project and Goal remain private carriers. | medium | `wrap` | CA2 Project/Goal identity and decisions are canonical; the public spell receives read-only context and returns proposal evidence only. |
| `ARC-DEBT-07` | Invoke, Refine, Task Session, Context Builder, and related lifecycle names throughout old work | Many current-candidate and development artifacts describe the public workflow as the execution path. Some are immutable historical evidence; others may still be live instructions. | high | `classify-then-migrate` | A live-consumer manifest distinguishes history, compatibility adapter, and active dependency before any rewrite or retirement. |
| `ARC-DEBT-08` | DomainSpec compiler and views under `projects/domainspec-v2/impl/tools/minted-project` | Active D65 bindings and generated system ontologies point to the legacy DomainSpec Project path. This is lineage/path debt, not an Arcanum dependency. | high | `migrate-separately` | Craft-owned compiler identity, exact digest, deterministic parity, new D65 binding epoch, and owner acceptance; old path remains historical evidence. |
| `ARC-DEBT-09` | Candidate/snapshot proliferation | 607 discovered references live under versioned candidate or snapshot trees and can dominate searches or look current. | medium | `retain-with-current-pointer` | One owner-controlled manifest identifies canonical current source, accepted history, generated mirrors, and retired candidates without rewriting evidence. |
| `ARC-DEBT-10` | Public/private prose crossing | Private DomainSpec, Craft, CyberAlchemy, and Saturn meaning must not be copied into public Arcanum packages. | critical | `keep-hard-boundary` | Automated non-leak scan plus owner review over every public-package change. |
| `ARC-DEBT-11` | Python ontology runtime candidate | Private diagnostic candidate, currently suspended as a mandatory gate. It is not Arcanum debt and must not be mixed into the public-tool migration. | high but separate | `replace-through-rust-goal` | Governance-selected Rust kernel proves dependency closure and bounded fail-closed behavior before any enforcement role. |

## Separation model

### Keep as public tools

- Inventory discovery and read models;
- generic workflow techniques whose inputs and outputs are explicitly bounded;
- historical dispatch telemetry;
- reusable schemas or validators that carry no private product meaning.

Keeping a tool does not adopt its vocabulary or grant it route authority.

### Wrap at the private boundary

- Goal/Craft loop operations;
- subagent readiness, registration, and close;
- generated native skill calls;
- any compatibility adapter that consumes private candidates.

The wrapper must bind exact version, source, selectors, permissible operation,
receipt shape, and authority ceiling. It must fail closed on form drift.

### Migrate or replace

- active lifecycle instructions that still make Arcanum the execution owner;
- compiler, views, and construction bindings rooted in the legacy DomainSpec
  Project path;
- live references that cannot distinguish a generated mirror from canonical
  private source;
- the ontology enforcement candidate, through the separately governed Rust
  path.

### Retain as history

- imported sources, source snapshots, rebound candidates, old current-candidate
  epochs, dispatch receipts, and dated development records.

Historical references are not bulk-rewritten. A current-pointer/manifest keeps
them from being selected as live authority.

## Proposed child work

1. `ARC-SWU-01` — create a live-consumer manifest for the 97 non-snapshot,
   non-development surfaces and classify each as active, compatibility,
   historical, generated, or false positive.
2. `ARC-SWU-02` — design the private subagent-strategy coordinator that removes
   public-profile version drift while preserving v0.10 ledger compatibility.
3. `ARC-SWU-03` — bind the public Goal spell as a replaceable technique behind
   the private Craft Project/Goal carrier.
4. `ARC-SWU-04` — prepare the Craft compiler/path migration as a separate D65
   epoch; do not mix it with public Arcanum retirement.
5. `ARC-SWU-05` — add a non-leak audit over public Arcanum changes that rejects
   private CyberAlchemy, Craft, DomainSpec, and Saturn prose.
6. `ARC-SWU-06` — establish one canonical-current manifest for versioned
   DomainSpec/Craft candidates and snapshots.
7. `ARC-SWU-07` — define one append-only drift-receipt contract for the 11
   immutable MIG-B subjects without rewriting historical evidence.
8. `ARC-SWU-08` — prepare the exact eight-file producer/validator implementation
   envelope, atomic observation shape, negative tests, and separate A1–A7 gates.

All eight remain analysis, design, or implementation-packet candidates. Each
mutation, owner disposition, receipt emission, admission, or authority effect
needs its own CA2 route, owner, exact file set, validation, and approval.

## Current disposition

`CGC-G20` has progressed from an unbounded concern to a bounded inventory with
eight child proposals: ARC-SWU-01 analysis is complete; ARC-SWU-02–07 have
design candidates; ARC-SWU-08 has an exact implementation packet with every
approval token null. It is not closed: no owner has accepted a disposition and
no dependency has been migrated, replaced, wrapped, retained, or retired by
this document.

## Claim ceiling

This inventory classifies evidence. It does not make Arcanum a private
authority, approve any dependency disposition, modify a public package, migrate
the compiler, rewrite historical artifacts, change the dispatch ledger, admit
the Rust kernel, publish, release, deploy, or create an external effect.
