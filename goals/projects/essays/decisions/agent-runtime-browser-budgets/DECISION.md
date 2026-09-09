# Essays Agent Runtime Browser Budgets

Result: selected as unproven first-vertical safety ceilings

Selected option: `OPT-BROWSER-BUDGET-LEAN-CONTROLLED`

Authority effect: none

The first supervised browser vertical uses one browser instance, one isolated
non-persistent context, at most four pages, and one in-flight action. The
Playwright supervisor and full browser descendant tree are limited to 768 MiB
RSS. Browser launch-ready p95 is limited to 2.5 seconds on the selected Linux
reference host.

A session expires after 15 minutes or 100 actions. Captured artifacts are
limited to 128 MiB, quarantine to 512 MiB, each download to 256 MiB, and each
upload to 64 MiB. All sizes apply before compression. Capability grants may
narrow these ceilings but cannot expand or reset them.

Exhaustion fails explicitly. If resource termination interrupts a potentially
effectful action after dispatch, the result is `uncertain`, dependent work
stops, and no implicit retry occurs.

This decision grants no browser action and does not satisfy the pending
security and Work Owner gate. The machine-readable decision is `selection.json`,
bound to request digest
`affc7d00e98a36862de7e2cc46d787014d7e28441ef949151e609d8cdaa1536b`.
