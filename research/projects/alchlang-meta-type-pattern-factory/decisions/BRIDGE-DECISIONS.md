# Bridge decisions proposed for owner review

| ID | Proposed decision | Reason | If rejected |
|---|---|---|---|
| BD-01 | Define profile as an immutable composition envelope, not a meta-type. | Profile selects compatibility; meta-type classifies domain meaning. | A new ontology argument must explain why compatibility selection is domain meaning. |
| BD-02 | Keep meta-type creation in DomainSpec and meta-type projection in AlchLang. | Preserves D65 and distinct ownership. | AlchLang would become an alternate admission authority. |
| BD-03 | Introduce Carrier v3 before arrow syntax. | Exact baseline/meta-type/profile refs are missing from v2. | Arrow lowering would create an unbound parallel semantics. |
| BD-04 | Parse arrow source statically; never execute it. | Determinism, safety, source traceability. | An explicit sandbox/effect model would be required and would materially expand scope. |
| BD-05 | Generalize pattern availability to describable/generatable/runtime-capable. | Static generation and observed runtime are different closures. | Current binary availability keeps overstating runtime readiness. |
| BD-06 | Keep Effect and Outbox as semantic/pattern concepts, not new meta-types for now. | No current admitted criterion supports that elevation; D45-D49 already classify infrastructure contracts. | Start a separate upstream meta-type admission lifecycle. |
| BD-07 | Produce one factory projection manifest and one proof node per realization. | Bridges ergonomic multi-node source to existing isolated canonical proofs. | Factory would need to absorb frontend parsing, violating separation. |
| BD-08 | Version profiles and catalogs immutably. | Owner decisions bind exact digests. | Migration and replay become ambiguous. |

No proposed decision is accepted by this document.

