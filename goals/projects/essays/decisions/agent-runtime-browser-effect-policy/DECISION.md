# Essays Agent Runtime Browser Effect Policy

Result: selected, pending security and Work Owner review

Selected option: `OPT-BROWSER-EFFECT-SCOPED-GRANTS`

Authority effect: none

Each supervised browser context receives an immutable, short-lived grant that
binds its actor, workspace, origins, action classes, credential and file
handles, budgets, evidence policy, validity, and revocation generation. The
Rust daemon evaluates the grant before every requested or dynamically derived
action.

Redirects, popups, downloads, permissions, dialogs, and other expansions do
not inherit authority automatically. Sensitive or irreversible actions always
require a fresh exact one-shot approval. Uploads use digest-bound handles;
downloads remain quarantined until separately approved for release.

An effectful action is never retried implicitly. A crash, timeout, disconnect,
or ambiguous page state after dispatch is recorded as `uncertain` and blocks
dependent work until reconciliation.

This decision creates no grant, credential, browser process, or external-effect
authority. The machine-readable decision is `selection.json`, bound to request
digest `a1d7ef449419a29ef5d2dd1b7b00a72f86f1a779c0e5a0d2dd12a9a5650c3529`.
