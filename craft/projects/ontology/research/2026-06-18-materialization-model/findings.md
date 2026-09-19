# Findings - Ontology Materialization Model

This is a **build-from-owned witness model**, not a net-new materialization model. It projects owned CyberAlchemy promotion governance and owned Ontologize branch discipline into a small `projects/ontology` fixture pack.

## OWNED

1. The first local witness should materialize the already-owned ladder: **evidence-first, claim-selected, promotion-governed ontology materialization**.

   The ladder is:

   `source selector -> InventoryEvidence -> OntologyCandidate -> PromotionRecord -> governed projection / retrieval view`

   This is build-from-owned: `PromotionRecord` is the governing boundary object, not the ontology entry or evidence container, and it carries claim, provenance, branch target, status, confidence, owner, gate result, contradiction path, rollback, and bridge validation when needed (`research.md:43-49`; direct source: `arcanum/development/cyberalchemy-ontology-lifecycle/ONTOLOGY-ARCHITECTURE.md:42`, `:210`, `:232`). Inventory is the evidence substrate; ontology owns thick agent-usable knowledge (`research.md:110-127`). Promotion remains a governed lifecycle, not a state flip (`arcanum/development/cyberalchemy-ontology-lifecycle/PROMOTION-LIFECYCLE.md:16`, `:84`, `:131`).

2. A canonical file is **not automatically a node**.

   A file is source/evidence. Selected claims from that file can become inventory evidence rows, then reviewable ontology candidates, then promoted nodes if they pass governance. Raw or adapter-derived material can feed governance, but only visible candidate/promoted states should guide agents (`research.md:46-49`). Generated inventory pages must not become source authority (`research.md:123-127`).

3. The owned branch substrate is **B1 meaning, B2 system, B3 run-context, B4 bridge**.

   `projects/ontologize/ONTOLOGY-BRANCHES.md:19` owns the four branch definitions, but it is still candidate design only at line 10 (`research.md:19`). `projects/ontologize/DAG-AND-METRICS.md:84` owns graph law, including node types, edge catalog, drift/contradiction distinction, gates, event model, and metrics (`research.md:20`); it separates drift/contradiction at line 119 and says nothing auto-promotes at line 146. The cyber-alchemy findings also record four branches as owned and the substrate chain as owned (`research.md:129-134`; `research/cyber-alchemy-space/findings.md:23`, `:39`, `:73`).

4. Runtime ownership split:

   - `inventory`: evidence substrate, selector cards, source refs, uncertainty, generated read model.
   - `ontology-vault`: governed maps, branch maps, promotion/demotion reports, confidence review, traceability, drift.
   - `ontology-harness`: composition layer for `inventory + ontology-vault + context-builder`.
   - `context-builder`: retrieval/projection proof, not ontology authority.

   The runtime return recommends `inventory + ontology-vault`, composed by `ontology-harness`, with `context-builder` proving retrieval (`research.md:65-85`, `research.md:87-104`).

## SYNTHESIS

1. `projects/ontology` should start as a **small witness fixture pack for the owned substrate**, not a full migration.

   Since `projects/ontology` is currently empty, the first materialized shape should be fixtures/templates rather than canonical mutation (`research.md:51-59`). The first slice should prove that one selected source claim can pass through the owned governance ladder without treating either the source file or the witness artifact tree as new authority.

2. `projects/ontologize/development/view-triad-method` lands as **method evidence and candidate branch-materialization design**, not as final ontology law.

   `BRANCH-MATERIALIZATION.md` owns only a method-local coverage profile and says it does not redefine branches (`research.md:21`; direct source: `projects/ontologize/development/view-triad-method/BRANCH-MATERIALIZATION.md:7`, `:16`). It also forbids creating a standalone branch-view unless a later owner decision changes the method (`BRANCH-MATERIALIZATION.md:106`). `DESIGN.md` owns a pass-for-planning workflow: source inventory, branch register, view passes, validation, and proposed output paths (`research.md:22`). The branch-as-view correction is not implemented; the strategy packet is prepared, but runtime-backed refine stages have not run (`research.md:24-30`).

3. `research/cyber-alchemy-space` lands as **synthesis boundary and owner-decision ledger**.

   It owns the correction history, the currently accepted substrate chain, and the open decisions OD-1 through OD-6 (`research.md:112-120`, `research.md:129-140`). It should not be copied into ontology as truth wholesale. It should feed evidence rows, candidate nodes, and decision records.

4. CyberAlchemy agent ontology material lands as **method/runtime ontology guidance**, not subject-run evidence.

   CyberAlchemy Operational Ontology is cross-run agent-operation knowledge: lessons, route patterns, failure modes, capability updates, and prompt contracts. Ontologize B3 `run-view` is per-subject runtime evidence. B3 must not import CyberAlchemy Operational Ontology wholesale; it may cite it as method guidance, but B3 content must come from legal subject run traces (`research.md:150-155`).

5. Markdown inventory is enough for the first slice **only as the human-readable evidence/read model**.

   Markdown should hold durable ontology narrative, maps, indexes, logs, schema, and reports (`research.md:73-77`). Inventory cards can be Markdown with YAML frontmatter and source refs (`research.md:75-83`). That is enough to begin, but not enough to govern promotion by itself. Promotion state, branch authority, confidence, contradictions, and owner decisions belong to ontology-vault / PromotionRecord governance.

6. CSV is appropriate only for **raw tabular evidence or compiled evidence indexes**, not authority.

   CSV can hold source-level tabular evidence rows, import/export fixtures, or a generated selector/evidence index. It should not be the canonical surface for branch governance, promotion state, ontology meaning, or owner decisions. The runtime docs do not define CSV as governance/storage authority (`research.md:77`).

## OPEN Owner Decisions

1. **OD-1: Branch-as-view ratification.**

   Current built reality is the triad; branch-as-view is an open owner decision. Any four-view tree belongs in a candidate OD-1 projection section, not the default materialization model. The ontology is the tree only if OD-1 lands (`research.md:112-120`, `research.md:142-149`).

2. **OD-2: Legal B3 producer.**

   `run-view` needs a legal subject-runtime producer. Research fanout or doc-production receipts cannot fill B3 for a code-less or non-runtime subject (`research.md:115`, `research.md:147`, `research.md:152-164`).

3. **OD-3: Residue-view placement.**

   Owner must choose whether residue stays embedded in branch artifacts or is extracted into a dedicated residue/bridge view (`research.md:116`, `research.md:148`).

4. **OD-4: Artifact catalog class rule.**

   Owner must decide whether each artifact has one primary class or can be multi-tagged across branch/view roles (`research.md:117`).

5. **OD-5: Authority tie-break.**

   Authority tie-break algorithm is proposed, not owned (`research.md:118-120`, `research.md:137-140`).

6. **Operational Ontology acceptance.**

   Business/System/Bridge are stable; Operational Ontology remains a candidate extension until user or ontology-harness review accepts it (`research.md:44`, `research.md:58-59`).

## Recommended First-Slice Tree

```text
projects/ontology/
  README.md
  schema/
    promotion-record.schema.md
    ontology-candidate.schema.md
    branch-view.schema.md
  sources/
    manifest.md
  inventory/
    evidence.csv
    evidence-cards/
      IE-0001-branch-definitions.md
  candidates/
    OC-0001-four-branch-substrate.md
  promotions/
    PR-0001-four-branch-substrate.md
  views/
    bridge-projection-example.md
  candidate-projections/
    branch-as-view-OD-1/
      meaning-view.md
      engineer-view.md
      run-view.md
      bridge-view.md
  decisions/
    OD-1-branch-as-view.md
    OD-2-run-view-producer.md
```

This tree keeps project-owned human artifacts in `projects/ontology`, while generated compiled inventory can still live under `.arcanum/inventory/` and governed maps/reports under `.arcanum/ontology-vault/` when runtime execution begins (`research.md:65-72`).

Artifact classes:

| Class | Owns | Does Not Own |
| --- | --- | --- |
| `source` | original evidence and authored context | ontology meaning or promotion |
| `evidence` | selector, summary, authority note, promotion owner, residue | final meaning |
| `candidate_node` | thick draft claim with branch, evidence, confidence, invalidation, and agent use | promotion |
| `promotion_record` | governed transition for one claim or decision | ontology node content or raw source dump |
| `branch_view` | thick projection view over candidate/promoted nodes | source authority |
| `decision` | owner choice, rationale, rejected alternatives, blocker state | implicit promotion |
| `generated_read_model` | compiled lookup and synthesis | canonical source truth |

Node eligibility rule: a file is an ontology node only if it carries `kind`, `claim`, `branchTarget`, `status`, `evidence`, `confidence`, `promotionGate` or `promotionRecord`, `reviewOwner`, `invalidation`, and `agentUse`. Otherwise it is a source, evidence card, decision, promotion record, or generated read model.

## Smallest Witness

### Source File

```text
source_id: SRC-0001
path: projects/ontologize/ONTOLOGY-BRANCHES.md
anchor: projects/ontologize/ONTOLOGY-BRANCHES.md:19
claim_observed: Defines B1 meaning, B2 system, B3 run-context, B4 bridge.
source_status: candidate design only, because research.md reports the source is explicitly candidate design at line 10.
evidence_ref: research.md:19
```

### Inventory Evidence Row

```csv
evidence_id,source_id,source_path,source_anchor,selector,observed_claim,authority_level,status,promotion_owner,residue
IE-0001,SRC-0001,projects/ontologize/ONTOLOGY-BRANCHES.md,projects/ontologize/ONTOLOGY-BRANCHES.md:19,branch-definitions,"Defines B1 meaning, B2 system, B3 run-context, B4 bridge","source-evidence","cataloged","ontology-owner","Source is candidate design only; do not promote branch-as-view without OD-1."
```

### Ontology Candidate Node

```yaml
id: OC-0001
kind: ontology_candidate
title: Four Branch Substrate
branchTarget: Bridge
status: candidate
claim: "The ontology substrate uses four branches: B1 meaning, B2 system, B3 run-context, and B4 bridge."
reviewOwner: ontology-owner
meaning:
  appliesWhen: "Mapping project ontology material into branch-aware artifacts."
  agentUse: "Classify candidate claims and candidate branch/view projections without treating source files as nodes."
evidence:
  - IE-0001
sourceRefs:
  - research.md:19
  - research.md:129-134
confidence:
  evidence: medium
  commitment: low
promotionRecord: PR-0001
promotionGate: block
blockedBy:
  - OD-1
  - OD-2
invalidation:
  - "Owner rejects branch-as-view."
  - "Legal B3 producer is not defined."
```

Correction: the owned substrate uses four branches, not four branch-view files. A four-view artifact tree is only a candidate projection if OD-1 ratifies branch-as-view.

### PromotionRecord

```yaml
id: PR-0001
kind: PromotionRecord
claim: "Four branch substrate is the first candidate branch model for projects/ontology."
claimType: concept
branchTarget: Bridge
status: draft
sourceInputs:
  - IE-0001
provenance:
  activity: "2026-06-18-ontology-materialization-model research dispatch"
  generatedBy: "Adámek, Jiří synthesis from explorer returns"
  reviewedBy:
    - "Capucci, Matteo"
    - "Bourbaki, Nicolas"
    - "Brandenburg, Martin"
targetCandidate: OC-0001
evidenceConfidence: medium
commitmentConfidence: low
reviewOwner: ontology-owner
gateResult: block
gateReason:
  - "OD-1 branch-as-view ratification remains open."
  - "OD-2 legal run-view producer remains open."
contradictionPath: projects/ontology/decisions/OD-1-branch-as-view.md
rollbackOrRetirement: "Retire OC-0001 or keep as historical candidate if owner rejects branch-as-view."
bridgeValidation:
  required: true
  state: insufficient
  missing:
    - "Two-sided bridge evidence for subject runtime B3."
sourceRefs:
  - research.md:43-49
  - research.md:112-120
  - research.md:142-164
```

### Governed Projection Example

```markdown
# Bridge Projection Example

## Candidate Node

- `OC-0001` Four Branch Substrate

## Evidence

- `IE-0001` from `projects/ontologize/ONTOLOGY-BRANCHES.md:19`

## Bridge Role

This projection records that the four-branch substrate is a candidate bridge structure connecting meaning, system, run-context, and validation/drift handling.

## Current Gate

Blocked pending `OD-1` and `OD-2`.

## Agent Use

Use this projection to classify evidence and branch claims during a fixture run. Do not use it as promoted branch-as-view doctrine.

## Source Boundary

The source file is evidence. The ontology candidate is `OC-0001`. The governing transition object is `PR-0001`.
```

## Reviewer Gate Results

| Gate | Result | Required Fix Applied |
| --- | --- | --- |
| Precedent ownership | pass after demotion | Labeled the package build-from-owned and moved branch-as-view into an OD-1 candidate projection. |
| Non-vacuity | report-level pass, materialized-substrate block | Kept the witness concrete and marked materialized artifacts as the next smallest legitimate move, not completed work. |
| Definitional soundness | pass after patch | Added node eligibility and artifact classes to prevent filesystem mirror, inventory index, pointer-only ontology, and premature promotion collapse. |

## Answer Summary

The first lightweight model is not "every Markdown file becomes a node." It is a build-from-owned witness ladder: sources remain sources, selected claims become inventory evidence, thick reviewed claims become ontology candidates, `PromotionRecord` governs transitions, and governed projections expose the current agent-usable shape. Markdown is enough for the first human/governed slice; CSV is useful for evidence rows and raw tabular imports, but not for ontology authority or promotion governance. The witness is report-level complete; the materialized substrate is still the next step.
