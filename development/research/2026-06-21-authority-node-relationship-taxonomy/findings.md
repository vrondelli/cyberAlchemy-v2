# Authority Node Relationship Taxonomy Findings

## Verdict

**ACCEPTABLE FOR NEXT SLICE / not schema-evolution yet.**

## One-Line Answer

`authority-type` and `authority-posture` are reviewable authority artifacts only when deflated into owned lifecycle surfaces: envelope fields, owner-profile payloads, PromotionRecord-compatible decisions, ledger evidence, and ontology projections; they are not current vault `node_type` values, tags, confidence aliases, ledger subgraphs, or movement graph edges. [research.md:281-287](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/research.md:281) [ontology-conventions.md:51-63](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:51) [RESULT.md:58-91](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:58)

## Final Taxonomy Table

| Thing | Current legal surface | Allowed relationship | Forbidden collapse |
| --- | --- | --- | --- |
| Authority-type artifact | Envelope/profile/PromotionRecord-compatible payload with `artifact_kind`, `authority_owner`, and `current_status` | Classifies an authority artifact through owned lifecycle metadata | Not a vault `node_type` today |
| Authority-posture artifact | Envelope `sources[]`, import/tower metadata, profile payload | Declares source/local/public-private reliance posture | Not a tag, `convicção`, or node class |
| Concept / ontology node | Ordinary vault node with closed `node_type`, maturity `status`, and confidence axes | May represent candidate meaning, provenance, confidence, and promotion state | Must not own authority transitions |
| Workflow record | Lifecycle or ledger record | Witnesses workflow state and evidence | Must not decide promotion |
| PromotionRecord-compatible decision | Owner decision / promotion record | Decides pass/flag/block/deferral/rejection for a candidate | Must not replace the canonical authority artifact |
| Ledger event | Ledger evidence / movement witness, partial until validator exists | May witness movement after validator/schema exists | Not an ontology subgraph or graph node today |
| Ontology projection | Candidate/read-model projection via `ontology_refs` | Exposes allowed authority state for search/review | Cannot promote by proximity |
| Ordinary vault `node_type` | Existing enum only: `axiom`, `premise`, `constitution`, `discovery`, `spec`, etc. | Classifies document role | Closed to `authority-type`, `authority-posture`, `movement`, `promotion-event` until schema evolution |

Evidence: the vault convention defines a closed current frontmatter vocabulary and `node_type` as document role, separate from maturity and confidence. [ontology-conventions.md:51-63](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:51) [ontology-conventions.md:71-123](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:71) The lifecycle envelope already carries `artifact_kind`, `authority_owner`, `current_status`, source posture, promotion, drift owner, and ontology refs. [RESULT.md:58-91](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:58) The explorer converges that reviewable authority objects are real, but today live as governed envelopes/records/profile payloads, not vault node classes. [research.md:223-228](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/research.md:223)

## Verdict Matrix

| Candidate | Verdict | Witness | Collapse test |
| --- | --- | --- | --- |
| Authority-type artifact | Build-from-owned | Existing envelope/profile surfaces can carry authority kind. [RESULT.md:58-62](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:58) | Collapse if claimed as vault `node_type`. [research.md:285-287](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/research.md:285) |
| Authority-posture artifact | Build-from-owned | Envelope sources carry `source_authority_posture`, `public_private_posture`, and confidence. [RESULT.md:63-72](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:63) Definitions preserve source posture and promotion routes. [DEFINITIONS.md:257-282](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:257) | Collapse if encoded as tag, `convicção`, or node type. [research.md:49-53](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/research.md:49) |
| Concept / ontology node | Already deployed | Ontology is typed meaning with nodes, relations, evidence, confidence, promotion state, and gates. [DEFINITIONS.md:858-901](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:858) | Kill authority-by-proximity: candidate ontology cannot promote definitions, constitutions, contracts, or public claims. [DEFINITIONS.md:922-940](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:922) |
| Workflow record | Already deployed / separate | `current_status` lives on envelope/workflow record; vault `status` is maturity. [RESULT.md:58-62](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:58) [ontology-conventions.md:189-208](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:189) | Collapse if workflow record decides promotion. [RESULT.md:14-24](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:14) |
| PromotionRecord | Build-from-owned; owner unsettled | Owner route or PromotionRecord decides promotion verdicts. [RESULT.md:14-24](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:14) | Kill if it replaces the canonical authority artifact. [research.md:223-226](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/research.md:223) |
| Ledger event | Partial build-from-owned | Ledger selector is plausible, but append-only authority movement lacks an in-repo validating schema. [findings.md:67-74](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:67) | Kill as ontology subgraph or movement edge until amendment. [findings.md:117-142](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:117) |
| Ontology projection | Already deployed as read model | Ontology can reference envelopes through `ontology_refs`, candidate maps, and generated projections. [RESULT.md:89-91](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:89) | Kill if projection changes authority. [RESULT.md:101-112](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:101) |
| Ordinary vault `node_type` | Already deployed; closed for now | Current enum excludes authority lifecycle node types. [ontology-conventions.md:51-63](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:51) | New values require schema-evolution discovery. [research.md:309-316](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/research.md:309) |

## Relation Catalog

### Allowed Now: Record / Envelope / Profile / Projection Relations

These relation names are allowed only as envelope fields, profile payload relations, PromotionRecord-compatible record relations, ledger evidence labels, or projection rows. They are not current vault `## Connections` edge types. [research.md:307-316](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/research.md:307)

| Relation | Current surface | Meaning |
| --- | --- | --- |
| `classifies_authority_kind` | Envelope/profile payload or projection row | An artifact is classified by authority kind. |
| `declares_source_posture` | `sources[]` metadata | A source declares how it may be relied on. |
| `uses_owner_profile` | Lifecycle envelope | An artifact routes validation to an owner profile. |
| `requests_promotion_gate` | Envelope / PromotionRecord-compatible record | A candidate asks whether it may count. |
| `decides_transition` | Owner decision / PromotionRecord-compatible record | Owner gate returns pass/flag/block/deferral/rejection. |
| `emits_projection_when_allowed` | Projection metadata / `ontology_refs` | Owner-approved state may appear in read models. |

All allowed-now relations must record endpoints, direction, relation kind, owner route, evidence, and validation/promotion effect before they influence authority. [DEFINITIONS.md:630-657](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:630)

### Schema-Evolution Only

The following are closed negative today:

- `witnesses_authority_movement`
- `promotion-movement edge`
- `authority-type` / `authority-posture` as vault `node_type`
- `promotion-event` / `movement` as vault `node_type`
- ledger row as ontology subgraph

Reason: vault edges require both endpoints and fixed forward/inverse pairs, except the current skills/agents and session-origin carve-outs. [ontology-conventions.md:281-320](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:281) A promotion movement matches neither carve-out, and prior research keeps the bridge movement-edge killed until a third carve-out or lawful `promotion-event`/`movement` node type exists. [findings.md:59-65](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:59) [research.md:151-159](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/research.md:151)

## Workflow Implications

1. Do not mutate ontology first. Lifecycle work starts with the existing `authority_artifact_lifecycle_envelope`, then owner route, then owner decision / PromotionRecord, then authority artifact, then optional ontology projection. [RESULT.md:31-39](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:31) [RESULT.md:150-155](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:150)

2. Preserve owner-route authority. Definitions, constitutions, disciplines, contested ownership, and promotion verdicts have distinct owner routes; ontology may represent/query lifecycle state but does not own transitions. [RESULT.md:11-24](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:11)

3. Keep `current_status` and vault `status` separate. Workflow status belongs on the lifecycle record; vault maturity status belongs on vault nodes. [research.md:256-261](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/research.md:256) [ontology-conventions.md:189-208](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:189)

4. Keep confidence axes distinct. Envelope source confidence, PromotionRecord evidence/commitment confidence, and vault `veracidade`/`convicção` are related review facts, not aliases. Vault confidence is meaningful mainly for `axiom`, `premise`, and `audit`; many document roles should omit document-level confidence. [ontology-conventions.md:211-256](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:211) [research.md:293-295](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/research.md:293)

5. Treat ontology projections as read models. Ontology can condense candidate maps and promotion requests, but cannot promote definitions, constitutions, runtime contracts, or public claims by itself. [DEFINITIONS.md:922-940](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:922)

## Implementation Slice And Blockers

### Next Slice

Build only the owned surfaces:

1. Extend/use the existing envelope fields for `artifact_kind`, `authority_owner`, `current_status`, source posture, promotion handle, conflicts, drift owner, and `ontology_refs`. [RESULT.md:58-91](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:58)

2. Add or formalize the typed-hole owner profile contract: rail produces a promotion record, but the per-kind owner profile produces the verdict. [findings.md:82-111](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:82)

3. Allow the six relation names only as envelope/profile/record/projection relations with explicit endpoints, owner, evidence, direction, and effect. [research.md:307-316](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/research.md:307) [DEFINITIONS.md:630-657](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/authority/definitions/DEFINITIONS.md:630)

4. Emit projections only through `ontology_refs.candidates/projections`, not movement graph edges. [RESULT.md:83-91](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:83)

### Blockers

- No current legal vault `node_type` for `authority-type`, `authority-posture`, `promotion-event`, or `movement`. [ontology-conventions.md:51-63](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:51)
- No current movement edge law: bidirectional vault edge rules and existing carve-outs do not admit promotion movement. [ontology-conventions.md:281-320](/home/vrondelli/projects/domainspec-core/implementation/domainspec/vault/ontology-conventions.md:281)
- No complete append-only authority-ledger validator yet; prior research marks the movement ledger contract as missing. [findings.md:67-74](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-harness-ledger-ontology-unification/findings.md:67)
- No permission for ontology projection to replace owner decision or PromotionRecord. [RESULT.md:101-112](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/refinement-runs/20260621T043600Z-authority-artifact-lifecycle-placement/RESULT.md:101)

## Gate Disposition

**ACCEPTABLE FOR NEXT SLICE / not schema-evolution yet.**

Proceed with envelope/profile/PromotionRecord-compatible record/projection implementation. Do not add vault node types, movement edges, or ledger-as-subgraph semantics until schema evolution chooses either a third forward-only carve-out for temporal authority-movement records or a lawful `promotion-event` / `movement` node type with cataloged inverse edges. [research.md:309-316](/home/vrondelli/projects/domainspec-core/cyberAlchemy-v2/development/research/2026-06-21-authority-node-relationship-taxonomy/research.md:309)
