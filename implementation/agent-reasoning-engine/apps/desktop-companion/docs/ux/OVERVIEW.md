# Overview UX brief

Status: candidate design. Question: **Is ARE okay?** User: a person opening
Companion for a quick orientation, not an operator seeking every metric.

## User journey

1. Click or keyboard-activate the floating orb. The dashboard shell opens even
   if ARE cannot be reached.
2. Read one sentence that names the most important observed condition.
3. Scan three independently labelled lines: **product diagnostic**, **adapter
   path**, and **information freshness**. The adapter line names only the
   strongest currently verified claim, such as “gateway running; backend
   connection unverified.”
4. If a line needs explanation, open its linked detail in Adapters or Evidence.
   Otherwise close the dashboard and continue work.

## Minimum effective screen

- One status sentence with an observation time and source.
- The three lines above; show “not observed” instead of guessing.
- At most one relevant next link, such as “Why is the diagnostic blocked?”
- A quiet Refresh action. Display completion or failure without resetting the
  whole page or repeatedly announcing an unchanged value.

Do not put component counts, digests, marketing language, or decorative charts
above the answer. The current [Companion snapshot](../../src-tauri/src/main.rs)
comes from `doctor --json`; a PASS does **not** prove that a gateway, model, or
  thread is online. The current [dashboard](../../ui/dashboard.html) provides
  product health and a separately sourced adapter summary. The product
  diagnostic and adapter readings expire independently; neither claims this
  desktop chat is ARE-managed. The current development UI presents the product,
  adapter, and independent freshness lines before its collapsed product-profile
  details, with one contextual detail link. This layout has fixture coverage and
  passed an extracted native Windows development-build WebView2 smoke check;
  the unsigned installer was not installed.

The current source now puts a source-aware sentence ahead of those lines:
product diagnostic and selected gateway observation keep their own posture and
observation time. A verified backend path, aggregate gateway fault, stale
reading, and unconfigured source produce distinct wording. The product-read
failure label is "Product diagnostic unavailable," not a claim that all of ARE
is unavailable. The 34-test dashboard suite and the isolated native Windows
Chromium fixture journey pass, including a product failure while the adapter
remains observed. A rebuilt unsigned Windows development package passed its
11-check feature probe and staged WebView2 journeys in both unconfigured and
connected-gateway-fixture modes; see the [exact package evidence](../WINDOWS-OVERVIEW-SOURCE-SUMMARY-2026-09-27.md#source-aware-headline-follow-up-2026-09-27).
The installer remains uninstalled, and no current desktop task was handed to ARE.

The later [current-source Windows guard check](../WINDOWS-OVERVIEW-GUARD-CURRENT-2026-09-29.md)
keeps the first-screen claim below the selected boundary's evidence: a fresh
managed parent heartbeat yields a guarded text-only **candidate**, while a
missing heartbeat leaves the backend connected but the guard **unverified**.
Neither state is a ready-host or desktop-task-control claim. Source-browser
and extracted-package native WebView2 journeys passed; the installer remains
uninstalled.

A collapsed **Other source readings** index now reflects the last independently
requested Threads, Decisions, Evolution ledger, and improvement-candidate inbox
observations. Its initial posture is **Not inspected**, distinct from a source
that was read and found **Not configured**. Expired or failed readings retain
their last-observed time and lose any current claim. Opening the index performs
no read; its links open the owning page, which requests that source. These
secondary readings never turn the product/adapter headline into a single ARE
health verdict. Unit and isolated Chromium journey checks cover the source
separation; native WebView and screen-reader checks remain open.

## State contract

| State | User-facing meaning |
| --- | --- |
| Observed | “Product diagnostic passed at 14:32; adapter connection not observed.” |
| Empty | Not applicable to a product diagnostic; use “not observed” for a missing source. |
| Stale | “Last diagnostic passed at 14:32; current result unavailable.” Never show a current green badge. |
| Not configured | Name the exact unconfigured live source without labelling the product broken. |
| Unavailable | State which read failed and offer one diagnostic detail link. |

The orb's color may reflect only a defined, currently observed condition. A
neutral orb is safer than a green dot when the live state is unknown.

## Experience checks

- In a five-second comprehension test, the reader distinguishes a passing
  product diagnostic from an unobserved adapter connection and can open
  [Adapters](ADAPTERS.md) for link-by-link evidence.
- Failure after an earlier PASS visibly replaces the current-success claim
  with a stale or unavailable state.
- A diagnostic older than ten seconds, or one returned already stale, cannot
  retain current-success styling. A retry labels previous values last seen.
- Refresh does not trap focus, hide the previous observation without context,
  or trigger an endless loading state.

## Open Questions

- Which authenticated source owns live connection status, and what observation
  interval makes a value current?
- Should Overview show an active-thread count before thread identity and
  currentness are verified?
