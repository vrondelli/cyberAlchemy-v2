# R13-PREP result

2026-09-13. **Preparation complete for parent review; R13 is not complete.**
Product construction only, candidate, authority effect: none. Source-only evidence.
R13 three-language execution still requires R12; DomainSpec precedes AlchLang.

## Result and exact scope

Created a reusable direct DomainSpec package with **38 source JSON files,
21 nodes, two features, all 13 configured metatypes, 14 lawful relationships,
and 22 stable scenarios (R13-C01–R13-C22)**. The current TypeScript public planner
accepts the complete graph and selection and plans 36 modules. No generated
TypeScript, Python or Rust module was executed.

All writes are under
`development/reconciliation-v1/profile-compiler-reconciliation/parallel/r13-commerce/`
in `/home/vrondelli/projects/domainspec-core/projects/domainspec-v2`.
No existing helper, production source, canonical contract, another lane,
completion ledger or parent plan was changed. No commit, push, native campaign
or successor task was started. Unique helper/negative fixtures were cleaned in
finally blocks.

Exact authored file inventory and SHA-256 identities are in
[package-files.json](package-files.json). Source JSON files are also individually
listed in [checks.json](checks.json#/source_identities). Additional package files:
`build-corpus.ts`, `check.ts`, `selection.json`, `scenarios.json`,
`values.json`, `source-inputs.json`, `checks-attempt-1.json`,
`checks-attempt-2.json`, `checks-attempt-3.json`, `checks.json`,
`routing.json`, `README.md`, `RESULT.md`, `package-files.json`.

## Covered preparation

| Surface | Concrete candidate coverage | Scenario IDs |
| --- | --- | --- |
| Entity and references | Commerce and billing customer share a local name but distinct selectors; order embeds commerce customer and separately binds billing_customer_id to billing:customer/id. No existence lookup. | C01–C02 |
| Values and Enums | Money quantity/optional note, money list, duplicate-preserving labels, unique-member tags, payload choice and plain priority Enum. Source shape probe rejects duplicate set members. | C03–C05 |
| Rules | Positive invariant is distinct from quantity-below-100 operation guard; valid quantity 100 can reject operation execution. | C06 |
| Calculation and Mapping | Exact subtraction and addition with duplicate local total names; explicit net/fee result arguments into named response Mapping. No invented Calculation-to-Mapping relationship. | C07–C09 |
| Query | Two qualified find Queries read their declared Entity and project only named fields; no hidden calculation or referenced-customer lookup. | C10 |
| Policy | Explicit positive Rule selects declared perform/undo identifiers without executing them. | C11 |
| Operations and Events | Each declared operation replaces order-state and forms one outbox event under state-and-outbox atomicity; rejection, uncertainty and distinct occurrence/time policies are explicit obligations. | C12–C15 |
| State Machine | Trigger/guard and ordered confirmation/audit output slots remain distinct, including two slots targeting the same Event. | C16–C17 |
| Workflow | Four ordered occurrences, seven distinct event inputs, explicit before snapshot for compensation, undo-first dependency on undo-second, and reverse-completion recovery selection. | C18–C20 |
| Interface | Named response contract, find result side and explicit backward version policy. | C21 |
| Hostile source | Five independently rejected mutations against a valid baseline. | C22 |

The complete identifiers are prefixed `R13-`; every scenario retains
`not_run` for TypeScript, Python and Rust execution. These scenarios do not
claim to replace the independently owned R14 canonical obligation matrix.

## Commands, real results and failures

Explicit working directory for each run:
`/home/vrondelli/projects/domainspec-core/projects/domainspec-v2`.

```bash
NODE_NO_WARNINGS=1 node --import ./impl/cli/node_modules/tsx/dist/loader.mjs development/reconciliation-v1/profile-compiler-reconciliation/parallel/r13-commerce/build-corpus.ts
NODE_NO_WARNINGS=1 node --import ./impl/cli/node_modules/tsx/dist/loader.mjs development/reconciliation-v1/profile-compiler-reconciliation/parallel/r13-commerce/check.ts
```

The builder succeeded and its JSON was materialized with apply_patch. It does
not edit the durable source package itself.

- Attempt 1: exit 1. Query projection `billing-customer-id` violated the
  lower-snake-case field rule, and hyphenated Workflow event-input names violated
  their identifier rule. Dependent checks failed prerequisites. Original evidence:
  [checks-attempt-1.json](checks-attempt-1.json). Corrected only candidate names,
  keeping selectors, behavior and separate occurrences intact.
- Attempt 2: exit 1. All positive source/planning checks passed; the invented-verb
  mutant was correctly rejected, but the diagnostic assertion expected a code in
  displayed text. Corrected the assertion to the exact observed message. Evidence:
  [checks-attempt-2.json](checks-attempt-2.json).
- Attempt 3: exit 0, 14 checks passed, with typed vector and scenario coverage
  checks added. [checks-attempt-3.json](checks-attempt-3.json).
- Final: exit 0, **15 checks passed**, including before/after verification of
  **253 selected input hashes**. Tool wall time approximately 2.28 seconds.
  [checks.json](checks.json). This is source loading/planning, never native proof.

Set semantics were checked against the current field model before finalizing
vectors: duplicate members fail rather than being silently deduplicated.
Scenario C04 retains the duplicate input as a rejection case.

Existing reusable functions are imported from
`impl/cli/test/helpers/cross-generator-public.ts` and its declared
`workflow-values.ts`, `workflow-verification.ts`, `composition-project.ts`
dependencies. Their source builders and compiler checks are reused;
their native helpers are not called. New assertions live only in `check.ts`.
No existing test suite was executed or modified.

## Source identities and currentness

[source-inputs.json](source-inputs.json) records exact bytes before candidate
construction for 253 selected dependencies: helper/loader/planner static import
closure, selected schema/contract references, configuration source paths and
the authorization/task definition. These are identities of the current working
checkout, **not a clean committed snapshot**.

All 253 match at the start and end of the final diagnostic run. The source
capsule selected by the current planner is
`2a9f76fd9b352c45cfd8eac36a56adddd0ac86a58097f8106c627e3dd7a553bc`.

- Graph: `4936ca2cddf63d64238b36667621fca556b9bd12e92cab391d4ece46c881ed9a`.
- Source manifest: `56a5e53b47f839a30ad4a21d71504f06c1f1a7350dc44140555cb08288846d5d`.
- Selection bytes: `4647573154b36faf37e9af7f9a7bf79bc25dc47a1d19ec4b646da25d8a6e07b7`.
- Public plan: `260a58315d53b567046b763d24de99f49d682926e19a1d9e5e42ee06865d1c3a`.

The historic `configuration.json.sources` hashes for `project_model` and
`typed_operations` differ from those files' current working bytes. Ten other
configured source identities match. The exact old/current digests are preserved
in `checks.json.configured_source_comparison`; none were refreshed.
This is pre-existing configured provenance divergence, distinct from the zero
in-session selected-input drift. Current planning used the compiler-selected
validated source capsule. Parent must determine the authoritative successor
provenance before qualification, not promote a passing source plan into admission.

Routing: `CA2-ROUTE-IMPLEMENT`, exact owner-directed native candidate mutation
under the D65 chain. ARE effect assessment identified the owner authorization
boundary; the user's delegated R13-PREP scope already supplies it. Routing
receipts and raw request are retained in [routing.json](routing.json).
No ontology runtime record was selected as a task prerequisite.

## Uncovered obligations and causal dependencies

1. **Three-language generation and execution**: every C01–C22 native cell is
   unexecuted. R12 remains the prerequisite. The current public selection decoder
   only accepts the TypeScript profile; R10/R11 successors must provide actual
   Python/Rust support. No unsupported selection was forged.
2. **Consumer dataflow**: C07 gives exact ordered Calculation/result/Mapping
   bindings and expected values, but remains a scenario specification. Parent
   must implement the native consumer harness against the generated APIs; no
   project-composition artifact or transport adapter is claimed here.
3. **Atomicity and failure**: compiled action declarations do not prove provider
   transactions, rollback, no replay after uncertainty, clocks, frozen factories,
   emitted imports or hostile runtime inputs. C12–C20 require scheduled native
   provider observations after R12.
4. **Recovery**: the before snapshot is explicitly supplied, not computed as an
   inferred inverse. This fixture describes a replacement candidate, not a
   concurrency-safe production commerce service. Recovery intent never proves
   durable execution, scheduling, idempotency or publication.
5. **Canonical completeness**: R14 owns the 17-row relationship assurance mapping.
   This corpus uses only needed lawful relationships; it does not invent edges
   to fill a denominator.
6. **Provenance integration**: resolve the two configured/current source digest
   differences in the parent-owned successor contract and recheck affected
   dependencies before final qualification.

No broader implementation or new product decision blocks the delivered inert
preparation. Operational support owner is the parent: heavy-test scheduling and
shared-source integration affect future R13 qualification only.

## Parent integration recommendation

Join the lane by verifying [package-files.json](package-files.json) and rerunning
the bounded check command on exact inputs. Preserve the failed attempts.
Link stable C01–C22 identifiers from the R14 matrix without changing that lane.
After R12, implement and execute the explicit consumer/provider scenarios in all
three languages against current source identities; retain unexecuted cells and
unsupported obligations until real evidence closes them. Only the parent may
update R13 and the shared completion ledger.

## Open Questions

- Which parent-owned successor provenance contract binds current loader and typed
  operation bytes in place of the two historical configuration references?
- What exact generated APIs and native harness bindings will R10/R11/R12 expose
  for the C07 consumer and C12–C20 provider observations?
- Which C01–C22 IDs cover each R14 canonical signature obligation once its
  independent matrix is joined? This preparation does not answer for that lane.

