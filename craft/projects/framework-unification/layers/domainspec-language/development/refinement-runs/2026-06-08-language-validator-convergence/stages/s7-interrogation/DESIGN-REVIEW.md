# Interrogation refine-design-review — Circularity Re-attack (s7)

The circularity-skeptic re-attacks the compiler-pair design.

- **Attack 1 — "disjoint facts is a claim, not a guarantee."** Could `K↓`
  accidentally read a verdict (e.g. derive obligations only from *promoted*
  contracts)? *Yes — that would re-close the loop.* **Repair:** `K↓` reads
  contract *content* regardless of lifecycle status; a contract's obligations
  compile to the table whether or not it is `validated`. Status must not gate
  derivation. Recorded as invariant I-K↓-status-blind.
- **Attack 2 — "warn-before-fail still oscillates if two contracts disagree."**
  Conflicting obligations from different contracts on the same `Meta`. *Real.*
  **Repair:** conflicts surface as a `gap`/`decision` record (DESIGN-PACKAGE
  sub-records), not as silent fail-flip; convergence holds because the conflict
  halts graduation rather than toggling pass/fail. Residue R-obligation-conflict.
- **Attack 3 — "P8 human gate makes the loop not really mutual."** *Rejected as
  objection:* mutual dependency is about D1∧D2 derivation, not full automation.
  P8 staying human is the honesty boundary, not a coupling gap.

## Verdict: PASS (provisional). DEC-CONV-01 survives.
Two invariants added (I-K↓-status-blind; conflicts→gap-record), one residue
(R-obligation-conflict). The acyclicity + bootstrap story is unbroken.
