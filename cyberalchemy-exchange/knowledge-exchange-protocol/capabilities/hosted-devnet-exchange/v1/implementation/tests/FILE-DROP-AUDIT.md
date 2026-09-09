# Local file-drop audit — 2026-09-06

Product construction: compact console file selection and browser regressions.
Operational support: local KEP operator rebuilt the embedded UI binary and
restarted only port 8783 against the existing database. Public deployment is deferred.

Cause: the running binary embedded the earlier console assets. Both served JS
and CSS differed from the generated files. After rebuilding with
`cargo build --offline --locked --features ui --bin hosted` and restarting,
both HTTP responses matched the local assets byte for byte.

Validation: 41 JavaScript tests pass; all three bundle comparisons pass.
`file-drop-browser.js` passed 19 browser assertions: selection, highlight,
retention opening, acceptance reset, oversized/multiple/folder rejection,
previous selection preservation, outside-drop prevention, picker and focus,
no overflow at 320/375/768/1440, and no browser errors.
Busy-drop rejection is covered by the unit tests.

Reproduce against the local server: create `/tmp/kep-drop-picker.txt` containing
any short text, then pass `tests/file-drop-browser.js` to playwright-cli
`run-code` in an open browser session. The script uses an isolated context,
synthetic DataTransfer events and a stubbed directory entry; it does not
perform an OS file-manager drag, create an account, or upload content.
The initial harness attempts exposed directory-stub and unavailable Buffer
issues; these were corrected before the passing run.

Historical deployment receipts were preserved. This is local UI evidence,
not an online deployment or an end-to-end exchange receipt.
