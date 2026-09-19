# Design Dispatch Technique Trace

The complete route is `DISPATCH-ROUTE.json`. Dispatch Spec validation returns
`flag` only because the Distill native-stage receipt is intentionally `flag`;
no schema, capability metadata, technique, handoff, boundary, or promotion
guardrail error remains.

| Technique | Steps / gate | Why it applied | Evidence |
| --- | --- | --- | --- |
| `sequence` | s1–s8 | Define inputs must close before denominator extraction; Design selection must close before architecture authoring. | `DISPATCH-ROUTE.json` dependencies |
| `frame_handoff` | s1→s2/s3 | Context Builder supplies a bounded obligation frame without copying the full source corpus. | `DEFINE-CONTEXT.md` |
| `owner_boundary_check` | s3, s5, s6, s7, authority gate | Package contracts must not absorb semantic, mapping, pattern, parser, tool, exception, or release authority. | `PRECEDENT-AUDIT.md`, `SOURCE-CONTRACTS.md` |
| `artifact_contract_bridge` | s5/s6 | Required concern outputs select exact architecture extensions and witness contracts. | `DESIGN-SELECTION-RESULT.json`, `ARCHITECTURE.md` |
| `concrete_path_evidence` | s1, s2, s4 | Design scope and source contracts are path/digest-bound. | `DESIGN-SCOPE-MANIFEST.json` |
| `residue_ledger` | s3, s6, s7 | Owner conflicts, unsupported constructs, privacy, performance, migration, and host ambiguity remain visible. | `DEFINE-GAPS.md`, `DESIGN-RISKS-AND-GAPS.md` |
| `validation_loop` | s4/s5 | Extractor and selection validator replay once from immutable inputs. | replay JSON artifacts and byte comparison |
| `observability_grouping` | s8 | Distill child and Invoke parent signals share caller lineage and package scope. | observability envelopes and JSONL ledger |
| `delegation_boundary` | s3 | One helper audited precedents with read-only scope and no final-claim authority. | `PRECEDENT-AUDIT.md` |
| `execution_receipt_handoff` | s3, s8 | Helper/validator/Distill evidence is materialized before parent closeout. | `DISPATCH-ROUTE.json` native receipts |

## Template And Companion Selection

- Base profile: DomainSpec SPEC plus architecture bundle.
- Required: all six architecture views.
- Selected extensions: authority/trust, state/event, failure/compensation,
  quality, integration/versioning, migration/rollout, data lifecycle, and
  validation contracts.
- Not selected: security/abuse, persistence/concurrency, UX plan.
- Recommended only: rollout execution and performance measurement.

## Next-Route Rule

The Design selection gate passed, but the Distill gate flagged owner closures.
Therefore this route ends in deferred Define/Design follow-up, not normal Plan.

