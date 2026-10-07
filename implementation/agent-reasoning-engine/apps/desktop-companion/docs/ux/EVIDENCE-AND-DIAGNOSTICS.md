# Evidence and diagnostics UX brief

Status: candidate design. Question: **What does this warning mean?** This is
an explanation and traceability page, not a repair console.

## User journey

1. Open a warning from Overview, Adapters, Threads, Decisions, or Evolution. Land on
   the exact issue, not the top of an undifferentiated log.
2. Read a plain-language meaning and scope: what was checked, what failed or
   could not be observed, and what remains unaffected.
3. Expand technical evidence for source, observation time, reason codes,
   schema/version, and digest when needed for review.
4. Return to the originating page. If no safe next action exists, say so.

## Minimum effective screen

- One issue summary with severity derived from the exact source, never color
  alone. Separate product diagnostic, adapter process, transport connection,
  adapter readiness, storage, and evolution checks.
- One provenance line: source, scope, observed time, and freshness.
- Expandable technical details; redact secrets and private content by default.
- No “repair,” “clear lock,” “delete state,” or “approve” action in this view.

The [current dashboard](../../ui/dashboard.html) exposes a digest and reason
codes from [`get_snapshot`](../../src-tauri/src/main.rs). A source-status card
now keeps product diagnostic, adapter path, backend threads, Evolution ledger,
gateway improvement-candidate inbox, and bounded gateway-consumer decision trace
separate, with a link to each owning page. Each row now explains its source
scope and posture and shows the last successful read time. During a retry it
shows Reading, not an older Observed claim. File-backed consumers can recover
content-free evaluations, but the current gateway read is not complete or
host-wide history; the candidate inbox does not admit an Evolution cycle.
It is an overview of read postures. The first bounded issue journey links
Overview directly to the product-diagnostic card, focuses it for keyboard
readers, and explains stable `doctor` reason-code families in plain language;
technical codes remain expandable and path-like details are withheld. Adapters,
Threads, Decisions, Evolution ledger and the separate gateway candidate inbox
now each link to their exact, focusable Evidence source row. Each row keeps a
source-specific meaning, observation time and return link to its owning page.
This is navigation and explanation only, not a repair control. A complete
reason catalog and deeper lower-layer diagnostics remain open. A passing
product doctor must not be relabelled as gateway, model, or storage readiness.
If evidence is absent, show “not observed,” not “passed.”
The product diagnostic now has its own ten-second freshness check. Expiry,
stale input, and a failed retry remove its current PASS styling while keeping
older values explicitly labelled last seen; the other source postures do not
change with it. The 27-test UI fixture suite passes this boundary, the
product-reason explanation/technical-code split, and the independent source
status meanings. The isolated Chromium journey passes 56 checks, including
product-issue focus, six source explanations, independent candidate/ledger
postures, narrow-screen containment, and gateway-epoch consistency for the
Decisions source in either read order. A changed gateway epoch now removes an
earlier current Decisions claim, including its Evidence row; a decision read
without an epoch is incompatible. A later [current-source staged Windows
WebView2 check](../WINDOWS-EVIDENCE-LINKS-TEST-2026-09-27.md) passed the same
five source links and return journeys in unconfigured and live-fixture modes;
the installer was not run. Exact lower-layer failure reasons and issue-specific
technical drill-down beyond the source rows remain open.

## State contract

| State | User-facing meaning |
| --- | --- |
| Observed | A specific diagnostic completed; show its scope and result. |
| No findings | “This check reported no reason codes,” not “all ARE systems healthy.” |
| Stale | Keep the last result with its age and remove current-success styling. |
| Not configured | Name the missing diagnostic source without inventing a failure. |
| Unavailable | Name the failed read, preserve safe prior evidence, and offer Retry. |

## Experience checks

- A reader can explain what one reason code means without copying raw JSON.
- A previous PASS followed by a timeout never presents as current success.
- Keyboard focus reaches the exact issue from its source page and returns
  without losing context; status updates are announced without focus theft.

## Open Questions

- Who owns plain-language explanations for each stable reason code?
- What redacted diagnostic summary, if any, may be copied for support without
  exposing paths, secrets, or private thread content?
