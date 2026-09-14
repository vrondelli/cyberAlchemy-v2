# Exchange task intents for agents and applications

Status: candidate definitions; authority effect: none.
Owner: Exchange product owner.

The owner selected code generation, extraction and summarization and requested a research intent. The owner confirmed `DOMAIN_MODELING` as the fifth intent. Category selection does not finalize the detailed contracts. All five are intended as callable capabilities for agents and applications.

| Intent | Outcome | Selection |
| --- | --- | --- |
| `CODE_GENERATION` | Generate or edit code | owner-selected-category-contract-candidate |
| `STRUCTURED_EXTRACTION` | Extract structured information | owner-selected-category-contract-candidate |
| `TEXT_SUMMARIZATION` | Summarize supplied material | owner-selected-category-contract-candidate |
| `RESEARCH` | Investigate a question with evidence | owner-requested-category-name-and-contract-candidate |
| `DOMAIN_MODELING` | Turn requirements into a domain model | owner-selected-category-contract-candidate |

## CODE_GENERATION

Produce source code satisfying the supplied specification and constraints.

- Input: specification, language/runtime, constraints and optional existing code.
- Output: source code or requested patch.
- Example: Generate an Alch service for a supplied, supported contract.
- Quality: Passes defined functional tests; Compiles/parses for the declared language; Meets interface and dependency constraints.
- Evaluation candidate: Held-out specifications with controlled compile/tests; evaluator execution must have a bounded isolated environment.

Generation does not deploy or execute code. Alch support requires compiler-specific test evidence; plain code output is not that proof.

## STRUCTURED_EXTRACTION

Extract requested fields from supplied text into the specified output schema without inventing missing facts.

- Input: source text, output schema and explicit missing-value policy.
- Output: schema-conforming structured result.
- Example: Extract model name, supported tasks and stated limits from provider documentation.
- Quality: Schema validity; Field correctness; Correct missing/ambiguous-value handling; No unsupported fields.
- Evaluation candidate: Labeled fixtures with expected fields, absent/ambiguous cases and schema checks.

Schema validity alone is not semantic correctness. Missing required evidence follows the requested missing-value policy; no silent factual completion.

## TEXT_SUMMARIZATION

Condense the provided text while preserving its supported meaning and requested emphasis.

- Input: source text and summary constraints.
- Output: summary text.
- Example: Summarize an ARE release report into changes and known limitations.
- Quality: Faithfulness to source; Coverage of required points; Requested length/format; Absence of unsupported additions.
- Evaluation candidate: Reference facts and omissions plus a faithfulness/coverage rubric; no single exact wording is required.

Uses supplied material; fetching documents or verifying their external truth is not part of this intent.

## RESEARCH

Investigate a bounded question using permitted sources and return findings linked to supporting evidence, disagreements and remaining uncertainty.

- Input: question, scope, supplied sources or permitted retrieval capabilities, freshness requirements, time/cost limits.
- Output: findings, claim-to-source references, source provenance, limitations and unresolved questions.
- Example: An agent investigates engine compatibility and produces a cited comparison for an application.
- Quality: Evidence supports each claim; Relevant question coverage; Source quality and freshness; Handling of conflicting evidence and uncertainty.
- Evaluation candidate: Controlled source collections with known supporting/conflicting evidence; verify references and score coverage with a declared rubric.

Retrieval requires explicitly available, authorized tools. Generated citations alone are not verified evidence. External source access, asynchronous execution and budgets require separate contract decisions. Does not authorize purchases or publication.

## DOMAIN_MODELING

Transform requirements and source context into a candidate domain model with defined concepts, relationships, constraints, source links and unresolved owner decisions.

- Input: requirements, domain context, source definitions and optional target profile.
- Output: candidate definitions, entities, relationships, rules, constraints, traceability and open questions.
- Example: Describe a reservation service; receive Reservation and Booking definitions, expiry rules and unresolved decisions for later Craft/DomainSpec construction.
- Quality: Requirement coverage; Consistent definitions and relationships; Source traceability; Explicit handling of ambiguity; Constraint consistency.
- Evaluation candidate: Reference requirements and adversarial ambiguity cases; structural checks plus independent semantic review. Compiler checks apply only to an explicitly supported generated profile.

Draws on Define and Craft. Proposes domain meaning beyond extracting existing fields; produces a model rather than source code. Output is not canonical authority, an admitted Definition Pack or deployment approval. Exact DomainSpec/Alch serialization remains open.

## Reuse and execution

[Define](../../../define/docs/DEFINITION-PACK.md) supplies the source-linked meaning and open-question discipline. [Craft](../../../product/craft/CONSTRUCTION-FEEDBACK-LOOP.md) explains the subsequent path from domain meaning to construction and independent evidence. These are sources for the proposed domain-modeling capability, not proof that a public endpoint exists.

Research → domain modeling → code generation is a possible composition: investigate, model, then construct. Each step has a distinct result and evaluation contract. Applications can also call each independently.

The proposed capability declaration advertises intent versions, schemas, profiles, limits and execution requirements. Exchange filters by audience, authorization, support, readiness and accepted terms before quality ranking. Research additionally needs permitted source access. Agent capability discovery alone grants no access.

Existing `text.generate` transport covers model calls, not the five contracts or an agentic research service. Long-running jobs, cancellation and tool budgets remain open. Quality belongs to the intent and execution configuration; compare latency within comparable workloads. Unknown quality remains unknown.

Earlier chat and translation proposals are deferred from this first-five draft. Definitions, source hashes and detailed routing proposals are in [INFERENCE-INTENTS.json](INFERENCE-INTENTS.json).

## Open Questions

[Q23](OPEN-QUESTIONS.md#q23-exchange-product-owner) owns initial profiles, research sources/tools/budgets and output formats. [Q22](OPEN-QUESTIONS.md#q22-exchange-productnetwork-owner) owns who evaluates quality. No evaluator authority or scoring weights are selected here.
