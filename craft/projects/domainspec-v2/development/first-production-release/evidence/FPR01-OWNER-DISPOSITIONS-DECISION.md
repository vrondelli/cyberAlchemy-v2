---
decision_id: DEC-FPR01-OWNER-DISPOSITIONS
task_id: SWU-FPR01-002
status: accepted
created_on: 2026-07-16
resolved_queues: [OD-001, OD-002, OD-003, OD-004, OD-005]
remaining_queues: []
production_authorized: false
---

# FPR-01 Owner Dispositions Decision Gate

This is the incremental Decision Gate record for `SWU-FPR01-002`. It records
explicit owner choices without changing canonical definitions, source files,
runtime behavior, production authority, or FPR completion state. All five
owner queues are resolved, and the accompanying machine disposition packet
passes the `SWU-FPR01-002` acceptance checks.

## Controlling Inputs

- `authority-census.json`, census `FPR01-CENSUS-2026-07-14`
- `TASK-FPR-01-AUTHORITY-BASELINE.md`, contract `SWU-FPR01-002`
- `definitions/meta-types/meta-types.yml`
- `definitions/DEFINITIONS.md` and `definitions/DEFINITIONS-INDEX.md`
- `development/saga-removal/WORK-PACK.md`
- `development/ui-meta-type-formalization/adjudication/verdicts.yml`
- `development/ui-meta-type-repair/WORK-PACK.md`
- `development/ui-meta-type-repair/evidence/results/dossier-policy/generation-001/evaluation.json`
- `development/ui-meta-type-repair/audit/integrated-001/result.json`
- `definitions/relationships/relationships.yml` and `relationships.md`
- `definitions/DEFINITION-DRIFT-AUDIT.md`
- `development/saga-removal/runs/SWU-SGRM-008/TASK-SESSION-RESULT.md`
- `impl/spec/minted-project/contract-manifest.json` and `INDEX.md`
- `impl/tools/minted-project/templates/project/README.md.template`
- `impl/test-derivation-engine/__fixtures__/minted-project/contract/positive/key-and-door/`
- `development/refinement-runs/20260714-minted-project-node-package-toy-game/task-sessions/20260715-swu-mnp-001-r2/TASK-SESSION-RESULT.md`
- `development/refinement-runs/20260714-minted-project-node-package-toy-game/task-sessions/20260715-swu-mnp-005-retry-001/TASK-SESSION-RESULT.md`
- `.craft/ledger.yml`, decision `DEC-DSV2-SPEC-HOMING`
- `development/reformulate-batch1/DESIGN.md`, spec-homing invariant
- `impl/spec/TAXONOMY.md`
- `definitions/meta-types/meta-types.yml` and `meta-types.md`
- `IMPORT-MANIFEST.md`
- `.craft/ledger.yml`, root-definition consolidation records

## OD-001 — Backend Count, Staged Labels, And Maturity

### Question

Which backend member count, staged-label count, and maturity vocabulary form
the first-release baseline?

### Options Considered

1. Thirteen backend candidates plus eleven formation-deferred UI labels.
   This follows the current machine registry literally but understates the
   completed UI candidate-formation work and the continuation model's backend
   activation state.
2. Thirteen active backend types plus a uniformly candidate UI catalog.
   This reflects the operator's initial direction but collapses nine
   candidate-schema-ready results, one merge-candidate, and one split-candidate
   into one maturity state.
3. Restore `DS-D1.10 Saga`, returning to fourteen backend types and twenty-five
   total labels. This contradicts the completed Saga-removal receipts and would
   reopen that owner route.
4. Preserve all eleven UI labels as uniformly formation-deferred. This is safe
   but discards the distinctions established by the completed UIF/UIR evidence
   programs.
5. Select the evidence-sensitive disposition below: thirteen active backend
   types, nine UI candidates, one merge-candidate, and one split-candidate.

### Selected Disposition

Option 5 was selected by the user on 2026-07-16 after reviewing the completed
UI formation, replication, repair, dossier, and integrated-audit evidence.

The selected release-baseline vocabulary is:

| Scope | IDs | Selected maturity/disposition | Effective condition |
| --- | --- | --- | --- |
| Backend | `DS-D1.1..9`, `DS-D1.11..14` | thirteen `active` backend types | represented in the FPR-01 baseline; current candidate wording is `repair-required` |
| Removed stable ID | `DS-D1.10 Saga` | `superseded` from the active vocabulary; historical evidence retained | completed Saga-removal receipts remain valid; the ID is never renumbered or reused |
| UI candidate set | `DS-D1.15..23` | nine `candidate` UI types; not active or promotion-ready | retain per-candidate limitations and route missing portability/separating evidence to empirical review and DS-D1 owners |
| Adapter | `DS-D1.24` | `deferred`, subtype `merge-candidate` toward backend `Mapping` | definitions owner must decide the merge; no distinct active UI type is implied |
| State Indicator | `DS-D1.25` | `deferred`, subtype `split-candidate` | research/DS-D1 owners must resolve the domain-state and async-UI-state branches |

The staged label count is therefore **24**: thirteen active backend IDs plus
eleven retained UI labels. The stable `DS-D1.10` gap is preserved, so the
system must not present these as a contiguous `DS-D1.1..25` set or as twenty-five
current types.

### Reasoning And Evidence Boundary

- The Saga-removal route proves that `DS-D1.10` is absent without renumbering
  later IDs, leaving thirteen backend members.
- The current continuation model describes those thirteen backend types as
  active, while machine and definition surfaces still contain candidate and
  fourteen/twenty-five wording. Those source claims are `repair-required`; this
  decision does not silently edit them.
- The UI formalization adjudication records nine `candidate-schema-ready`
  results, one Adapter `merge-candidate`, and one State Indicator
  `split-candidate`.
- The completed repair package mechanically passes, but its dossier remains
  `DEFER`: all nine evaluated candidates are below the fixed portability
  threshold, and independent-positive/separating evidence remains incomplete.
- Consequently, `candidate` here is an explicit non-active maturity state. It
  does not mean replicated, authoritative, production-ready, or promoted.

### Disagreement Dispositions

| Disagreement | Resolution |
| --- | --- |
| `FPR01-D001` backend admission count `13/14` | resolve to thirteen active backend members; fourteen-count prose is `repair-required`; Saga remains superseded |
| `FPR01-D002` staged label count `24/25` | resolve to twenty-four stable staged labels; twenty-five-count/contiguous-range prose is `repair-required` |
| `FPR01-D003` maturity vocabulary | use `active` for the thirteen backend types; `candidate` for `DS-D1.15..23`; `deferred/merge-candidate` for Adapter; `deferred/split-candidate` for State Indicator |

### Downstream Impact

- `SWU-FPR01-003` must encode and validate these distinct maturity states
  without treating the UI set as active.
- Definitions Governance must reconcile the canonical summary, index, machine
  registry, human cards, and narrative projections after the total FPR-01
  disposition packet is accepted through its owner route.
- FPR-02 must separately decide which active/candidate/deferred types enter the
  supported profile. This decision does not admit UI candidates into that
  profile automatically.
- UI empirical evidence may refine candidate limitations, but it cannot mutate
  this release baseline without reopening the FPR-01 owner route.

## OD-002 — Relationship Count And Composability Context

### Question

Which relationship-signature count and composability context form the
first-release baseline, and how are stale definition, audit, and learning-view
claims treated?

### Options Considered

1. Select the root relationship registry's thirty active signatures and mark
   every thirty-one-signature consumer `repair-required`.
2. Restore or replace a thirty-first active signature. This would reopen the
   completed Saga/Workflow relationship migration and require new endpoint,
   fixture, non-collapse, and owner review.
3. Defer the relationship baseline and preserve both counts as unresolved.
   This would block the baseline validator and every downstream graph task.

### Selected Disposition

Option 1 was selected by the user on 2026-07-16.

The first-release relationship baseline is the active root registry at
`definitions/relationships/relationships.yml`:

- authority home: `definitions/relationships`;
- registry status: `active`;
- declared signature count: 30;
- record count: 30;
- active record count: 30; and
- category wording: `typed composable graph fragment`.

The composability claim remains deliberately bounded. It means a finite graph
whose edges use the thirty active DS-D8 signatures and their declared endpoint,
scope, multiplicity, validation, and composition obligations. It does not claim
general category identity, closure, associativity, path equations, or
functorial preservation.

### Source Dispositions

| Source/claim | Disposition | Reason/effective condition |
| --- | --- | --- |
| `definitions/relationships/relationships.yml` | `authoritative` | machine root contains exactly thirty declared, unique, active signature records |
| `definitions/relationships/relationships.md` | `generated-projection` | human companion must agree with the machine root and currently reports thirty |
| `DEFINITIONS.md` DS-D8 thirty-signature context | `authoritative` explanatory reference | agrees with the root machine authority |
| `DEFINITIONS.md` definitions carrying thirty-one-signature context | `repair-required` | stale after Saga removal; must be reconciled to the root authority |
| `DEFINITION-DRIFT-AUDIT.md` pass rows carrying thirty-one | `repair-required` | a pass verdict cannot remain valid while disagreeing with the root machine/human registry |
| `impl/spec/meta-types/LEARNING-ORDER.md` thirty-one count | `repair-required` generated/candidate projection | learning order cannot redefine DS-D8 authority |
| completed Saga-removal evidence | `historical` execution evidence | explains the 31-to-30 transition and remains immutable |

No thirty-first relationship is admitted implicitly. Any future signature must
follow the normal relationship proposal, non-collapse, endpoint, fixture,
definitions, and owner-promotion route.

### Disagreement Dispositions

| Disagreement | Resolution |
| --- | --- |
| `FPR01-D004` relationship signature count `30/31` | resolve to thirty active root signatures; all thirty-one consumers are `repair-required` |
| `FPR01-D005` internal definition inconsistency | DS-D8/root thirty wins; stale domainspec-v2 definition-card counts require repair |
| `FPR01-D006` drift-audit verdict | the thirty-one-based pass claim is stale and `repair-required`; it cannot serve as current pass evidence |
| `FPR01-D012` composability signature context | resolve to a finite typed composable graph fragment over the thirty active root signatures |

### Downstream Impact

- `SWU-FPR01-003` must derive the count from the root registry rather than
  trusting prose.
- Its stale-count negative fixture must reject thirty-one and any mismatch
  between the declared count, record count, active count, and unique IDs.
- Definitions, audit, and learning-view repairs remain downstream owner work;
  this decision record does not mutate them.
- The selected composability phrase does not open the separate category-law
  formalization route.

## OD-003 — Authoritative Feature-Pack Input Home

### Question

Which feature-pack home defines the compiled input graph for local validation
and derivation?

### Options Considered

1. Use the minted consumer project's machine source package: `project.json`
   binds feature manifests below `specs/`; each feature manifest binds one
   canonical JSON file per node; generated graph, provenance, Markdown, and
   receipts remain non-authoritative outputs.
2. Treat authored `docs/features/<feature>/` Markdown as canonical and derive
   machine inputs from it. This reverses the implemented machine-first contract
   and makes a human view responsible for executable graph semantics.
3. Put consumer feature authority below DomainSpec's package-relative
   `impl/spec/` tree. This mixes reusable language/engine authority with the
   concrete domain meaning owned by independently minted projects.
4. Preserve all observed homes as co-authoritative. This leaves compilation
   order and conflict resolution ambiguous and cannot support a fail-closed
   local validator.

### Selected Disposition

Option 1 was selected by the user on 2026-07-16.

For a minted consumer project, the authoritative compiled input is the
project-owned machine source package:

```text
<consumer-project>/
├── project.json
└── specs/
    └── <feature>/
        ├── feature.json
        └── nodes/
            └── <node>.json
```

- `project.json` is the canonical project manifest. Its `features` array binds
  the authoritative feature-manifest paths and its `generated_root` keeps
  outputs separate from sources.
- `specs/<feature>/feature.json` is the canonical feature manifest. Its
  `node_sources` array binds the canonical per-node files.
- `specs/<feature>/nodes/<node>.json` is the canonical node source. Under the
  selected `per-node-connections` layout, the source node owns each outgoing
  connection's `edge_id`, `type`, and `to`; normalization supplies `from` from
  the containing node.
- Concrete domain meaning belongs to the minted consumer project's source
  records. DomainSpec's `impl/spec/minted-project/` owns the reusable record
  schemas and profile contract, not the consumer project's feature semantics.
- Compiled graph, source manifest, Markdown, and build receipt are generated
  semantic, provenance, human, and verification read models. They are never
  repaired by hand and never become competing authority.

### Source Dispositions

| Observed home or surface | Disposition | Reason/effective condition |
| --- | --- | --- |
| consumer `project.json` plus `specs/<feature>/feature.json` and `nodes/*.json` | `authoritative` | machine source set compiled by the minted-project contract; every path must remain within the consumer root |
| consumer configured generated root, such as `.domainspec/generated/` | `generated-projection` | contains derived graph, provenance, Markdown, and verification evidence only |
| legacy `docs/features/<feature>/` | `historical` / migration input | may be imported through an explicit migration but is not authority for newly minted projects |
| DomainSpec `impl/spec/minted-project/` | `authoritative-contract` | owns schemas and profile bindings, not concrete consumer domain meaning |
| DomainSpec `impl/spec/features/` and test fixtures | `internal-fixture` | dogfood/conformance inputs for the engine; not the destination for external business features |
| package-relative `spec/features` prose that implies consumer authority | `repair-required` | must distinguish internal engine fixtures from the minted consumer source package |

### Disagreement Dispositions

| Disagreement | Resolution |
| --- | --- |
| `FPR01-D007` feature-pack authority home | resolve to the minted consumer project's `project.json` plus machine source files below `specs/<feature>/`; legacy Markdown packs are non-authoritative migration inputs |
| `FPR01-D008` compiled graph input home | resolve to the contained source set transitively bound by `project.json`, feature manifests, and node-source paths; compiled graph and other views are generated outputs |

### Downstream Impact

- `SWU-FPR01-003` must validate source containment, manifest closure, unique node
  and edge IDs, profile/registry bindings, and generated-output non-authority.
- A future compatibility route may import a legacy `docs/features/` pack, but
  must emit and validate the machine source package before it becomes current
  project authority.
- The learning website and implementer agent should traverse the generated
  semantic graph while resolving every node and edge back to its authoritative
  consumer source file through the generated provenance manifest.
- This disposition does not move consumer features into the DomainSpec
  repository and does not promote the experimental minted-project profile.

## OD-004 — Transitional Taxonomy Projection

### Question

What final disposition applies to the transitional taxonomy projection at
`impl/spec/TAXONOMY.md`?

### Options Considered

1. Delete the projection after its remaining vocabulary and consumers are
   migrated to root authority. This follows the closed spec-homing invariant
   and avoids a second generated catalog that duplicates the root human view.
2. Replace it with a generated, CI-verified projection after the same migration.
   This preserves the legacy path for readers but adds generator and validation
   maintenance.
3. Keep the current hand-authored projection. This conflicts with
   `DEC-DSV2-SPEC-HOMING` and retains an independent drift surface.
4. Defer the disposition. This preserves the current blocker and prevents the
   first-release authority baseline from closing.

### Selected Disposition

Option 1 was selected by the user on 2026-07-16.

`impl/spec/TAXONOMY.md` receives the disposition
`retire-after-migration`. It remains a transitional, non-authoritative source
until every effective condition below passes; it is then deleted rather than
generated.

Root `definitions/` remains the sole authored semantic authority. In
particular, `definitions/meta-types/meta-types.yml` is the machine authority,
and its synchronized human companion and definition/index surfaces provide the
reader-facing explanation. The learning application consumes the machine
registry and generated semantic graph, not the legacy taxonomy document.

### Effective Conditions

Deletion is authorized only after a bounded Definitions Governance task proves
all of the following:

1. the root machine authority encodes the OD-001 baseline: thirteen active
   backend types, nine UI candidates, Adapter as a deferred merge-candidate,
   State Indicator as a deferred split-candidate, and the superseded
   `DS-D1.10 Saga` gap without ID reuse;
2. the root human companion and definition index agree with that machine
   authority and preserve the required formal, plain-language, and DomainSpec
   context voices;
3. useful descriptive meaning unique to `TAXONOMY.md` is either migrated to the
   owner definition cards or explicitly retired as obsolete guidance;
4. references in `definitions/DEFINITIONS.md`,
   `definitions/meta-types/meta-types.md`,
   `impl/spec/meta-types/LEARNING-ORDER.md`, and the
   `agent-execution-orchestrator` fixture are repointed or removed; and
5. repository validation and a bounded absence check prove no runtime,
   validator, fixture, learning view, or documentation consumer still depends
   on `impl/spec/TAXONOMY.md`.

Until those conditions pass, deletion is not authorized and the projection
must not be treated as current authority. Its stale backend maturity, uniform
UI formation-deferred status, and authored documentation-path guidance are
`repair-required` rather than baseline claims.

### Source Dispositions

| Source or projection | Disposition | Reason/effective condition |
| --- | --- | --- |
| `definitions/meta-types/meta-types.yml` | `authoritative-repair-required` | canonical machine home; must be synchronized to OD-001 before taxonomy deletion |
| `definitions/meta-types/meta-types.md` and indexed definition surfaces | `authoritative-companion-repair-required` | reader-facing root surfaces must agree with the machine authority and retain the required definition voices |
| `impl/spec/TAXONOMY.md` | `retire-after-migration` | transitional non-authority; delete only after all five effective conditions pass |
| remaining taxonomy references | `repair-required` | repoint to root authority or remove when the reference is historical noise |
| future learning or website views | `generated-projection` | derive from machine authority/semantic graph; never restore the legacy document as authored authority |

### Disagreement Disposition

| Disagreement | Resolution |
| --- | --- |
| `FPR01-D009` taxonomy projection state | resolve to conditional deletion: migrate and synchronize root authority, repair every consumer, validate bounded absence, then delete `impl/spec/TAXONOMY.md`; do not replace it with another projection at that path |

### Downstream Impact

- The deletion itself belongs to a bounded Definitions Governance/Task Session;
  this Decision Gate does not mutate the projection or canonical definitions.
- `SWU-FPR01-003` must reject the current taxonomy as an authority source and
  validate the reconciled root machine registry instead.
- Generated graph and learning views may preserve useful navigation and
  explanatory structure without recreating a competing authored taxonomy.
- If migration reveals unique load-bearing semantics that cannot be homed in
  the canonical definition surfaces, the deletion task must stop and reopen
  this owner route rather than discard them.

## OD-005 — Import Destination And Build-Proof Repair

### Question

Should the import manifest's absent vocabulary destination and missing
build-proof reference be repaired, removed, or superseded?

### Options Considered

1. Repair the active manifest: correct the vocabulary destination to root
   authority, explicitly record that the original import-era result was not
   retained, and add a new dated verification receipt that proves only the
   current checkout.
2. Preserve the stale assertions as historical claims and add a supersession
   notice. This retains provenance but leaves the active ledger less direct.
3. Remove both assertions. This removes the contradiction but discards useful
   migration intent and failure history.

### Selected Disposition

Option 1 was selected by the user on 2026-07-16.

`IMPORT-MANIFEST.md` is an active migration ledger and receives the disposition
`repair-required`; it is not immutable evidence and is not removed. The repair
must preserve the historical distinction between what was claimed during the
fork and what can be proven from the current checkout.

The absent `impl/spec/DEFINITIONS.md` destination is superseded as a planned
home and must not be recreated. The canonical vocabulary destination is root
`definitions/`, including `DEFINITIONS.md`, `DEFINITIONS-INDEX.md`, the
`meta-types/` registry and companion, and the `relationships/` registry and
companion under their respective owners.

The phrase `build-proof: see RESULT below` is `repair-required` because no
`RESULT` section exists. The repair must state that the original import-era
result is unavailable rather than fabricating it. A new dated verification
receipt may prove the current checkout, but must explicitly say that it is not
retroactive proof of the original fork.

### Effective Conditions

The import-migration owner must complete all of the following in a bounded Task
Session:

1. replace every live `impl/spec/DEFINITIONS.md` destination claim with the
   correct root authority surfaces and record that the old planned destination
   was superseded before creation;
2. replace the dangling `RESULT` reference with an explicit missing-historical-
   proof statement;
3. generate a new dated verification receipt containing the tested commit,
   commands, tool versions, exit results, and relevant input/output digests;
4. label that receipt `current-state-verification`, not import-era proof; and
5. keep the v1 freeze gate closed until its independent reformulation and
   current-build conditions actually pass.

### Source Dispositions

| Source or claim | Disposition | Reason/effective condition |
| --- | --- | --- |
| root `definitions/` authority surfaces | `authoritative` | selected vocabulary home; individual stale counts and maturity claims still follow OD-001/OD-002 repairs |
| planned `impl/spec/DEFINITIONS.md` destination | `superseded` | replaced by root authority before the planned projection was created; path remains absent |
| `IMPORT-MANIFEST.md` destination statement | `repair-required` | active ledger must point to the actual root authority surfaces |
| `build-proof: see RESULT below` | `repair-required` | dangling proof reference; original result is unavailable |
| original import-era build claim | `historical` | may be retained only as an explicitly unverified historical claim |
| future dated current-checkout receipt | `deferred` | becomes verification evidence only after the bounded repair task executes and validates it |

### Disagreement Dispositions

| Disagreement | Resolution |
| --- | --- |
| `FPR01-D010` domain vocabulary destination | repair the active manifest to name root `definitions/`; treat the absent `impl/spec/DEFINITIONS.md` plan as superseded and do not recreate it |
| `FPR01-D011` import build proof | repair the dangling reference, record the historical proof as unavailable, and require a new non-retroactive current-state verification receipt |

### Downstream Impact

- `SWU-FPR01-003` must treat root definitions as the authority home and reject
  `impl/spec/DEFINITIONS.md` as a stale path.
- The separate import-manifest repair must not claim the FPR-01 owner
  disposition packet, baseline, or later ratification receipt as proof that the
  original import build passed.
- No v1 freeze, production authorization, or migration completion follows from
  this decision.

## Owner Review Trace

The manual Decision Gate is the review surface required by
`SWU-FPR01-002`. Each choice below was supplied explicitly by the repository
owner in this session; this is an owner-review trace, not a cryptographic
signature or production ratification.

| Queue | Required owner route | Review result |
| --- | --- | --- |
| `OD-001` | definitions, validation, and layering governance | approved through explicit user selection |
| `OD-002` | definitions, layering, validation, and drift-review routes | approved through explicit user selection |
| `OD-003` | spec-homing owner route with validation governance | approved through explicit user selection |
| `OD-004` | definitions and layering governance | approved through explicit user selection |
| `OD-005` | import-migration owner with definitions governance | approved through explicit user selection |

## Remaining Blockers

None within `SWU-FPR01-002`.

## Gate Result

- Result: `PASS`
- Decisions resolved: 5 of 5
- Blockers remaining: 0
- Final `authority-source-dispositions.json`: emitted with exactly one allowed
  disposition for each census disagreement `FPR01-D001` through `FPR01-D012`.
- Direction dependency: deferred to FPR-03; no implementation direction was
  silently selected by this task.
- Handoff: approved dispositions only to `SWU-FPR01-003`.
- Production authorization: false
