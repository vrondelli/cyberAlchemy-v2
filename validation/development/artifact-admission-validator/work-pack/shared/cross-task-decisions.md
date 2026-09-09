# Cross-Task Decisions

| Decision | Choice | Reason | Revisit Trigger |
| --- | --- | --- | --- |
| Input format | JSON | Standard-library parsing and stable machine receipts without a new dependency. | CAV2 adopts a repository-wide artifact metadata format. |
| Policy source | Parse Canonical Kinds Markdown directly | Preserve current authority and avoid a validation-owned shadow registry. | Ontology owner publishes an approved machine projection. |
| Parser posture | Strict, header-driven, fail closed | Formatting drift must not become allow-by-default. | Approved source format changes. |
| Validation phases | `pre` and `post` | C18 acts before mutation while C7/C14 need post-mutation evidence. | A transactional creation workflow replaces two-phase checks. |
| Working material | Lightweight and inheritable | Avoid burdening scratch files while blocking false durable/authority claims. | C18 changes. |
| Durability override | Defer when owner note exists; block when absent | Carrier is unresolved under Canonical Kinds OQ-3. | OQ-3 owner decision. |
| Rollout | Manual/local pilot through L2 | No evidence supports CI blocking yet. | Stable L2 receipts and owner approval. |
