# Plan traceability

| User-requested step | Plan location | Evidence required |
| --- | --- | --- |
| Use the first replay's native execution model | T0; DAG B | Legacy Task Session gate removed, technical readiness derived from actual checks, and successor freeze. |
| Run three-replica cases | T2; DAG F | 48 native, 48 sanitizer and two CBMC typed records. |
| Seed defective repairs | T3; DAG G | Frozen mutation/control manifest and isolated inputs. |
| Verify every defect is detected | T3; DAG G/H | Raw-derived non-pass for every selected control. |
| Independent replay | T4; DAG R/I/J | Separate reviewer evidence and promotion decision. |
| Transfer to financial settlement | T5; DAG K/L/M | Owner property decision, exact binding, typed result and replay. |
| Package commercial service | T6; DAG N/O | Evidence-linked templates, measured economics and owner decision. |

Existing implementation detail R00-R09 remains owned by
[the partial-knowledge repair plan](../../../crabs-partial-knowledge-move-candidate-v1/implementation-repair-plan.md).
This successor package owns sequencing, cross-target transfer and service
packaging; it does not silently redefine those repair requirements.

## Open Questions

See [WORK-PACK.md](../../WORK-PACK.md#blockers-and-open-questions).
