---
node_type: development-package
docType: glossary
module: architecture-pattern-enforcement
feature_code: APE
status: candidate
updatedAt: 2026-08-04
semanticAuthority: none
---

# APE Glossary

These definitions explain the development package. Canonical DomainSpec and
CAV2 sources retain their existing authority.

| Term | Plain-language meaning | Authority posture |
| --- | --- | --- |
| canonical meta-type reference | exact pointer to one active DS-D1 definition and criterion | reference only; DS-D1 remains authoritative |
| implementation realization type | candidate ontology type describing how one DS-D1 kind can appear in implementation evidence | non-authoritative architecture model |
| implementation property | one typed, observable architecture expectation, such as a closed value set or direct dependency | candidate until profile owner review |
| portable property | expectation intended to carry across languages without requiring the same syntax | architecture-profile input, not DS-D1 truth |
| language realization | TypeScript, Python, or Rust way of observing or constraining a portable property | language-profile owned |
| architecture profile | explicit set of applicable property and relation constraints | separate owner admission required |
| implementation binding | exact connection between a canonical concept and a source unit or symbol | candidate mapping; filename alone is insufficient |
| observation projection | normalized evidence emitted by a source/native adapter | evidence, not authority |
| observed fact | value read directly from source or a native tool | provenance must name raw evidence |
| derived fact | value computed from other observed facts under a named rule | must retain derivation provenance |
| owner-resolved fact | value whose ambiguity was decided by an accountable owner | must retain the decision handle |
| unsupported | required fact cannot be established for the encountered construct | blocks; never means absent or passing |
| evaluation scenario | immutable positive or mutant input plus expectations, lineage, scope, and result joins | proof input, not semantic authority |
| constraint finding | explainable comparison between expected and observed property/relation values | evidence only |
| proof-engine provider | BTE-compatible execution, mutation, receipt, and replay service | mechanics only; cannot select semantics |
| meta-type realization cycle | ontology-first workflow for completing implementation evidence for one already-active type | planning model |
| type completion receipt | bounded evidence that selected profiles and applicable obligations closed | no admission, release, or production authority |
| exact-cause negative | fixture with one controlled violation whose required diagnostic identifies that cause | validation evidence |
| parity | agreement on portable obligation IDs and applicability across independent language lanes | not syntax equality or majority vote |
| profile-local convention | folder, filename, export, import, or callable-form rule selected for one architecture profile | never universal by proximity |
| evidence burden | required observation stages, relations, unsupported cases, runtime planes, and owner decisions still missing for a type | planning input for next-type selection |

## Preserved earlier terms

`uniformity`, `composability`, `layering`, `code tag`, `feature pack`,
`pattern candidate`, `promotion lifecycle`, `substrate`, and `drift` retain the
meanings documented by the earlier APE package. Their completed and open work is
indexed in [HISTORICAL-EVIDENCE-MAP.md](HISTORICAL-EVIDENCE-MAP.md); it no
longer supplies the active execution order.
