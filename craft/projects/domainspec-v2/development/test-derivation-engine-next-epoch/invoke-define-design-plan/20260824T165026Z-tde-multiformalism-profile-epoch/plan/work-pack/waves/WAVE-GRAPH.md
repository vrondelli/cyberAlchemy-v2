# Wave Graph

W0 owner/verifier admission and Refresh gates W1.

W1: 001 registry/contracts.

W2: 002 intake, then 003 neutral derivation.

W3: 004 TypeScript trust lane freezes the shared contract.

W4: 005 Python and 006 Rust run independently after W3.

W5: 007 extension contract depends on 001 and 004; 008 Lean/EVF handoff depends on 002. They are separately owned and may proceed independently.

W6: 009 joins 004, 005, and 006 for semantic parity.

W7: 010 closes only after 007, 008, and 009.

Any change to a frozen dependency invalidates all downstream receipts and returns to Refresh before re-entry.
