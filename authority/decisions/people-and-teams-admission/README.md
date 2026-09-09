# People and Teams Semantic Admission

Status: accepted exact semantic predecessor
Decision owner: CyberAlchemy v2 product owner plus People and Teams product and ontology owners
Authority effect: semantic admission only

`selection.json` records the owner's explicit admission of the exact validated
People and Teams Product Thesis, Product Capability meaning, and business
ontology at material digest
`9093ce70926c60d80ba1ce69917a5789a2af14842b3a03d8fb7717fd70b579b8`.
The admitted package remains byte-identical to the reviewed candidate. This
decision is a separate authority record rather than a rewritten status field.

The decision makes that exact semantic baseline eligible to precede separately
authorized DomainSpec v2 authoring under `CAV2-D65`. It does not admit Person
or Team instances, authorize personal-data processing, adopt the Product
Capability through a separate lifecycle act, admit a DomainSpec profile or
source, authorize implementation, or prove conformance or product outcomes.

Validate from the repository root:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 cyberAlchemy-v2/authority/decisions/people-and-teams-admission/validate.py
```

Any change to the bound package, Product Thesis, Product Capability, source
selections, or validation receipt makes this decision stale for continuation.
