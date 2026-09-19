# DomainSpec v2 completion DAG

Status: **planning candidate**. This plan defines 46 tasks, 57 dependency edges and eight milestones. It does not execute implementation, approve a product, register an execution goal or authorize operational effects.

The proposed finish line is five finite products: the Stable 1.0 compiler, a bounded compiler-to-EVF integration, one durable recovery profile, one UI profile and the selected legacy migration. A joined regression and product decision closes the selected program. Publication and live operation have separate finish lines. P00 records this completion contract; each track defines its own finite profile before implementation.

## Read and use the plan

- [TASKS.md](TASKS.md): detailed owners, prerequisites and reasons, deliverables, completion criteria, validation and scope for every node.
- [plan.json](plan.json): machine-readable source of truth and complete dependency graph.
- [sources.json](sources.json): exact planning source snapshots; source records are not fresh product-test receipts.
- [validate.py](validate.py): structural, source-currentness and negative-case checks. Run `python3 -B projects/domainspec-v2/development/completion-dag/v1/validate.py --self-test` from the repository root.

## Current frontier and what to reuse

| Track | Existing basis | Remaining work proposed here |
|---|---|---|
| Compiler | Stable 1.0 compiler, release-candidate tooling and tests already exist | Select current source; run full checks and qualification; build and independently verify exact bundle; review and product decision |
| Evidence | EVF v3 has recorded test, review, product approval and bounded adoption evidence | Reconcile that evidence, then implement only the missing finite compiler/conformance integration |
| Recovery | Durable recovery architecture and in-process planning exist | Determine code delta; build atomic store, Operation ledger, fencing, retries and restart; test crashes and races |
| UI | Candidate UI profile/types and development work exist | Reconcile actual implementation; select finite framework/profile; resolve Adapter and State Indicator disposition; build missing scope and test |
| Migration | Legacy import manifest and consumer paths exist | Reconcile stale rows; retain, adapt or explicitly exclude requirements; verify selected consumers and parity |

These are source-based planning findings. Existing tests were not rerun to produce this plan. Every reconciliation node may reuse current evidence or remove duplicate implementation work after checking its exact scope. Historical Body War first-production tasks are not assumed to be Stable compiler requirements.

The portable EVF kit owner updated its build plan during this audit to record a completed local packaging candidate. O06 now verifies and reuses that handoff. Its archive and test receipts were not independently checked here. Distribution and additional platforms remain operational residue.

## Product dependency overview

This is an overview; the complete graph below includes every edge.

```mermaid
flowchart LR
  C[Compiler baseline] --> CT[Verify and qualify] --> CB[Immutable bundle and review] --> CA[Compiler product approval]
  E[EVF evidence reconciliation] --> ED[Bounded integration model] --> EI[Adapter implementation] --> ET[Integration tests] --> EA[Integration product approval]
  CT --> ET
  R[Recovery baseline and profile] --> RM[System model] --> RS[Atomic store]
  RM --> RL[Operation replay ledger]
  RS --> RW[Fenced worker]
  RL --> RW
  RW --> RR[Retry and restart] --> RT[Failure campaign] --> RA[Recovery product approval]
  U[UI baseline and finite profile] --> UI[Model and implementation] --> UT[UI tests] --> UA[UI product approval]
  L[Legacy inventory and dispositions] --> LI[Migration candidates] --> LT[Closure tests] --> LA[Migration product approval]
  P[Finite program completion contract] --> J[Joined regression]
  CA --> J
  EA --> J
  RA --> J
  UA --> J
  LA --> J
  J --> A[Final product review and approval]
```

## Priority and first runnable work

Start with **P00 and C00**: bound the finish line and select the exact compiler candidate. E00, R00, U00 and L00 are also dependency-ready read-only reconciliation work. Named actors, exact selected source bytes and later mutation allowlists still need resolution; the plan does not assign people or launch parallel agents.

1. **Compiler closure first:** C00 → O00 → C01 and C02 → C03 → C04 → C05. Full verification and recipe qualification share a source/toolchain prerequisite and can be scheduled independently. Broader UI, recovery, migration or distribution work does not gate this milestone.
2. **Evidence integration:** E00 → E01 → E02 → E03 → E04 → E05. E04 also needs C01 for a compatible tested compiler baseline. Reuse EVF v3 instead of recreating it.
3. **Recovery:** R00 → R01 → R02 → R03 and R04 → R05 → R06 → R07 → R08. The store and Operation ledger can be developed independently after contracts are fixed; both are needed by the fenced worker.
4. **UI:** U00 → U01 → U02 → U03 → U04 → U05. A finite profile decision precedes implementation, and tests precede approval.
5. **Migration:** L00 → L01 → L02 → L03 → L04. Retirement proposals do not authorize deletion.
6. **Program join:** P01 consumes the five approved products and P00; P02 follows integrated regression and independent review. Shared contract changes reopen affected candidate epochs.

No duration-based critical path or delivery date is claimed. Estimate effort after baseline reconciliation reveals what can be reused. Independent DAG branches may still share files; use one owner per overlapping write scope or isolated checkouts.

## Construction sequence and evidence

For each materially revised capability, its profile-definition node records prototype definitions, agent-facing product/business ontology scaffolds and finite product meaning. The system-design node records DomainSpec, compiled-system and implementation prototypes; implementation produces one exact testable candidate; test nodes produce current evidence; a separate product decision follows. Compiler work reuses existing prototypes only after C00 checks their currentness. Migration must add or revise its scoped prototypes in L01/L02 when changing an implementation-bearing adapter.

A task closes against exact input/output manifests and observed checks, with independent review before product approval. A dependency cannot be discharged solely by a status field. Failures are `BLOCK`; causally unavailable checks are `not_evaluable`. Continue independent ready branches. Repair creates a successor task/candidate epoch instead of introducing a retry cycle into the accepted DAG. Changed shared contracts invalidate affected downstream evidence, including prior approval bindings.

The Python ontology runtime is not an admission gate during its suspension. Each task resolves only its selected ontology records, selectors and source bytes; unrelated ontology drift cannot block it.

## Operational support and causal blockers

| Nodes | Owner role | Affected stage | Relationship to construction |
|---|---|---|---|
| O00 | Repository/toolchain owner | Compiler product testing | Exact isolated source/toolchain prerequisite for C01 and C02; the only operational-to-product edges |
| O01–O03 | Repository/release owner | Hosted compiler evidence | Read existing evidence first; triggering remote work or publishing source needs O02's exact envelope after product approval |
| O04–O05 | Release owner | Compiler release | Separate release decision and execution after product approval and hosted evidence |
| O06 | Existing portable EVF kit owner | EVF distribution | Verify completed local candidate handoff; licensing, platforms and delivery are separate residue |
| O07 | Project maintenance owner | No product stage | Reconcile stale CRAFT, architecture/import and continuation views; cannot block prototypes |
| O08 | Deployment/operator and ORODI owners | Deployment preparation | Offline operational candidate and runbooks; identify exact ORODI prerequisites for selected scope |
| O09–O10 | Deployment/operator owner | Deployment and live operation | Separate authority decision and bounded execution after final product approval |

Exact current tool absence can block its dependent check. Unrelated packaging, bookkeeping, publication and deployment waits cannot block runnable product construction. An unavailable required live namespace stays a blocker for that live test; no isolation bypass is planned.

## Milestones

- **M-COMPILER** — Tested and approved Stable 1.0 compiler product; terminal: C05; lane: `product_construction`.
- **M-EVIDENCE** — Bounded compiler-to-EVF integration approved; terminal: E05; lane: `product_construction`.
- **M-RECOVERY** — Selected durable recovery product approved; terminal: R08; lane: `product_construction`.
- **M-UI** — Selected UI profile product approved; terminal: U05; lane: `product_construction`.
- **M-MIGRATION** — Selected legacy migration product approved; terminal: L04; lane: `product_construction`.
- **M-PROGRAM** — Joined selected products tested and approved; terminal: P02; lane: `product_construction`.
- **M-RELEASE** — Separately authorized compiler release verified; terminal: O05; lane: `operational_support`.
- **M-LIVE** — Separately authorized bounded live operation verified; terminal: O10; lane: `operational_support`.

## Complete DAG

Arrows mean “requires current evidence from.” Subgraphs are work tracks, not agent assignments. Human decision nodes are diamonds. O06 and O07 are intentionally separate operational terminals.

```mermaid
flowchart TD
  subgraph P_track["Program"]
    P00["P00: Define the finite completion contract"]
    P01["P01: Join the selected products and revalidate shared contracts"]
    P02{"P02: Independent final review and product decision"}
  end
  subgraph C_track["Compiler"]
    C00["C00: Reconcile current compiler candidate and evidence"]
    C01["C01: Run complete compiler verification"]
    C02["C02: Qualify the current deployment recipe without deploying"]
    C03["C03: Prepare and independently verify immutable compiler bundle"]
    C04["C04: Independent review of the exact compiler candidate"]
    C05{"C05: Compiler product approval"}
  end
  subgraph E_track["Evidence integration"]
    E00["E00: Reconcile EVF and conformance evidence"]
    E01["E01: Define one bounded compiler-to-EVF capability"]
    E02["E02: Design and compile the integration model"]
    E03["E03: Implement a bounded compiler/EVF adapter"]
    E04["E04: Test integration end to end"]
    E05{"E05: Review and approve integration candidate"}
  end
  subgraph R_track["Recovery"]
    R00["R00: Reconcile durable recovery architecture and existing code"]
    R01["R01: Define bounded recovery product and failure semantics"]
    R02["R02: Author recovery system prototype and binding contracts"]
    R03["R03: Implement atomic coordination store"]
    R04["R04: Implement Operation replay ledger"]
    R05["R05: Implement fenced durable worker"]
    R06["R06: Implement persisted retries, terminal recording and restart"]
    R07["R07: Run recovery failure campaign"]
    R08{"R08: Review and approve recovery product candidate"}
  end
  subgraph U_track["UI"]
    U00["U00: Reconcile UI types and existing implementation evidence"]
    U01["U01: Define the bounded UI profile"]
    U02["U02: Compile UI source and generation design"]
    U03["U03: Implement the selected UI generator/profile"]
    U04["U04: Verify selected UI product"]
    U05{"U05: Independently review and approve UI candidate"}
  end
  subgraph L_track["Migration"]
    L00["L00: Reconcile legacy import and dual-input inventory"]
    L01["L01: Define retain, adapt or retire scope"]
    L02["L02: Implement and test migration candidates"]
    L03["L03: Verify selected migration closure"]
    L04{"L04: Independently review and approve migration candidate"}
  end
  subgraph O_track["Operational support"]
    O00["O00: Provide isolated compiler verification workspace"]
    O01["O01: Inspect hosted compiler evidence for selected commit"]
    O02{"O02: Decide exact hosted-run or source-publication envelope"}
    O03["O03: Complete hosted compiler evidence"]
    O04{"O04: Decide exact compiler publication/release envelope"}
    O05["O05: Execute and independently verify compiler release"]
    O06["O06: Verify and reuse portable EVF kit owner handoff"]
    O07["O07: Reconcile project status and continuation views"]
    O08["O08: Define operational deployment candidate and runbooks"]
    O09{"O09: Decide exact live pilot/deployment envelope"}
    O10["O10: Run authorized live pilot and operational closeout"]
  end
  C00 --> O00
  O00 --> C01
  O00 --> C02
  C01 --> C03
  C02 --> C03
  C03 --> C04
  C04 --> C05
  E00 --> E01
  E01 --> E02
  E02 --> E03
  E03 --> E04
  C01 --> E04
  E04 --> E05
  R00 --> R01
  R01 --> R02
  R02 --> R03
  R02 --> R04
  R03 --> R05
  R04 --> R05
  R05 --> R06
  R06 --> R07
  R07 --> R08
  U00 --> U01
  U01 --> U02
  U02 --> U03
  U03 --> U04
  U04 --> U05
  L00 --> L01
  L01 --> L02
  L02 --> L03
  L03 --> L04
  P00 --> P01
  C05 --> P01
  E05 --> P01
  R08 --> P01
  U05 --> P01
  L04 --> P01
  P01 --> P02
  C03 --> O01
  C05 --> O02
  O01 --> O02
  O02 --> O03
  C03 --> O03
  C05 --> O04
  O03 --> O04
  O04 --> O05
  E00 --> O06
  C00 --> O07
  E00 --> O07
  R00 --> O07
  U00 --> O07
  L00 --> O07
  R08 --> O08
  E05 --> O08
  P02 --> O09
  O08 --> O09
  O09 --> O10
```

## Unresolved choices and exclusions

- Exact current compiler commit and hosted evidence to be selected at C00/O01.
- Provider/language and fixture scope for the first durable runtime at R01.
- Bounded obligation profile and independent consumer for compiler/EVF at E01.
- UI framework/profile and Adapter/State Indicator dispositions at U01.
- Actual current legacy consumer set and retirement scope at L00/L01.
- Named people/active tasks must be assigned to owner roles before dispatch; portable EVF kit retains its current owner.
- No execution-ready claim is made while exact per-node source selectors/file allowlists remain to be materialized.

- Historical Body War application-release program
- AlchLang integration/lowering
- Universal multi-language semantic parity
- All cloud/provider/framework variants
- Automatic ontology admission or promotion
- Rewriting frozen EVF candidates or historical decisions

A structural PASS validates this planning artifact only. It does not mean any milestone is complete.
