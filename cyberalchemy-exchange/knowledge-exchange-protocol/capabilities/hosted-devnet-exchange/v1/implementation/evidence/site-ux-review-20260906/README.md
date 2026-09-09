# KEP site UX review — local test epoch

Product construction: standalone paper route, obsolete UI-copy removal,
recipient automatic save, inline dismissible notifications, and public receiving
card copy/disclosure. Source decisions and implementation are complete for local review.

Operational support: the prior local server/database was unavailable. A separate
Docker database `kep-ux-review-20260906` was created with loopback port 32773;
the rebuilt hosted binary runs on 127.0.0.1:8783. Existing remote accounts,
wallet keys, image grants, deployment receipts and old workbench source are preserved.
Public deployment is deferred to its own tested-image deployment envelope.

## Results

- 47 JavaScript tests PASS, all three bundle comparisons PASS, generated paper
  comparison PASS (`npm test`).
- Rust interface assets/security and readiness tests PASS.
- Navigation browser regression PASS at 320/375/768/1440, including direct legacy
  paper anchor, refresh, Back/Forward, SVG logos and keyboard disclosures.
- Console browser regression PASS: 20 assertions covering hidden public card,
  inline copy confirmation, clipboard-denied manual fallback, notification
  dismissal/expiry/navigation, denied/expired/interrupted access, automatic save
  despite acknowledgement failure, acknowledgement retry, no network on Save again,
  responsive layouts and absence of browser errors.
- Selected PNG: 1,561,871 bytes; SHA-256
  `fd47854b6ba52295fc5fdefe0b64d458478b8033957d73e7194c8e2b0a8211dd`.
  Both automatic browser download and Save again matched the original exactly.
- Served JS/CSS/redirect/paper bytes match local sources.

## Reproduce

`npm run build:paper`, `npm run build:console`, `npm test`, then
`cargo test --offline --locked --features ui --test interface_assets --test readiness`.
Rebuild `cargo build --offline --locked --features ui --bin hosted` and restart the
local server to refresh embedded assets. Run `tests/browser-regressions.js` and
`tests/console-ux-browser.js` through playwright-cli run-code in an open session.
For the latter create `/tmp/kep-ux-browser` with an `original.bin` fixture first.
The runner saves test-only recovery and downloaded files there; do not commit them.

## Scope and limitations

The account browser test uses an isolated generated wallet and the local backend;
no real wallet extension or new public Devnet transaction was exercised. Access
403/410/503 and acknowledgement failure are injected HTTP responses. Real crypto,
local upload, download, acknowledgement retry and browser download events are used.
The tested image was downloaded as `original.bin` to compare bytes independent of
its extension. Recovery and receiving identity are distinct. Copy tests stub the
clipboard to exercise both success and denied branches deterministically.

Historical proof/review limitations in the paper remain accurate scope markers;
removing obsolete prototype interface labels does not establish Mainnet readiness
or upgrade old proof receipts. `/workbench` now redirects by fragment and no longer
serves its old combined interface; its source stays on disk as paper source input.
