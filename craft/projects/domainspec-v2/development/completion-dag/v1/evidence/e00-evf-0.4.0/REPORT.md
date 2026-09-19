# E00 — EVF and conformance reconciliation

Date: 2026-09-06. Route: CA2-ROUTE-RESEARCH. Lane: product construction.

**PASS for E00 reconciliation only.** The next construction node is E01:
define one bounded compiler-to-EVF capability. E01–E05 remain open.
No implementation, acceptance, activation, publication or release occurred.

## Reconciled baselines

| Surface | Selected evidence and current check | Reuse ceiling |
| --- | --- | --- |
| Stable 1.0 compiler | C05 candidate `domainspec-v2-cli-1.0.0-cd1ec3272ba7`; manifest `9720c3ca33a5ffd21aca9956bb361c24e7003b0dc668689fbaf703b951a3745d`; all 54 selected CLI source files match the successor source manifest | Existing compiler product approval remains scoped to that candidate. This reconciliation adds no EVF integration approval. |
| Frozen EVF reference core | `evf.production-stability.reference.v3-candidate`; payload `e9beb48427c8f849f15b4211438935aa757cf294815f580fe1d0a2759f6d4f51`; manifest file SHA `f0a2dac78de46d4d7f77517ac96e26ec7c06a6d49e75053e64a353a64826a75e`; all 67 artifact refs and 11 runtime refs match | Recorded product approval binds this reference candidate. Existing reference profiles and evidence machinery are reusable inputs, not proof of compiler integration. |
| Local enforcement rehearsal | Selected receipt payload `db04078de50b06aa273ffc303e913fdd220baf4894caeb593b5eb68bf06e1589`; selected direct references match | Recorded successful key-door S0–S12 gate rehearsal, degraded-mode denial and exact rollback. The receipt ends disabled. No Auth or compiler enforcement authority transfers. |
| Portable audit 0.4.0 | Archive SHA `748b1afcd27ae52b9c1f105a97314cf05a6582aaed4048b6a4a48a28fe4fca08`; archive and retained RESULT/FORMAL-CLAIMS files match | Tested evaluation candidate. Its record reports 104 passing tests, 13 sequential checks and five bounded example claims. These tests were **not rerun** in E00; no product approval is recorded for this package. |
| Conformance factory | 39 provider registrations in 37 imported modules; registry, imported modules and provider result contract hashed | Existing Rule, Operation, enforces, Enum, Calculation, Policy, Query, ValueObject, Entity, parity, composition, W3 and W4 machinery. Source inventory is not a fresh provider execution PASS. |
| Independent reference consumer | Separate consumer source belongs to the verified frozen manifest; README inspected | No producer/verifier dependency; checks digests and every S0–S12 stage, but accepts only the exact multi-provider reference profile. Its current contract does not accept arbitrary compiler evidence. |
| Auth downstream | AUTH-EVF-00 selected freeze refs match; AUTH-EVF-01 all 32 material files match | Selected records establish structural work only: 24 executable obligations plus one theorem obligation. Executable route is structural nonpass; theorem is not_evaluable. Not a completed compiler integration or fresh whole-Auth assessment. |

`sources.json` records exact paths, observed SHA-256, recorded expected hashes
where available, byte sizes, and individual outcomes. The historical rehearsal
reports 79 reference checks; E00 independently checks the manifest itself plus
its 78 listed references. No historical receipt count is copied as a fresh run.
Ontology material is hashed only as selected evidence; no ontology runtime gate
or semantic admission is performed.

## What 0.4.0 changes for the next design

Use the exact 0.4.0 package as a **proposed prototype execution dependency** in
E01/E02, with its own candidate identity. Do not rename the approved reference
core to 0.4.0 or inherit its approval into the portable package.

Portable formal audit requests use `evf.formal-audit/v1` and
`evf.formal-request/v1`; adapters cover Souffle, Alloy, CBMC, Lean and TLC.
The bundled examples demonstrate bounded models, not correspondence between
DomainSpec compiler output and those models. They cannot discharge compiler
obligations merely by passing.

For prototype execution through this package, its public `./evf` launcher is the
containment boundary: pinned Bubblewrap, namespaces, explicit runtime grants,
read-only kit/runtime mounts and one writable audit workspace. Unavailable
containment must remain a failure, with no host-execution fallback. Required
native tool installations are separate dependencies, not archive contents.
Provider writes inside the workspace remain possible; containment does not
authenticate evidence. A consumer must independently verify the evidence and
input identity. Only the recorded WSL2 environment was evaluated.

The prior intermittent TLC setup failure remains unexplained. Later passes do
not establish repair. It limits clean TLC stability and production-readiness
claims; it does not block a bounded definition/prototype that makes neither
claim. A TLC-dependent test must retain failure evidence and report its actual
outcome.

## Missing compiler-to-EVF contract

The approved compiler exposes compiled graphs, obligation evaluation,
compilation certificates, formalization projections and assurance certificates.
Its selected source tree has no direct EVF integration reference. Generated
catalogue entries do contain conformance-factory provenance; that is not an
executable compiler-to-EVF bridge. The implementation-conformance architecture
is explicitly a design document, not an implementation receipt.

The factory returns `FactoryNodeSemanticResult/v1`, including declared/passed
positives and declared/killed mutants. This is not an EVF stage receipt or formal
request. For example, `typescript-enforces-v1` consumes explicit relation/source
roles and upstream Rule/Operation results. Reusing it requires a defined mapping
and independent evaluation of its accounting, not treating its `result: pass`
field as complete conformance evidence.

E01 must specify:

1. One finite compiler graph/obligation profile, its owned meaning, denominator,
   assumptions and excluded claims.
2. A deterministic source-to-model mapping with compiler/source/graph/profile
   identities, selected tool dependencies and provider request schemas.
3. Positive and deliberately broken cases, required evidence, and treatment of
   absent, stale, malformed, disagreement and surviving-mutant outcomes.
4. One independent consumer contract that recomputes selected identities and
   verdicts without depending on the producer's acceptance decision.
5. Whether the first profile uses a portable formal adapter or a factory-backed
   executable provider. These are distinct routes; no choice is silently made
   by E00. A finite reachability profile is an available starting option, but
   its DomainSpec meaning and mapping still require definition.

E02 then designs/compiles the mapping and pure evaluator; E03 implements;
E04 tests positive/broken/absent/stale cases with the independent consumer;
E05 obtains independent review and exact product approval.

## Frontier and operational residue

Product construction: E00 complete; **E01, R00, U00 and L00 are dependency-ready**.
E01 is the recommended next node. M-COMPILER remains recorded complete;
M-EVIDENCE and the full program remain open. No causal blocker prevents E01.

| Operational support | Owner | Affected stage | Disposition |
| --- | --- | --- | --- |
| O01 hosted compiler evidence | Repository/release owner; actor unassigned | Compiler release preparation | Deferred; no E01 prerequisite |
| O06 portable EVF packaging/publication coordination | Existing portable EVF package owner; actor not resolved here | Distribution/publication | Visible residue; preserve owner-controlled package bytes; no E01 prerequisite |
| 0.4.0 execution environment verification | Future E03/E04 execution owner | Integration product-test environment | Check exact launcher/runtime closure before executing the selected prototype; not a definition-stage blocker |
| TLC intermittent failure investigation | Portable EVF/TLC owner; actor unassigned | TLC stability evidence | Open cause unknown; only blocks claims that depend on established TLC stability |

Frozen candidate and archive bytes were only read. Original DAG files and C05
records were not rewritten. `progress.json` appends this reconciliation to the
C05 progress chain. No product tests, provider runs or effectful rehearsals were
executed. Recheck the selected hashes before future reuse; temporary evidence
paths are local retained evidence and are not promised durable distribution.
