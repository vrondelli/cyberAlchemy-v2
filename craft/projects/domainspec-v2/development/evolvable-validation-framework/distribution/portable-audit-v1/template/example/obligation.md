# Finite insertion-order check

For the six permutations of the three distinct integers 1, 2, and 3, inserting
them with the ordered implementation must produce exactly [1, 2, 3].

The deliberately broken implementation appends in arrival order. Five of the
six permutations must fail the same oracle. A crash or timeout is not evidence
that this negative control was detected for the intended reason.

This is a native finite example, not a CRABS audit, a merge-law theorem, or a
proof about other values, list lengths, deletions, moves, or memory safety.
