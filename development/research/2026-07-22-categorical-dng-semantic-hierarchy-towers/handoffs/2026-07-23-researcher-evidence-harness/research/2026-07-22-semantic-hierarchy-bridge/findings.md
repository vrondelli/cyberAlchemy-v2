# Semantic Hierarchy Bridge — Findings

Dispatch: `2026-07-22-semantic-hierarchy-bridge`

## 1. Answer

**One-line answer:** The repositories can host evidence-bound proposals for two different hierarchy operations and compare their named projections component by component, but they do not currently infer semantic hierarchy from embeddings, supply a sound scalar alignment metric, or prove a Lean semantics bridge (research.md, Agents 1–3).

**Friend-ready reply:** We have a good filing system and one small working viewer, not a machine that discovers “what is above what.” A model may tell us that two things look nearby; we still need an explicit policy, examples of correct and incorrect relationships, and human-auditable tests before calling one a parent, ancestor, or facet of the other. The Lean work gives useful warnings about preserving structure, but it is not a semantic ladder.

## 2. Key correction: proximity is not hierarchy

An embedding neighborhood is model evidence about proximity under a pinned model and configuration. It is not, by itself, `is_a`, containment, precedence, parenthood, ancestry, or facet membership. The bridge must first turn proximity into an explicit typed relation **proposal**, then pass that proposal to one of two separately governed operations: an order-candidate constructor or a facet-assignment proposer. Conflating those operations would turn geometric correlation into unstated semantics (research.md, Agent 1 §§1,3–4; Agent 3 §§2,7).

The repository relation contract supports that restraint: a proposal must name endpoints, direction, owner, evidence, authority effect, and forbidden collapse; incomplete semantics remain residue (`cyberAlchemy-v2/ontology/RELATION-MODEL.md`, “Relation Contract” and “Endpoint Rule”).

## 3. What the repositories actually have

The private ontology package has candidate schemas for stable, challengeable node and relation records, value/cycle review, named branch views, and non-authoritative projections. It explicitly cannot promote itself or redefine authority (`cyberAlchemy-v2/ontology/NODE-MODEL.md`; `cyberAlchemy-v2/ontology/RELATION-MODEL.md`; `cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md`; `cyberAlchemy-v2/ontology/README.md`). These are representation and governance precedents, not an induction implementation (research.md, Agent 1 §§1–3).

The deployed IOLM fixture is narrower: it compiles one pinned four-node, three-relation source into synchronized graph, authored-outline, and table views with stable IDs and explicit directions. Its outline asserts no containment, and the generated snapshot has `authority_effect: none` (`cyberAlchemy-v2/development/iolm-workable-example/generated/read-models/demo-snapshot.v1.json`; `cyberAlchemy-v2/development/iolm-workable-example/tests/projections.test.mjs`; `cyberAlchemy-v2/development/iolm-workable-example/README.md`). This witnesses projection only, not semantic discovery or hierarchy induction (research.md, Agent 3 §1).

The Lean repository has preservation taxonomies: unit/counit, schema/instance, Lan/S2 and Ran/S3 slots, with mono/iso strength where defined. They are categorical fidelity conditions, not learned abstraction levels (`domainspec-lean-formalization/lean-formalization/FractalOP.lean`; `domainspec-lean-formalization/lean-formalization/Cofractal.lean`; `domainspec-lean-formalization/lean-formalization/S3Fractal.lean`; research.md, Agent 2 “SOURCE-BACKED MAP”). Presheaf-in-Vect remains open: the deployed tower is Set/Type-valued, and no Vect residue theorem connects latent geometry to semantics (`domainspec-lean-formalization/research/presheaf-vect-novelty/findings.md`, §§(a),(d); research.md, Agent 2 “LATENT-SPACE BRIDGE”).

Inventory was useful only as discovery. **Inventory is non-authority**; all conclusions here rest on the named repository sources and the explorer transcript (research.md, preamble and Agent 1 §2).

## 4. Five-layer bridge architecture

1. **Model neighborhood.** Pin model, embedding build, source digest, distance/similarity function, neighborhood rule, and provenance. Output proximity evidence only. No such generator is witnessed today (research.md, Agent 3 §§2,7).
2. **Typed relation proposal — C1.** Convert neighborhood evidence into reviewable relation candidates using the owned node/relation envelope. `KILL` any claim of a demonstrated semantic bridge until a pinned embedding fixture includes near-negative and far-positive predicate cases (`cyberAlchemy-v2/ontology/NODE-MODEL.md`; `cyberAlchemy-v2/ontology/RELATION-MODEL.md`; research.md, Agent 1 §1).
3. **Two separate hierarchy operations.** **C2a** constructs candidates for one named order policy and rejects cycles; **C2b** proposes multi-label facet assignments under a different named policy. Neither is implemented. Order must not be inferred from facet membership, nor facet membership from order (research.md, Agent 3 §§3–4,6–7).
4. **Projection, then alignment.** **C3** compiles accepted/candidate records into a named view without changing authority. Only after two named projections exist may **C4** compare them componentwise. Projection and alignment are separate operations (`cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md`; `cyberAlchemy-v2/ontology/projections/README.md`; research.md, Agent 1 §§1,4).
5. **Validation and residue — C5.** Retain rejected candidates, cycles, unmapped nodes, component-level N/A values, drift, uncertainty, and non-entailments. Lean preservation results may supply a negative-boundary card—what is not implied—but not semantics for learned views (research.md, Agents 2–3).

## 5. Finite witness: source-backed core versus proposed extension

### Source-backed IOLM core

Nodes: `DoorUnlocked:Event`, `HasKeyRule:Rule`, `Player:Entity`, `UnlockDoor:Operation`.

Relations: `HasKeyRule -enforces-> UnlockDoor`; `Player -performs-> UnlockDoor`; `UnlockDoor -produces-> DoorUnlocked`.

That exact four-node/three-relation witness, and only that witness, is present in the generated read model and projection tests (`cyberAlchemy-v2/development/iolm-workable-example/generated/read-models/demo-snapshot.v1.json`; `cyberAlchemy-v2/development/iolm-workable-example/tests/projections.test.mjs`; research.md, Agent 3 §1).

### Proposed, unverified eight-node extension

Add nodes `Key:ValueObject`, `Door:Entity`, `UnlockPolicy:Policy`, and `DoorState:StateMachine`; propose `Player -has_resource-> Key`, `Door -is_target_of-> UnlockDoor`, `UnlockPolicy -constrains-> UnlockDoor`, and `DoorUnlocked -updates-> DoorState`. These nodes, predicates, endpoint typings, embeddings, and semantics have no witness in the evidence set and must remain fixture hypotheses (research.md, Agent 3 §2).

Two different proposed views may then be tested: `dependency-order/v0` with a strict `precedes_operationally` relation, and `semantic-facets/v0` with multi-label groups. Neither view is established by the source-backed core (research.md, Agent 3 §3).

## 6. Working definitions

- **Model neighborhood:** a provenance-bound set of items selected around an item by a pinned representation, distance/similarity function, and neighborhood rule; evidence of model proximity only.
- **Typed graph:** stable node identities plus directed or symmetric relations whose endpoints, predicate, provenance, owner, evidence, verification state, and authority effect are explicit (`cyberAlchemy-v2/ontology/NODE-MODEL.md`; `cyberAlchemy-v2/ontology/RELATION-MODEL.md`).
- **Named/partial order:** a versioned, semantically named relation governed by an explicit policy; a strict partial order is irreflexive and transitive, while a non-strict form is reflexive, antisymmetric, and transitive. The choice must be named, not inferred.
- **Taxonomy/facet:** a classification view assigning one or more labels to an item; facet membership is not containment, ancestry, node type, lifecycle state, or promotion (`cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md`, “Forbidden Collapses”).
- **View:** an identified interpretive reading over cited records with allowed readings, forbidden authority moves, owner, and residue (`cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md`, “Branch Contract”).
- **Projection:** a read model emitted from source/candidate records for a named use; it cannot create authority (`cyberAlchemy-v2/ontology/projections/README.md`).
- **Parallel hierarchy:** two or more named structures, each independently order-bearing through its own explicit relation, order policy, and hierarchy invariants over shared or explicitly mapped stable identities. Multiple facets, classifications, projections, or views may coexist without constituting parallel hierarchies unless each independently satisfies those hierarchy conditions. “Parallel” alone does not assert equivalence, alignment, or preservation (research.md, Agents 1 §4 and 2 “SYNTHESIS”).
- **Alignment:** a versioned, evidence-bearing comparison between two already-produced named views, reporting correspondences, unmapped items, violations, and each component separately; it is not a scalar assertion of semantic sameness (research.md, Agent 3 §5).

## 7. Verdict matrix

| Candidate | Owner / precedent | Witnessed? | Sound? | Verdict |
| --- | --- | --- | --- | --- |
| **C1 Evidence-Neighborhood Relation-Proposal Envelope** | Build from owned node/relation contracts | Schema precedent yes; embedding-to-proposal bridge no | Sound only as a proposal envelope | **KILL demonstrated-bridge claim** pending pinned embeddings plus near-negative/far-positive predicate fixtures |
| **C2a Policy-Versioned Order-Candidate Constructor** | New operation using relation and cycle guards | No implementation, policy, or gold order fixture | Contract shape is plausible; outputs unvalidated | **KILL operational claim** pending named order policy, gold parent/ancestor pairs, cycles, and hard negatives |
| **C2b Policy-Versioned Facet Assignment Proposer** | New operation using branch/view non-collapse rules | No implementation, facet policy, or gold memberships | Plausible only when independent of order | **KILL operational claim** pending separate facet policy and gold multi-label memberships/nonmemberships |
| **C3 Named-View Projection Compiler** | IOLM fixture plus ontology projection contract | Yes, narrowly: one four-node/three-relation fixture | Sound as representation only | **KEEP representation contract**; current Firefox/manual acceptance remains `BLOCK` / `NOT_RUN` |
| **C4 Componentwise Cross-View Comparison Ledger** | Proposed Agent 3 alignment record; branch/view precedent | No executed alignment | Sound if every component and N/A is retained | **KEEP proposed ledger; KILL scalar TNAS** because weights, threshold, ownership, and commensurability are unwitnessed |
| **C5 Preservation-Taxonomy Negative-Boundary Card** | Lean Fractal/Cofractal/S2–S3 files | Preservation predicates yes; semantics bridge no | Sound only as analogy and explicit non-entailment | **KEEP boundary card; KILL entailment claim**; presheaf-in-Vect remains open |

The matrix follows research.md Agents 1–3 and the direct sources named in §§3–4. “KEEP” never means promotion or authority.

## 8. Smallest next experiments and fixtures

1. Freeze and replay the four-node/three-relation core, including digest-drift rejection, before adding semantic claims.
2. Pin one embedding model/configuration and label a minimal predicate set containing both **near but not the proposed relation** and **far but genuinely related** cases. This is C1’s first falsification fixture.
3. For C2a, publish `dependency-order/v0` as an explicit policy and a tiny gold set of parent pairs, ancestor pairs, non-pairs, a reversed-edge adversary, and an injected cycle. Report parent/ancestor precision-recall and cycle rejection.
4. For C2b, publish `semantic-facets/v0` separately with gold multi-label memberships and nonmemberships, including the same facet across different operational levels.
5. Project both results with stable IDs, preserving candidate/rejected/unknown states and `authority_effect:none`.
6. Compare them with a component ledger: stable-ID overlap, typed incident-relation overlap, order/level compatibility where applicable, reachability preservation where applicable, unmapped items, and N/A reasons. Do not aggregate.
7. Add unresolved-endpoint, split/merge, deterministic-repeat, and source-digest-drift fixtures (research.md, Agent 3 §6).

## 9. Limitations and residue

- No implemented embedding generator, semantic relation inference, hierarchy induction, facet assignment, alignment metric, human-gold corpus, or confidence calibration exists in the audited evidence (research.md, Agents 1 §3 and 3 §§6–7).
- The latest Firefox replay is still `overall_status: BLOCK`, `manual_status: NOT_RUN`, because expected and actual graph hashes differ under `BIND_GRAPH_HASH_MISMATCH`. Owner resolution and rebind or restoration must precede validation (`cyberAlchemy-v2/development/iolm-workable-example/generated/runs/20260722T182915Z-firefox-replay/validation-summary.json`).
- **`machine_index_gap`:** this synthesis is Markdown only; no authoritative machine-readable candidate/verdict/fixture index was found or created. Inventory cannot fill that authority gap because it is a non-authority discovery surface (research.md preamble; Agent 1 §2).
- Scalar TNAS remains rejected: its weights, threshold, ownership, calibration, and cross-component commensurability are unwitnessed. Componentwise reporting with explicit N/A is the surviving proposal (research.md, Agent 3 §5).
- Lean preservation taxonomies do not imply learned semantic ladders or alignment. Exact strictness should not be sharpened without the cited counterexample witnesses, and no `ModuleCat`/Vect tower or semantics interpretation map exists in the audited bridge (research.md, Agent 2 “RESIDUE”).
- The eight-node extension and both proposed views remain typed residue, not inferred authority (research.md, Agent 3 §§2–3,7).

## 10. Evidence boundary and source references

Evidence is bounded to the complete explorer transcript at `cyberAlchemy-v2/development/research/2026-07-22-semantic-hierarchy-bridge/research.md` and the local `cyberAlchemy-v2/` and `domainspec-lean-formalization/` sources it names. No external source or Inventory claim is treated as authority.

Primary local references:

- `cyberAlchemy-v2/ontology/NODE-MODEL.md`
- `cyberAlchemy-v2/ontology/RELATION-MODEL.md`
- `cyberAlchemy-v2/ontology/BRANCH-AS-VIEW.md`
- `cyberAlchemy-v2/ontology/README.md`
- `cyberAlchemy-v2/ontology/TAXONOMY-CROSSWALK.md`
- `cyberAlchemy-v2/ontology/RELATIONSHIP-CROSSWALK.md`
- `cyberAlchemy-v2/ontology/projections/README.md`
- `cyberAlchemy-v2/development/iolm-workable-example/README.md`
- `cyberAlchemy-v2/development/iolm-workable-example/generated/read-models/demo-snapshot.v1.json`
- `cyberAlchemy-v2/development/iolm-workable-example/tests/projections.test.mjs`
- `cyberAlchemy-v2/development/iolm-workable-example/generated/runs/20260722T182915Z-firefox-replay/validation-summary.json`
- `domainspec-lean-formalization/lean-formalization/FractalOP.lean`
- `domainspec-lean-formalization/lean-formalization/Cofractal.lean`
- `domainspec-lean-formalization/lean-formalization/S3Fractal.lean`
- `domainspec-lean-formalization/research/presheaf-vect-novelty/findings.md`

This report claims no implemented hierarchy induction, semantic inference, alignment metric, or Lean semantics bridge.
