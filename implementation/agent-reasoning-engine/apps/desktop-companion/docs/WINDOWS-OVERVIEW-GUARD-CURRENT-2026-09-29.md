# Windows Overview guard claim — current-source development check

Status: unsigned, uninstalled development evidence; authority effect: none.
Owner: ARE Companion and managed-session runtime owners. This follows the
[whole UI plan](WHOLE-UI-IMPLEMENTATION-PLAN.md), especially Overview and
Adapters.

## Change and exact artifact

Overview no longer reports a generic ready backend path when the selected
managed gateway declares a guarded text-only candidate. With a fresh parent
heartbeat it says `Guarded text-only candidate`; without one it says
`Backend connected; guard unverified`. The source detail names the observed
heartbeat posture. A connected backend, either way, does not establish
host-effect coverage or control of this desktop task. The ordinary connected
path and the default Windows model-entry pause keep their separate labels.

The exact unsigned NSIS output is
`D:\are-companion-overview-guard-20260929.exe`, SHA-256
`d3ded9d5ed2f93161e13b40021f1cafce1493310c80aaa4d21aca0a5dc924e04`.
The retained build stage is `D:\acw-J1QJ2O`, and its source `ui/app.js`
matches the checkout at build time by SHA-256
`110b8d9167e02a7aedc2e70872bf6af18dba92b810f870cd5027ded9c3440a25`.
The installer was extracted, not run or installed, to
`D:\are-companion-overview-payload.AfyOEt`. Its 815-file NSIS payload passed
7-Zip's integrity extraction; the extracted `are/` tree is byte-identical to
the stage. Its bundled Node SHA-256 is
`5cba0ea928508c65ddadefc0681d2fb6d95f1f3beea4428f04397631140ee8e5`.

## Validation

- Source dashboard suite: 47/47. The full source Chromium navigation journey
  passed, including fresh guard, lost guard, and ordinary-path transitions,
  with no uncaught page errors. Script syntax and whitespace checks passed.
- Staged and extracted bundled ARE feature probes: 11 checks each, including
  product health, route/context, Reasoning State, thread/decision observers,
  and native Evolution SQLite write/read/replay.
- Staged and extracted native WebView2 default journeys: 36 checks each;
  dashboard nonblank and all seven destinations rendered.
- Extracted-package managed-session native WebView2 smokes passed in both
  guarded and default Windows modes using an isolated gateway and pinned
  `codex-cli 0.155.0-alpha.16.4` (SHA-256
  `9015c47d1714294ecd9033c4b5aefc3076797d867d1c36aa37749fcb76c8942f`).
  Guarded mode observed `parent-heartbeat-observed` and the candidate Overview
  claim; default mode retained the pause. Each supervised the Companion exit,
  made zero private or external model calls, and reported desktop-task control
  as unverified.

The first managed smoke used the executable in the protected WindowsApps
directory and failed with `spawn EPERM`. A direct Windows launch of that path
also returned Access is denied. The hash-identical, runnable pinned CLI copy
on D: passed both extracted-package smokes. The failed launch is not a
successful host-boundary test.

## Claim ceiling and next frontier

This proves the current-source read-only UI wording in a native development
package and bounded isolated gateway journeys. It does not prove installer
installation/upgrade/rollback, live-provider compatibility, complete host
effect coverage, a numerical low-resource budget, or exclusive ARE control of
this Codex desktop task. The Companion remains an observer; the activated
session contract still owns any handover claim.

Runnable product work: continue the exact host-effect boundary and task
handover construction, then joined UI journeys with a verified source.
Operational support owned by Companion/runtime release owners: installed
package lifecycle, signing, privacy/access control, physical accessibility,
and resource-budget acceptance. These are not silently promoted by this
development package.

## Open Questions

- Which host-provided writer-release and ingress-transfer evidence can bind
  this desktop task without two active writers?
- What owner-set memory, CPU, freshness, and installed-package test gates
  define product-candidate acceptance?
