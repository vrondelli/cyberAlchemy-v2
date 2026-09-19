# Historical comparison capacity probe

COMPARISON-CAPACITY-PROBE-R1.json records eight retained discovery-run footprints, including allocated file/directory bytes and exact result hashes. Repeating the largest observed allocation twelve times exceeds the current 120 MiB ordinary run-artifact allowance (128 MiB total including an 8 MiB final reserve). This is an empirical stress projection, not a claim that every new arm will use that size or a proven upper bound.

No files were copied or removed, no provider calls were made, and no frozen storage limits changed. This finding prevents treating existing tiny storage fixtures as evidence that the entire twelve-slot campaign fits. It does not show that current disk capacity is exhausted.

## Open questions

Before dispatch, coordinator must qualify cumulative artifact growth: reduce unnecessary retained duplication or choose an explicitly bounded larger stage with corresponding D:/WSL admission, then verify it with representative retained traces. Source-write growth remains a separate periodic-monitoring limitation. Both choices must preserve receipts, reconstructed predictions, failed costs and final-report reserves; capacity changes cannot alter benchmark acceptance.
