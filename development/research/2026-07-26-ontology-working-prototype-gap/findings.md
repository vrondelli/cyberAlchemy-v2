# Goal

Determine what is missing before `cyberAlchemy-v2/ontology` can honestly be called a working prototype, and identify the smallest buildable, falsifiable target without collapsing candidate structure, projections, learned scoring, validation evidence, or authority.

# TL;DR

The current checkout does **not** contain a working ontology prototype. It contains authored candidate ontology contracts, a machine-readable four-Evidence-kind edge grammar without an ontology instance validator, and a separate private IOLM fixture boundary whose current A1 check passes but whose projection/viewer chain is stale and fails four tests. The smallest defensible build-from-owned target is an **ontology-oriented candidate-graph validation and inspection prototype**: a closed finite graph contract, deterministic policy validator, valid and invalid fixtures, a read-only named projection, inspectable policy dispositions, and evidence that the process cannot mutate authority. Only after that full finite contract executes should the stronger label **bounded ontology prototype** be used. [Agent 1 — executable repository path audit](./research.md#agent-1--executable-repository-path-audit), [Agent 2 — formal ontology contract audit](./research.md#agent-2--formal-ontology-contract-audit), [Agent 3 — bounded user outcome and evidence harness](./research.md#agent-3--bounded-user-outcome-and-evidence-harness)

# Context

The repository already has enough adjacent machinery to make a superficial prototype claim tempting: ontology prose and YAML, generic ontology-vault pressure-test validators, a strict IOLM fixture binding, projection code, and a browser viewer. The dispatch was necessary because these surfaces have different owners and proof states. A passing fixture boundary is not an executable binding from `cyberAlchemy-v2/ontology`; a projection is not canonical ontology; a policy result is not admitted meaning; a receipt is not promotion authority. The three investigations therefore tested repository executability, the minimum formal contract, and the minimum useful user outcome independently.

## Current-state evidence boundary

The strongest current claims are:

- `cyberAlchemy-v2/ontology` owns candidate maps, relation descriptions, projections, and the explicit prohibition on self-promotion or runtime/schema redefinition. Its four-Evidence-kind grammar is machine-readable, but grounding acyclicity is marked unenforced and no ontology instance-graph validator was witnessed. [Agent 1](./research.md#agent-1--executable-repository-path-audit), `cyberAlchemy-v2/ontology/README.md`, `cyberAlchemy-v2/ontology/canonical-kinds/EDGES.yaml`, `cyberAlchemy-v2/ontology/canonical-kinds/ALLOWED-EDGES.yaml`
- The IOLM A1 boundary currently validates a pinned four-node/three-edge candidate fixture with `authority_effect: none`; the Python server contract passes 8/8. The full Node suite currently reports 46 passing and four failing tests, all caused by `SNAPSHOT_CONTRACT_BINDING_MISMATCH`. The A2 snapshot and A4 browser evidence are therefore not current reproducible evidence. [Agent 1](./research.md#agent-1--executable-repository-path-audit), `cyberAlchemy-v2/development/iolm-workable-example/serve_demo.py`, `cyberAlchemy-v2/development/iolm-workable-example/contracts/source-binding.v1.json`, `cyberAlchemy-v2/development/iolm-workable-example/tests/demo-snapshot-v1.test.mjs`
- The IOLM demo has no executable reference to `cyberAlchemy-v2/ontology`; the two are parallel candidate surfaces. Ponder appears only in research and handoff artifacts, with its fixture, adapter, schedule, policy, validator, and adjudication package still absent. [Agent 1](./research.md#agent-1--executable-repository-path-audit), `cyberAlchemy-v2/development/iolm-workable-example`, `cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md`
- Current ontology definitions require typed objects and relations, provenance, confidence, ownership, use guidance, and lifecycle/invalidation boundaries. Concrete node-instance carriers and authority movement records remain proposed rather than enacted. [Agent 2](./research.md#agent-2--formal-ontology-contract-audit), `cyberAlchemy-v2/authority/definitions/DEFINITIONS.md`, `cyberAlchemy-v2/ontology/NODE-MODEL.md`, `cyberAlchemy-v2/ontology/promotion-requests/2026-06-23-authority-object-schema-proposal.md`
- A useful first outcome is deterministic inspection of predeclared relation candidates under a named policy, including positive, negative, and indeterminate cases. Ponder and learned scoring are not required; if later added, they may rank candidates but cannot admit relations. [Agent 3](./research.md#agent-3--bounded-user-outcome-and-evidence-harness), `cyberAlchemy-v2/development/research/2026-07-22-categorical-dng-semantic-hierarchy-towers/handoffs/2026-07-23-researcher-evidence-harness/SESSION-HANDOFF.md`

The generic `arcanum/arcana/ontology-vault` validators are useful schema-validation precedent only. Their passing checks do not supply CyberAlchemy ontology semantics or runtime proof. [Agent 1](./research.md#agent-1--executable-repository-path-audit), `arcanum/arcana/ontology-vault/development/schema-validation-plan/README.md`

## Present, partial, and absent

| Surface | State | What the evidence sustains | Missing before the target works |
|---|---|---|---|
| Candidate ontology and authority boundary | Present | Authored private ontology model with explicit non-authority boundary | No semantic promotion implied; retain boundary in executable outputs |
| Four-Evidence-kind node/edge grammar | Partial | Closed allowed-edge table, directions, cardinalities, negatives, one path law | Executable instance validator, diagnostic codes, valid/invalid fixtures |
| Node-instance contract | Partial | Documentary and proposed fields for provenance, confidence, ownership, challenge, lifecycle | One admitted finite prototype schema without pretending the proposal is enacted authority |
| Named views/projections | Partial | Read-only projection rules and implemented IOLM projection precedent | Ontology-bound pure projection plus source/authority immutability proof |
| IOLM source boundary | Present, narrow | Current fail-closed A1 check over one private fixture | It is not bound to ontology policy |
| IOLM snapshot/viewer chain | Stale | Implemented projection and viewer code | Rebind/regenerate A2, pass the Node suite, then run browser/manual acceptance |
| Ontology-to-observable dataflow | Absent | No executable path was found | Schema → validator → candidate projection → inspection/receipt |
| Deterministic relation-candidate policy | Absent | The required separation is designed | Named policy, version/digest, pass/fail/indeterminate result, typed reason |
| Fixtures and receipts | Absent for ontology evaluator | IOLM has a source fixture; handoff describes future JSONL evidence | Keep input fixtures separate from run/adjudication receipts and validate both |
| Tested write isolation | Absent | Documentary prohibition exists | Demonstrate unchanged authority/promotion inputs and no mutation-capable interface |
| Browser/human inspection | Partial and stale | Viewer and manual protocol exist | Current automated browser evidence plus named human keyboard/focus/semantics evidence |
| Ponder adapter and semantic hierarchy | Absent | Research handoff only | Deferred; not necessary for the first target |
| Promotion/authority runtime | Absent and out of scope | Authority owns meaning/lifecycle | Must remain outside this prototype |

## Lowest sufficient architecture

The lowest sufficient model is deliberately small:

```text
authored candidate graph schema + named policy
                    |
          finite input fixtures
                    |
    deterministic closed-world validator
       |              |              |
 policy-pass      policy-fail   policy-indeterminate
                    |
       candidate projection/read model
                    |
       CLI report + inspectable viewer
                    |
     immutable run/adjudication receipt

authority and promotion inputs ── read-only / unchanged
```

The reviewer vocabulary repairs are load-bearing:

- Use **policy-pass**, **policy-fail**, and **policy-indeterminate**, not `accepted`, `rejected`, and `unknown` without qualification. These are results under one finite policy, not assertions of semantic truth or authority admission.
- Call the emitted view a **candidate projection/read model**, not canonical ontology.
- Keep **fixtures** (declared test inputs and expected outcomes) separate from **receipts** (records of a particular run or adjudication).
- Require **tested write isolation**, not merely an `authority_effect: none` field.
- Use **ontology-oriented candidate-graph validation and inspection prototype** while only the slice is being assembled. Use **bounded ontology prototype** only after the complete finite contract below executes.

## Minimum finite contract and witness

### Records and rules

The first graph should use the already authored four Evidence kinds rather than inventing a live authority-object schema: `session`, `discovery`, `research`, and `findings`. Each node needs a stable ID, declared kind, claim/label, source selector, owner route, candidate status, separate evidence and commitment confidence, challenge/use guidance, and residue or invalidation route. Each edge needs existing endpoints, a declared verb, allowed endpoint kinds, direction, evidence, cardinality, and `authority_effect: none`. Unknown kinds, verbs, endpoint pairs, and required enum values fail closed. Grounding through `derives-from` must be instance-acyclic; `contradicts` is symmetric but non-composing. [Agent 2](./research.md#agent-2--formal-ontology-contract-audit), `cyberAlchemy-v2/ontology/canonical-kinds/ALLOWED-EDGES.yaml`, `cyberAlchemy-v2/ontology/canonical-kinds/EDGES.yaml`

### Positive fixture

Use five nodes:

```text
S1: session
D1: discovery
R1: research
F1: findings
D2: discovery
```

and these valid edges:

```text
S1 --creates------> D1
S1 --creates------> R1
R1 --derives-from-> D1
F1 --derives-from-> R1
D2 --contradicts--> D1
```

The valid run must produce `policy-pass`, preserve the valid grounding chain, exclude contradiction from grounding composition, and emit a named read-only `research-lineage` projection containing `D1`, `R1`, and `F1`. [Agent 2](./research.md#agent-2--formal-ontology-contract-audit)

### Policy-fail fixtures

Each negative mutation must run independently and return `policy-fail` with a stable diagnostic:

```text
R1 --derives-from--> F1       # wrong direction
D1 --derives-from--> R1       # grounding cycle
S1 --contradicts----> D1      # session makes semantic claim
D1 --derives-from--> S1       # session used as evidence
F1 --created-by-----> S1      # read inverse stored as edge
```

### Policy-indeterminate fixture

The finite fixture must separately declare the well-formed candidate:

```text
candidate_id: C-SPECIALIZES-D2-D1
source: D2
predicate: specializes
target: D1
condition: endpoints resolve, but no admitted specializes policy or named policy owner exists
expected_disposition: policy-indeterminate
expected_reason: POLICY_OWNER_UNBOUND
authority_effect: none
```

`D2` and `D1` are the two discovery nodes from the positive graph. The candidate is syntactically inspectable but cannot be admitted or rejected semantically because `specializes` has no enacted policy in this slice. Its proposed immutable input belongs at `fixtures/cases/indeterminate-specializes.v1.json`; its expected assertion belongs with that fixture, while the separate observed run record belongs at `generated/runs/<run-id>/receipts/indeterminate-specializes.receipt.v1.json`. The validator must not overwrite the fixture, and the receipt must bind the fixture and policy digests. The expected result is `policy-indeterminate` with `POLICY_OWNER_UNBOUND`, never pass and never an authority decision. [Agent 2](./research.md#agent-2--formal-ontology-contract-audit), [Agent 3](./research.md#agent-3--bounded-user-outcome-and-evidence-harness)

### What the witness must demonstrate

The same inputs and policy digest must produce byte-identical reports and projections across two runs. The candidate projection must preserve stable IDs, endpoint direction, source digests, policy/version, disposition, and reason. A before/after digest or capability-level test must show that authority files, promotion state, and governed source inputs are unchanged. A receipt records that evidence; it does not authorize anything.

## Ordered build-from-owned slices

| Order | Slice | Owner | Dependency | Completion evidence |
|---|---|---|---|---|
| 1 | Freeze the finite Evidence-kind graph schema, policy vocabulary, diagnostics, and valid/invalid/indeterminate fixtures | CyberAlchemy v2 ontology route with definitions-governance for load-bearing terms | Current `EDGES.yaml`, `ALLOWED-EDGES.yaml`, authority definitions | Schema validation plus owner review; no authority schema claim |
| 2 | Implement a closed-world ontology candidate-graph validator and pure candidate projection | Ontology edge-law/validator owner | Slice 1 | Deterministic positive and negative test suite; stable diagnostics |
| 3 | Prove write isolation and emit separate run/adjudication receipts | Research-evidence-harness owner with authority owner reviewing the fence | Slice 2 | Input/output digests, denied mutation test, receipt-schema validation |
| 4 | Repair the current IOLM A1→A2 binding drift and expose policy results across graph, outline, table, and provenance inspector | `private-learning-map-product-owner` through an explicitly selected IOLM work unit | Slice 2 and current passing A1 | Full Node/Python suites pass; regenerated snapshot is deterministic |
| 5 | Run browser and named human acceptance | IOLM A4/product acceptance owner | Slice 4 | Browser automation plus separately recorded human keyboard, focus, reduced-motion, and semantic-label checks |
| 6 | Admit the label `bounded ontology prototype` | Parent/ontology owner after evidence audit | Slices 1–5 | All minimum-contract evidence current and claim ceiling restated |

This ordering separates the ontology slice from the mechanical IOLM repair. Repairing IOLM alone would establish a working fixture-backed candidate projection, not an ontology prototype. [Agent 1](./research.md#agent-1--executable-repository-path-audit)

## Proposed acceptance commands and observations

The following are **future command shapes**, not commands currently present in the repository:

```bash
# Proposed: validate schemas and all fixture expectations.
ontology-prototype validate \
  --schema fixtures/schema.v1.json \
  --policy fixtures/policy.v1.json \
  --cases fixtures/cases

# Proposed: prove deterministic projection and receipt bytes.
ontology-prototype inspect \
  --graph fixtures/valid-graph.v1.json \
  --policy fixtures/policy.v1.json \
  --out generated/run-1
ontology-prototype inspect \
  --graph fixtures/valid-graph.v1.json \
  --policy fixtures/policy.v1.json \
  --out generated/run-2
cmp generated/run-1/projection.json generated/run-2/projection.json
cmp generated/run-1/receipt.json generated/run-2/receipt.json

# Proposed: verify protected inputs remain byte-identical.
ontology-prototype verify-write-isolation \
  --protected cyberAlchemy-v2/authority \
  --protected cyberAlchemy-v2/ontology/promotion-requests
```

Expected proposed observations:

1. The positive fixture yields `policy-pass`.
2. Every negative mutation yields `policy-fail` and its expected diagnostic.
3. The insufficient-evidence fixture yields `policy-indeterminate`, never pass.
4. The projection contains only selected source records and does not introduce authority state.
5. Repeated runs are byte-identical.
6. Protected-input digests are unchanged and mutation attempts are denied.
7. Browser and human evidence are recorded separately; automation cannot mark human checks passed.

Current commands that establish only the adjacent baseline are recorded by Agent 1: the A1 `serve_demo.py --check` passes, the Python server suite passes 8/8, and the full Node suite remains red at 46/50 because A2 pins are stale. They are not acceptance of the proposed ontology prototype.

## Verdict matrix

The precedent classification is exhaustive for the proposed slices: `already-deployed` means a current narrow repository surface exists; `build-from-owned` means current owners and reusable repository substrates exist but the composition is unwitnessed; `novel-attempt` means neither an owned implementation nor a verified local composition exists. No required first-prototype slice is classified `novel-attempt`; that category begins only with the deferred semantic-hierarchy attempt.

| Candidate claim or component | Owner | Precedent class | Witnessed now? | Sound under repaired vocabulary? | Verdict |
|---|---|---|---:|---:|---|
| IOLM A1 strict fixture boundary | `private-learning-map-product-owner` | `already-deployed` | Yes | Yes, as read-only fixture validation only | **KEEP, NARROW** |
| Finite Evidence-kind schema and fixture bank | CyberAlchemy v2 ontology route plus definitions-governance | `build-from-owned` | Grammar exists; complete fixture bank does not | Yes as candidate policy inputs | **BUILD** |
| IOLM A2/A4 projection and viewer chain | IOLM A2/A4 owners | `build-from-owned` | No; current suite fails and manual evidence is not run | Yes after rebind and current evidence | **BUILD, BLOCKED BY DRIFT** |
| Four-Evidence-kind ontology grammar | CyberAlchemy v2 ontology route | `already-deployed` | As authored YAML, not as instance execution | Yes as candidate policy input | **KEEP, PARTIAL** |
| Executable ontology validator and candidate projection | Ontology edge-law/validator owner | `build-from-owned` | No | Yes if finite, closed-world, and non-authoritative | **BUILD** |
| Deterministic relation-candidate evaluator | Ontology policy owner plus research-evidence-harness | `build-from-owned` | No | Yes with policy-pass/fail/indeterminate and typed reasons | **BUILD** |
| Tested write isolation and separate receipts | Authority fence reviewer plus research-evidence-harness | `build-from-owned` | No | Required | **BUILD** |
| Browser and named human acceptance | IOLM A4/product acceptance owner | `build-from-owned` | No | Yes only as inspection/usability evidence | **BUILD AFTER A2 REPAIR** |
| `bounded ontology prototype` label | Parent/ontology owner | `build-from-owned` | No | Only after the complete finite witness executes | **KILL CURRENT CLAIM; CONDITIONAL LATER** |
| Ponder adapter or learned candidate ranking | Ponder adapter/research owners | `build-from-owned` | No | Sound only as ranking input, never admission | **DEFER** |
| Semantic hierarchy induction | Future hierarchy research owner | `novel-attempt` | No | Requires an independent empirical and semantic contract | **DEFER; NOT A FIRST-PROTOTYPE SLICE** |
| Direct-parent/ancestor/facet admission policies | Respective ontology/policy owners | `build-from-owned` | No | Separate contracts required | **DEFER / ABSENT** |
| Promotion or authority runtime | Existing authority/lifecycle owners | `build-from-owned` | No and out of prototype scope | Cannot be inferred from validation or receipts | **EXCLUDE** |

The precedent review supports build-from-owned status for the graph, validation, projection, and evidence-harness pieces because repository owners and adjacent implementations exist. Precedent does not convert unwitnessed composition into a current prototype. The non-vacuity review kills the current stronger label until the valid/invalid/indeterminate witness and executable observation exist. The definitional review permits the bounded target only with the repaired vocabulary used here.

## Typed negative bank

The prototype test bank must also reject:

- an unknown node or authority kind;
- a record missing source selector, owner, either confidence axis, challenge contract, or residue route;
- a projection that emits an authority-state read model without owner-decision references;
- a candidate workflow status interpreted as an authority verdict;
- an Evidence node declaring itself authoritative or attempting to change promotion state;
- a relation with unknown effect treated as permission;
- transitive composition of `contradicts`;
- an inverse read direction persisted as a duplicate edge;
- a fixture embedded in, or overwritten by, its run receipt;
- a policy result named simply `accepted` in a way that implies semantic admission;
- a learned score directly determining a relation, hierarchy, or facet disposition;
- a successful validator receipt used as proof of promotion, publication, or production readiness.

These cases extend the graph-level negatives from Agent 2 with the user-outcome and authority-boundary failures identified by Agents 1 and 3.

## Deferred work

The first target does not include hierarchy induction, `specializes` admission, direct-parent or ancestor evaluation, facet assignment, Ponder adaptation, learned ranking, generated ontology compilation, live schema mutation, authority movement, promotion execution, publication, or production scaling. Each of relation, direct-parent, ancestor, and facet evaluation requires a distinct policy, fixture family, and owner; none may be smuggled in through a generic “semantic” label. [Agent 2](./research.md#agent-2--formal-ontology-contract-audit), [Agent 3](./research.md#agent-3--bounded-user-outcome-and-evidence-harness)

## Residue and next owner route

The immediate product residue is the stale IOLM A2 snapshot and absent current A4 evidence. The semantic residue is larger: no enacted ontology instance carrier, no executable edge-law validator, unresolved `specializes` meaning, no facet owner, incomplete confidence-carrier vocabulary reconciliation, and no chosen mechanism for proving non-write authority. [Agent 1](./research.md#agent-1--executable-repository-path-audit), [Agent 2](./research.md#agent-2--formal-ontology-contract-audit)

The next route should be a bounded ontology-owned define/design/plan package for slices 1–3, not implementation by inference. It must select the exact schema carrier, diagnostic vocabulary, fixture/receipt separation, and write-isolation mechanism. IOLM repair should remain a separate explicitly selected product work unit dependent on the ontology projection contract. No Ponder or promotion work should enter that first plan.

## Connections

| Document | Type | Description |
|---|---|---|
| `./research.md` | `derives-from` | This synthesis derives from the three explorer returns recorded for this dispatch. |

# Open Questions

- **OQ-1 (BLOCKER)** — Which executable carrier binds a finite node instance to an ontology concept without allowing self-declared authority? Recommendation: select one candidate-only schema in the next ontology design package and require definitions-governance review before implementation. Owner: CyberAlchemy v2 ontology route with definitions-governance.
- **OQ-2 (BLOCKER)** — What mechanism proves write isolation: process capability separation, filesystem policy, read-only API design, or protected-input digest checks? Recommendation: require capability denial plus before/after digests; do not accept a declarative `authority_effect: none` field alone. Owner: ontology validator owner with the relevant authority owner.
- **OQ-3** — Should the first inspectable UI reuse the repaired Key-and-Door IOLM fixture or use the five-node Evidence-kind witness directly? Recommendation: keep the normative five-node witness as validator input; reuse IOLM only as a projection/viewer adapter after its binding drift is repaired. Owner: ontology product owner and `private-learning-map-product-owner`.
- **OQ-4** — Which owner controls the relation-policy diagnostic and indeterminate vocabulary? Recommendation: define the finite policy under the ontology edge-law owner and route load-bearing term changes through definitions-governance. Owner: CyberAlchemy v2 ontology edge-law owner.
- **OQ-5** — Which composite path laws, if any, are required beyond grounding acyclicity? Recommendation: implement only witnessed grounding acyclicity in the first slice and retain all other equations as typed residue. Owner: ontology schema/edge-law owner.
- **OQ-6** — When may `specializes`, direct-parent, ancestor, and facet contracts enter? Recommendation: defer each until it has a named semantic owner, separate positive/negative fixtures, and deterministic admission policy. Owner: CyberAlchemy v2 ontology route plus the future facet-policy owner.
- **OQ-7** — Who performs and retains the non-automatable browser, keyboard, focus, reduced-motion, and visual-semantics evidence? Recommendation: assign a named human only after A2 regeneration and automated browser checks pass. Owner: IOLM A4/product acceptance owner.
