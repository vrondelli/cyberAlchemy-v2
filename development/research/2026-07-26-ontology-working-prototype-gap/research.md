## Agent 1 — executable repository path audit

## Hewitt audit: executable ontology-prototype reality

### Bottom line

The smallest defensible claim is:

> The checkout has a working, read-only, fail-closed fixture boundary for a four-node/three-relation DomainSpec candidate graph, plus implemented projection and viewer code. It does not currently have a reproducible end-to-end ontology viewer because the A2 snapshot pins are stale relative to the current A1 fixture binding. It also has no executable binding from this demo into `cyberAlchemy-v2/ontology`, no Ponder adapter, and no instantiated semantic-hierarchy witness.

This read-only trace establishes implementation state only. It does not promote ontology meaning, admit relation semantics, close any authority gate, or prove Ponder/runtime capability.

## 1. Path-and-command evidence

| Status | Surface | Current evidence and command | Claim bound |
|---|---|---|---|
| PRESENT | Candidate ontology boundary | `cyberAlchemy-v2/ontology/README.md:3-18` identifies the package as candidate maps/projections and explicitly denies self-promotion or runtime/schema redefinition. | Documentation boundary, not runtime. |
| PRESENT | Evidence-kind edge vocabulary | `cyberAlchemy-v2/ontology/canonical-kinds/EDGES.yaml:22-67` defines four verbs; `ALLOWED-EDGES.yaml:1-14,16-52` gives a default-deny permitted type matrix. | Authored YAML policy for four Evidence kinds. |
| PARTIAL | Executable edge law | `EDGES.yaml:171-181` explicitly says instance-level acyclic grounding is `UNENFORCED`; `RELATION-MODEL.md:8-11,60-71` says its candidate predicates are not executable edge-family additions. | There is vocabulary/type policy, but no instance-graph validator for the ontology package. |
| PRESENT | Generic ontology-vault candidate schemas and validators | `arcanum/arcana/ontology-vault/development/schema-validation-plan/README.md:1-13,23-36,38-47`; validators at `tests/validate_branch_json_schema.py:15-57` and `tests/validate_branch_schema.py:1-6,17-38,139-154`. Commands rerun: `python3 .../validate_branch_json_schema.py` and `python3 .../validate_branch_schema.py`; both returned `PASS`. | Candidate entry-schema pressure tests only; README and validator deny canonical/runtime status. |
| ABSENT | `cyberAlchemy-v2/ontology` executable adapter | A scoped `rg` found no reference from `cyberAlchemy-v2/development/iolm-workable-example` or its active work-pack into `cyberAlchemy-v2/ontology`, `canonical-kinds`, `EDGES.yaml`, or `ALLOWED-EDGES.yaml`. | The ontology package and IOLM demo are parallel candidate surfaces, not one executable dataflow. |
| PRESENT | Current pinned fixture manifest/binding | `.../iolm-workable-example/contracts/source-binding.v1.json:1-25` pins graph, source manifest, build receipt, and hashes; lines 26-55 pin 4 nodes/3 edges and prohibit promotion/publication. Its schema is strict Draft 2020-12 at `source-binding.v1.schema.json:1-18,27-56,111-138`. | This overturns the older “minimal fixture manifest absent” lead for IOLM specifically, not for Ponder. |
| PRESENT | A1 read boundary | `serve_demo.py:23-42` fixes exact files/routes/hashes; lines 44-99 fix expected structure and exclusion fence. `gateway.mjs:6-38` performs exactly four GETs and validates the bundle. Command `python3 .../serve_demo.py --repo-root \"$PWD\" --binding .../source-binding.v1.json --check` returned `status: pass`, `iolm-fixture-boundary/v1`, 4/3, and `listener_opened:false`. | Current read-only fixture boundary works. |
| PRESENT | A1 negative/runtime tests | `tests/binding-guard.test.mjs:51-70` checks strict binding/pass handle; lines 73-132 cover byte drift, path/fence drift, joins, endpoints, provenance; lines 134-174 cover exact GETs and no fallback. `test_server_contract.py:63-89,91-105,107-139,141-175` checks CLI, pre-bind failure, traversal/symlink/host controls, and fixed GET/HEAD surface. Current results: A1 Node tests passed and Python `8/8` passed. | Fail-closed boundary evidence. |
| STALE | Generated A2 snapshot | `generated/read-models/demo-snapshot.v1.json:9-25` still contains old source/profile/generator/relation/fixture hashes, while current binding has new values at `source-binding.v1.json:27-35`. | Checked-in read model is no longer derived from the current fixture boundary. |
| STALE / BLOCKED | A2 projection construction | `demo-snapshot-v1.mjs:282-309` rejects any source-binding/provenance mismatch; `createDemoSnapshotV1` returns through that validator at lines 500-527. `tests/demo-snapshot-v1.test.mjs:63-88,90-112` requires current A1 to recreate the checked-in snapshot. Current `node --test .../tests/*.test.mjs` result: 50 tests, 46 pass, 4 fail with `SNAPSHOT_CONTRACT_BINDING_MISMATCH`. | Deterministic model code exists, but current end-to-end regeneration is broken. |
| PARTIAL / currently non-observable | Browser viewer | `assets/app.mjs:1-15` loads the live fixture, creates the snapshot, and feeds graph/outline/table/inspector models; lines 69-125 render graph edges/nodes with selection and ARIA attributes; lines 162-173 explicitly label outline order as navigation, not semantic containment. Because snapshot creation currently throws, this path cannot reach rendered output from current inputs. | Implemented UI, not a currently passing walking skeleton. |
| STALE historical receipt | A2 pass receipt | `.../SWU-IOLM-00C-UI-A2/RESULT.md:5-26,41-60` records a historical pass and digest, while lines 62-67 explicitly excluded browser evidence. Live tests now contradict reproducibility. | Historical receipt, not current pass. |
| STALE historical browser evidence | A4 replay | `.../A4/replays/.../RESULT.md:5-13,15-29` records `BLOCK`, browser not opened, automated/manual checks `NOT_RUN`. A later A1 rebind receipt exists at `.../A1/rebinds/.../RESULT.md:29-34,49-73`, but there is no later current-generation A2/A4 evidence. | No current browser/accessibility/manual acceptance. |
| PRESENT but generic | Projection policy | `cyberAlchemy-v2/ontology/projections/README.md:8-19` defines allowed inputs; lines 39-50 constrain use; lines 52-57 say generated projection runtime remains gated. | Manual read-model design, not executable ontology projection. |
| ABSENT | Ponder executable surface | Current scoped search found “Ponder” only in research/handoff artifacts, not adapter/schema/fixture/validator/runtime code. Handoff explicitly orders creation of the absent fixtures, adapter, schedules, target contracts, JSONL schemas, validators, and adjudication receipt at `.../SESSION-HANDOFF.md:24-38`; owners/gaps are explicit at lines 130-142. | Ponder remains proposed research infrastructure. |
| ABSENT | Semantic witness and admission policies | `SESSION-HANDOFF.md:106-128` separates candidate scoring from relation admission/order/facets; lines 134-139 name absent fixture, adapter, labels/splits, executable policies, reproduction, and second hierarchy. | No semantic hierarchy, learned admission, operational order, or facet witness. |
| PARTIAL | Research evidence harness precedent | The generic `arcanum/arcana/research-evidence-harness` capability exists, but the Ponder handoff says it owns future fixture/run schemas while Ponder and ontology owners retain semantic authority (`SESSION-HANDOFF.md:43-52`). | Harness availability is not a Ponder experiment or result. |

## 2. Shortest actual dataflow

The shortest currently passing path stops before projection:

```text
DomainSpec Key-and-Door fixture bytes
  graph.json
  source-manifest.json
  build-receipt.json
        |
source-binding.v1.json
  exact paths + SHA-256 + expected IDs/digests
        |
serve_demo.py / binding-guard.mjs
  path, hash, schema, join, endpoint, provenance checks
        |
iolm-fixture-boundary/v1
  status=pass, 4 nodes / 3 edges,
  posture=candidate, authority_effect=none
```

The intended observable path is:

```text
iolm-fixture-boundary/v1
  -> createDemoSnapshotV1
  -> immutable question/default slice
  -> graph | outline | table
  -> persistent provenance inspector
  -> browser at 127.0.0.1:4173
```

That second path currently stops at `createDemoSnapshotV1` with `SNAPSHOT_CONTRACT_BINDING_MISMATCH`, because A1 was rebound to current DomainSpec bytes but the A2 constants and checked-in snapshot were not regenerated.

There is no concrete path:

```text
cyberAlchemy-v2/ontology/*.md|*.yaml
  -> validator/compiler
  -> IOLM or Ponder adapter
  -> observable semantic output
```

## 3. Exact witness commands and fixtures

Current passing boundary:

```bash
python3 cyberAlchemy-v2/development/iolm-workable-example/serve_demo.py \
  --repo-root "$PWD" \
  --binding cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.json \
  --check
```

Current regression truth:

```bash
node --test cyberAlchemy-v2/development/iolm-workable-example/tests/*.test.mjs
```

Expected current result: 46 pass, 4 fail, all four at the A1→A2 source-binding mismatch.

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest \
  cyberAlchemy-v2/development/iolm-workable-example/tests/test_server_contract.py
```

Expected current result: `8/8 OK`.

Generic ontology-vault candidate validation:

```bash
python3 arcanum/arcana/ontology-vault/development/schema-validation-plan/tests/validate_branch_json_schema.py
python3 arcanum/arcana/ontology-vault/development/schema-validation-plan/tests/validate_branch_schema.py
```

Expected current result: both `PASS`.

Fixtures required for the current IOLM boundary are exactly those named at `source-binding.v1.json:9-24`. For Ponder, the required fixture package does not exist; its minimum contents are enumerated in `SESSION-HANDOFF.md:28-38,106-113`.

## 4. Blockers and owners

| Blocker | Exact owner |
|---|---|
| Current A1→A2 pin mismatch and stale generated snapshot | `private-learning-map-product-owner`; execution through explicitly selected `SWU-IOLM-00C-UI-A2` regeneration. |
| No current rendered-browser/accessibility/manual evidence | IOLM A4/product acceptance owner after A2 and A3 are current. |
| No executable link from `cyberAlchemy-v2/ontology` policy/YAML into a graph validator or viewer | CyberAlchemy v2 ontology route plus schema/edge-law owner. |
| Acyclic grounding and other instance policies unenforced | Ontology/edge-law validator owner; the gap is self-declared in `EDGES.yaml:171-181`. |
| Ponder minimal fixtures, JSONL schemas, validators | `research-evidence-harness` with Ponder data owner. |
| Finite graph-to-event adapter and schedule | Ponder adapter owner. |
| Predicate, labels, grouped splits, adjudication | Ponder research owner. |
| Relation/direct-parent/ancestor/facet admission policy | Ontology and policy owners. |
| Promotion, authority, public release | Existing lifecycle/promotion owners; explicitly outside IOLM and ontology self-authority. |

## 5. Smallest runnable walking skeleton

The smallest defensible prototype should not include Ponder or semantic induction. It should be:

1. One frozen Key-and-Door source bundle: current graph, source manifest, and build receipt.
2. One strict source-binding contract with exact hashes and exclusion fence.
3. One deterministic regeneration command producing `demo-snapshot.v1.json`.
4. One validator that proves:
   - exact 4/3 stable-ID set;
   - endpoints resolve;
   - source-manifest joins are unique;
   - source digests match;
   - candidate posture and `authority_effect:none`;
   - deterministic byte-for-byte snapshot.
5. One loopback-only GET viewer showing graph, outline, table, and provenance inspector from the regenerated snapshot.
6. One browser script asserting:
   - page reaches ready state;
   - all three lenses expose identical stable IDs;
   - selecting `Player` persists across lenses;
   - provenance is visible;
   - outline labels itself navigation, not containment;
   - unknown IDs fail visibly;
   - no POST/PUT/PATCH/DELETE surface exists.
7. One receipt recording machine tests separately from browser/accessibility/manual evidence and reiterating that none is promotion evidence.

The immediate repair is narrowly mechanical in concept but must remain owner-selected: regenerate the A2 pins/read model from the current passing A1 boundary, rerun the full Node/Python suites, then rerun A4 browser evidence. Only after those pass can this be called a working **fixture-backed candidate projection prototype**.

It still must not be called:

- an executable `cyberAlchemy-v2/ontology` prototype;
- a Ponder ontology evaluator;
- a semantic hierarchy;
- an ontology relation-admission engine;
- an authority or promotion runtime.

## Agent 2 — formal ontology contract audit

## Result

The smallest defensible prototype is not a hierarchy learner, ontology compiler, or promotion engine. It is a deterministic validator plus finite fixture for one candidate ontology graph, with typed node records, a closed relation table, endpoint/cardinality/path checks, explicit provenance/confidence/owner fields, named views, and a hard prohibition on authority mutation.

Anything less is structured prose. Anything more—hierarchy induction, facet inference, generated projections, promotion execution, or authority-ledger movement—exceeds current proof.

## 1. Contract matrix

| Contract area | Current state | Current owner | Load-bearing evidence |
|---|---|---|---|
| Ontology meaning | **Authored, active definition.** Requires typed objects, typed relations, branch/role assignment, provenance, confidence, promotion state/gate, invalidation route, and use guidance. | definitions-governance | `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:873-919` |
| Package authority boundary | **Authored candidate design.** Ontology models authority but does not decide it; live schemas, movement edges, runtime contracts, and verdicts are excluded. | ontology route; boundary crossings go to narrowest authority owner | `cyberAlchemy-v2/ontology/PACKAGE-MODEL.md:32-68`; `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:23-46,90-104` |
| Node kinds | **Candidate concepts authored; no live node schema.** Twelve concept rows exist, but no instance contract is enacted. | ontology route; term semantics from definitions-governance; schema effect via schema governance | `cyberAlchemy-v2/ontology/NODE-MODEL.md:12-27,61-96` |
| Authority kinds | **Closed authority enumeration enacted in review mode, deterministic scan absent.** | authority model; additions require decision-gate + constitution-governance | `cyberAlchemy-v2/authority/AUTHORITY-MODEL.md:48-72,155-159`; `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:3247-3269` |
| Fine canonical kinds | **Candidate, explicitly uncited and not closed.** Only four Evidence-kind instance contracts are scoped; other kinds are deferred. | ontology route; definitions-governance for term authority | `cyberAlchemy-v2/ontology/canonical-kinds/CANONICAL-KINDS.md:3-9,58-64,120-124` |
| Node instance fields | **Proposed, not executed.** `node_id`, `instantiates`, lifecycle log, provenance, confidence, and challenge contract appear only in a promotion proposal. | ontology route, then decision-gate/schema governance | `cyberAlchemy-v2/ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md:11-18,26-45,107-111` |
| Relations | **Candidate relation catalog authored.** Each relation must name endpoints, direction, owner, evidence, effect, and forbidden collapse. | ontology route; schema effect via schema governance | `cyberAlchemy-v2/ontology/RELATION-MODEL.md:13-26,45-58,73-77` |
| Executable edge grammar precedent | **Machine-readable candidate files exist for four Evidence kinds only.** Closed-world allowed-edge table, cardinalities, verb definitions, inverses-as-read-directions, and typed negatives are present. No validator was witnessed. | ontology route | `cyberAlchemy-v2/ontology/canonical-kinds/ALLOWED-EDGES.yaml:1-14,16-52`; `cyberAlchemy-v2/ontology/canonical-kinds/EDGES.yaml:17-20,22-66,101-137` |
| Endpoint admissibility | **Authored documentary rule, not executable.** Missing endpoint/type/direction/owner/evidence/effect must remain residue. | ontology route | `cyberAlchemy-v2/ontology/RELATION-MODEL.md:73-77`; `cyberAlchemy-v2/ontology/RELATIONSHIP-CROSSWALK.md:50-63` |
| Path laws | **One explicit law exists but is unenforced:** grounding must be instance-acyclic; symmetric contradiction is exempt. No general composite-path equations are supplied. | ontology/schema route | `cyberAlchemy-v2/ontology/canonical-kinds/EDGES.yaml:171-183`; schema requires path equations where applicable at `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:3916-3949` |
| Branches/views | **Candidate named view contract authored.** Branch is interpretive view, not node type, lifecycle, namespace, or promotion route. Canonicalization remains open. | ontology route; definitions-governance before load-bearing use | `cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md:6-24,36-47`; `.arcanum/inventory/entries/ontology-population-from-inventory-synthesis.md:137-147` |
| Facets | **Absent as assignment policy/runtime.** Current research says separate facet policy and positive/negative fixtures are needed. | Undefined future facet-policy owner | `.arcanum/inventory/entries/semantic-hierarchy-bridge-strategy-result-synthesis.md:111-126,164-180` |
| Hierarchy/specialization | **Designed, not built.** `specializes` requires ontology-owned edge shape and authority-owned meaning; derive/reference versus inherit remains unlocked. | ontology route + authority owner + decision-gate | `.arcanum/inventory/entries/cav2-ontology-authority-organizing-synthesis.md:70-88,90-108` |
| Provenance | **Normatively required, documentary shapes authored.** Session provenance is explicitly partial; absence of `creates` proves nothing. | source/inventory owner; ontology records references | `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:885-895`; `cyberAlchemy-v2/ontology/canonical-kinds/EDGES.yaml:48-57` |
| Confidence | **Active two-axis semantics; candidate carriers.** Evidence confidence and commitment confidence must remain separate from status, owner, and challenge contract. | definitions-governance | `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:1315-1377`; challenge separation at `:2553-2588` |
| Promotion request | **Candidate staging shape authored; explicitly not verdict or authority artifact.** | ontology stages; relevant owner decides | `cyberAlchemy-v2/ontology/promotion-requests/README.md:6-28,41-51` |
| Promotion record/lifecycle | **Active semantic lifecycle; concrete record/schema and append-only validator absent.** | relevant authority owner; authority-ledger owner for executable witness | `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:3184-3211`; `cyberAlchemy-v2/ontology/LIFECYCLE-MODEL.md:56-62` |
| Projection | **Manual shape ready; generated runtime flagged.** | ontology route plus source-owner permission | `cyberAlchemy-v2/ontology/projections/README.md:21-35,37-56` |
| Mutation boundary | **Authored prohibition; code-level non-write proof absent.** Ontology cannot mutate authority, schema, runtime contract, or promotion state. | authority owners/schema governance/task-session | `cyberAlchemy-v2/ontology/README.md:12-18`; `.arcanum/inventory/entries/ontology-population-from-inventory-synthesis.md:140-149` |

## 2. Irreducible prototype contract

### Prototype obligations

These are the minimum executable obligations.

1. **Finite declared schema.** A machine-readable `K, C, R, N` declaration: node kinds, per-kind field constraints, relation verbs, and endpoint/cardinality/path rules. This follows the active schema definition, which requires decidable inspection rather than execution or semantic interpretation (`authority/definitions/DEFINITIONS.md:3916-3958`).

2. **Closed-world validation.** Unknown node kinds, relation verbs, endpoint pairs, and enum values fail. The existing authority closure is default-deny, although only review-enforced today (`authority/AUTHORITY-MODEL.md:61-69`).

3. **Node records.** Each node must carry at least:
   `node_id`, declared kind, claim/label, source selectors, owner route, candidate status, evidence confidence, commitment confidence, challenge contract, use guidance, and residue/invalidation route. This is the smallest union of the active ontology definition and candidate node contract (`authority/definitions/DEFINITIONS.md:885-895`; `ontology/NODE-MODEL.md:14-27`).

4. **Typed edges.** Each edge must have existing endpoints, declared verb, permitted source/target kinds, direction, authority effect, evidence reference, and cardinality. Inverses are read directions, never duplicate stored edges (`canonical-kinds/ALLOWED-EDGES.yaml:1-14`; `canonical-kinds/EDGES.yaml:17-20`).

5. **At least one enforced path law.** Grounding (`derives-from`) must reject instance cycles; symmetric `contradicts` must not enter grounding composition (`canonical-kinds/EDGES.yaml:30-46,171-183`).

6. **Named projection/view.** The fixture must show that a view is derived from selected nodes/edges and cannot alter source records, promotion state, or authority. Branch membership must not imply status or ownership (`ontology/BRANCH-AS-VIEW.md:36-47`; `ontology/projections/README.md:47-56`).

7. **Positive and negative fixtures with a real command.** A validator must return pass/fail with stable diagnostic codes. Existing prose and YAML alone do not establish this witness.

8. **Write isolation.** The prototype process reads candidate files and emits validation/report output only. It must have no write path to `authority/`, promotion records, lifecycle state, or governed sources. Current repository evidence calls this an open code-level proof obligation (`entries/ontology-population-from-inventory-synthesis.md:140-149`).

### Later production obligations

Not required for the first prototype:

- hierarchy induction or learned relation proposals;
- facet inference or multi-label assignment policy;
- `specializes` admission and semantics;
- live vault node/edge schema mutation;
- append-only authority-movement ledger and validator;
- owner-executing promotion workflow;
- generated projections and incremental compilation;
- invalidation closure across a large graph;
- public/private release automation;
- retrieval performance or persistence substrate;
- cross-context authority promotion.

Those remain explicitly blocked, deferred, proposed, or unwitnessed (`ontology/PACKAGE-MODEL.md:147-153`; semantic hierarchy synthesis `:111-126,164-180`).

## 3. Contradictions and undefined semantics

### Facts

- `NODE-MODEL` says candidate node status is one of five package workflow values, while the unexecuted schema proposal introduces a separate instance maturity axis and adds `superseded`. The two-axis distinction is reasonable but not ratified (`NODE-MODEL.md:78-89`; schema proposal `:47-54,107-111`).
- `concept.promotion_record` remains in the current node model, while the proposal generalizes it to `concept.authority_movement_record`; this is not enacted (`NODE-MODEL.md:70-75`; proposal `:53-61`).
- The proposal drops `veracidade/convicção`, but active definition prose elsewhere still uses those names. Therefore the canonical carrier vocabulary is not wholly reconciled (`promotion proposal:47-54`; active two-axis contract at `authority/definitions/DEFINITIONS.md:1323-1348`).
- Canonical kinds declare themselves uncited and open, while authority kinds are closed in review mode. Tier-1 artifact typing therefore cannot safely stand in for Tier-2 authority typing (`CANONICAL-KINDS.md:3-9,58-64`; `AUTHORITY-MODEL.md:61-72`).
- The only concrete allowed-edge grammar covers four Evidence kinds, not the authority-object concepts in `NODE-MODEL` (`ALLOWED-EDGES.yaml:1-3`; `CANONICAL-KINDS.md:120-124`).

### Inferences

- The first prototype should use the four Evidence kinds as its executable graph kernel and attach ontology/governance metadata as records, rather than pretending the proposed authority-node schema is enacted.
- “Named views” can be tested as pure filters/projections without settling branch-as-view as canonical vocabulary.
- Confidence validation can check presence/separation and enum shape; it cannot infer truth or upgrade promotion.

### Open questions

- What executable carrier binds a node instance to an ontology concept without permitting self-declared authority?
- Which owner admits `specializes`, and is its meaning derivation/reference rather than inheritance?
- Which composite paths must commute besides grounding acyclicity?
- Who owns facet vocabulary and assignment?
- Is durability/mutability/status reconciliation required before broadening beyond four Evidence kinds?
- What artifact is the authoritative PromotionRecord schema?
- How is non-write authority proven—process sandbox, API capability separation, filesystem policy, or validator architecture?

## 4. Typed negative examples that must fail

1. `research --derives-from--> findings`: wrong direction; the synthesis rests on aggregate research, not vice versa (`EDGES.yaml:101-109`).
2. `artifact --derives-from--> session`: sessions record work and cannot ground claims (`EDGES.yaml:111-115`).
3. `session --contradicts--> discovery`: session may only `creates` or `updates` (`ALLOWED-EDGES.yaml:36-50`).
4. `question` used as node or endpoint: it is a field, never a node (`EDGES.yaml:125-129`).
5. `D1 --derives-from--> R1` and `R1 --derives-from--> D1`: instance grounding cycle (`EDGES.yaml:171-183`).
6. Unknown verb `specializes` in the executable slice: absent from allowed edges and still owner/schema residue.
7. Unknown authority kind `Score`: default-deny (`AUTHORITY-MODEL.md:61-69`).
8. Candidate node missing source selector, owner, either confidence axis, challenge contract, or invalidation/residue route.
9. `candidate_status: promoted` used as if it were an owner verdict: candidate workflow and authority state are distinct.
10. Projection containing `owner_decision_refs: []` but emitting `authority-state-read-model`.
11. Evidence node declaring itself authoritative or directly writing promotion state.
12. Relation with `value_effect: unknown` treated as permission; unknown is typed residue (`RELATION-MODEL.md:28-43`).
13. `contradicts` composed transitively or used in the grounding acyclicity calculation; it is symmetric and non-composing (`EDGES.yaml:30-46`).
14. Inverse `created-by` stored as a second edge; inverse is read-only direction (`EDGES.yaml:17-20,48-57`).

## 5. Smallest useful finite graph

I recommend five nodes and four positive edges. Four nodes can test the happy research chain, but five are needed to witness contradiction without conflating conflict with provenance or grounding.

### Nodes

- `S1: session`
- `D1: discovery`
- `R1: research`
- `F1: findings`
- `D2: discovery`

Each carries the prototype metadata contract. `D1` and `D2` contain incompatible claims.

### Valid edges

```text
S1 --creates------> D1
S1 --creates------> R1
R1 --derives-from-> D1
F1 --derives-from-> R1
D2 --contradicts--> D1
```

This exercises:

- provenance acts versus semantic claims;
- typed endpoint pairs;
- optional cardinality;
- directionality;
- symmetric non-composing conflict;
- a valid grounding chain `F1 -> R1 -> D1`;
- partial provenance, because `F1` and `D2` need no creating session;
- a named view such as `research-lineage = {D1,R1,F1}` without changing source state.

### Invalid mutations over the same graph

```text
R1 --derives-from--> F1       # inverted grounding
D1 --derives-from--> R1       # creates grounding cycle with R1 -> D1
S1 --contradicts----> D1      # session asserts a claim
D1 --derives-from--> S1       # session used as evidence
F1 --created-by-----> S1      # inverse illegally declared
D2 --specializes----> D1      # unadmitted verb
```

A valid prototype run should accept the first graph, reject each mutation independently with a typed diagnostic, emit a read-only view, and demonstrate unchanged authority/promotion inputs. That is the first point at which “working ontology prototype” becomes defensible. The current repository is one validator and fixture package short of it; it is not merely missing more ontology prose.

## Agent 3 — bounded user outcome and evidence harness

## Simon — smallest defensible working-prototype boundary

### Fact: current state

The checkout has a narrow, private IOLM read-model viewer: a pinned four-node/three-relation Key & Door snapshot, three synchronized lenses, stable selection, and per-record provenance. It explicitly remains a candidate, generated read model with `authority_effect: none`; it is ineligible for promotion or publication. [IOLM snapshot](cyberAlchemy-v2/development/iolm-workable-example/generated/read-models/demo-snapshot.v1.json:2), [snapshot provenance/status](cyberAlchemy-v2/development/iolm-workable-example/generated/read-models/demo-snapshot.v1.json:5), [four-node/three-relation contents](cyberAlchemy-v2/development/iolm-workable-example/generated/read-models/demo-snapshot.v1.json:33), [exclusions](cyberAlchemy-v2/development/iolm-workable-example/generated/read-models/demo-snapshot.v1.json:242).

That viewer is useful precedent but not yet a witnessed prototype: its latest replay is `BLOCK`, its manual status is `NOT_RUN`, and a pinned graph digest mismatch blocks browser acceptance. [validation summary](cyberAlchemy-v2/development/iolm-workable-example/generated/runs/20260722T182915Z-firefox-replay/validation-summary.json:2).

The Ponder/evidence handoff identifies the first missing empirical-contract package: minimal fixtures, finite adapter and schedule, four separate task contracts, baselines, JSONL schemas, deterministic validators, and adjudication receipts. It specifically says these do not yet exist and forbids claiming a Ponder adapter, semantic witness, or hierarchy. [Ponder handoff](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md:28), [claim ceiling](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md:34).

### 1. Primary job-to-be-done

**A user or agent can inspect a frozen finite graph, submit or select predeclared relation candidates, and receive an inspectable deterministic disposition—accepted, rejected, or unknown—under one named policy, with source binding, reason, and an explicit `authority_effect: none`.**

This is the lowest useful outcome because it distinguishes an ontology-oriented prototype from a static diagram:

- It carries stable records, typed directed relations, provenance, and an inspectable projection.
- It produces a decision-like *policy result*, including a negative case, rather than merely rendering records.
- It prevents the policy result from silently becoming canonical meaning, promotion, or authority.

**Inference:** Ponder/learned scoring is not required in the first walking skeleton. It may rank a closed, predeclared candidate list, but deterministic policies must separately decide relation/order/facet outcomes; the handoff expressly preserves this separation. [handoff decision](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md:72), [preserved boundaries](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md:123), [DNG limit](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/towers/dynamic-neural-graph-inference/final-learning-pack.md:27).

### 2. Minimal scripted scenario and observable outputs

Use the already present Key & Door fixture as the bounded substrate—not as semantic proof.

1. **Freeze and load.** Validate the source binding and load the fixed four-node/three-edge snapshot. It contains `HasKeyRule → UnlockDoor` (`enforces`), `Player → UnlockDoor` (`performs`), and `UnlockDoor → DoorUnlocked` (`produces`). [source binding](cyberAlchemy-v2/development/iolm-workable-example/generated/read-models/demo-snapshot.v1.json:9), [relations](cyberAlchemy-v2/development/iolm-workable-example/generated/read-models/demo-snapshot.v1.json:115).

2. **Select a single named policy and finite candidate set.** For the first slice, use an explicitly declared relation predicate and a deterministic decision table. Include:
   - one positive candidate identical to an admitted fixture relation;
   - one invalid candidate with an unresolved endpoint or forbidden predicate;
   - one unknown/held candidate where policy evidence is insufficient.
   
   **Inference:** the minimal first build should not claim direct-parent, ancestor, or facet semantics yet. Those must be separate contracts and are currently only named envelopes, so adding them without their own valid/invalid fixtures would collapse the evidence boundary. [separate-contract requirement](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md:28), [open policy gap](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md:134).

3. **Run a deterministic evaluator twice.** Emit a machine-readable evaluation/adjudication receipt containing fixture and policy digests, candidate ID, disposition, rejection/unknown reason, and no authority mutation. The existing research route calls for append-only JSONL, deterministic fixture validation, and claim-adjudication receipts. [research-evidence route](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/towers/dynamic-neural-graph-inference/final-learning-pack.md:59).

4. **Inspect the result in the viewer.** In graph, outline, and table, select the candidate/relation and see the same stable ID and direction, its disposition, policy/version, source digest, and authority boundary in the provenance inspector. Existing projections already preserve stable-ID parity, edge direction, deterministic serialization, and non-containment status for the outline. [projection tests](cyberAlchemy-v2/development/iolm-workable-example/tests/projections.test.mjs:13), [direction check](cyberAlchemy-v2/development/iolm-workable-example/tests/projections.test.mjs:26), [outline non-claim](cyberAlchemy-v2/development/iolm-workable-example/tests/projections.test.mjs:38), [determinism check](cyberAlchemy-v2/development/iolm-workable-example/tests/projections.test.mjs:44).

Observable outputs:

| Output | What it proves | What it does not prove |
|---|---|---|
| Bound fixture/read model | Exact nodes, edges, source digests, candidate posture | Canonical ontology or authority |
| Deterministic policy result | This finite policy accepted/rejected/held this candidate | Semantic truth or generalized hierarchy induction |
| Negative-case receipt | The evaluator can fail closed with a reason | Model quality or empirical superiority |
| Three-lens inspection | A person can trace the same record and provenance across views | Browser usability until manual evidence passes |
| Adjudication receipt | Review status and claim boundary were recorded | Promotion, publication, or authority change |

### 3. Acceptance criteria

#### Machine evidence

- A schema validator rejects altered source bindings/digests, malformed candidate records, unresolved endpoints, and any result lacking a disposition or reason.
- Positive and negative synthetic fixtures both pass their expected assertions; identical input/policy digests yield byte-identical projected results and receipts.
- The positive relation keeps source, target, direction, stable ID, and provenance through graph/outline/table; the negative candidate is visibly rejected or held rather than disappearing.
- Every result remains `candidate` and `authority_effect: none`. The existing demo schema already constrains generated records to those values; the prototype must retain that property in the new evaluator output. [schema constraints](cyberAlchemy-v2/development/iolm-workable-example/contracts/demo-snapshot.v1.schema.json:24), [record provenance constraints](cyberAlchemy-v2/development/iolm-workable-example/contracts/demo-snapshot.v1.schema.json:168).

#### Human evidence

- A named human can start from a question or selected record, find the relation in all three lenses, select it by keyboard, and identify:
  - source and target;
  - predicate and direction;
  - candidate/accepted/rejected/unknown status;
  - policy/version and rejection reason;
  - source reference/digest;
  - “no authority effect.”
- Selection and focus remain stable across lens changes; no essential distinction depends only on color; reduced-motion rendering retains all essential information.
- These are not satisfied by CLI output or DOM assertions. The repository’s own manual protocol requires human keyboard/focus, Firefox/reduced-motion, cross-lens parity, and visual-semantics checks, and prohibits automation from marking them passed. [manual protocol](cyberAlchemy-v2/development/iolm-workable-example/manual/MANUAL-CHECKS.md:1).

#### Authority evidence

- The fixture, policy, and resulting receipt name their owners and immutable digests.
- The artifact is explicitly non-authoritative; no policy disposition changes canonical ontology records, promotion status, lifecycle state, or publication eligibility.
- If a learned score is included, it is stored as a candidate-ranking input only. Its score cannot determine admission; relation, order, and facet admission remain separate deterministic-policy responsibilities. [handoff boundary](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md:72), [DNG non-transfer](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/towers/dynamic-neural-graph-inference/final-learning-pack.md:51).
- A receipt records evidence and adjudication; it does not itself authorize promotion. The IOLM precedent’s declared exclusions should be carried forward. [IOLM exclusions](cyberAlchemy-v2/development/iolm-workable-example/generated/read-models/demo-snapshot.v1.json:242).

### 4. Exact gaps from present state

| Needed prototype element | Present state | Gap |
|---|---|---|
| Frozen finite graph with provenance | Present as 4/3 private candidate snapshot | Repair/rebind digest drift before it is current reproducible browser evidence. [BLOCK](cyberAlchemy-v2/development/iolm-workable-example/generated/runs/20260722T182915Z-firefox-replay/validation-summary.json:4) |
| Inspectable graph/outline/table/provenance | Implemented narrowly | Need a disposition/policy/reason projection and successful browser/manual acceptance. [viewer purpose](cyberAlchemy-v2/development/iolm-workable-example/README.md:3), [manual gaps](cyberAlchemy-v2/development/iolm-workable-example/manual/MANUAL-CHECKS.md:7) |
| Finite candidate-input and policy-result contract | Absent | Define candidate identifiers, policy/version/digest, disposition, reason, source binding, and ownership. |
| Valid/invalid deterministic evaluator | Absent | Implement a small policy and positive/negative fixtures; retain unknown rather than forcing admission. |
| Adjudication receipt and JSONL validation | Absent | Author schema, validator, append-only fixture/run rows, and receipt shape. [required first package](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md:28) |
| Ponder adapter/schedule | Absent | Defer from the first deterministic walking skeleton; required before any Ponder experiment, not before the basic evaluator. [open gap](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md:135) |
| Relation/direct-parent/ancestor/facet evaluation | Relation display only; no evaluation policies | Build relation first; later add three separate target contracts, fixtures, and policy owners. [required separation](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md:107) |
| Human usability evidence | Not run | Assign runners and capture the named manual evidence; automation cannot substitute. [manual boundary](cyberAlchemy-v2/development/iolm-workable-example/manual/MANUAL-CHECKS.md:3) |

### 5. Deferred features

**Facts / explicitly deferred:**

- Training, benchmarking, target-benefit claims, DNG reproduction, parallel-hierarchy alignment, and publication are outside the selected Ponder handoff. [out-of-scope boundary](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md:114).
- A learned encoder cannot supply relation semantics, hierarchy policy, facets, alignment, or authority; it only becomes a research hypothesis after frozen target-specific adapters, labels, splits, and baselines. [DNG applicability limit](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/towers/dynamic-neural-graph-inference/final-learning-pack.md:27).
- Direct-parent, ancestor, and facet evaluation are not interchangeable; their policies remain blocked for semantic admission. [blocked policies](cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md:136).

**Open questions:**

1. Who owns the first relation-policy semantics and its rejection/unknown vocabulary?
2. Which frozen source will replace or rebind the currently drifted Key & Door graph?
3. Is the first evaluator strictly relation-only, or does an owner authorize a separate direct-parent contract in the same slice?
4. Who performs human adjudication and browser/accessibility runs, and where are their immutable receipts retained?

**Bottom line:** a working prototype is not presently witnessed. The smallest defensible build is a repaired, human-inspectable IOLM fixture plus one deterministic, fail-closed relation-candidate evaluator and its valid/invalid/adjudication receipts—explicitly non-authoritative. Ponder learning, hierarchy induction, and authority movement remain deferred.

## Connections

| Document | Type | Description |
|----------|------|-------------|
| `./findings.md` | `derives` | The dispatch findings synthesize the three verbatim explorer returns recorded here. |
