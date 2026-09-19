# Auth Service non-EVF implementation candidate

This directory holds the deterministic local freeze and validation receipt for
the Auth Service work through readiness item 14. Run:

```text
python3 projects/auth-foundation/implementation/authorization-service/scripts/freeze_non_evf_candidate.py
python3 projects/auth-foundation/implementation/authorization-service/scripts/validate_non_evf.py --write-receipt
```

The candidate deliberately excludes EVF. It is therefore not the complete D65
F0 product candidate, does not close J0, and grants no product approval or
operational authority.
