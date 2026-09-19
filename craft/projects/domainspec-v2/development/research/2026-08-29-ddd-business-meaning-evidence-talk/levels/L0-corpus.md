# L0 — Source Corpus

## CFP And Audience Sources

| Source | Kind | What it establishes | Limit |
| --- | --- | --- | --- |
| [DDD Brasil Sessionize CFP](https://sessionize.com/dddbrasil-meetup/) | primary-source | Calls for strategic or tactical DDD practice, experiences, lessons, architecture, organizational design, and real adoption; talks are 30–40 minutes and may be recorded. | The located call closed on 2025-11-10. It is not evidence of a current open submission window. |
| [DDD Brasil second meetup](https://dddbrasil.com.br/evento/2-meetup-ddd-brasil/) | primary-source | Audience includes architects, product managers, and developers; content is technical but accessible and focuses on context, domain clarity, ubiquitous language, and business alignment. | Describes one past event, not every future audience. |
| [DDD Brasil video catalogue](https://dddbrasil.com.br/videos/) | primary-source | Existing talks cover EventStorming, Event Sourcing, tactical DDD, Team Topologies, value architecture, and becoming a DDD practitioner. | Topic list does not reveal reviewer scoring criteria. |

## DDD Sources

| Source | Kind | What it establishes | Limit |
| --- | --- | --- | --- |
| [Eric Evans, DDD Reference](https://www.domainlanguage.com/wp-content/uploads/2016/05/DDD_Reference_2015-03.pdf) | primary-source | DDD focuses on the core domain, explores models through domain/software collaboration, and uses a ubiquitous language inside an explicit bounded context. Model and implementation should have an understandable relationship and feed insight back into each other. | DDD does not require formal verification or a single modeling notation. |
| [Whirlpool Process of Model Exploration](https://www.domainlanguage.com/ddd/whirlpool/) | primary-source | Model exploration is iterative and can fit into Agile or Lean work. | It is a model-exploration aid, not evidence for EVF. |

## Related Formalization Research

| Source | Kind | What it establishes | Limit |
| --- | --- | --- | --- |
| [Le, Dang, Nguyen — DDD with DCSL](https://eprints.uet.vnu.edu.vn/eprints/2973/1/DDD-with-DCSL.pdf) | primary-source | A domain-specific language can encode structural constraints and essential behavior and can help bridge domain-model and implementation views. | This is one object-oriented DDD method; it is not DomainSpec or EVF evidence. |
| [Le et al. — Unified Executable Domain Models with Event-B](https://jcsce.vnu.edu.vn/index.php/jcsce/article/view/6743) | primary-source | Recent research explicitly connects DDD domain models, executable semantics, and Event-B transformation for consistency and verification. | One framework and case study; it does not validate this repository's translation or claims. |
| [Bugrara — User Experience with Language-Independent Formal Verification](https://arxiv.org/abs/1912.02951) | primary-source | Human-readable specifications, incremental formalization, and mutation-based challenges address important formal-verification usability problems. It also stresses that translation from intended behavior to formal specification is critical. | Smart-contract context and one proposed approach; usability claims do not automatically transfer to DDD teams. |

## Local Product And Implementation Sources

| Source | Kind | What it establishes | Limit |
| --- | --- | --- | --- |
| [CyberAlchemy product thesis](../../../../../../cyberAlchemy-v2/product/PRODUCT-THESIS.md) | primary-source | Candidate thesis connects intent, meaning, evidence, decisions, action, feedback, ownership, and work ergonomics. | Private candidate premise; not a validated market claim. |
| [DomainSpec v2 meta-types](../../../../definitions/meta-types/meta-types.md) | primary-source | Thirteen backend types are active; additional UI labels remain candidate or deferred. | An active vocabulary does not prove the whole product or all modeled domains. |
| [DomainSpec v2 relationships](../../../../definitions/relationships/relationships.md) | primary-source | Thirty-one active typed relationship signatures exist; `Rule --enforces--> Operation` is canonical. | Relationship authority is not proof that instances or implementations satisfy the relation. |
| [EVF canonical overview](../../../evolvable-validation-framework/README.md) | primary-source | EVF connects a source claim to obligations, bindings, checks, mutations, verdicts, receipts, and a bounded claim. | Current evidence is candidate-local L0/L1 plus one selected bounded L2 property; wider claims remain open. |
| [EVF architecture](../../../evolvable-validation-framework/ARCHITECTURE.md) | primary-source | The internal causal path and provider path preserve exact sources, results, failures, and authority boundaries. | No current receipt proves the complete system-level vertical or production behavior. |

## Corpus Finding

The proposed topic has a real DDD bridge and clear related work. The distinctive
contribution should not be “a DSL for DDD” or “formal methods for DDD” in general;
both already exist. The useful contribution is the practical, human-readable
evidence loop and its explicit refusal to let claims exceed their evidence.
