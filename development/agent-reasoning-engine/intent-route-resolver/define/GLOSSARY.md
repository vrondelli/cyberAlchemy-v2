# Intent Route Resolver glossary

| Term | Local meaning | Boundary |
|---|---|---|
| Intent Route Resolver | Private, pure reasoning-engine child runtime that derives an advisory `RouteDisposition` from typed intent and a frozen capability-route catalog. | Not a dispatcher, scheduler, gate, or execution owner. |
| `IntentRecord` | Existing selected-local projection preserving raw intent and declared, inferred, or unresolved fields. | Shape and provenance posture do not prove truth, approval, or authority. |
| `RouteRequest` | Versioned envelope containing an `IntentRecord`, typed discriminator values, constraints, and a frozen catalog reference. | Does not carry approval. |
| `CapabilityRouteCatalogSnapshot` | Immutable, owner-supplied list of route entries, their required discriminators, exclusions, inputs, and explicit dominance relations. | Distinct from the semantic evaluator's `RuleCatalogManifest`. |
| `RouteDisposition` | Advisory terminal result: `candidate`, `ambiguous`, `no-match`, or `invalid`. | Not a ResonantOS `RouteDecision` and not an Arcanum dispatch. |
| candidate | Exactly one eligible route remains under the frozen snapshot. | Still requires host presentation and any owner-required approval. |
| ambiguous | More than one route remains eligible, or a missing discriminator can materially change eligibility. | Must return reasons, missing discriminators, and one clarification question. |
| no-match | A valid, sufficiently discriminated request matches no catalog route. | Does not authorize capability creation or fallback execution. |
| invalid | Request or catalog fails version, shape, digest, ownership, or cycle validation. | Fails closed with zero route execution. |
| Augmentor projection | Conversational capture and presentation of intent, candidates, ambiguity, clarification, and owner-backed state. | Augmentor does not become route, run, artifact, memory, or effect authority. |
| host route decision | Immutable ResonantOS-owned acceptance, rejection, or clarification decision over a displayed disposition. | Happens after resolver output and outside this runtime. |

These are private local candidate terms. No public Arcanum or canonical CAV2
definition is changed.

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
