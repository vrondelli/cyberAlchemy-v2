# Auth Service W4 — candidate freeze and test denominator

W4 implements only the `AUTH-D65-SWU-FREEZE` boundary:

- `F0` freezes the exact D0–V0 Auth Service artifacts and required tool identities;
- `PT0` closes a unique, collect-all E0–E3 product-test denominator;
- the receipt proves deterministic W4 materialization and preserves the W3 test prerequisite.

W4 deliberately does not execute W5. Every denominator check remains
`pending-w5`, `J0` is unresolved, and product approval is not requested.

Materialize from the repository root:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 projects/auth-foundation/development/auth-service-d65-r2-plan/w4/freeze_w4.py --materialize
```

Verify current bytes without rerunning Rust tests:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 projects/auth-foundation/development/auth-service-d65-r2-plan/w4/freeze_w4.py
```

Verify and replay the W3 prerequisite:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 projects/auth-foundation/development/auth-service-d65-r2-plan/w4/freeze_w4.py --run-precondition
```

Any candidate-bound artifact or tool drift blocks verification and requires a
new prototype epoch. A W4 PASS grants no product approval, admission,
activation, publication, release, deployment, production-security claim, or
external-effect authority.
