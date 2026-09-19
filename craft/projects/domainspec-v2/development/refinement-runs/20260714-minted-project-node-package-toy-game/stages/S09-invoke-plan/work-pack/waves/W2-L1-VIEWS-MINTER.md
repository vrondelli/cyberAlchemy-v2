# W2 — L1 Views and Minter

Layer question: can generated views and project emission repeat the L0 contract without authority or path leakage?

- Entry: W1 receipt with exact output schemas and compiler digest.
- Order: SWU-MNP-004 → SWU-MNP-005; sequential because minter embeds generator/tool handles.
- Tasks: [VIEWS](../tasks/TASK-MNP-VIEWS.md), [MINTER](../tasks/TASK-MNP-MINTER.md).
- Exit: source-aware receipt verification, stale-output failures, clean mint/rebuild, contained `generated_root`, leakage scan, rollback proof.
- Stop: Markdown needed for machine semantics, partial destination state, DomainSpec fixture content/path in minted project, or generated output outside project.

Progress: SWU-MNP-004, SWU-MNP-001-R2, and SWU-MNP-005 retry 001 completed
with passing receipts; W2 exit satisfied.
