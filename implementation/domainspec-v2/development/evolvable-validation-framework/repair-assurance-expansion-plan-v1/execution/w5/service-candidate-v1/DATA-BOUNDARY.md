# Customer data and access boundary

## Default boundary

Use the smallest reproducible data and access set. Prefer synthetic fixtures or
customer-sanitized snapshots when they preserve the property. Never substitute
synthetic data when doing so changes the rule under assessment.

Before transfer, record classification, purpose, permitted users, permitted
environment, encryption method, secret handling, logging, retention, deletion,
incident handling and subprocessor constraints. Production credentials and
production write capability are excluded unless separately authorized for a
specific need; this candidate assumes neither.

## Technical controls required for a pilot

- isolated project workspace and per-engagement access list;
- exact source/data intake manifest and transfer receipt;
- secrets supplied through an agreed secret channel and excluded from evidence;
- no model or service training on customer data;
- output review for confidential data before delivery;
- immutable or append-only raw evidence for the accepted epoch;
- retention clock starting at acceptance or termination;
- attributable deletion record covering working copies, caches and backups
  within the contracted capability; and
- separate authorization for any external service or subprocessor.

## Contract fields to decide

| Field | Pilot value |
| --- | --- |
| Data controller/owner | TBD |
| Processing purpose | Property assessment and optional repair verification |
| Data classes allowed | TBD |
| Storage/processing region | TBD |
| Named subprocessors | TBD |
| Retention period | TBD |
| Backup deletion behavior | TBD |
| Breach notification interval | TBD |
| Evidence ownership and reuse | TBD |
| Customer export and deletion format | TBD |

## Open Questions

The pilot cannot begin until all TBD fields that apply to the selected customer
are resolved and contractually assigned.

