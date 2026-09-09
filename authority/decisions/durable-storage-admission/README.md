# Durable Storage Semantic Admission

Status: accepted exact semantic predecessor
Decision owner: CyberAlchemy v2 product owner plus durable-state capability owner
Authority effect: semantic admission only

`selection.json` records the owner's explicit admission of the exact validated
Product Capability and capability-local business ontology at material digest
`122b7939e2f9d4ffe7662cacf54b9ac82496dc2e28937af0d445a9a2666e0241`.
The admitted package remains byte-identical to the reviewed candidate; this
decision is a separate authority record rather than a rewritten status field.

The decision makes that exact semantic baseline eligible to precede a
separately authorized DomainSpec v2 authored source under CAV2-D65. It does not
adopt the Product Capability through a separate lifecycle act, admit a
DomainSpec profile or source, select a provider, authorize implementation, or
prove conformance or recovery.

Validate from the repository root:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/authority/decisions/durable-storage-admission/validate.py
```

Any change to the bound package or validation receipt makes this decision stale
for continuation. The ontology runtime also binds the whole decision file, so
decision drift blocks its route preflight.
