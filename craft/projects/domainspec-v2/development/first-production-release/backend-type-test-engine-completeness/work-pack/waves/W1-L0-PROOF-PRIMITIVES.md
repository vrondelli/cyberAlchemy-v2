# W1 — L0A Contract Publication And Evidence Repair

## Question

Do current machine-contract and diagnostic bytes exactly reproduce the
immutable L0A publication receipt before independent red cases are authored?

## Entry, Work, Exit

Historical entry required W0 and explicit selection of `SWU-BTE-L0A-001`; that
Task Session returned a pass receipt. The applied evidence-reconciliation
package then exposed exactly `SWU-BTE-L0A-REPAIR-001`, whose Task Session also
returned a pass receipt.

The repair executed only the nine declared one-LF byte repairs and append-only
Task Session evidence. Exit has exact immutable receipt digests, a passing
`verify:bte:contract-publication`, unchanged historical receipt/manifest bytes,
and a non-admitting repair receipt. It consumed no red manifest.

W1 is complete and green. Its receipt-sync refresh routes the validation owner
for the package-local red-manifest freeze. W1 never opens W2 directly.
