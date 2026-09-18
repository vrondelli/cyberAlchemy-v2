# Glossary

| Term | Meaning in ARE |
| --- | --- |
| ARE | Agent Reasoning Engine, the product described by `product.json`. |
| Authority effect | Whether a record grants authority. ARE evidence normally states `none`. |
| Candidate | An immutable tested product proposal that still lacks product approval. |
| Closure | The exact content-addressed files required by the declared product. |
| Context basis | The selected evidence needed for one request. |
| Context Envelope | An immutable, source-bound projection of the current context basis. |
| Continuation | A decision about completion and possible next objectives. |
| Counterevidence | Evidence recorded against a claim or reusable state. |
| Effect boundary | The point where an exact proposal is assessed before host execution. |
| Epoch | A sealed digest-bound Reasoning State snapshot. |
| Gateway | The authenticated Unix-socket service that retains backend sessions. |
| Improvement Signal | A structured projection of an observed failure or weakness. |
| Module port | A versioned semantic boundary between runtime modules. |
| Reasoning State | Durable append-only reasoning evidence plus derived checkpoints. |
| Receipt | A digest-bound record of inputs, decisions, or observed results. |
| Route | One repository workflow contract selected for a request. |
| Runtime journal | Ordered operational events used for replay and recovery. |
| Stable request ID | A client identity used to avoid duplicate dispatch across reconnects. |
| Span-F1 | Harmonic mean of precision and recall for required answer spans. |
| File-F1 | Harmonic mean of precision and recall for required source files. |
| Percentage point | Absolute difference between percentage values. |

Canonical project definitions remain in
[`authority/definitions/DEFINITIONS.md`](../../../authority/definitions/DEFINITIONS.md).
This glossary explains usage and does not promote new definitions.

## Open Questions

- Which of these terms should be promoted to the canonical definitions source
  after product-owner review?
