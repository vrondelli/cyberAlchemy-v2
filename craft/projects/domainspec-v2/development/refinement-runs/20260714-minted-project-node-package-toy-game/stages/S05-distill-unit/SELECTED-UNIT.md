# Distill Result — Minimum Coherent Toy-Game Unit

## Run Frame

- Mode: `standard`
- Objective: select the smallest experiment that can falsify authority, modular source, traversal, and generated-view claims together.
- Output artifact: one bounded `key-and-door` consumer-project tournament passed to Invoke Design.
- Risk: medium; the result informs a future mint contract but has no production authority.
- Role execution: labeled local Proposer/Balancer passes; no subagents were authorized or used.

## Concept Layers

| Layer | Abstraction level | Responsibility |
| --- | --- | --- |
| Project mint contract | capability | establishes factory-to-consumer authority handoff and compilable project shape |
| Consumer node package | artifact/interface | owns project-local node and edge declarations under a manifest |
| Compiler projection | function | validates and normalizes sources into graph, manifest, and human view |
| Toy-game tournament | workflow/process | compares three layouts under identical positive and negative evidence |

## Proposal Pass 1

### P1 — Single node file

One `Player` node would prove file addressability but cannot prove edge ownership, endpoint typing, traversal, duplicate detection, or generated relationship views. Rejected as too small.

### P2 — One connected feature package

One project manifest, one feature manifest, four canonical nodes, three canonical typed edges, three storage layouts, one normalization contract, and seven named mutants. This is the first unit that exercises all acceptance-critical boundaries.

### P3 — Complete project minter

Schemas, CLI, package distribution, cross-feature resolution, migrations, production registry integration, and website graph. Rejected as too broad and acceptance-confounded.

## Balancer Pass 1

P2 risks mixing the artifact under test with its validation machinery. The repair is to state the unit as an evidence bundle with two separable responsibilities:

1. candidate consumer sources for layouts A/B/C;
2. a disposable compiler/harness that evaluates the same semantic graph and mutants.

The harness is not proposed as production compiler code. Its only contract is repeatable comparative evidence.

## Proposal Pass 2 — Selected Unit

`SCU-MINT-NODE-PACKAGE-TOY-001`

**Responsibility:** demonstrate whether one consumer-owned feature can be represented by modular machine sources, validated against current DomainSpec kind/relationship evidence, compiled deterministically into a first-class graph, and rendered to Markdown without authority collapse.

**Inputs:**

- pinned kind and relationship registry digests;
- project-local manifest;
- the same semantic graph in three source layouts;
- seven named mutations.

**Outputs:**

- canonical normalized `graph.json` per valid layout;
- source manifest and generated Markdown per valid layout;
- deterministic graph/view digests;
- pass/fail evidence for each mutant;
- Pareto comparison and selection/residue.

**Exact domain content:**

- `key-and-door.Player` — Entity
- `key-and-door.UnlockDoor` — Operation
- `key-and-door.HasKeyRule` — Rule
- `key-and-door.DoorUnlocked` — Event
- `Player --performs--> UnlockDoor`
- `HasKeyRule --enforces--> UnlockDoor`
- `UnlockDoor --produces--> DoorUnlocked`

**Layouts:**

- A: one node per file, connections embedded only on their canonical source nodes;
- B: one node per file plus one file per edge;
- C: aspect bundles grouped by kind plus a connection bundle.

**Mutants:** dangling target; duplicate edge ownership; unknown relationship; endpoint-invalid relationship; stale graph; stale Markdown; Markdown-only required field; external source-root escape.

The last two review obligations are combined into eight concrete cases because unknown-label and endpoint-invalid failures must remain distinguishable.

## Balancer Pass 2

- Underbuilding check: four kinds and three signatures provide enough variety to exercise node typing, two targets into an Operation, and an Operation-to-Event path.
- Overbuilding check: a second feature, independent edge lifecycle, schema publication, and project CLI are not needed to choose a first authoring layout.
- Coordination check: normalized graph semantics are shared; layout readers are the only variable.
- Knowledge status: the source contract is a concept claim; current kind/signature existence is knowledge-backed; product suitability remains a hypothesis.

## Closure and Recomposition Proof

The selected unit recomposes into the upper mint-contract capability as:

`project manifest → feature sources → layout reader → common validation/normalization → graph + source manifest → implementer traversal + Markdown view`

No hidden semantic glue is permitted between layout reader and normalization. If any layout needs a special semantic rule, it is not equivalent and must be eliminated or flagged. The future minter can replace the disposable readers while preserving the source, normalized-graph, and receipt boundaries.

Failure if wrong: the run would select a tidy file organization that cannot establish unique ownership, deterministic traversal, or generated-view fidelity.

## Technique Trace

| Technique | Hook | Result | Effect |
| --- | --- | --- | --- |
| `abstraction_level_guard` | before layer split | pass | separated capability, artifact/interface, function, and workflow levels |
| `recomposition_proof` | before accepting P2 | pass | explicit manifest-to-view chain with no semantic glue |
| `evolution_profile` | after proposer | pass | concrete pressure is more features/cross-feature edges; preserve manifest and layout-reader seam, defer edge service/registry |
| `cognitive_load_check` | after proposer/balancer | pass | four nodes and three edges are meaningful chunks; three layouts are alternatives, not simultaneous product surfaces |
| `requisite_variety_check` | after balancer | pass | internal variety covers known local authoring failures without claiming cross-feature completeness |
| `boundary_object_check` | after intent/balancer | pass | stable shared meanings are manifest, canonical source, normalized graph, and receipt; authors and implementers may use different views |
| `concept_vs_knowledge_status` | before split acceptance | pass | registry facts are cited; authoring layout remains a falsifiable concept claim |
| `premortem_pass` | before verdict | pass | likely failure is selecting A because it is compact while missing edge lifecycle; guard by stable edge IDs and an explicit future split trigger |
| `frame_expiry_note` | before verdict | pass | rerun when cross-feature edges or independently governed edges become required |
| `navigable_result_check` | before verdict | pass | S06 starts from the exact content, layouts, mutants, outputs, and chain above |
| `set_based_tournament` | future pitch-off | route | activated in S06/S08 after measured evidence, not used to preselect a layout |

## Tension Ledger

| Tension | Current treatment |
| --- | --- |
| Edge locality vs independent lifecycle | measure A vs B; preserve stable ID and future split trigger |
| Low file count vs edit/merge locality | compare A/B/C under file and ownership metrics |
| Factory defaults vs consumer authority | reject external roots and concrete factory-owned feature meaning |
| Human learnability vs machine authority | generate Markdown and fail Markdown-only semantics |
| Current registry maturity vs experiment validity | bind exact digests and avoid release-admission claims |

## Deferred Complexity

- schema publication and compatibility negotiation;
- cross-feature source roots and relationship resolution;
- independent edge evidence/owner lifecycle;
- minter CLI and package distribution;
- production FPR disposition and migration;
- interactive website graph.

## Frame Expiry

This optimization point expires when one feature owns edges that cannot be assigned to a canonical source node, when edges require an owner/evidence lifecycle independent of both endpoints, or when cross-feature traversal becomes part of the production claim. Any of those conditions requires rerunning the layout tournament with a multi-feature corpus.

## Verdict and Navigation

Status: `pass`.

Start S06 by materializing layouts A/B/C with exactly the selected node and edge set. Run the positive equivalence and eight negative cases through one normalizer. Do not select a production schema; return design evidence and candidate ranking to Interrogation.

