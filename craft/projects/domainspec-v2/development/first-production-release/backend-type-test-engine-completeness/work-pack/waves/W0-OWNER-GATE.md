> **Historical, non-executable after 2026-07-22.** See `../HISTORICAL-MAP.md` and `W0-REFRESH-HANDOFF.md`.

# W0 — Owner gate

## Question

Which successor minted-project profile/version owns the exact 13 backend kinds, 16 backend signatures, independent edge roots, and consumer-proof boundary?

## Entry evidence

- FPR01 is closed.
- The current experimental profile covers four backend kinds.
- The FPR-02 lane split is closed and the FPR-02B backend decision is accepted.
- FPR-02U progress and completion are not entry evidence.
- This refresh records `feature-with-independent-node-and-edge-files@1`, exact 13/16 breadth, and read-only IOLM/Body War consumers.

## Allowed work

- Review `DECISIONS.md`, the profile/version proposal, and the body-to-criterion mapping.
- Record the owner decision and synchronized receipt.
- No implementation or release-state mutation.

## Exit gate

- B-BTE-001 and B-BTE-002 are closed by the accepted FPR-02B decision naming profile ID/version, exact kind/signature sets, source roots, and preserved non-goals.

## Promotion

After W0 verification, select only one dependency-ready SWU through a bounded Task Session. No implementation or release unit is promoted by this gate.
