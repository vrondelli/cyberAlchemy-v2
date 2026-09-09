# UX6 — Assistive-technology observations

Status: representative real screen-reader journey passed on 2026-09-09; the
remaining product worksheet is retained for release qualification. Authority
effect: none.

## Recorded environment

The test used Orca 50.2 with Chromium 153.0.8010.12 on Ubuntu 26.04. Chromium
ran headed under Xvfb with renderer accessibility forced. Orca used AT-SPI and a
private D-Bus session. Its packages were extracted into a temporary user-local
overlay; package scripts and system installation were not used. The exact package
versions and hashes are in [packages.json](t7d-evidence/orca/packages.json).

The journey used the current candidate dashboard and its recorded completed native
fixture. It did not submit a task, call a model, change installed history, or use a
VPS. The raw Orca log, filtered speech, and browser-side focus observations are
preserved in [debug.log](t7d-evidence/orca/debug.log),
[speech-output.txt](t7d-evidence/orca/speech-output.txt), and
[browser-observations.json](t7d-evidence/orca/browser-observations.json).

## Journey and observations

| Step | Actual observation | Result |
| --- | --- | --- |
| Open Dashboard and enter a recorded run | Orca spoke the Workspace document, main content, Workspace dashboard heading, header, Explore projects link, All runs link, completed run title, and the default Overview tab | Pass |
| Browse headings and landmarks | Main content, dashboard heading, header, run title heading and Overview execution summary were exposed and spoken | Pass for representative path |
| Navigate tabs with End and Home | End selected Lifecycle and Orca spoke “Lifecycle page tab. Not reported.” Home returned to Overview and Orca spoke “Overview page tab. Execution summary.” Browser observation confirmed selected state and focus | Pass |
| Activate View result and read all result content | Covered by automated semantics and keyboard journeys; no complete spoken-output observation | Pending release qualification |
| Expand Technical details and read complete identities | Automated browser coverage only | Pending release qualification |
| Browse a real dependency fixture | Automated graph/list keyboard coverage only | Pending release qualification |
| Browse Research ontology list | Automated keyboard coverage and axe scan only | Pending release qualification |
| Trigger required-field validation | Automated focus and recovery coverage only | Pending release qualification |
| Exercise busy, failure, expiry and reconnection | Automated failure/recovery coverage only | Pending release qualification |
| Return through history and reload | Automated browser coverage only | Pending release qualification |
| Repeat key steps at 200/400% zoom | 320 CSS px reflow covered across three engines; actual screen-reader zoom session was not performed | Pending release qualification |

This is actual Orca speech-output evidence rather than a DOM semantic snapshot.
It satisfies T7D's requirement to record real keyboard and screen-reader
observations. It does not claim full assistive-technology product certification.

## Open Questions

- Which additional OS, browser, screen-reader, and zoom combinations are required
  for a release beyond this local candidate boundary?
- Who owns review of the remaining spoken-output worksheet rows during T7E?
- See [UX6 acceptance](UX6-ACCEPTANCE.md#open-questions) and
  [T7](T7-ACCEPTANCE.md#open-questions) for whole-Workspace release scope.
