---
dispatch_id: 2026-07-12-r3c-relationship-card-triage
artifact_role: verbatim-explorer-transcript
status: collected
created: 2026-07-12
---

# SWU-R3C-006 Relationship-Card Triage — Explorer Returns

## Agent 1 — Abramsky, Samson

Evidence boundary: v1 is read-only and supplies practical authoring evidence only; current DS-D8 remains authoritative. The manifest explicitly marks v1 as a frozen evidence source and distinguishes import verdict from authority ([IMPORT-MANIFEST.md:11](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/IMPORT-MANIFEST.md:11), [IMPORT-MANIFEST.md:17](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/IMPORT-MANIFEST.md:17)).

| Relationship ID | Exact v1 selector | v1 endpoints | Contract | Minimal example | Distinctive practical authoring utility | Proposed current DS-D8 match | Stale endpoint / semantic issue |
|---|---|---|---|---|---|---|---|
| `performs` | Backend Edges / `performs` row ([library:80](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:80)) | Entity → Operation | Actor/entity triggers an operation | `customer.performCreatePayment(command);` | Shows initiation as an actor-facing call site. | Exact active `performs`, Entity → Operation ([relationships:20](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:20)) | None against current signature; v1’s “actor/entity” wording is broader than its Entity endpoint. |
| `produces` | Backend Edges / `produces` row ([library:81](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:81)) | Operation → Event | Operation emits event after postconditions | `ProcessPayment -> PaymentCompleted` | Locates event production after successful postconditions. | Exact active `produces`, Operation → Event ([relationships:36](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:36)) | None; current semantics sharpen success completion and distinguish it from `emits`. |
| `produces-for` | Backend Edges / `produces-for` row ([library:82](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:82)) | Operation@A → Entity@B | Cross-feature operation updates foreign entity projection | `Billing.GenerateStatement -> Accounting.InvoiceLedger` | Makes foreign-feature projection ownership visible in an implementation slice. | Exact active `produces-for`, Operation → Entity, cross-feature ([relationships:52](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:52)) | None; `@A/@B` is informal v1 scope notation, now formal feature-scope metadata. |
| `triggers-cross` | Backend Edges / `triggers-cross` row ([library:83](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:83)) | Event@A → Operation@B | Event in A activates operation in B | `PaymentCompleted -> Shipping.ScheduleDispatch` | Identifies the subscriber-to-operation cross-feature handoff. | Exact active `triggers-cross`, Event → Operation, cross-feature ([relationships:68](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:68)) | None; `@A/@B` is replaced by explicit scope metadata. |
| `enforces-cross` | Backend Edges / `enforces-cross` row ([library:84](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:84)) | Rule@A → Operation@B | External rule gates operation execution | `Compliance.KycRule -> Accounts.OpenAccount` | Preserves the useful cross-feature gate scenario. | Replacement match `enforces`; same ID is deprecated ([relationships:525](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:525)) | Separate verb is stale. Current `enforces` says cross-feature is metadata, yet its admitted `feature_scope` lists only `same-feature` ([relationships:84](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:84)); this authority inconsistency needs review before admitting the scenario. |
| `enforces` | Backend Edges / `enforces` row ([library:85](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:85)) | Rule → Operation | Rule must pass before mutation | `MaxAmountRule -> ProcessPayment` | Gives a concrete pre-mutation guard placement. | Exact active `enforces`, Rule → Operation ([relationships:84](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:84)) | None for same-feature use. |
| `calculates` | Backend Edges / `calculates` row ([library:86](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:86)) | Calculation → Operation | Operation consumes derived values | `FeeCalculation -> ProcessPayment` | Shows where a pure derived value enters a mutating use case. | Exact active `calculates`, Calculation → Operation ([relationships:100](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:100)) | None. |
| `transitions` | Backend Edges / `transitions` row ([library:87](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:87)) | Event → State Machine | Event drives lifecycle change | `PaymentCompleted -> PaymentLifecycle` | Identifies the event as the transition input symbol. | Exact active `transitions`, Event → State Machine ([relationships:116](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:116)) | None; current scope also admits declared cross-feature use. |
| `exposes` | Backend Edges / `exposes` row ([library:88](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:88)) | Interface → Operation/Query | Boundary makes use-case callable | `PaymentAPI -> ProcessPayment` | Connects a callable boundary directly to its use-case behavior. | Exact active `exposes`, Interface → Operation or Query ([relationships:132](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:132)) | None. |
| `orchestrates` | Backend Edges / `orchestrates` row ([library:89](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:89)) | Workflow → Operation[] | Workflow coordinates operation sequence | `OrderFulfillment -> [ProcessPayment, ReserveInventory]` | Makes ordered multi-operation coordination explicit. | Exact active `orchestrates`, Workflow → Operation with ordered one-to-many multiplicity ([relationships:148](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:148)) | No endpoint mismatch; current authority additionally requires an admitted declared scope. |
| `applies` | Backend Edges / `applies` row ([library:90](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:90)) | Policy → Operation | Policy chooses execution strategy | `RetryPolicy -> RetryPayment` | Shows runtime strategy selection at the consuming behavior. | Exact active `applies`, Policy → Operation or Calculation ([relationships:164](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:164)) | v1 omits the now-admitted Calculation target; its Operation case remains valid. |
| `maps` | Backend Edges / `maps` row ([library:91](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:91)) | Mapping → Entity/Interface | Mapper transforms between shapes | `TransactionToResponse -> PaymentAPI` | Places explicit shape conversion at a boundary instead of hiding it. | Exact active `maps`, Mapping → Entity or Interface ([relationships:180](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:180)) | None. |
| `contains` | Backend Edges / `contains` row ([library:92](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:92)) | Entity → Value Object | Entity embeds immutable value | `PaymentTransaction -> Money` | Gives a direct field-structure cue for immutable domain values. | Exact active `contains`, Entity → Value Object ([relationships:196](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:196)) | None. |
| `queries` | Backend Edges / `queries` row ([library:93](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:93)) | Query → Entity | Query reads entity state | `GetPaymentStatus -> PaymentTransaction` | Makes read ownership and entity access visible. | Exact active `queries`, Query/Calculation/Operation → Entity ([relationships:212](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:212)) | v1 omits Calculation and Operation sources; its Query case remains valid. |
| `emits` | Backend Edges / `emits` row ([library:94](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:94)) | Entity → Event | Entity is event source | `PaymentTransaction -> PaymentCompleted` | Identifies the changed entity as the event subject/source. | Exact active `emits`, Entity → Event ([relationships:228](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:228)) | None; current authority explicitly contrasts it with Operation → Event `produces`. |
| `renders` | Intra-UI Edges / `renders` row ([library:100](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:100)) | Page → Component[] | Page renders component tree | `PaymentsPage -> [PaymentsHeader, PaymentsTable]` | Gives the page’s concrete render-tree boundary. | Exact active `renders`, Page → Component, one-to-many ([relationships:276](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:276)) | None. |
| `wraps` | Intra-UI Edges / `wraps` row ([library:101](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:101)) | Layout → Page[] | Layout wraps routable pages | `DashboardLayout -> [PaymentsPage, RefundsPage]` | Shows shared-shell ownership over multiple routes. | Exact active `wraps`, Layout → Page, one-to-many ([relationships:292](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:292)) | None. |
| `composes` | Intra-UI Edges / `composes` row ([library:102](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:102)) | Component → Component[] | Parent component includes children | `PaymentsPanel -> [FiltersBar, PaymentsTable]` | Makes component containment/import structure explicit. | Exact active `composes`, Component → Component, one-to-many ([relationships:308](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:308)) | None. |
| `consumes` | Intra-UI Edges / `consumes` row ([library:103](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:103)) | Component → Hook | Component uses reactive hook | `PaymentsTable -> usePaymentOverview` | Identifies the UI unit’s reactive data/state dependency. | Exact active `consumes`, Component → Hook ([relationships:324](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:324)) | None. |
| `submits` | Intra-UI Edges / `submits` row ([library:104](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:104)) | Form → Action | Form delegates submit behavior | `CreatePaymentForm -> submitCreatePayment` | Separates form validation/input ownership from mutation behavior. | Exact active `submits`, Form → Action ([relationships:340](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:340)) | None; current example happens to use hook-like naming but retains Action typing. |
| `shapes` | Intra-UI Edges / `shapes` row ([library:105](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:105)) | Adapter → View Model | Adapter produces render model | `PaymentAdapter -> PaymentOverviewVM` | Locates API-to-render-model transformation in a pure adapter. | Exact active `shapes`, Adapter → View Model ([relationships:356](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:356)) | None. |
| `protects` | Intra-UI Edges / `protects` row ([library:106](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:106)) | Guard → Page | Guard controls page access | `AuthGuard -> PaymentsPage` | Shows the concrete route/render access gate. | Exact active `protects`, Guard → Page ([relationships:372](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:372)) | None. |
| `displays` | Intra-UI Edges / `displays` row ([library:107](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:107)) | Component → View Model | Component renders VM fields | `PaymentCard -> PaymentOverviewVM` | Makes the render unit’s data-shape dependency explicit. | Exact active `displays`, Component → View Model ([relationships:388](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:388)) | None. |
| `fetches` | Cross-Layer Edges / `fetches` row ([library:113](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:113)) | Binding → Query | UI read binding calls query | `usePaymentOverviewBinding -> GetPaymentStatus` | Connects reactive UI reads to the exact backend query seam. | Exact active `fetches`, Binding → Query ([relationships:404](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:404)) | None. |
| `mutates` | Cross-Layer Edges / `mutates` row ([library:114](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:114)) | Binding → Operation | UI write binding calls operation | `useCreatePaymentBinding -> ProcessPayment` | Connects UI mutation plumbing to the exact backend use case. | Exact active `mutates`, Binding → Operation ([relationships:420](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:420)) | None. |
| `reflects` | Cross-Layer Edges / `reflects` row ([library:115](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:115)) | State Indicator → State Machine | UI visual state mirrors lifecycle | `PaymentStatusBadge -> PaymentLifecycle` | Ties badge/state presentation directly to lifecycle state. | Exact active `reflects`, State Indicator → State Machine ([relationships:436](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:436)) | None. |
| `derives` | Cross-Layer Edges / `derives` row ([library:116](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:116)) | View Model → Entity | VM fields derived from entity data | `PaymentOverviewVM -> PaymentTransaction` | Makes field lineage from domain data to render shape reviewable. | Exact active `derives`, View Model → Entity ([relationships:452](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:452)) | None. |
| `contracts` | Cross-Layer Edges / `contracts` row ([library:117](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:117)) | Form → Interface | Form schema aligns with endpoint contract | `CreatePaymentForm -> PaymentAPI.createPayment` | Provides a concrete schema-to-API compatibility review seam. | Exact active `contracts`, Form → Interface ([relationships:468](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:468)) | Example targets an interface member while DS-D8 types the endpoint as the Interface; useful notation, but it must not be parsed as a distinct endpoint type. |
| `mirrors` | Cross-Layer Edges / `mirrors` row ([library:118](/home/vrondelli/projects/domainspec-core/implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md:118)) | Guard → Rule | UI guard mirrors backend authorization rule | `AuthGuard -> AuthenticatedUserRule` | Exposes duplicated client feedback logic for parity testing against backend authorization. | Exact active `mirrors`, Guard → Rule ([relationships:484](/home/vrondelli/projects/domainspec-core/projects/domainspec-v2/definitions/relationships/relationships.yml:484)) | None; current semantics emphasize that the backend rule remains authoritative. |

## Agent 2 — Noether, Emmy

Noether evidence report for `2026-07-12-r3c-relationship-card-triage`.

### Provenance boundary

- Parent repository HEAD: `996ac595815034043f5717f24db54e1cb70774d8`.
- The live authority file is modified relative to parent HEAD: `M projects/domainspec-v2/definitions/relationships/relationships.yml`.
- Working authority content:
  - SHA-256: `567fda214dbf3d2cdfe8f360020d2497cccc611bbcfd05f2fd885e8ad308ab41`
  - Git blob: `e2540aefc33b89c896f65f1546bb9a7bda931ef5`
  - Declares exactly 30 active signatures (`relationships.yml:17-18`).
- Parent-HEAD authority content:
  - SHA-256: `d0d50147254ac98a37154088f2594dfb7f3ca833bc84a7d3b730303f5bb376e6`
  - Declares 31 signatures because it still includes the second `orchestrates` signature sourced from the retired Saga type.
- Therefore, **30 active signatures is a working-tree authority result, not yet a committed-HEAD fact**.
- The Import Manifest pins v1 provenance at `33859b561dc34e3d0b9cb3da76b6cb3d196daa65` and marks the relationship authority reformulated (`IMPORT-MANIFEST.md:1-5,28-29`).
- That pin belongs to the `implementation/domainspec` submodule, whose current HEAD is `5ce62e5ce70db6232042a9c3239bc3e602a51691`.
- The v1 architecture library is clean and byte-identical to its pinned version:
  - SHA-256: `d6410630fdd60564ced75f488b8ffd4efcdcca20af315424585011b75c698585`
  - Git blob: `db7eaac2bad3844c4e450d778c58363b5a4ba45a`
- The v1 library explicitly claims 29 cards (`ARCHITECTURE-PATTERN-LIBRARY.md:132-140`): 15 backend, 8 UI, and 6 cross-layer (`:74-118`).

### Full-outer-join matrix

Formal state rule:

- `matched-active / staged-review`: a v1 row shares an ID with a live active signature, but label equality alone does not admit legacy prose as authority.
- `reject-or-superseded`: legacy row is explicitly deprecated.
- `authority-only-active / no-card`: active signature exists without a v1 card; do not manufacture one during triage.
- `generated-view / no-authored-card`: projection only, never a canonical authored relationship.
- `deferred / no-card`: candidate remains outside the admitted signature set.

| Key | v1 evidence | Working authority evidence | Formal disposition |
|---|---|---|---|
| `performs` | library:80 | relationships:20-33 | matched-active / staged-review |
| `produces` | library:81 | relationships:36-49 | matched-active / staged-review |
| `produces-for` | library:82 | relationships:52-65 | matched-active / staged-review |
| `triggers-cross` | library:83 | relationships:68-81 | matched-active / staged-review |
| `enforces-cross` | library:84 | relationships:525-530 | **reject-or-superseded**; replacement is `enforces` |
| `enforces` | library:85 | relationships:84-97 | matched-active / staged-review |
| `calculates` | library:86 | relationships:100-113 | matched-active / staged-review |
| `transitions` | library:87 | relationships:116-129 | matched-active / staged-review |
| `exposes` | library:88 | relationships:132-145 | matched-active / staged-review |
| `orchestrates` | library:89 | relationships:148-161 | matched-active / staged-review |
| `applies` | library:90 | relationships:164-177 | matched-active / staged-review |
| `maps` | library:91 | relationships:180-193 | matched-active / staged-review |
| `contains` | library:92 | relationships:196-209 | matched-active / staged-review |
| `queries` | library:93 | relationships:212-225 | matched-active / staged-review |
| `emits` | library:94 | relationships:228-241 | matched-active / staged-review |
| `renders` | library:100 | relationships:276-289 | matched-active / staged-review |
| `wraps` | library:101 | relationships:292-305 | matched-active / staged-review |
| `composes` | library:102 | relationships:308-321 | matched-active / staged-review |
| `consumes` | library:103 | relationships:324-337 | matched-active / staged-review |
| `submits` | library:104 | relationships:340-353 | matched-active / staged-review |
| `shapes` | library:105 | relationships:356-369 | matched-active / staged-review |
| `protects` | library:106 | relationships:372-385 | matched-active / staged-review |
| `displays` | library:107 | relationships:388-401 | matched-active / staged-review |
| `fetches` | library:113 | relationships:404-417 | matched-active / staged-review |
| `mutates` | library:114 | relationships:420-433 | matched-active / staged-review |
| `reflects` | library:115 | relationships:436-449 | matched-active / staged-review |
| `derives` | library:116 | relationships:452-465 | matched-active / staged-review |
| `contracts` | library:117 | relationships:468-481 | matched-active / staged-review |
| `mirrors` | library:118 | relationships:484-497 | matched-active / staged-review |
| `owns` | absent from all 29 v1 rows | relationships:244-257 | authority-only-active / no-card |
| `belongs-to` | absent from all 29 v1 rows | relationships:260-273 | authority-only-active / no-card |
| `owned-by` | absent from all 29 v1 rows | relationships:500-509 | generated-view / no-authored-card |
| `depends-on` | absent from all 29 v1 rows | relationships:511-515 | deferred / no-card |
| `operation-returns-value-object` | absent from all 29 v1 rows | relationships:516-519 | deferred / no-card |
| `event-payload-publisher-composite` | absent from all 29 v1 rows | relationships:520-523 | deferred / no-card |

Paths abbreviated in the matrix:

- `library` = `implementation/domainspec/architecture/ARCHITECTURE-PATTERN-LIBRARY.md`
- `relationships` = `projects/domainspec-v2/definitions/relationships/relationships.yml`

### Count proof

- 28 v1 rows match active signatures.
- 1 v1 row, `enforces-cross`, is deprecated.
- 2 canonical active signatures have no v1 card: `owns`, `belongs-to`.
- 1 generated view has no v1 card: `owned-by`.
- 3 deferred candidates have no v1 card.
- Full outer join: `28 + 1 + 2 + 1 + 3 = 35` keyed rows.
- Live admitted authority: `28 + 2 = 30` active signatures.

### Material semantic drift requiring review

Even the 28 matching IDs should not be admitted as `evidence-ready` merely from name agreement:

- `produces` is now specifically successful-operation causation; v1 calls it “emits,” which blurs it with the distinct `emits` edge (`library:81,94`; `relationships:36-49,228-241`).
- `orchestrates` now admits same- or cross-feature Workflow scope with an explicit scope obligation; the v1 row only states sequence coordination (`library:89`; `relationships:148-161`).
- `applies` now targets `Operation | Calculation`, while the v1 row shows only Operation (`library:90`; `relationships:164-177`).
- `queries` now admits `Query | Calculation | Operation` sources, while v1 shows only Query (`library:93`; `relationships:212-225`).
- `enforces-cross` must not survive as a distinct card: cross-feature behavior is scope metadata on `enforces` (`relationships:84-97,525-530`).
- `owned-by` must not be promoted into the authored-signature count; it is explicitly a generated reverse projection of `owns` (`relationships:244-257,500-509`).

No files were written and no validators were run.
