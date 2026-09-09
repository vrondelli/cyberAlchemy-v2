---
status: candidate
artifact_kind: candidate-bridge-profile
base_ontology_type: architecture-property
branch: system
private: true
authority_effect: none
runtime_conformance_effect: none
promotion_status: not-requested-not-granted
last_updated: 2026-08-05
---

# RWO to Agent Reasoning Engine — Candidate Ontology Bridge

## Boundary

This profile projects the accepted Recursive Work Orchestrator (RWO) research into the private
Agent Reasoning Engine (ARE) design boundary. It is a documentation-only, non-authoritative view.
It does not select an owner, accept an interface schema, register a host binding, implement a
runtime seam, admit an artifact, authorize an effect, or promote either architecture.

The source RWO ontology remains proposal-only. Existing orchestrator features are precedents and
partial analogues, not an RWO implementation. ARE's bounded local L0 witness is not evidence of
RWO, orchestrator, ACI, Bus, ACP, or APT compatibility.

## Pinned sources

| Source ID | Identity | Posture | Use |
|---|---|---|---|
| `RWO-ONTOLOGY-0.1` | `sha256:1c6d417c4f0cdfc73c7c42f016c05fd6f8fbccd738a35bf7454472d3cee3b920` | pre-update proposal observed by the accepted research | freezes the ontology bytes on which the research findings were based |
| `RWO-EVIDENCE-0.2` | [`../../../../../projects/cyberalchemy-orchestrator/docs/features/recursive-work-orchestrator/ontology/evidence/CURRENT-STATE-2026-08-05.json`](../../../../../projects/cyberalchemy-orchestrator/docs/features/recursive-work-orchestrator/ontology/evidence/CURRENT-STATE-2026-08-05.json) | candidate projection | preserves proof/correspondence distinctions and current residue |
| `ARE` | [`../ARCHITECTURE.md`](../ARCHITECTURE.md), `sha256:1958758a104c19af9966fd1460097c18fbf919e480da45e5c8dcc0b5f4ffe0de` | private candidate architecture | semantic stages, gates, replay, and failure boundaries |
| `ACI-BINDING` | [`../aci-reasoning-binding/ARCHITECTURE.md`](../aci-reasoning-binding/ARCHITECTURE.md), `sha256:02eaede41676bcf19e45cb8cf9b7130bddf297d6ae786d81fdb67ee456bb2c8c` | selected candidate binding | single-journal and lifecycle-owner boundary |
| `RESEARCH-C1` | `sha256:synthesis-revision-2=400d601aea76eb38cf2f9646a337c3ec597c34f2fd577fc6d5cc0b21bcdc8066` | accepted documentation evidence | typed entry contract and planned discriminating fixtures |

The accepted evidence closure lives at
`domainspec-core:ops/development/2026-08-04-cyberalchemy-orchestrator-rwo-are-current-state-research/receipts/evidence-closure.json`.
Its claim ceiling applies to every row below.

## Conditional stage map

The labels in this table are local bridge labels, not newly promoted definitions.

| Stage | Producer | Typed boundary | Consumer | Owner boundary | Fail-closed condition | Evidence status |
|---|---|---|---|---|---|---|
| entry | confirmed dispatch plus bound seat | `ReasoningEntryVerdict` persisted before mapping | reasoning command mapper | entry-gate owner remains distinct from ACI and ARE | missing, stale, mismatched, or non-pass verdict produces no mapper, ACI, actor, evaluator, artifact, or effect call | documentation candidate |
| command acceptance | mapper | proposed lifecycle command plus exact digest | ACI acceptance boundary | ACI alone accepts or rejects and owns canonical lifecycle identity | unknown schema/digest or cross-run substitution rejects | documentation candidate |
| history | ACI acceptance boundary | accepted lifecycle record plus verified journal cut | observation-admission boundary | ACI owns the one integrated journal | unverified cut or missing lineage blocks admission | source boundary observed; integrated conformance absent |
| observation admission | verified journal cut and external source adapters | admission verdict plus immutable admitted observations | bounded semantic evaluator | observation-admission owner is not the journal, projection, or evaluator | lifecycle history is never admitted automatically; missing owner blocks | documentation candidate |
| L0 semantics | frozen admitted inputs, authority snapshot, and finite catalog | semantic result plus derivation and residue | receipt assembler | evaluator owns deterministic derivation, not lifecycle or effect authority | unresolved required inputs or non-pass entry yields no evaluation | bounded local witness previously executed; not freshly executed in the accepted research |
| artifact admission | semantic receipt assembler | immutable semantic artifact plus digest | artifact-admission boundary | artifact owner is unresolved; ACI may retain only accepted references and lifecycle facts | absent owner or contract blocks (`GAP-ARE-ART-001`) | blocked |
| exact effect | exact requested envelope plus admitted semantic artifact | distinct exact-effect verdict | effect-command mapper | effect-gate owner is separate from evaluator, router, and ACI acceptance | non-pass, stale, mismatched, or broadened envelope produces no effect intent | documentation candidate |
| effect lifecycle | effect-command mapper | proposed ACI effect intent | ACI acceptance then effect adapter | ACI owns intent acceptance; adapter owns attempt evidence; neither invents authority | rejection produces no attempt; unknown outcome remains honest unknown | deferred |
| replay | verified ACI cut plus retained immutable semantic artifacts | reproduced semantic outcome | audit consumer | replay reads ACI facts and deterministic artifacts; it does not own current truth | any mutable, provider, tool, or effect call invalidates historical replay | bounded local witness previously executed; integrated bridge deferred |
| revalidation | current source handles and a new admitted run context | new run identity and fresh receipts | ordinary entry path | current owners decide applicability and authorization again | reuse of a historical receipt as current permission rejects | documentation candidate |

## Required sequence

```text
Confirmed Dispatch + bound seat
  -> persisted ReasoningEntryVerdict
  -> proposed ACI lifecycle command
  -> accepted ACI lifecycle record
  -> verified ACI journal cut
  -> independently admitted observations
  -> bounded ARE L0 evaluation
  -> semantic receipt and proposed artifact
  -> separate ArtifactAdmissionVerdict
  -> separate ExactEffectVerdict for one exact envelope
  -> proposed ACI effect intent
  -> ACI intent acceptance
  -> external attempt receipt or honest unknown
```

A non-pass or missing boundary stops at that boundary. A pass permits only the next named proposal
or evaluation step. No pass is transferable to a later boundary.

## Topology dispositions

| Disposition | Topology | Constraint |
|---|---|---|
| select for documentation analysis | gate-adjacent bounded evaluator | selection is analytical only; it does not select implementation |
| narrow | ACI-subordinate ARE leaf facade | accepts one addressed immutable command and returns lifecycle events plus an artifact reference; no direct journal write or effect |
| narrow | read-only audit or replay sidecar | output remains non-authorizing and cannot release routing or effects |
| defer | ARE as `CompositeWork` | no recursive compiler, boundary projection, generic fan-in, or compatibility receipt exists |
| defer | generic RWO sidecar, fan-in, cursor, repeat, and integrated `ReplayBridge` | source similarity does not satisfy contract or runtime conformance |
| kill | second scheduler or second integrated journal | conflicts with the ACI-owned lifecycle and journal boundary |
| kill | orchestrator-owned semantic judgment or evaluator-owned effect authority | collapses routing, semantics, and authorization |
| kill | result or recommendation used as authorization | semantic output is never an effect permission |

## Non-collapse constraints

- RWO graph readiness is not a `ReasoningEntryVerdict`.
- A route label is not a semantic verdict.
- An accepted ACI lifecycle record is not an admitted semantic observation.
- A semantic receipt is not canonical artifact admission.
- Artifact admission is not an exact-effect pass.
- An exact-effect pass is not ACI command acceptance or an external attempt.
- Historical replay is not current revalidation, redelivery, or a new attempt.
- A projection may expose lineage and freshness but cannot own source lifecycle or status.
- One selected journal owner does not make journal history authoritative for work-owned domain state.
- Missing owner, schema, digest, conformance, or compatibility evidence remains residue; the bridge
  cannot manufacture it.

## Planned discriminating witnesses

These witnesses are requirements from the accepted research. None was executed by this ontology
update.

| Witness | Required discrimination | Current status |
|---|---|---|
| `F1` | dependency-complete confirmation to binding to journal-verification lifecycle | unexecuted |
| `F2` | recursive A to readiness to B path with wrong and missing artifact negatives | unexecuted |
| `F3` | semantic fan-in reconciliation distinct from arrival or quorum | unexecuted |
| `F4` | sidecar failure and completion cannot control the primary without declared policy | unexecuted |
| `F5` | entry non-pass makes zero downstream calls and only the valid owner may write its receipt | unexecuted |
| `F6` | L0 positive result plus effect non-pass and ACI rejection paths remain distinct | unexecuted |
| `F7` | historical replay makes zero mutable or external calls; current revalidation creates a new run | unexecuted |
| `F8` | missing or substituted owner receipts, schemas, digests, and run identities fail closed | unexecuted |

## Validation posture

| Check | Result | Meaning |
|---|---|---|
| source identities pinned | pass | the bridge identifies the exact pre-update RWO and current ARE/ACI source bytes used by the accepted research |
| owner seams retained | pass | each lifecycle, semantic, artifact, and effect boundary remains separate |
| forbidden topologies retained | pass | the second-control-plane and authority-collapse paths remain killed |
| bridge runtime schema | unsupported | no accepted cross-repository schema exists |
| runtime compatibility and conformance | unsupported | no executable RWO-to-ARE seam or conformance receipt exists |
| F1-F8 witness execution | unsupported | all eight remain unexecuted |
| authority or promotion | not granted | this profile is a candidate projection only |

Overall: **FLAG**. The documentation boundary is explicit; executable integration remains blocked.

## Open Questions

| ID | Question | Owner route | Blocking effect |
|---|---|---|---|
| `RWO-ARE-OQ-001` | Who owns and versions `ReasoningEntryVerdict`? | entry-gate and dispatch authority owners | blocks entry mapper and zero-call/write-set conformance |
| `RWO-ARE-OQ-002` | Who admits semantic artifacts and which immutable schema is accepted? | artifact-admission owner | blocks `GAP-ARE-ART-001` and artifact references |
| `RWO-ARE-OQ-003` | Who owns the exact-effect verdict and effect envelope? | authorization and effect-boundary owner | blocks effect command mapping |
| `RWO-ARE-OQ-004` | Which ACI command, cut, artifact, and effect schemas are accepted across repositories? | ACI, artifact, and effect owners | blocks compatibility and conformance fixtures |
| `RWO-ARE-OQ-005` | What executable RWO compiler and reducer establish graph and replay semantics? | RWO implementation owner after source gates | blocks CompositeWork, cursor, replay, and recursive witnesses |
| `RWO-ARE-OQ-006` | Which catalog-applicability, precedence, and challenge-closure owners govern L0 inputs? | ARE catalog and authority owners | blocks an integrated reasoning run |
| `RWO-ARE-OQ-007` | Which ACI, Bus, ACP, and APT maturity receipts are sufficient for the selected seam? | respective source owners | blocks L1-L3 integration claims |
| `RWO-ARE-OQ-008` | Which target dependency lock will make F1 and the broader lifecycle suites reproducible? | target runtime and validation owner | blocks dependency-complete current-state proof |

Resolution requires the named owner routes. Editing this bridge cannot close any question.
