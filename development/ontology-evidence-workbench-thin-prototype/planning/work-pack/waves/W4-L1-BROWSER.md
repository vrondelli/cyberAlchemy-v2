# W4: L1 Browser Acceptance

- Layer question: after this wave, has one real current Chromium executed the
  complete Poker-Team trust and inspection journey?
- Task: [TASK-OEWTP-04](../tasks/TASK-OEWTP-04-BROWSER-ACCEPTANCE.md)
- SWU: SWU-OEWTP-004
- Dependency: W3 source and owner receipts
- Parallelism: none

## Exit gate

- active Playwright absolute API and its `chromium.executablePath()` result are
  version/path/digest bound;
- all thirteen named browser assertions pass;
- console/page errors and outbound requests are zero;
- browser, gateway, port, profile, and temporary roots close;
- bounded browser receipt, request/console ledgers, and required screenshot are
  complete.

The result is producer evidence at the fixed one-local-journey ceiling. W5 may
complete a read-only recomposition audit; independent immutable verification
remains L2.
