# TASK-UCFE-VERIFY

## Objective

Audit the Form pilot and reusable profile, then emit bounded continuation routes.

## Smallest Working Unit Exemption

### SWU-UCFE-010 - Integrated Pilot Audit

This closure-only VERIFY unit runs after accepted execution or explicit branch
skip receipts for SWU-001 through 009.

**Audit order:** verify contracts/identity; preregistration immutability;
coverage isolation; corpus authorship/style; separation experiments; reviewer
independence; disposition precedence; owner firewall; profile leakage;
source/canonical immutability; observability and receipt closure.

**Write scope:** `audit/form-pilot-001/` and `runs/SWU-UCFE-010/` only.

**Done criteria:** process result is pass/flag/block independently of Form's
candidate disposition; active evidence gaps and owner routes are explicit; no
authority status changed.

**Acceptance evidence:** integrated manifest/result, package tests, DomainSpec
aggregate validation, immutable-source hash audit, SWU receipt.

**Verification:**

```bash
node --test projects/domainspec-v2/development/ui-candidate-formalization-experiments/tests/*.test.mjs
npm --prefix projects/domainspec-v2/impl run typecheck
npm --prefix projects/domainspec-v2/impl run validate
```

**Execution owner:** local-fallback through Task Session.

**Context Builder anchors:** all accepted/skip receipts, Form disposition,
profile generation, source contracts, gaps, and authority digests.

**Handoff:** propose one next candidate only after explicit owner selection.
