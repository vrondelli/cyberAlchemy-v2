# W3 — Compatibility and Recovery

Layers/slice: L2-L3 / SFC-S4. Units: SWU-SFC-015 through SWU-SFC-018.

## Outcome

Prove the current/N-1 read policy, immutable historical identity, local recovery
state machine, and an exact acceptance-bound candidate corpus without creating a
release or tag.

## Order and gates

`015 → 016 → 017 → 018` is sequential after the complete W2 join. Historical
bytes cannot be rewritten or deleted to make a test pass. The recovery drill is
local fixture evidence only; rollback, withdrawal, quarantine, and supersession
remain owner-gated. Candidate freeze must bind all selected bytes and every
declared mutant must invalidate acceptance.

Exit requires four passing Task Session and closeout receipts plus an independent
freeze recheck. It makes SWU-SFC-019 eligible; it grants no release authority.
