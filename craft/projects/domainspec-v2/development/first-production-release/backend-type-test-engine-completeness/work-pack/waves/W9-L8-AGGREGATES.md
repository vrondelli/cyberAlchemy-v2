# W9 — L8 Consumer And Terminal Aggregates

## Question

Do exact fresh IOLM and Body War replays plus the unchanged core compose into
fail-closed consumer and terminal results?

## Entry, Work, Exit

Entry requires both W8 ReplayResults and the exact W7 core handle. Run only
consumer/terminal required-check manifests, joins, aggregates, and independent
replay. Exit requires `verify:bte:consumers` and terminal `verify:bte` to reject
every missing/extra/duplicate/stale/self-authored/literal-pass substitution.
Passing output remains non-admitting and routes to lifecycle owners.
