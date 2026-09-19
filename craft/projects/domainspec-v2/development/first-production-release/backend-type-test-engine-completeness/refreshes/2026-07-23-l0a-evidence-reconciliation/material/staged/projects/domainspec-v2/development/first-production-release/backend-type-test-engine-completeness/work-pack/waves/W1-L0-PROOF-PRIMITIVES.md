# W1 — L0A Contract Publication And Evidence Repair

## Question

Do current machine-contract and diagnostic bytes exactly reproduce the
immutable L0A publication receipt before independent red cases are authored?

## Entry, Work, Exit

Historical entry required W0 and explicit selection of `SWU-BTE-L0A-001`; that
Task Session returned a pass receipt. Current entry requires the applied
evidence-reconciliation package and explicit selection of exactly
`SWU-BTE-L0A-REPAIR-001`.

Execute only the nine declared one-LF byte repairs and append-only Task Session
evidence. Exit requires exact immutable receipt digests, a passing existing
`verify:bte:contract-publication`, unchanged historical receipt/manifest bytes,
and a non-admitting repair receipt. It does not consume a red manifest.

Failure remains in L0A repair. Passing routes to Invoke Refresh for receipt
synchronization; only that refresh may route the validation owner for the
package-local red-manifest freeze. W1 never opens W2 directly.
