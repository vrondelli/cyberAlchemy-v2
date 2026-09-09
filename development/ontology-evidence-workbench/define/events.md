# Events

| Event | Required fields | Effect |
| --- | --- | --- |
| `bundle.verification.started` | run path, verifier version | none |
| `bundle.verification.passed` | run ID, receipt digest, source digest | unlock adapter |
| `bundle.verification.rejected` | diagnostic, residue path | block |
| `adapter.projection.completed` | adapter version, source/output digests, mapping counts | unlock adapter validation |
| `adapter.validation.passed` | receipt ID, determinism result | unlock serving |
| `viewer.started` | loopback address, token issuance, adapter receipt | local session only |
| `view.selection.changed` | source ref, surface | ephemeral UI state |
| `tour.step.changed` | tour ID, step, source refs | ephemeral UI state |
| `code-context.attached` | code graph digest, mapping digest | optional separate lane |

These events are operational evidence or transient UI signals. They do not
promote ontology meaning, glossary terms, product acceptance, or release state.

## Open Questions

See [SPEC.md](SPEC.md#open-questions).
