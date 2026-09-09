# Compatibility Repair Decision Packet

Status: owner decision required. No option is selected by this package.

## Proved boundary

Patch0004 adds two assertions that use `document`, focus, and
`activeElement`; the generated Vitest configuration declares Node. The frozen
dashboard lockfile does not resolve `jsdom` or `happy-dom`. This proves the
current incompatibility, not a product defect and not the correct repair side.

## Option A — test-side repair

- Keep the generated Node environment.
- Replace direct DOM construction with a bounded fixture or test split that
  exercises unit logic only.
- Preserve real focus/`activeElement` behavior for Chromium acceptance.
- Likely cost: smaller dependency surface; risk of weakening unit realism.
- Reject if the fixture cannot falsify the intended focus-selection contract.

## Option B — config-side repair

- Supply a DOM-capable test environment to the selected test(s).
- Bind exact runtime package/version/lockfile/dependency and network policy.
- Preserve isolation so unrelated pure Node tests do not silently change.
- Likely cost: lockfile/runtime surface; risk of undeclared dependency fetch.
- Reject if the environment is not already frozen or cannot be admitted
  without new authority.

## Decision and admission gate

The OEWSN compatibility owner must select A or B through Decision Gate. Invoke
Refresh then creates exact successor patch/config/binding SWUs with immutable
predecessor digests and branch-specific validation. Any fresh build, dependency
fetch, or browser run requires separate explicit authority.

