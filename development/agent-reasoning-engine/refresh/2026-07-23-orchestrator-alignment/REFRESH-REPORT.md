# Invoke refresh report — orchestrator alignment

## Result

- Spell / mode: `invoke` / `refresh`
- Mutation mode: `proposal-only`
- Phase status: `pass`
- Phase-status basis: the evidence-backed proposal is exact and has zero
  refresh-authoring blockers.
- Handoff status: `gated`
- Source signals: 9
- Target artifact groups: 3 owners
- Applied changes: none
- Immediate target route: explicit `G-ARE-L0` evidence/owner promotion gate
- First proposed post-promotion route: `invoke:design
  ACI-REASONING-BINDING`
- Claim ceiling: one local finite semantic witness exists; no general
  reasoning-engine promotion, ACI compatibility, actor runtime, real effect or
  anti-bias efficacy is claimed.

The current reasoning-engine architecture is directionally aligned with the
orchestrator's newer ACI decisions: both separate gates from semantic results,
persist before effect eligibility, require idempotency, distinguish historical
replay from fresh evaluation and treat receipts as non-authorizing. That
alignment is architectural, not executable.

The exact refresh consequence is twofold:

1. correct stale “unwitnessed” language in the reasoning-engine SPEC,
   architecture and Inventory read models; and
2. open one typed cross-repository binding blocker before L1 actor-journal or
   L2 durability work can create a competing authority.

## Refresh signals

| ID | Type | Claim | Safety | Targets |
|---|---|---|---|---|
| `RS-ARE-ALIGN-001` | `evidence_added` | SWU-ARE-001 supplies a passing bounded L0 semantic witness. | safe | SPEC, architecture, Inventory |
| `RS-ARE-ALIGN-002` | `artifact_drift` | SPEC and architecture still call the first witness unwitnessed. | safe | SPEC, architecture |
| `RS-ARE-ALIGN-003` | `evidence_added` | ACI ADR-001 accepts a concrete journal/replay/canonical contract for W0 decision scope. | safe | architecture, Work Pack |
| `RS-ARE-ALIGN-004` | `blocker_opened` | Planned SWU-ARE-002 could create a second runtime-journal authority unless the ACI/reasoning ownership seam is decided first. | needs_review | Work Pack, protocol task, W1 wave, Craft |
| `RS-ARE-ALIGN-005` | `blocker_opened` | Planned SWU-ARE-006 currently combines artifact-byte durability with receipt/journal durability that ACI assigns to a journal boundary. | needs_review | Work Pack, governance task, Craft |
| `RS-ARE-ALIGN-006` | `evidence_added` | Work Bus, ACP and APT expose plausible mapping seams for observations, reviews, DispatchSpec and lineage. | safe | architecture, future binding route |
| `RS-ARE-ALIGN-007` | `blocker_opened` | Work Bus remains without a post-remediation PASS, ACI runtime is blocked and APT mutation is blocked; no binding may be claimed. | safe | Work Pack, future binding route |
| `RS-ARE-ALIGN-008` | `artifact_drift` | Two verified Inventory pages retain the pre-witness and pre-remote-advance snapshot as if current. | safe | Inventory entries and indexes |
| `RS-ARE-ALIGN-009` | `no_op` | AntiBiasVector remains correctly excluded from the first witness and no new evidence closes that gap. | safe | SPEC, Work Pack |

## Proposed delta summary

### Invoke-owned targets

- Update `spec/SPEC.md` and `design/ARCHITECTURE.md` to distinguish:
  - witnessed local evaluator slice;
  - unpromoted whole-engine candidate;
  - unresolved cross-repository runtime binding.
- Add `BLK-ARE-ACI-BINDING-001` to `planning/WORK-PACK.md` as a future
  L1/L2 design blocker that does not block G-ARE-L0 promotion.
- Mark SWU-ARE-002/003/006 scopes as provisional until the binding owner
  decides journal, artifact, canonical-byte and observation-publication
  responsibilities.
- Add the binding decision to the W1 entry gate.
- Preserve `implementation_authorized: false`, `selected_swu: none` and the
  immediate G-ARE-L0 route.

### Craft-owned targets

- Add the cross-repository binding blocker and external evidence handles to
  `.craft/ledger.yml`.
- Preserve the current L0 pass, closed semantic-witness gap and pending
  promotion route.
- Regenerate `.craft/index.json` and `CRAFT.md` through Craft; do not hand-edit
  generated views.

### Inventory-owned targets

- Update the reasoning-engine contract synthesis so its current-state section
  records the bounded L0 witness while preserving the historical accepted
  research posture.
- Update the orchestrator-purpose synthesis with a dated current-state
  addendum at `origin/master@6e5936b`, without rewriting its frozen
  `ca560b8` result.
- Regenerate `index.md`, `index.json` and `log.md` through Inventory.

The exact field-level proposal is in
[`REFRESH-PATCH-PROPOSAL.md`](REFRESH-PATCH-PROPOSAL.md).

## Smallest coherent post-promotion unit

`ACI-REASONING-BINDING` is a documentation-only design contract with one
responsibility: decide and map the authority seam among:

- confirmed reasoning requests and `DispatchSpec`;
- actor commands/events and ACI journal facts;
- proposed observations/reviews and the candidate Work Bus;
- reasoning receipts and ACI canonical event/receipt identity;
- effect eligibility and ACI effect intents;
- session/dispatch/research lineage and APT projections;
- artifact bytes versus journal-owned lifecycle facts.

It produces mappings, owner decisions, incompatible-state behavior and
conformance fixtures. It does not implement ACI, the actor protocol, an
artifact store or an adapter.

Recomposition:

```text
ACI-REASONING-BINDING
  -> SWU-ARE-002 journal transitions
  -> SWU-ARE-003 observation/challenge transport
  -> SWU-ARE-006 durability/recovery
  -> G-ARE-L1/L2 evidence
```

## Blockers by lifecycle scope

| ID | Scope | Owner | Status | Claim |
|---|---|---|---|---|
| `BLK-REFRESH-ALIGN-APPLY-001` | `apply-authorization` | human authorization | open | Proposal completion does not authorize target mutation. |
| `BLK-REFRESH-ALIGN-PROMOTION-001` | `target-lifecycle` | G-ARE-L0 claim/promotion owner | open | The bounded witness has not been admitted beyond its local L0 evidence posture. |
| `BLK-ARE-ACI-BINDING-001` | `target-lifecycle` | reasoning-engine and ACI architecture owners | open | Journal, artifact, canonical identity, publication and lineage ownership must be mapped before affected future SWUs mutate code. |
| `BLK-ARE-ACI-MATURITY-001` | `target-lifecycle` | ACI / Bus / APT lifecycle owners | deferred | Runtime and candidate mapping surfaces do not yet have the receipts needed for an executable binding. |
| `BLK-REFRESH-ALIGN-AUDIT-001` | `audit` | Invoke, Craft and Inventory validators | deferred | Applied status, blocker and projection changes require owner-specific validation. |

Refresh-authoring blocker count: **0**. Apply, promotion, target lifecycle and
audit conditions gate later handoffs but do not lower this complete
proposal-only phase.

## Preserved residue

- ACI runtime code remains blocked and unimplemented.
- Bus Contracts remains draft with a latest `FIX` review and no later PASS
  receipt.
- ACP is discovery, not an admitted Skill Execution Profile/runtime contract.
- APT remains observational and mutation-blocked.
- Artifact durability, incident readiness, rollout readiness, intent
  revision/inter-rater evidence and anti-bias efficacy remain open.
- No downstream SWU is selected or authorized.

## Validation plan

- Validate the dispatch against the repository-local Dispatch Spec schema and
  semantic checks.
- Parse every new JSON artifact.
- Confirm every source and target digest in the context pack.
- Re-run the 16-test semantic evaluator suite as source evidence only.
- Confirm no target outside this refresh package changed.
- Run `git diff --check` and link/path presence checks.
- Emit `VALIDATION.json` and `OWNER-RECEIPT.json`.

## Next route

Exact next route for mutation:

```text
invoke:refresh:apply-approved
  target = refresh/2026-07-23-orchestrator-alignment/REFRESH-PATCH-PROPOSAL.md
  explicit authorization required
```

After an approved, validated apply:

1. run the existing explicit `G-ARE-L0` evidence/owner promotion gate;
2. if that gate admits continuation, run `invoke:design
   ACI-REASONING-BINDING`;
3. do not route SWU-ARE-002, SWU-ARE-003 or SWU-ARE-006 to Task Session until
   the binding contract dispositions their ownership conflicts.

