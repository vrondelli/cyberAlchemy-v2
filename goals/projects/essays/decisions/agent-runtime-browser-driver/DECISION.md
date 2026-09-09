# Essays Agent Runtime Browser Driver

Result: selected, pending security and effect-policy owner review

Selected option: `OPT-BROWSER-PLAYWRIGHT-SUPERVISOR`

Authority effect: none

A pinned Playwright process, supervised by the Rust daemon, drives a separate
browser outside the Tauri application WebView. The daemon remains the only
accepted-state authority and the only process permitted to submit typed browser
action envelopes.

Isolated non-persistent contexts are the default. Navigation, popups, dialogs,
permissions, credentials, downloads, uploads, external protocols, and raw CDP
must cross the separately selected browser-effect policy. Any timeout, crash,
or disconnect after a potentially effectful dispatch produces an explicit
uncertain outcome and is never retried implicitly.

The exact Playwright release, JavaScript runtime, browser build, packaging, and
supervisor protocol remain later frozen implementation bindings. No dependency
installation, browser launch, navigation, credential use, or external effect is
authorized by this decision.

The machine-readable decision is `selection.json`, bound to request digest
`f90e2de87eb9be7b62811ab5d9d741ba762cb16510a949f8b23485689de6c96d`.
