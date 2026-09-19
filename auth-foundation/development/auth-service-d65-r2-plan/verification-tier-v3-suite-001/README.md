# Auth Foundation V3 verification suite

Run `PYTHONDONTWRITEBYTECODE=1 python3 -B run.py --output evidence/author-attempt-005`.

The suite executes Rust EVF verification, Lean proofs, TLC temporal model
checking, Alloy relational model finding, and Soufflé recursive analysis. Every
route includes a mutation control and binds its raw evidence and provider
profile directly into the V3 receipt.

See `AUDIT-SERVICE-PACKAGE.md` for the resulting service deliverable.

`authority_effect: none`

## Open Questions

See [PLAN.md](PLAN.md#open-questions).
