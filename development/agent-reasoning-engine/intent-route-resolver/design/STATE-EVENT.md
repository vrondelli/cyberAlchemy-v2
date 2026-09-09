# State and event contract

One invocation has no durable internal state. Its logical progression is:

```text
RECEIVED -> REQUEST_VALIDATED -> CATALOG_VALIDATED -> EVALUATED
         -> REDUCED -> DISPOSITION_ASSEMBLED -> RETURNED
```

Validation failure transitions directly to `DISPOSITION_ASSEMBLED(invalid)`.
No state may transition from `RETURNED`. Clarification creates a new request
with a new request ID and an explicit `supersedes_request_id`; it does not
mutate the prior disposition.

Forbidden transitions:

- `RECEIVED -> EXECUTING`;
- `EVALUATED -> APPROVED`;
- `candidate -> dispatched`;
- mutation of a prior request or disposition; and
- reuse of a disposition under a different catalog digest.

Open questions are owned in [../OPEN-QUESTIONS.md](../OPEN-QUESTIONS.md).
