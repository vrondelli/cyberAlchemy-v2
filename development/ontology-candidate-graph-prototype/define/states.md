# States

## Disposition State

`PolicyDisposition` is terminal for one evaluation:

```text
unevaluated
  ├── policy-pass
  ├── policy-fail
  └── policy-indeterminate
```

No disposition transitions into authority, promotion, or canonical meaning.
Changing a fixture or policy creates a new evaluation identity.

| State | Required reason | Meaning |
| --- | --- | --- |
| `policy-pass` | `POLICY_RULES_SATISFIED` | The finite declared policy found no violation |
| `policy-fail` | stable violation code | The finite declared policy found a violation |
| `policy-indeterminate` | stable missing-owner/rule code | The policy cannot decide the candidate |

## Run State

```text
new -> evaluated -> projected -> isolation-checked -> receipt-complete
  \-> failed-in-isolated-output
```

Only `receipt-complete` is inspectable as a completed run. There is no retry
mutation; a retry uses a new run ID.
