# Post-L4 Test Campaign

Run only after explicit user authorization. The default campaign is local and
non-effectful: Playwright and Wasmtime remain disabled and no remote listener,
credential, publication, or deployment is used.

```bash
cargo fmt --check
cargo clippy --locked --all-targets -- -D warnings
cargo test --locked
node --check browser/playwright-runner.mjs
cargo check --locked --manifest-path desktop/src-tauri/Cargo.toml
python3 ../conformance/bridge-ontology/scripts/validate.py
```

After those checks pass:

1. execute CLI, Unix IPC, HTTP/DPoP, SSE cursor, and Tauri golden traces;
2. run crash-point and replay fixtures against temporary SQLite databases;
3. ask exactly one bounded helper to refresh and self-validate the exact
   implementation binding;
4. independently validate that binding and request human pre-merge review.

Live Playwright, Wasmtime, real TLS credentials, and non-loopback endpoints are
separate optional campaigns and are not authorized by the local test campaign.
