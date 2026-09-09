# Refresh patch proposal — orchestrator alignment

Mutation mode is `proposal-only`. This is a scoped change contract, not
authorization to mutate any target.

## 1. Invoke-owned define and design status correction

### `spec/SPEC.md`

Apply these changes:

1. Frontmatter:
   - `status: unwitnessed-candidate`
   - becomes
   - `status: candidate-with-bounded-l0-witness`
2. In **Definition posture**, retain:
   - rejection of the claim that the repository already has a general
     pre-action reasoning engine;
   - prohibition on semantic outcomes authorizing effects;
   - exclusion of AntiBiasVector efficacy claims.
3. Change only the first-slice posture:
   - `semantic-judgment evaluator@1` →
     `WITNESSED LOCAL CANDIDATE; G-ARE-L0 promotion pending`.
4. Add a dated evidence note linking the terminal SWU receipt and stating its
   exact ceiling: one finite deterministic semantic relation, two rule
   families, typed counterfactuals, byte-identical replay, persisted order and a
   test-only idempotent effect boundary.
5. Replace the non-goal that says no evaluator implementation exists with:
   - no general actor runtime, real effect adapter, promoted engine contract or
     executable ACI binding exists.
6. Add an open integration decision:
   - the whole-engine design must not assign `RuntimeJournal`, artifact bytes,
     canonical receipt identity, Work Bus publication or provenance lineage
     until `BLK-ARE-ACI-BINDING-001` is decided.

Signals: `RS-ARE-ALIGN-001`, `002`, `003`, `006`, `007`, `009`.

### `design/ARCHITECTURE.md`

Apply these changes:

1. Frontmatter:
   - `status: unwitnessed-candidate-design`
   - becomes
   - `status: candidate-design-with-bounded-l0-witness`
2. Update the opening paragraph so evaluator@1 is witnessed locally while the
   whole-engine architecture and all higher layers remain candidates.
3. Add the terminal L0 receipt to source evidence.
4. Add a clearly separated **external candidate alignment sources** section:
   - ACI ADR-001: accepted W0 decision scope, runtime blocked;
   - Bus Contracts: draft and no post-remediation PASS;
   - ACP: discovery;
   - APT: observational and mutation-blocked.
5. Add a View 2/6 boundary note:
   - evaluator semantics remain reasoning-engine-owned;
   - integrated actor/journal/effect-intent physical authority is unresolved;
   - artifact bytes and journal-owned lifecycle facts must remain distinct;
   - no external candidate source is binding until its owner receipt and the
     local binding decision both pass.
6. Add `ARE-DES-008`: require `ACI-REASONING-BINDING` before mutation of
   SWU-ARE-002/003/006.

Signals: `RS-ARE-ALIGN-001` through `007`.

## 2. Invoke-owned plan delta

### `planning/WORK-PACK.md`

Apply these changes:

1. Preserve:
   - `status: l0-witness-complete-awaiting-explicit-promotion`;
   - `selected_swu: none`;
   - `implementation_authorized: false`;
   - the immediate next move, `G-ARE-L0` promotion.
2. Add blocker:

   | ID | Type | Owner | Closure |
   |---|---|---|---|
   | `BLK-ARE-ACI-BINDING-001` | L1/L2 design blocker; does not block G-ARE-L0 | reasoning-engine and ACI architecture owners | Approved `ACI-REASONING-BINDING` mapping journal, artifact, canonical identity, Work Bus, effect-intent and provenance responsibilities, while preserving non-binding status for immature external contracts. |

3. Add deferred external maturity gap:

   | `BLK-ARE-ACI-MATURITY-001` | external target-lifecycle dependency | ACI / Bus / APT lifecycle owners | Required external receipts or an explicit local-witness-only disposition before executable integration. |

4. Amend G-ARE-L1 entry:
   - actor-protocol mutation requires a terminal disposition of
     `BLK-ARE-ACI-BINDING-001`;
   - a local-only witness path must state that it is non-integrated and cannot
     satisfy packaging or ACI-compatibility claims.
5. Amend G-ARE-L2:
   - artifact-byte durability cannot claim journal lifecycle ownership;
   - compatibility requires conformance evidence against the accepted binding,
     not structural similarity.
6. Add the future Invoke design route after G-ARE-L0 promotion:
   `ACI-REASONING-BINDING`.

Signals: `RS-ARE-ALIGN-003` through `007`.

### `planning/work-pack/tasks/TASK-ARE-PROTOCOL-001.md`

Before SWU-ARE-002, add:

- its current journal package path and storage algorithm are provisional;
- no implementation may create a second integrated runtime-journal authority;
- `ACI-REASONING-BINDING` must choose one of:
  1. an ACI-subordinate adapter/conformance path;
  2. an explicitly local-only protocol witness with a later integration gate;
  3. a rejected/incompatible path with reroute.
- SWU-ARE-003 must preserve Work Bus/APT candidate mappings as optional
  interfaces, never import draft schemas as authority.

Do not mark either SWU ready or selected.

Signals: `RS-ARE-ALIGN-004`, `006`, `007`.

### `planning/work-pack/tasks/TASK-ARE-GOVERNANCE-001.md`

Before SWU-ARE-006, add:

- local artifact bytes may remain content-addressed candidate evidence;
- integrated command receipts, event order, effect intents and workflow
  lifecycle cannot be silently duplicated in an artifact index;
- recovery/quarantine handles must map to the eventual journal authority;
- current `AtomicFileRecordStore` evidence is L0 source evidence, not proof of
  ACI durability or compatibility.

Do not change SWU status.

Signals: `RS-ARE-ALIGN-005`, `007`.

### `planning/work-pack/waves/W1-L1.md`

Add an entry condition:

> Before any actor-journal or observation-transport mutation, the
> `ACI-REASONING-BINDING` contract must disposition
> `BLK-ARE-ACI-BINDING-001`. A local-only witness disposition may proceed only
> with explicit non-integration wording and cannot satisfy packaging or ACI
> compatibility.

Signals: `RS-ARE-ALIGN-004`, `006`, `007`.

## 3. Craft lifecycle handoff

Do not hand-edit `.craft/index.json` or `CRAFT.md`.

The Craft owner should:

1. Add `BLK-ARE-ACI-BINDING-001` as an active target-lifecycle/design blocker
   on L1/L2 work, not on G-ARE-L0 promotion.
2. Add evidence handles for:
   - orchestrator `origin/master@6e5936b`;
   - ACI ADR-001;
   - ACI Work Pack;
   - the Bus integration assessment;
   - APT Work Pack.
3. Preserve:
   - `GAP-ARE-SEMANTIC-WITNESS` closed;
   - G-ARE-L0 evidence pass and promotion pending;
   - no selected downstream SWU;
   - all existing downstream gaps.
4. Add the post-promotion next-route branch:
   `invoke:design ACI-REASONING-BINDING`.
5. Regenerate `.craft/index.json` and `CRAFT.md` from the updated ledger.

Signals: `RS-ARE-ALIGN-003` through `008`.

## 4. Inventory lifecycle handoff

Inventory owns these changes:

1. Update
   `.arcanum/inventory/entries/agent-reasoning-engine-contract-strategy-result-synthesis.md`
   with a dated current-state addendum:
   - the original research conclusion was historically correct;
   - SWU-ARE-001 now supplies a bounded local witness;
   - whole-engine promotion and higher-layer runtime remain absent.
2. Update
   `.arcanum/inventory/entries/cyberalchemy-orchestrator-reasoning-engine-purpose-strategy-result-synthesis.md`
   with a dated current-state addendum:
   - preserve the frozen `ca560b8` acceptance result;
   - record remote advance `6e5936b`;
   - distinguish new ACI W0 decisions and candidate surfaces from runtime
     implementation.
3. Update entry summaries/residue without deleting historical provenance.
4. Regenerate `index.md`, `index.json`, tags if required, and `log.md`.
5. Run `scripts/validate-index-json.sh`; uncontrolled tag warnings may remain
   warnings but lookup readiness must pass.

Signals: `RS-ARE-ALIGN-001`, `003`, `006`, `007`, `008`.

## 5. Apply validation contract

An `apply-approved` run must block unless all checks pass:

1. Explicit apply authorization identifies this exact proposal.
2. The staged material package and receipt satisfy Invoke Refresh apply gates.
3. L0 receipt result remains pass and its source digest matches.
4. External source files and Git SHAs match the context pack or the proposal is
   regenerated.
5. `implementation_authorized` remains false and no downstream SWU becomes
   selected, ready or executing.
6. G-ARE-L0 remains the immediate promotion route.
7. No file under `implementation/agent-reasoning-engine/` changes.
8. Craft changes are applied through Craft and projections are regenerated.
9. Inventory changes are applied through Inventory and the machine-index
   validator passes.
10. Links, JSON, Markdown whitespace and owner-boundary checks pass.
11. Separate Invoke, Craft and Inventory receipts—or a joined receipt retaining
    all three owners—are emitted.

## 6. Explicit non-changes

- No evaluator source, fixtures or generated run mutation.
- No actor-protocol, ACI adapter, journal or artifact-store code.
- No `implementation_authorized: true`.
- No G-ARE-L0 promotion decision.
- No ACI, Bus, ACP or APT status promotion.
- No public Arcanum or canonical definition mutation.
- No general reasoning-engine, real-effect or anti-bias efficacy claim.

