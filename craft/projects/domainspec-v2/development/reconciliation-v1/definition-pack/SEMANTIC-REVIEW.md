# Bounded semantic review — DSR-006

Candidate definition evidence, not compiler conformance, language-quality certification, or SFOL proof.
Review method: exact source reuse plus separating examples and mutations. Automated tests check references,
selected text, signature admissibility and deterministic projections; the explanations below are analyst review,
not owner confirmation. The native Define CLI separately reports deterministic-structure-only validation.

| Distinction | Separating case and consequence | Source / downstream check |
| --- | --- | --- |
| Entity / Value Object / record | Equal field values with different Entity identities remain different; equal Value Objects remain equal. A shared emitted record shape proves neither classification. | DS-D1.1/.2; DSR-C-DATA-SHAPE; DSR-009/028 |
| Enum / payload sum | A closed list of names is Enum. Alternatives carrying different typed payloads need a type-expression contract; this pack does not quietly broaden Enum. | DS-D1.3; DSR-C-TYPE-EXPRESSION; DSR-009 |
| Embedded value / identity reference / ownership | Money inside Order can be contains. A reference to another Entity identity is not contains, owns, a foreign-key constraint or a grant of write responsibility. | DS-D8 contains; D29/D30/D46; DSR-009/028 |
| Query / Calculation / Operation | Query and Operation may read Entity data; Calculation cannot. Operation changes state; a pure calculation is not modeled as a support Operation. | DS-D1.4/.5/.6; BMC-RQ1; DSR-013 |
| Rule / Policy | Boolean eligibility differs from strategy selection. Proposed Policy authoring reuses Rules; neither Policy-to-Rule applies nor a new rule-reference DS-D8 edge is admitted. Existing inline predicates require a compatibility decision. | DS-D1.7/.8; DSR-015 |
| Mapping / Calculation / value flow | Passing a computed total into a Mapping is an explicit input binding, not a calculates-to-Mapping edge or hidden repository lookup. Mapping still retains its source-defined computed-field capability. | DS-D1.6/.13; DSR-C-VALUE-FLOW; DSR-014 |
| Event cause / subject / trigger / effect | Operation produces Event and Entity emits Event have different endpoints. Incoming lifecycle trigger and outgoing announcement remain separate roles. Removing produces changes admissibility even while emits remains. | DS-D8; BMC-D08; DSR-016 |
| Concept degree / step count / execution count | One Operation used in two named steps is one target concept and two declarations; neither determines runtime attempt count. Two Mapping roles likewise need not be two target concepts. | BMC-D04/D05; D39/D40; DSR-017 |
| Ownership / membership | Lifecycle, custody and write-responsibility are ownership dimensions; classification and home-assignment are membership kinds. They do not establish each other's uniqueness or inverse. | D29/D30; DSR-008/010 |
| Endpoint type / scope / representation / degree | Altering a display shape does not change permitted endpoint types. A correct type does not legalize cross-feature placement. Compatibility multiplicity tokens are not new numeric bounds. | DS-D8; BMC-D01/D02/D03; DSR-010 |
| Claim / evidence / admission | A passing candidate test does not discharge an owner-controlled obligation, admit an implementation or make an exact package current. | D28/D31-D35; DSR-038/039 |
| Recovery / local transaction | Forward recovery is not database rollback; coordinator persistence and each business Operation have separate transaction and effect boundaries. | D36-D49; DSR-024/025 |

The relationship evaluator here is a small read-only probe of the frozen authority table, not a replacement
for DomainSpec's validator. Its scope is endpoint and placement discrimination only: it does not implement
BMC numeric degree, closure, ordering, duplicate, role or provider semantics. Metamorphic checks vary
representation metadata without changing type admission and remove one relationship without removing another.

Negative controls detect a mutated selected meaning, absent definition reference, ontology relabeling,
missing consumer, false handoff readiness and invalid endpoints/scope. These controls demonstrate bounded
non-collapse and orthogonality properties; they do not establish universal semantic correctness or a full
category-theory model. Broader language quality, compiler and runtime checks remain DSR-030 and later work.

## Open Questions

See [OPEN-QUESTIONS.md](OPEN-QUESTIONS.md). Historical Query prose says same inputs imply same result; a future
executable query contract must make the read snapshot/context explicit rather than silently promise identical
answers across changing state. This pack reuses, rather than edits, the owned source wording.
