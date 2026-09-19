# Auth Foundation EVF V0-V2 bridge

This additive candidate package runs the exact Auth fail-closed authorization
property through the EVF verification-tier enforcement kernel.

Run:

```sh
/usr/bin/python3.14 -B run.py --output evidence/author-attempt-002
/usr/bin/python3.14 -B -m unittest -v test_bridge.py
```

The run performs two fresh independent-verifier executions over the sealed Auth
executable and theorem EVF evidence, constructs exact provider receipts, maps
the existing hostile controls to all V2 classes, and evaluates V0, V1, and V2
without voting or automatic downgrade.

The result remains candidate evidence with `authority_effect: none`.

## Open Questions

See [PLAN.md](PLAN.md#open-questions).
