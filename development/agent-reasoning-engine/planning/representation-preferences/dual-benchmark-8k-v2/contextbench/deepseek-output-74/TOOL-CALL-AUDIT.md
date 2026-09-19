# Tool-call failure audit

Round 73's ARE runs 2 and 4 stopped with `glm.tool-calls-invalid` after known paid
responses. Their receipts identify `finish_reason: tool_calls` but do not retain
the array shape. [Audit facts](TOOL-CALL-AUDIT.json) retain exact evidence paths.

The failing predicate requires `tool_calls` to be an array with one to eight
entries. Therefore a missing/non-array value, an empty array, or more than eight
calls can trigger the same error. The old records cannot distinguish these cases.
There is no basis to blame a particular tool argument, field, source path, or
provider behavior. The failure is distinct from the output-cap error.

Round 74 adds `tool_call_shape` only when that existing predicate fails. It records
presence, array type and count before preserving the same rejection. Offline tests
cover missing, non-array, empty, oversized and valid arrays and verify that costs
and diagnostics survive in the ledger. No diagnostic is sent back to the model;
no new attempt occurs. This changes observability, not the recovery policy.

A later recovery experiment should use complete centralized response validation
and bounded diagnostic feedback, not a sequence of field-specific repairs. Do not
execute partial tool calls or invent arguments to obtain a successful benchmark.

## Open questions

Which shape occurs in real GLM responses? Does a larger output allowance affect
its frequency? Can a general validator plus feedback recover the response while
preserving source evidence and counting all additional model tokens?
