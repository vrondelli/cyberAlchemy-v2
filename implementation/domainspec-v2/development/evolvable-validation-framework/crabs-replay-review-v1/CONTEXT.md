# Execution context

Status: run-local evidence; authority effect: none.
Task: CRABS replay DAG, A through K. Owner direction: user requested execution
of the previously reviewed plan on 2026-09-12. No publication or deployment.

## Selected context and obligations

| Source | Selector | Nodes / purpose |
| --- | --- | --- |
| ../repair-assurance-dag.json | nodes and exit_criterion | A-K requirements and dependencies |
| ../repair-assurance-implementation-layering.md | first construction unit | A scope; L0/L1 only |
| historical/original/obligation.json | subject.bound, oracle | B original declared property |
| historical/repair/obligation.json | subject.bound, oracle | B repair comparison |
| historical/original/source-manifest.json | selected_sources, provider_runtime | C/D exact original source and CBMC |
| historical/repair/source-manifest.json | selected_sources, harnesses | C repair identity and historical patch |
| inputs/original/harness/ordered_set_commutativity.c | main, same_order | C original executable fixture |
| inputs/repair/harness/ordered_set_commutativity.c | main, same_order | C repair executable fixture |
| inputs/repair/harness/ordered_set_regression.c | main and five test groups | G required regression examples |
| repository tools/toolchain/README.md | native toolchain | D current pinned GCC; no temporary compiler |
| repository authority/definitions/DEFINITIONS.md | CAV2-D65 | exact prototype and evidence boundary |

This is the Context Builder standard-mode pack (11 selected sources). Selection
covers the task contract, property, source, tool and verification requirements;
it does not claim that planned executions or reviewer outcomes already exist.
Original code and patch source identities were recovered through the configured
SSH access. API/unauthenticated HTTPS access did not expose the repository.

## Decisions and construction boundary

Use the existing original and repair source bytes. Create a run-local adapter,
fresh evidence and replay instructions under this folder; preserve historical
receipts and scripts. Reuse existing candidate property meanings; no new general
engine, ontology meaning or provider-admission capability is constructed.
The D65 predecessor chain is the linked existing TDE/EVF and CRABS construction
evidence. New execution identities bind source exports, comparison contract,
runner, harness and pinned toolchain. No product approval is inferred.

GCC 13 and the historical local paths are unavailable. The current repository
GCC 15.2.0 is explicitly selected for both subjects in a new execution epoch.
CBMC 6.11.0 is recovered byte-for-byte. Compiler drift is disclosed, never
concealed by refreshing historical manifests.

The user authorized one separate subagent for technical replay. Its review is
independent of the primary agent's conversation but shares model-family and host
limitations; it is not external professional accreditation. It will receive the
package and task instructions only, not expected results as coaching.

## Open Questions

Live results and the independent reviewer report must establish F-K. A failed
source, harness, provider or comparison check remains visible and prevents its
dependent completion claim. The later 48-case runtime contract is out of scope.
