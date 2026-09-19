# Auth Service EVF Campaign v1

Status: executable campaign candidate with run-local evidence.

This package challenges the exact current Auth Service candidate across the
binding, derivation, lineage, observation, provider, scope, and semantic seams.
Synthetic fixtures validate only the campaign mechanics. They are not product
or EVF evidence.

Check readiness without running Auth or EVF tests:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 \
  projects/auth-foundation/development/auth-service-d65-r2-plan/evf-campaign-v1/validate_campaign.py
```

Run the frozen campaign twice and replace its run-local evidence:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 \
  projects/auth-foundation/development/auth-service-d65-r2-plan/evf-campaign-v1/run_campaign.py
```

Every mutation operator must match exactly once and prove that it changed
bytes before its detector can adjudicate the mutant. The runner rehashes every
candidate binding, executes all fourteen cases twice, validates observation
shape and cardinality, and only then writes `observations.jsonl` and
`EVF-RECEIPT.json`.
